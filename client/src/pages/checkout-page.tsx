import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "@/hooks/use-translations";
import { useLocation } from "wouter";
import { CreditCard, CheckCircle2, Calendar } from "lucide-react";
import PayPalButton from "@/components/PayPalButton";
import { TranslationKey, TranslatedText } from "@/components/TranslatedText";

export default function CheckoutPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { language } = useTranslations();
  const [, navigate] = useLocation();
  
  const [paymentMethod, setPaymentMethod] = useState("credit-card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvc, setCvc] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Parse courseId from URL search params
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const courseId = parseInt(searchParams.get("courseId") || "1");
  
  // In a real application, we would fetch this from the API
  // For this mockup, find the course from our mock data
  const [course, setCourse] = useState<any>(null);
  
  // Use effect to simulate an API call to get course details
  useEffect(() => {
    // Simulate API delay
    const timer = setTimeout(() => {
      // For now, use mock data
      const mockCourses = [
        {
          id: 1,
          title: "ESG Reporting Fundamentals",
          provider: {
            name: "KPMG ESG Academy"
          },
          price: 999,
          startDate: "2025-06-15",
          duration: "8 weeks"
        },
        {
          id: 2,
          title: "Carbon Accounting & Net Zero Strategy",
          provider: {
            name: "Deloitte Sustainability"
          },
          price: 1299,
          startDate: "2025-07-10",
          duration: "6 weeks"
        },
        {
          id: 3,
          title: "ESG Due Diligence for Investors",
          provider: {
            name: "BlackRock Sustainable Investing Institute"
          },
          price: 1599,
          startDate: "2025-09-05",
          duration: "4 weeks"
        },
        {
          id: 4,
          title: "Supply Chain ESG Compliance",
          provider: {
            name: "PwC ESG Learning Academy"
          },
          price: 899,
          startDate: "2025-08-01",
          duration: "5 weeks"
        }
      ];
      
      const foundCourse = mockCourses.find(c => c.id === courseId) || mockCourses[0];
      setCourse(foundCourse);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [courseId]);

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!course) {
      toast({
        title: "Error",
        description: "Course information could not be loaded",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "Payment successful!",
        description: `You have successfully enrolled in "${course.title}"`,
      });
      
      // Redirect to profile page or course details
      navigate("/profile");
    }, 2000);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to continue with your enrollment
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/auth")} className="w-full">
              Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (!course) {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-4 text-muted-foreground">Loading course information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">
        {language === "en" ? "Complete Your Enrollment" : "完成您的註冊"}
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {language === "en" ? "Payment Information" : "付款資訊"}
              </CardTitle>
              <CardDescription>
                {language === "en" ? "Choose your preferred payment method" : "選擇您偏好的付款方式"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="payment-method" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="payment-method">
                    {language === "en" ? "Payment Method" : "付款方式"}
                  </TabsTrigger>
                  <TabsTrigger value="review">
                    {language === "en" ? "Review & Confirm" : "檢查與確認"}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="payment-method">
                  <div className="space-y-6">
                    <RadioGroup 
                      defaultValue="credit-card" 
                      className="space-y-3"
                      value={paymentMethod}
                      onValueChange={setPaymentMethod}
                    >
                      <div className="flex items-center space-x-2 border rounded-md p-4">
                        <RadioGroupItem value="credit-card" id="credit-card" />
                        <Label htmlFor="credit-card" className="flex-1 flex items-center">
                          <CreditCard className="h-5 w-5 mr-2" />
                          <span>{language === "en" ? "Credit/Debit Card" : "信用卡/借記卡"}</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 border rounded-md p-4">
                        <RadioGroupItem value="paypal" id="paypal" />
                        <Label htmlFor="paypal" className="flex-1 flex items-center">
                          <img src="https://www.paypalobjects.com/webstatic/en_US/i/buttons/PP_logo_h_100x26.png" 
                              alt="PayPal" className="h-6 mr-2" />
                          <span>PayPal</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 border rounded-md p-4">
                        <RadioGroupItem value="bank-transfer" id="bank-transfer" />
                        <Label htmlFor="bank-transfer" className="flex-1">{language === "en" ? "Bank Transfer" : "銀行轉賬"}</Label>
                      </div>
                    </RadioGroup>

                    {paymentMethod === "credit-card" && (
                      <form className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="card-number">
                            {language === "en" ? "Card Number" : "卡號"}
                          </Label>
                          <Input
                            id="card-number"
                            placeholder={language === "en" ? "1234 5678 9012 3456" : "請輸入卡號"}
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="card-name">
                            {language === "en" ? "Cardholder Name" : "持卡人姓名"}
                          </Label>
                          <Input
                            id="card-name"
                            placeholder={language === "en" ? "John Doe" : "請輸入姓名"}
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="expiry">
                              {language === "en" ? "Expiry Date" : "到期日"}
                            </Label>
                            <Input
                              id="expiry"
                              placeholder={language === "en" ? "MM/YY" : "月/年"}
                              value={expiryDate}
                              onChange={(e) => setExpiryDate(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cvc">CVC</Label>
                            <Input
                              id="cvc"
                              placeholder="123"
                              value={cvc}
                              onChange={(e) => setCvc(e.target.value)}
                            />
                          </div>
                        </div>
                      </form>
                    )}

                    {paymentMethod === "paypal" && (
                      <div className="border rounded-md p-4 bg-muted/20">
                        <h3 className="font-medium mb-2">PayPal Payment</h3>
                        <p className="text-muted-foreground mb-4">
                          Click the button below to proceed with PayPal payment:
                        </p>
                        <div className="mt-4 flex justify-center">
                          <div className="p-3 bg-blue-50 rounded-md border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors">
                            {course && (
                              <PayPalButton 
                                amount={course.price.toString()} 
                                currency="USD" 
                                intent="CAPTURE" 
                              />
                            )}
                          </div>
                        </div>
                        <p className="mt-4 text-center text-sm text-muted-foreground">
                          You will be redirected to PayPal to complete your payment securely.
                        </p>
                      </div>
                    )}
                    
                    {paymentMethod === "bank-transfer" && (
                      <div className="border rounded-md p-4 bg-muted/20">
                        <h3 className="font-medium mb-2">Bank Transfer Instructions</h3>
                        <p className="text-muted-foreground mb-4">
                          Please transfer the total amount to the following bank account:
                        </p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">Bank Name:</span>
                            <span>ESG Global Bank</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Account Name:</span>
                            <span>ESG Marketplace Ltd</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Account Number:</span>
                            <span>1234567890</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Sort Code:</span>
                            <span>12-34-56</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Reference:</span>
                            <span>ESG-{course.id}-{user.id}</span>
                          </div>
                        </div>
                        <p className="mt-4 text-muted-foreground text-sm">
                          Your enrollment will be confirmed once we receive your payment,
                          typically within 1-2 business days.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="review">
                  <div className="space-y-6">
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">User Information</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Name:</span>
                          <span>{user.username}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email:</span>
                          <span>{user.email || "No email provided"}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">Payment Method</h3>
                      <div className="flex items-center">
                        {paymentMethod === "credit-card" ? (
                          <>
                            <CreditCard className="h-5 w-5 mr-2" />
                            <span>Credit/Debit Card</span>
                            {cardNumber && (
                              <span className="ml-auto">
                                **** {cardNumber.slice(-4)}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <Calendar className="h-5 w-5 mr-2" />
                            <span>Bank Transfer</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2 items-stretch">
              <Button 
                onClick={handlePayment} 
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? "Processing..." : `Complete Payment - $${course.price}`}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate("/courses")}
                className="w-full"
              >
                Cancel
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium text-lg">{course.title}</h3>
                <div className="text-sm text-muted-foreground">{course.provider.name}</div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>Starts {new Date(course.startDate).toLocaleDateString()}</span>
                </div>
                <div className="text-sm">{course.duration}</div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Course Price</span>
                  <span>${course.price}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Platform Fee</span>
                  <span>$0</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>${course.price}</span>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                By completing your purchase, you agree to our Terms of Service
                and acknowledge that you have read our Privacy Policy.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}