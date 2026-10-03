import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Calendar as CalendarIcon, Clock, User, Calendar, CheckCircle, ArrowLeft } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import PayPalButton from "@/components/PayPalButton";
import { addDays, format, isBefore, setHours, setMinutes } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTranslations } from "@/hooks/use-translations";

type TimeSlot = {
  id: string;
  startTime: Date;
  endTime: Date;
  available: boolean;
};

type BookingStep = "details" | "payment" | "confirmation";

export default function BookingPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { language } = useTranslations();
  const queryClient = useQueryClient();
  
  const [currentStep, setCurrentStep] = useState<BookingStep>("details");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(addDays(new Date(), 3));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [projectDescription, setProjectDescription] = useState("");
  const [hoursRequested, setHoursRequested] = useState("1");
  const [paymentMethod, setPaymentMethod] = useState("paypal");
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<number | null>(null);
  
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const consultantId = parseInt(searchParams.get("consultantId") || "0");
  
  const { data: consultant, isLoading: consultantLoading } = useQuery<any>({
    queryKey: ["/api/consultants", consultantId],
    enabled: consultantId > 0,
  });

  const { data: availabilityData } = useQuery<any>({
    queryKey: ["/api/consultants", consultantId, "availability", selectedDate?.toISOString()?.split("T")[0]],
    queryFn: async () => {
      const dateStr = selectedDate?.toISOString()?.split("T")[0];
      const response = await fetch(`/api/consultants/${consultantId}/availability?date=${dateStr}`);
      return response.json();
    },
    enabled: consultantId > 0 && !!selectedDate,
  });

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest("POST", "/api/bookings", bookingData);
      return response.json();
    },
    onSuccess: (data) => {
      setCreatedBookingId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/user/bookings"] });
      toast({
        title: language === "en" ? "Booking Created!" : "預約已創建！",
        description: language === "en" 
          ? "Your consultation has been scheduled successfully." 
          : "您的諮詢已成功預約。",
      });
      setCurrentStep("confirmation");
    },
    onError: (error: any) => {
      toast({
        title: language === "en" ? "Booking Failed" : "預約失敗",
        description: error.message || (language === "en" ? "Failed to create booking" : "創建預約失敗"),
        variant: "destructive",
      });
    },
  });
  
  const bookingTotal = consultant ? parseFloat(consultant.hourlyRate) * parseInt(hoursRequested) : 0;

  const generateTimeSlots = (date: Date | undefined): TimeSlot[] => {
    if (!date) return [];
    
    const slots: TimeSlot[] = [];
    const dayOfWeek = date.getDay();
    
    // Default working hours if no availability data
    let startHour = 9;
    let endHour = 17;
    
    // Check if consultant has availability for this day
    if (availabilityData?.availability?.length > 0) {
      const dayAvailability = availabilityData.availability.find(
        (a: any) => a.dayOfWeek === dayOfWeek
      );
      if (dayAvailability) {
        startHour = parseInt(dayAvailability.startTime.split(":")[0]);
        endHour = parseInt(dayAvailability.endTime.split(":")[0]);
      }
    }
    
    // Get existing bookings for this date
    const existingBookings = availabilityData?.existingBookings || [];
    const blockedSlots = availabilityData?.blockedSlots || [];
    
    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = setMinutes(setHours(new Date(date), hour), 0);
      const endTime = setMinutes(setHours(new Date(date), hour + 1), 0);
      
      const isPast = isBefore(endTime, new Date());
      
      // Check if this slot is already booked
      const isBooked = existingBookings.some((booking: any) => {
        const bookingStart = new Date(booking.sessionDate);
        const bookingEnd = new Date(bookingStart.getTime() + booking.sessionDuration * 60000);
        return startTime >= bookingStart && startTime < bookingEnd;
      });
      
      // Check if this slot is blocked
      const isBlocked = blockedSlots.some((blocked: any) => {
        if (!blocked.startTime) return true; // Whole day blocked
        const blockedStart = parseInt(blocked.startTime.split(":")[0]);
        const blockedEnd = parseInt(blocked.endTime.split(":")[0]);
        return hour >= blockedStart && hour < blockedEnd;
      });
      
      const isAvailable = !isPast && !isBooked && !isBlocked;
      
      slots.push({
        id: `slot-${hour}`,
        startTime,
        endTime,
        available: isAvailable
      });
    }
    
    return slots;
  };
  
  const timeSlots = selectedDate ? generateTimeSlots(selectedDate) : [];
  
  const handleTimeSlotSelect = (slotId: string) => {
    setSelectedTimeSlot(slotId);
  };
  
  const getSelectedSlotTime = () => {
    if (!selectedTimeSlot) return null;
    const slot = timeSlots.find(s => s.id === selectedTimeSlot);
    return slot?.startTime;
  };

  const handleProceedToPayment = () => {
    if (!selectedDate || !selectedTimeSlot) {
      toast({
        title: language === "en" ? "Missing information" : "資料不完整",
        description: language === "en" 
          ? "Please select a date and time for your booking" 
          : "請選擇預約日期和時間",
        variant: "destructive"
      });
      return;
    }
    setCurrentStep("payment");
  };

  const handleCreateBooking = async (paymentStatus: "pending" | "paid" = "pending") => {
    const slotTime = getSelectedSlotTime();
    if (!slotTime || !consultant) return;

    const bookingData = {
      consultantId: consultant.id,
      sessionDate: slotTime.toISOString(),
      sessionDuration: parseInt(hoursRequested) * 60,
      sessionType: "consultation",
      notes: projectDescription,
      totalAmount: bookingTotal.toString(),
      paymentStatus,
    };

    createBookingMutation.mutate(bookingData);
  };

  const handleInvoiceBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    handleCreateBooking("pending");
    setIsProcessing(false);
  };

  const handlePayPalSuccess = () => {
    handleCreateBooking("paid");
  };
  
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{language === "en" ? "Authentication Required" : "需要登入"}</CardTitle>
            <CardDescription>
              {language === "en" ? "Please sign in to book a consultation" : "請登入以預約諮詢"}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/auth")} className="w-full">
              {language === "en" ? "Sign In" : "登入"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (consultantId === 0) {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>{language === "en" ? "No Consultant Selected" : "未選擇顧問"}</CardTitle>
            <CardDescription>
              {language === "en" 
                ? "Please select a consultant from our directory first." 
                : "請先從目錄中選擇顧問。"}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/consultants")} className="w-full">
              {language === "en" ? "Browse Consultants" : "瀏覽顧問"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (consultantLoading || !consultant) {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">
              {language === "en" ? "Loading consultant information..." : "載入顧問資訊..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === "confirmation") {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">
              {language === "en" ? "Booking Confirmed!" : "預約已確認！"}
            </CardTitle>
            <CardDescription>
              {language === "en" 
                ? "Your consultation has been successfully scheduled." 
                : "您的諮詢已成功預約。"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{language === "en" ? "Consultant" : "顧問"}</span>
                <span className="font-medium">{consultant.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{language === "en" ? "Date" : "日期"}</span>
                <span className="font-medium">{selectedDate && format(selectedDate, "PPP")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{language === "en" ? "Time" : "時間"}</span>
                <span className="font-medium">
                  {getSelectedSlotTime() && format(getSelectedSlotTime()!, "h:mm a")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{language === "en" ? "Duration" : "時長"}</span>
                <span className="font-medium">
                  {hoursRequested} {language === "en" ? "hour(s)" : "小時"}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{language === "en" ? "Total" : "總計"}</span>
                <span className="font-bold text-lg">${bookingTotal}</span>
              </div>
            </div>
            
            <div className="text-center text-muted-foreground">
              <p>
                {language === "en" 
                  ? "You will receive a confirmation email shortly with the meeting details." 
                  : "您將很快收到確認電郵，內附會議詳情。"}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button variant="outline" onClick={() => navigate("/consultants")} className="flex-1">
              {language === "en" ? "Browse More Consultants" : "瀏覽更多顧問"}
            </Button>
            <Button onClick={() => navigate("/dashboard")} className="flex-1">
              {language === "en" ? "Go to Dashboard" : "前往儀表板"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate("/consultants")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">
          {language === "en" ? "Book a Consultation" : "預約諮詢"}
        </h1>
      </div>

      <div className="flex gap-4 mb-8">
        <div className={`flex items-center gap-2 ${currentStep === "details" ? "text-primary font-medium" : "text-muted-foreground"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "details" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>1</div>
          <span>{language === "en" ? "Details" : "詳情"}</span>
        </div>
        <Separator className="flex-1 self-center" />
        <div className={`flex items-center gap-2 ${currentStep === "payment" ? "text-primary font-medium" : "text-muted-foreground"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "payment" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>2</div>
          <span>{language === "en" ? "Payment" : "付款"}</span>
        </div>
        <Separator className="flex-1 self-center" />
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted">3</div>
          <span>{language === "en" ? "Confirmation" : "確認"}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {currentStep === "details" && (
            <Card>
              <CardHeader>
                <CardTitle>{language === "en" ? "Booking Details" : "預約詳情"}</CardTitle>
                <CardDescription>
                  {language === "en" ? "Choose your preferred date and time" : "選擇您的首選日期和時間"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="date">{language === "en" ? "Select a Date" : "選擇日期"}</Label>
                    <div className="mt-2">
                      <DatePicker 
                        value={selectedDate} 
                        onChange={(date) => {
                          setSelectedDate(date);
                          setSelectedTimeSlot(null);
                        }} 
                      />
                    </div>
                  </div>
                  
                  {selectedDate && (
                    <div className="space-y-2">
                      <Label>{language === "en" ? "Available Time Slots" : "可預約時段"}</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {timeSlots.map((slot) => (
                          <Button 
                            key={slot.id} 
                            variant={selectedTimeSlot === slot.id ? "default" : "outline"}
                            disabled={!slot.available}
                            className={!slot.available ? "opacity-50" : ""}
                            onClick={() => handleTimeSlotSelect(slot.id)}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            {format(slot.startTime, "h:mm a")}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="hours">
                      {language === "en" ? "Session Duration" : "諮詢時長"}
                    </Label>
                    <Select value={hoursRequested} onValueChange={setHoursRequested}>
                      <SelectTrigger id="hours">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">{language === "en" ? "1 hour" : "1 小時"}</SelectItem>
                        <SelectItem value="2">{language === "en" ? "2 hours" : "2 小時"}</SelectItem>
                        <SelectItem value="3">{language === "en" ? "3 hours" : "3 小時"}</SelectItem>
                        <SelectItem value="4">{language === "en" ? "4 hours" : "4 小時"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">
                      {language === "en" ? "Project Description (Optional)" : "項目描述（選填）"}
                    </Label>
                    <Textarea 
                      id="description" 
                      placeholder={language === "en" 
                        ? "Describe your project, goals, and what you need help with..." 
                        : "描述您的項目、目標和需要的幫助..."}
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleProceedToPayment} 
                  disabled={!selectedTimeSlot}
                  className="w-full"
                >
                  {language === "en" ? "Continue to Payment" : "繼續付款"}
                </Button>
              </CardFooter>
            </Card>
          )}

          {currentStep === "payment" && (
            <Card>
              <CardHeader>
                <CardTitle>{language === "en" ? "Payment" : "付款"}</CardTitle>
                <CardDescription>
                  {language === "en" ? "Choose your payment method" : "選擇您的付款方式"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{language === "en" ? "Date" : "日期"}</span>
                    <span>{selectedDate && format(selectedDate, "PPP")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{language === "en" ? "Time" : "時間"}</span>
                    <span>{getSelectedSlotTime() && format(getSelectedSlotTime()!, "h:mm a")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{language === "en" ? "Duration" : "時長"}</span>
                    <span>{hoursRequested} {language === "en" ? "hour(s)" : "小時"}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <RadioGroup 
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2 border rounded-md p-4 cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="paypal" id="paypal" />
                      <Label htmlFor="paypal" className="flex-1 flex items-center cursor-pointer">
                        <img 
                          src="https://www.paypalobjects.com/webstatic/en_US/i/buttons/PP_logo_h_100x26.png" 
                          alt="PayPal" 
                          className="h-6 mr-2" 
                        />
                        <span>PayPal</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-md p-4 cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="invoice" id="invoice" />
                      <Label htmlFor="invoice" className="flex-1 cursor-pointer">
                        {language === "en" ? "Invoice (for companies)" : "發票（適用於公司）"}
                      </Label>
                    </div>
                  </RadioGroup>
                  
                  {paymentMethod === "paypal" && (
                    <div className="border rounded-md p-6 bg-muted/20">
                      <p className="text-muted-foreground mb-4 text-center">
                        {language === "en" 
                          ? "Click the PayPal button below to complete your payment:" 
                          : "點擊下方 PayPal 按鈕完成付款："}
                      </p>
                      <div className="flex justify-center">
                        <div className="p-3 bg-blue-50 rounded-md border border-blue-100">
                          <PayPalButton 
                            amount={bookingTotal.toString()} 
                            currency="USD" 
                            intent="CAPTURE" 
                          />
                        </div>
                      </div>
                      <p className="mt-4 text-center text-sm text-muted-foreground">
                        {language === "en" 
                          ? "After PayPal payment, click 'Complete Booking' below" 
                          : "PayPal 付款後，點擊下方「完成預約」"}
                      </p>
                      <Button 
                        onClick={() => handlePayPalSuccess()} 
                        className="w-full mt-4"
                        disabled={createBookingMutation.isPending}
                      >
                        {createBookingMutation.isPending 
                          ? (language === "en" ? "Processing..." : "處理中...") 
                          : (language === "en" ? "Complete Booking" : "完成預約")}
                      </Button>
                    </div>
                  )}
                  
                  {paymentMethod === "invoice" && (
                    <div className="border rounded-md p-6 bg-muted/20">
                      <p className="text-muted-foreground mb-4">
                        {language === "en" 
                          ? "For company payments, we'll send an invoice to your registered email address." 
                          : "對於公司付款，我們會將發票發送到您的註冊電郵地址。"}
                      </p>
                      <Button 
                        onClick={handleInvoiceBooking} 
                        disabled={isProcessing || createBookingMutation.isPending}
                        className="w-full"
                      >
                        {isProcessing || createBookingMutation.isPending
                          ? (language === "en" ? "Processing..." : "處理中...") 
                          : (language === "en" ? `Request Invoice - $${bookingTotal}` : `申請發票 - $${bookingTotal}`)}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentStep("details")}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {language === "en" ? "Back to Details" : "返回詳情"}
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
        
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>{language === "en" ? "Booking Summary" : "預約摘要"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="relative h-16 w-16 flex-shrink-0">
                  <img 
                    src={consultant.photoUrl}
                    alt={consultant.fullName}
                    className="rounded-full h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-medium">{consultant.fullName}</h3>
                  <div className="text-sm text-muted-foreground">{consultant.position}</div>
                  <div className="text-sm text-muted-foreground">{consultant.company}</div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{language === "en" ? "Expertise:" : "專業領域："} {consultant.expertise}</span>
                </div>
                {selectedDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(selectedDate, "PPP")}</span>
                  </div>
                )}
                {getSelectedSlotTime() && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{format(getSelectedSlotTime()!, "h:mm a")}</span>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{language === "en" ? "Hourly Rate" : "時薪"}</span>
                  <span>${consultant.hourlyRate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{language === "en" ? "Duration" : "時長"}</span>
                  <span>{hoursRequested} {language === "en" ? "hour(s)" : "小時"}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium text-lg">
                  <span>{language === "en" ? "Total" : "總計"}</span>
                  <span>${bookingTotal}</span>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                {language === "en" 
                  ? "By completing your booking, you agree to our Terms of Service and acknowledge that you have read our Privacy Policy." 
                  : "完成預約即表示您同意我們的服務條款，並確認已閱讀我們的私隱政策。"}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
