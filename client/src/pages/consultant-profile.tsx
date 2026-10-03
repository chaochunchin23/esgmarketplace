import { useRoute, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import ReviewForm from "@/components/consultant/ReviewForm";
import ReviewList from "@/components/consultant/ReviewList";
import MessageConsultant from "@/components/consultant/MessageConsultant";
import ConsultationPackages from "@/components/consultant/ConsultationPackages";
import {
  User,
  Briefcase,
  DollarSign,
  Building2,
  FileText,
  Star,
  Languages,
  GraduationCap,
  Calendar,
  ShoppingCart,
  Phone,
  Mail,
  MapPin,
  Award,
  Globe,
  BarChart,
  Leaf,
  Users,
  Scale,
  FileCheck,
  LineChart,
  LinkedinIcon,
  CheckCircle,
} from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useTranslations } from "@/hooks/use-translations";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

type Consultant = {
  id: number;
  fullName: string;
  photoUrl: string;
  bio: string;
  expertise: "environmental" | "social" | "governance";
  subExpertise: {
    frameworks: string[];
    keywords: string[];
  };
  trainingOfferings: {
    title: string;
    description: string;
  }[];
  hourlyRate: number;
  yearsExperience: number;
  company: string;
  position: string;
  reportsGenerated: number;
  certifications: string[];
  availability: string;
  linkedinUrl: string;
  languages: string[];
  industries: string[];
  avgRating: string | number | null;
  totalReviews: number;
};

export default function ConsultantProfile() {
  const [, params] = useRoute("/consultants/:id");
  const consultantId = parseInt(params?.id || "0");
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [scrollToReviewId, setScrollToReviewId] = useState<number | undefined>();

  const { data: consultant, isLoading } = useQuery<Consultant>({
    queryKey: [`/api/consultants/${consultantId}`],
    enabled: !!consultantId,
    queryFn: async () => {
      const response = await fetch(`/api/consultants/${consultantId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch consultant data');
      }
      return response.json();
    }
  });

  const handleReviewSubmit = (reviewId?: number) => {
    setReviewDialogOpen(false);
    if (reviewId) {
      setScrollToReviewId(reviewId);
    }
  };
  
  const { addItem } = useCart();
  const { language } = useTranslations();
  const { toast } = useToast();
  
  // Function to add consultation to cart
  const addToCart = () => {
    if (!consultant) return;
    
    const consultantName = consultant.fullName;
    const consultantId = consultant.id;
    const consultantExpertise = consultant.expertise;
    const consultantRate = consultant.hourlyRate;
    
    addItem({
      id: consultantId,
      type: "consultation",
      name: language === "en" 
        ? `${consultantName} - ESG Consultation` 
        : `${consultantName} - ESG 諮詢`,
      price: consultantRate,
      details: {
        consultantName,
        expertise: consultantExpertise,
        hourlyRate: consultantRate,
        duration: language === "en" ? "1 hour" : "1 小時" // Default duration
      }
    });
    
    toast({
      title: language === "en" ? "Added to cart!" : "已加入購物車！",
      description: language === "en" 
        ? `Consultation with ${consultantName} has been added to your cart` 
        : `與${consultantName}的諮詢已加入您的購物車`,
    });
  };

  if (isLoading) {
    return <div>{language === "en" ? "Loading..." : "加載中..."}</div>;
  }

  if (!consultant) {
    return <div>{language === "en" ? "Consultant not found" : "找不到顧問"}</div>;
  }

  // Convert avgRating to number and format it
  const formattedRating = consultant && (typeof consultant.avgRating === 'number' || typeof consultant.avgRating === 'string')
    ? Number(consultant.avgRating).toFixed(1)
    : null;

  const getExpertiseIcon = (expertise: string) => {
    switch(expertise.toLowerCase()) {
      case 'environmental': return <Leaf className="h-5 w-5 text-green-500" />;
      case 'social': return <Users className="h-5 w-5 text-blue-500" />;
      case 'governance': return <Scale className="h-5 w-5 text-purple-500" />;
      default: return <BarChart className="h-5 w-5" />;
    }
  };
  
  // Localized text based on language
  const text = consultant ? {
    backToConsultants: language === "en" ? "← Back to Consultants" : "← 返回顧問列表",
    bookConsultation: language === "en" ? "Book Consultation" : "預約諮詢",
    addToCart: language === "en" ? "Add to Cart" : "加入購物車",
    writeReview: language === "en" ? "Write Review" : "撰寫評論",
    reviewConsultant: language === "en" ? `Review ${consultant.fullName}` : `評價 ${consultant.fullName}`,
    overview: language === "en" ? "Overview" : "概述",
    expertise: language === "en" ? "Expertise" : "專業知識",
    services: language === "en" ? "Services" : "服務",
    reviews: language === "en" ? "Reviews" : "評價",
    yearsExperience: language === "en" ? `${consultant.yearsExperience} years experience` : `${consultant.yearsExperience} 年經驗`,
    hourlyRate: language === "en" ? `$${consultant.hourlyRate}/hour` : `$${consultant.hourlyRate}/小時`,
    reports: language === "en" ? `${consultant.reportsGenerated} reports` : `${consultant.reportsGenerated} 份報告`,
    availability: language === "en" ? consultant.availability : consultant.availability,
    primaryFocus: language === "en" ? "Primary Focus" : "主要專注領域",
    esgFrameworks: language === "en" ? "ESG Frameworks" : "ESG 框架",
    industries: language === "en" ? "Industries" : "行業",
    certifications: language === "en" ? "Certifications" : "認證",
    trainingOfferings: language === "en" ? "Training Offerings" : "培訓課程",
    contactInformation: language === "en" ? "Contact Information" : "聯絡資訊",
    projectHistory: language === "en" ? "Project History" : "項目歷史",
    skills: language === "en" ? "Skills & Expertise" : "技能與專長",
    reviewsAndFeedback: language === "en" ? "Reviews & Feedback" : "評價與反饋",
    position: language === "en" ? `${consultant.position} at ${consultant.company}` : `${consultant.company} 的${consultant.position}`,
    viewLinkedIn: language === "en" ? "View LinkedIn Profile" : "查看 LinkedIn 檔案",
    reviewsCount: language === "en" 
      ? `${formattedRating || 'N/A'} (${consultant.totalReviews} ${consultant.totalReviews === 1 ? 'review' : 'reviews'})`
      : `${formattedRating || '無'} (${consultant.totalReviews} ${consultant.totalReviews === 1 ? '條評價' : '條評價'})`,
  } : {
    backToConsultants: language === "en" ? "← Back to Consultants" : "← 返回顧問列表",
    bookConsultation: language === "en" ? "Book Consultation" : "預約諮詢",
    addToCart: language === "en" ? "Add to Cart" : "加入購物車",
    writeReview: language === "en" ? "Write Review" : "撰寫評論",
    reviewConsultant: language === "en" ? "Review Consultant" : "評價顧問",
    overview: language === "en" ? "Overview" : "概述",
    expertise: language === "en" ? "Expertise" : "專業知識",
    services: language === "en" ? "Services" : "服務",
    reviews: language === "en" ? "Reviews" : "評價",
    yearsExperience: language === "en" ? "years experience" : "年經驗",
    hourlyRate: language === "en" ? "$/hour" : "$/小時",
    reports: language === "en" ? "reports" : "份報告",
    availability: language === "en" ? "Availability" : "可用性",
    primaryFocus: language === "en" ? "Primary Focus" : "主要專注領域",
    esgFrameworks: language === "en" ? "ESG Frameworks" : "ESG 框架",
    industries: language === "en" ? "Industries" : "行業",
    certifications: language === "en" ? "Certifications" : "認證",
    trainingOfferings: language === "en" ? "Training Offerings" : "培訓課程",
    contactInformation: language === "en" ? "Contact Information" : "聯絡資訊",
    projectHistory: language === "en" ? "Project History" : "項目歷史",
    skills: language === "en" ? "Skills & Expertise" : "技能與專長",
    reviewsAndFeedback: language === "en" ? "Reviews & Feedback" : "評價與反饋",
    position: language === "en" ? "Position at Company" : "公司職位",
    viewLinkedIn: language === "en" ? "View LinkedIn Profile" : "查看 LinkedIn 檔案",
    reviewsCount: language === "en" ? "N/A (0 reviews)" : "無 (0 條評價)",
  };

  return (
    <div className="space-y-6 pb-10">
      <Link href="/consultants">
        <Button variant="ghost" className="mb-4">
          {text.backToConsultants}
        </Button>
      </Link>

      {/* Hero section with consultant profile */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-lg overflow-hidden bg-gradient-to-r from-primary/10 to-primary/5 p-6 md:p-8"
      >
        <div className="grid md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={consultant.photoUrl} alt={consultant.fullName} />
                <AvatarFallback className="bg-primary/20">
                  <User className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {getExpertiseIcon(consultant.expertise)}
                  <Badge variant="outline" className="capitalize">
                    {language === "en" 
                      ? consultant.expertise 
                      : consultant.expertise === "environmental" 
                        ? "環境" 
                        : consultant.expertise === "social" 
                          ? "社會" 
                          : "治理"}
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold">{consultant.fullName}</h1>
                <p className="text-muted-foreground">{text.position}</p>
                
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current text-yellow-500" />
                    {text.reviewsCount}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                    {text.yearsExperience}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:justify-end gap-3">
            <Link href={`/booking?consultantId=${consultant.id}`}>
              <Button size="lg" variant="default" className="w-full md:w-auto">
                <Calendar className="mr-2 h-4 w-4" />
                {text.bookConsultation}
              </Button>
            </Link>
            <Button 
              size="lg"
              variant="outline" 
              className="w-full md:w-auto flex items-center gap-1"
              onClick={addToCart}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {text.addToCart}
            </Button>
            <a href={consultant.linkedinUrl} target="_blank" rel="noopener noreferrer">
              <Button size="icon" variant="ghost">
                <LinkedinIcon className="h-5 w-5 text-blue-600" />
              </Button>
            </a>
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="overview">{text.overview}</TabsTrigger>
          <TabsTrigger value="expertise">{text.expertise}</TabsTrigger>
          <TabsTrigger value="services">{text.services}</TabsTrigger>
          <TabsTrigger value="reviews">{text.reviews}</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === "en" ? "About" : "關於"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed">{consultant.bio}</p>
              
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">{language === "en" ? "Professional Information" : "專業資訊"}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{consultant.company}</p>
                        <p className="text-sm text-muted-foreground">{consultant.position}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{text.reports}</p>
                        <p className="text-sm text-muted-foreground">{language === "en" ? "Completed ESG reports" : "已完成的ESG報告"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{text.hourlyRate}</p>
                        <p className="text-sm text-muted-foreground">{language === "en" ? "Consultation rate" : "諮詢費率"}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">{text.availability}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{consultant.availability}</p>
                        <p className="text-sm text-muted-foreground">{language === "en" ? "Typical response time: 24 hours" : "一般回應時間：24小時"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Languages className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{consultant.languages.join(", ")}</p>
                        <p className="text-sm text-muted-foreground">{language === "en" ? "Working languages" : "工作語言"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{language === "en" ? "Remote & On-site" : "遠程和現場"}</p>
                        <p className="text-sm text-muted-foreground">{language === "en" ? "Consultation options" : "諮詢選項"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>{language === "en" ? "Industry Focus" : "行業焦點"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {consultant.industries.map((industry) => (
                    <div key={industry} className="flex items-center gap-3 p-3 rounded-lg border">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>{industry}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{text.certifications}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {consultant.certifications.map((cert) => (
                  <div key={cert} className="flex items-center gap-3 p-2 rounded-lg border">
                    <Award className="h-5 w-5 text-amber-500" />
                    <span className="text-sm font-medium">{cert}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Expertise Tab */}
        <TabsContent value="expertise" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{text.primaryFocus}</CardTitle>
              <CardDescription>
                {language === "en" 
                  ? "Areas of expertise and specialized knowledge" 
                  : "專業領域和專業知識"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                {getExpertiseIcon(consultant.expertise)}
                <div>
                  <h3 className="text-xl font-bold capitalize">{consultant.expertise} Focus</h3>
                  <p className="text-muted-foreground">
                    {consultant.expertise === "environmental" && (language === "en" 
                      ? "Specializing in environmental sustainability, climate change, and resource efficiency."
                      : "專注於環境可持續性、氣候變化和資源效率。")}
                    {consultant.expertise === "social" && (language === "en" 
                      ? "Specializing in social impact, community relations, and ethical labor practices."
                      : "專注於社會影響、社區關係和道德勞工實踐。")}
                    {consultant.expertise === "governance" && (language === "en" 
                      ? "Specializing in corporate governance, compliance, and ethical business practices."
                      : "專注於企業治理、合規和道德商業實踐。")}
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">{text.esgFrameworks}</h3>
                  <div className="flex flex-wrap gap-2">
                    {consultant.subExpertise.frameworks.map((framework) => (
                      <Badge key={framework} className="px-3 py-1 text-sm">
                        {framework}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">{language === "en" ? "Key Skills" : "主要技能"}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {consultant.subExpertise.keywords.map((keyword, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{keyword}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>{language === "en" ? "Experience Breakdown" : "經驗分析"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{language === "en" ? "ESG Strategy Development" : "ESG 策略開發"}</span>
                    <span>85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{language === "en" ? "Sustainability Reporting" : "可持續發展報告"}</span>
                    <span>92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{language === "en" ? "Risk Assessment" : "風險評估"}</span>
                    <span>78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{language === "en" ? "Stakeholder Engagement" : "利益相關者參與"}</span>
                    <span>88%</span>
                  </div>
                  <Progress value={88} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{language === "en" ? "Consultation Packages" : "諮詢套餐"}</CardTitle>
                  <CardDescription>
                    {language === "en" 
                      ? "Select a package that suits your ESG needs" 
                      : "選擇適合您ESG需求的套餐"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {consultant && (
                    <ConsultationPackages 
                      consultantId={consultant.id}
                      consultantName={consultant.fullName}
                      hourlyRate={consultant.hourlyRate}
                      expertise={consultant.expertise}
                    />
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>{text.trainingOfferings}</CardTitle>
                  <CardDescription>
                    {language === "en" 
                      ? "Specialized training and workshops offered by this consultant" 
                      : "該顧問提供的專業培訓和工作坊"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {consultant && consultant.trainingOfferings.map((offering, index) => (
                      <Card key={index} className="overflow-hidden border border-border/40 hover:border-primary/20 transition-all">
                        <CardHeader className="bg-primary/5 pb-2">
                          <CardTitle className="text-lg">{offering.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <p className="text-sm text-muted-foreground">
                            {offering.description}
                          </p>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-4">
                          <span className="text-sm font-medium">${Math.round(consultant.hourlyRate * 0.9)} per session</span>
                          <Button variant="outline" size="sm" className="text-xs">
                            {language === "en" ? "Inquire" : "查詢"}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>{language === "en" ? "Custom Consultation Services" : "客製化諮詢服務"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {consultant && (
                      <>
                        <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <FileCheck className="h-5 w-5 text-primary" />
                              <h3 className="font-semibold">{language === "en" ? "ESG Assessment & Gap Analysis" : "ESG評估和差距分析"}</h3>
                            </div>
                            <Badge variant="outline">${consultant.hourlyRate * 2}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground ml-7">
                            {language === "en"
                              ? "Comprehensive assessment of your organization's current ESG practices and identification of improvement areas."
                              : "全面評估您組織當前的ESG實踐，並確定需要改進的領域。"}
                          </p>
                        </div>
                        
                        <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <LineChart className="h-5 w-5 text-primary" />
                              <h3 className="font-semibold">{language === "en" ? "Sustainability Strategy Development" : "可持續發展策略制定"}</h3>
                            </div>
                            <Badge variant="outline">${consultant.hourlyRate * 5}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground ml-7">
                            {language === "en"
                              ? "Development of tailored ESG strategies aligned with your business objectives and stakeholder expectations."
                              : "制定與您的業務目標和利益相關者期望相符的量身定制的ESG策略。"}
                          </p>
                        </div>
                        
                        <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-primary" />
                              <h3 className="font-semibold">{language === "en" ? "ESG Reporting & Disclosure" : "ESG報告和披露"}</h3>
                            </div>
                            <Badge variant="outline">${consultant.hourlyRate * 3}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground ml-7">
                            {language === "en"
                              ? "Assistance with preparing comprehensive ESG reports that meet global reporting standards and frameworks."
                              : "協助準備符合全球報告標準和框架的全面ESG報告。"}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button className="w-full" onClick={addToCart}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {text.addToCart}
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <div>
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>{language === "en" ? "Message Consultant" : "發送訊息給顧問"}</CardTitle>
                  <CardDescription>
                    {language === "en" 
                      ? "Ask questions or discuss your needs" 
                      : "詢問問題或討論您的需求"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {consultant && (
                    <MessageConsultant 
                      consultantId={consultant.id}
                      consultantName={consultant.fullName}
                      consultantPhoto={consultant.photoUrl}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{text.reviewsAndFeedback}</CardTitle>
                <CardDescription>
                  {language === "en"
                    ? "Client reviews and feedback for this consultant"
                    : "此顧問的客戶評價和反饋"}
                </CardDescription>
              </div>
              <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Star className="mr-2 h-4 w-4" />
                    {text.writeReview}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>{text.reviewConsultant}</DialogTitle>
                    <DialogDescription>
                      {language === "en"
                        ? "Share your experience working with this consultant"
                        : "分享您與該顧問合作的經驗"}
                    </DialogDescription>
                  </DialogHeader>
                  <ReviewForm
                    consultantId={consultant.id}
                    reviewerId={1} // TODO: Get from auth context
                    onClose={handleReviewSubmit}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <ReviewList
                consultantId={consultant.id}
                currentUserId={1}
                scrollToReviewId={scrollToReviewId}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}