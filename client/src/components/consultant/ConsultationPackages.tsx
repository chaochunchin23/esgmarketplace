import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "@/hooks/use-translations";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  FileCheck,
  FileText,
  ShoppingCart,
  VideoIcon,
  BarChart,
  DollarSign,
} from "lucide-react";
import PayPalButton from "../PayPalButton";

interface ConsultationPackage {
  id: string;
  title: string;
  description: string;
  price: number;
  discountPrice?: number;
  features: string[];
  duration: string;
  isPopular?: boolean;
  sessions: number;
}

interface ConsultationPackagesProps {
  consultantId: number;
  consultantName: string;
  hourlyRate: number;
  expertise: string;
}

export default function ConsultationPackages({
  consultantId,
  consultantName,
  hourlyRate,
  expertise,
}: ConsultationPackagesProps) {
  const { user } = useAuth();
  const { language } = useTranslations();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<ConsultationPackage | null>(null);
  const [showPaypal, setShowPaypal] = useState(false);

  // Generate packages based on hourly rate
  const packages: ConsultationPackage[] = [
    {
      id: "basic",
      title: language === "en" ? "Initial Consultation" : "初步諮詢",
      description: language === "en" 
        ? "Perfect for understanding your ESG needs and getting started" 
        : "非常適合了解您的ESG需求並開始行動",
      price: hourlyRate,
      features: [
        language === "en" ? "1-hour consultation session" : "1小時諮詢會議",
        language === "en" ? "Initial assessment" : "初步評估",
        language === "en" ? "Action plan recommendations" : "行動計劃建議",
      ],
      duration: language === "en" ? "1 hour" : "1小時",
      sessions: 1,
    },
    {
      id: "standard",
      title: language === "en" ? "Comprehensive Package" : "綜合套餐",
      description: language === "en" 
        ? "A thorough consultation to address your ESG challenges" 
        : "全面的諮詢以解決您的ESG挑戰",
      price: hourlyRate * 5,
      discountPrice: hourlyRate * 4.5,
      features: [
        language === "en" ? "5 consultation sessions" : "5次諮詢會議",
        language === "en" ? "Detailed ESG assessment" : "詳細的ESG評估",
        language === "en" ? "Written recommendations" : "書面建議",
        language === "en" ? "Implementation guidance" : "實施指導",
      ],
      duration: language === "en" ? "5 hours" : "5小時",
      isPopular: true,
      sessions: 5,
    },
    {
      id: "premium",
      title: language === "en" ? "Strategic Partnership" : "策略合作夥伴",
      description: language === "en" 
        ? "A complete ESG transformation program with ongoing support" 
        : "完整的ESG轉型計劃和持續支持",
      price: hourlyRate * 10,
      discountPrice: hourlyRate * 8,
      features: [
        language === "en" ? "10 consultation sessions" : "10次諮詢會議",
        language === "en" ? "Comprehensive ESG strategy" : "全面的ESG策略",
        language === "en" ? "Detailed implementation plan" : "詳細的實施計劃",
        language === "en" ? "Regular progress reviews" : "定期進度審查",
        language === "en" ? "Stakeholder presentation support" : "利益相關者演示支持",
      ],
      duration: language === "en" ? "10 hours" : "10小時",
      sessions: 10,
    },
  ];

  const handleAddToCart = (pkg: ConsultationPackage) => {
    addItem({
      id: consultantId,
      type: "consultation",
      name: `${pkg.title} - ${consultantName}`,
      price: pkg.discountPrice || pkg.price,
      details: {
        consultantName,
        consultantId,
        packageId: pkg.id,
        sessions: pkg.sessions,
        duration: pkg.duration,
        expertise,
      },
    });

    toast({
      title: language === "en" ? "Added to cart" : "已加入購物車",
      description: language === "en"
        ? `${pkg.title} with ${consultantName} has been added to your cart`
        : `${consultantName}的${pkg.title}已加入您的購物車`,
    });
  };

  const handleBuyNow = (pkg: ConsultationPackage) => {
    setSelectedPackage(pkg);
  };

  const handlePaypalPurchase = () => {
    if (selectedPackage) {
      setShowPaypal(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <Card
            key={pkg.id}
            className={`flex flex-col ${
              pkg.isPopular ? "border-primary/50 shadow-md" : ""
            }`}
          >
            {pkg.isPopular && (
              <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/3">
                <Badge className="bg-primary text-white">
                  {language === "en" ? "Popular" : "熱門"}
                </Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="flex items-start justify-between">
                <span>{pkg.title}</span>
                {pkg.discountPrice ? (
                  <div className="text-right">
                    <span className="text-sm line-through text-muted-foreground">
                      ${pkg.price}
                    </span>
                    <span className="block text-xl font-bold">${pkg.discountPrice}</span>
                  </div>
                ) : (
                  <span className="text-xl font-bold">${pkg.price}</span>
                )}
              </CardTitle>
              <CardDescription>{pkg.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{pkg.duration}</span>
                <span className="mx-1">•</span>
                <VideoIcon className="h-4 w-4" />
                <span>
                  {pkg.sessions} {language === "en" ? "sessions" : "次會議"}
                </span>
              </div>
              <ul className="space-y-2">
                {pkg.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <FileCheck className="h-4 w-4 text-green-500 mt-1" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 pt-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleAddToCart(pkg)}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {language === "en" ? "Add to Cart" : "加入購物車"}
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    className="w-full"
                    onClick={() => handleBuyNow(pkg)}
                  >
                    {language === "en" ? "Buy Now" : "立即購買"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>
                      {language === "en" ? "Complete Purchase" : "完成購買"}
                    </DialogTitle>
                    <DialogDescription>
                      {language === "en"
                        ? "Purchase consultation package with PayPal"
                        : "使用PayPal購買諮詢套餐"}
                    </DialogDescription>
                  </DialogHeader>

                  {selectedPackage && (
                    <div className="py-4">
                      <div className="mb-4 p-4 bg-muted rounded-lg">
                        <h3 className="font-medium flex justify-between">
                          <span>{selectedPackage.title}</span>
                          <span>
                            ${selectedPackage.discountPrice || selectedPackage.price}
                          </span>
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedPackage.description}
                        </p>
                        <div className="mt-3 text-sm flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{selectedPackage.duration}</span>
                          <span className="mx-1">•</span>
                          <VideoIcon className="h-4 w-4" />
                          <span>
                            {selectedPackage.sessions}{" "}
                            {language === "en" ? "sessions" : "次會議"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{language === "en" ? "Consultant" : "顧問"}</span>
                          <span>{consultantName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>{language === "en" ? "Expertise" : "專業領域"}</span>
                          <span className="capitalize">{expertise}</span>
                        </div>
                        <div className="flex justify-between font-medium pt-2 border-t mt-2">
                          <span>{language === "en" ? "Total" : "總計"}</span>
                          <span>
                            ${selectedPackage.discountPrice || selectedPackage.price}
                          </span>
                        </div>
                      </div>

                      {showPaypal ? (
                        <div className="mt-6">
                          <PayPalButton
                            amount={(selectedPackage.discountPrice || selectedPackage.price).toString()}
                            currency="USD"
                            intent="CAPTURE"
                          />
                        </div>
                      ) : (
                        <div className="mt-6">
                          <Button 
                            className="w-full" 
                            onClick={handlePaypalPurchase}
                          >
                            <DollarSign className="mr-2 h-4 w-4" />
                            {language === "en" ? "Proceed to Payment" : "前往付款"}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}