import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Clock, 
  GraduationCap, 
  Users, 
  BookOpen, 
  DollarSign, 
  Calendar, 
  MapPin, 
  Globe, 
  Bookmark, 
  Award, 
  Target, 
  Filter,
  ShoppingCart,
  BadgeCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { useTranslations } from "@/hooks/use-translations";

type Course = {
  id: number;
  title: string;
  description: string;
  price: number;
  duration: string;
  totalHours: number;
  level: "beginner" | "intermediate" | "advanced";
  category: string;
  syllabus: {
    week: number;
    topic: string;
    description: string;
  }[];
  instructor: {
    name: string;
    title: string;
    bio: string;
    photoUrl: string;
    expertise: string[];
  };
  provider: {
    id: number;
    name: string;
    logoUrl?: string;
  };
  courseImage: string;
  learningOutcomes: string[];
  prerequisites: string[];
  maxStudents: number;
  startDate: string;
  endDate?: string;
  language: string;
  certificationType: string;
  location?: string;
  isVirtual?: boolean;
  targetAudience?: string;
};

const mockCourses: Course[] = [
  {
    id: 1,
    title: "ESG Reporting Fundamentals",
    description: "Master the essentials of ESG reporting and learn how to create comprehensive sustainability reports that meet global standards.",
    price: 999,
    duration: "8 weeks",
    totalHours: 32,
    level: "beginner",
    category: "Reporting & Compliance",
    courseImage: "https://api.dicebear.com/7.x/shapes/svg?seed=course1",
    instructor: {
      name: "Dr. Sarah Chen",
      title: "Head of ESG Research, KPMG",
      bio: "Former UN sustainable development advisor with 15+ years of experience in ESG reporting and sustainability strategy.",
      photoUrl: "https://api.dicebear.com/7.x/personas/svg?seed=sarah",
      expertise: ["GRI Standards", "SASB Framework", "Carbon Accounting"]
    },
    provider: {
      id: 1,
      name: "KPMG ESG Academy",
      logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=kpmg"
    },
    syllabus: [
      {
        week: 1,
        topic: "Introduction to ESG Reporting",
        description: "Overview of ESG frameworks and reporting standards"
      },
      {
        week: 2,
        topic: "Data Collection & Analysis",
        description: "Methods and tools for ESG data collection and analysis"
      },
      {
        week: 3,
        topic: "Materiality Assessment",
        description: "Identifying and prioritizing material ESG issues"
      },
      {
        week: 4,
        topic: "GRI Standards in Practice",
        description: "Applying GRI Standards to ESG reporting"
      },
      {
        week: 5,
        topic: "SASB Framework Integration",
        description: "Working with SASB metrics and disclosures"
      },
      {
        week: 6,
        topic: "Data Visualization & Storytelling",
        description: "Effective presentation of ESG data and narratives"
      },
      {
        week: 7,
        topic: "Assurance & Verification",
        description: "Third-party verification of ESG reports"
      },
      {
        week: 8,
        topic: "Future Trends in ESG Reporting",
        description: "Emerging technologies and frameworks"
      }
    ],
    learningOutcomes: [
      "Understand major ESG reporting frameworks",
      "Develop ESG metrics and KPIs",
      "Create comprehensive sustainability reports",
      "Implement ESG data collection systems"
    ],
    prerequisites: ["Basic understanding of corporate sustainability"],
    maxStudents: 30,
    startDate: "2025-06-15",
    endDate: "2025-08-10",
    language: "English",
    certificationType: "Professional Certificate in ESG Reporting",
    location: "London, UK",
    isVirtual: true,
    targetAudience: "Sustainability professionals, CSR managers, and corporate reporting teams"
  },
  {
    id: 2,
    title: "Carbon Accounting & Net Zero Strategy",
    description: "Learn how to measure, report, and reduce greenhouse gas emissions across your organization's value chain.",
    price: 1299,
    duration: "6 weeks",
    totalHours: 36,
    level: "intermediate",
    category: "Environmental",
    courseImage: "https://api.dicebear.com/7.x/shapes/svg?seed=course2",
    instructor: {
      name: "Dr. Michael Rodriguez",
      title: "Climate Strategy Director, Deloitte",
      bio: "Climate scientist with 12 years of experience in carbon accounting and net-zero strategy development.",
      photoUrl: "https://api.dicebear.com/7.x/personas/svg?seed=michael",
      expertise: ["GHG Protocol", "CDP Reporting", "Science-Based Targets"]
    },
    provider: {
      id: 2,
      name: "Deloitte Sustainability",
      logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=deloitte"
    },
    syllabus: [
      {
        week: 1,
        topic: "GHG Accounting Foundations",
        description: "Understand the GHG Protocol and carbon accounting principles"
      },
      {
        week: 2,
        topic: "Scope 1, 2 & 3 Emissions",
        description: "Identifying and measuring direct and indirect emissions"
      },
      {
        week: 3,
        topic: "Carbon Reduction Strategies",
        description: "Developing effective carbon reduction plans"
      },
      {
        week: 4,
        topic: "Science-Based Targets",
        description: "Setting and validating science-based emission targets"
      },
      {
        week: 5,
        topic: "Net Zero Transition Planning",
        description: "Creating robust net zero transition plans"
      },
      {
        week: 6,
        topic: "Carbon Offsetting & Removal",
        description: "Evaluation of carbon credits and removal technologies"
      }
    ],
    learningOutcomes: [
      "Conduct organization-wide carbon footprint analyses",
      "Set science-based emission reduction targets",
      "Develop and implement net-zero strategies",
      "Navigate carbon markets and offsetting mechanisms"
    ],
    prerequisites: [
      "Basic understanding of climate change science",
      "Familiarity with corporate sustainability"
    ],
    maxStudents: 25,
    startDate: "2025-07-10",
    endDate: "2025-08-21",
    language: "English",
    certificationType: "Professional Certificate in Carbon Accounting",
    location: "Virtual",
    isVirtual: true,
    targetAudience: "Sustainability professionals, environmental engineers, and corporate strategists"
  },
  {
    id: 3,
    title: "ESG Due Diligence for Investors",
    description: "Comprehensive training on ESG integration in investment analysis, due diligence, and portfolio management.",
    price: 1599,
    duration: "4 weeks",
    totalHours: 24,
    level: "advanced",
    category: "Finance & Investment",
    courseImage: "https://api.dicebear.com/7.x/shapes/svg?seed=course3",
    instructor: {
      name: "Lisa Wei",
      title: "ESG Investment Director, BlackRock",
      bio: "Investment professional with 15+ years experience in responsible investment and ESG integration in asset management.",
      photoUrl: "https://api.dicebear.com/7.x/personas/svg?seed=lisa",
      expertise: ["ESG Integration", "Impact Investing", "Climate Finance"]
    },
    provider: {
      id: 3,
      name: "BlackRock Sustainable Investing Institute",
      logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=blackrock"
    },
    syllabus: [
      {
        week: 1,
        topic: "ESG Investment Framework",
        description: "Understanding ESG materiality in investment analysis"
      },
      {
        week: 2,
        topic: "ESG Data & Metrics",
        description: "Evaluating and using ESG data providers and ratings"
      },
      {
        week: 3,
        topic: "Climate Risk Analysis",
        description: "Assessing and pricing climate risks in investments"
      },
      {
        week: 4,
        topic: "ESG Engagement Strategies",
        description: "Developing effective corporate engagement approaches"
      }
    ],
    learningOutcomes: [
      "Conduct robust ESG due diligence on investments",
      "Integrate material ESG factors into valuation models",
      "Develop ESG engagement strategies",
      "Monitor and report on portfolio ESG performance"
    ],
    prerequisites: [
      "Financial analysis experience",
      "Investment management knowledge",
      "Understanding of corporate governance"
    ],
    maxStudents: 20,
    startDate: "2025-09-05",
    endDate: "2025-10-03",
    language: "English",
    certificationType: "Advanced Certificate in ESG Investing",
    location: "New York, NY",
    isVirtual: false,
    targetAudience: "Investment professionals, portfolio managers, and financial analysts"
  },
  {
    id: 4,
    title: "Supply Chain ESG Compliance",
    description: "Learn strategies for managing ESG risks and enhancing sustainability throughout global supply chains.",
    price: 899,
    duration: "5 weeks",
    totalHours: 25,
    level: "intermediate",
    category: "Supply Chain & Procurement",
    courseImage: "https://api.dicebear.com/7.x/shapes/svg?seed=course4",
    instructor: {
      name: "Thomas Huang",
      title: "Supply Chain Sustainability Director, PwC",
      bio: "Supply chain expert with 10+ years experience in sustainable procurement and ESG risk management across global operations.",
      photoUrl: "https://api.dicebear.com/7.x/personas/svg?seed=thomas",
      expertise: ["Supplier Assessment", "Human Rights Due Diligence", "Scope 3 Emissions"]
    },
    provider: {
      id: 4,
      name: "PwC ESG Learning Academy",
      logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=pwc"
    },
    syllabus: [
      {
        week: 1,
        topic: "Supply Chain ESG Risks",
        description: "Identifying and mapping ESG risks in supply chains"
      },
      {
        week: 2,
        topic: "Supplier ESG Assessment",
        description: "Tools and frameworks for supplier evaluation"
      },
      {
        week: 3,
        topic: "Human Rights Due Diligence",
        description: "Implementation of UNGP and modern slavery prevention"
      },
      {
        week: 4,
        topic: "Sustainable Procurement",
        description: "Integrating ESG criteria into procurement processes"
      },
      {
        week: 5,
        topic: "Supply Chain Reporting",
        description: "Transparency and disclosure of supply chain ESG performance"
      }
    ],
    learningOutcomes: [
      "Design and implement supplier ESG assessment programs",
      "Conduct human rights due diligence in supply chains",
      "Develop sustainable procurement policies",
      "Manage and report on Scope 3 emissions"
    ],
    prerequisites: [
      "Supply chain management experience",
      "Basic understanding of ESG principles"
    ],
    maxStudents: 30,
    startDate: "2025-08-01",
    endDate: "2025-09-05",
    language: "English",
    certificationType: "Certificate in Supply Chain ESG Management",
    location: "Singapore",
    isVirtual: true,
    targetAudience: "Supply chain managers, procurement officers, and sustainability professionals"
  },
  {
    id: 5,
    title: "Sustainable Finance Fundamentals",
    description: "Learn the core principles of sustainable finance, green bonds, and ESG-linked financial instruments.",
    price: 1199,
    duration: "6 weeks",
    totalHours: 30,
    level: "intermediate",
    category: "Finance & Investment",
    courseImage: "https://api.dicebear.com/7.x/shapes/svg?seed=course5",
    instructor: {
      name: "Dr. James Mitchell",
      title: "Head of Sustainable Finance, HSBC",
      bio: "Banking expert with 18 years experience in developing sustainable financial products and green bonds.",
      photoUrl: "https://api.dicebear.com/7.x/personas/svg?seed=james",
      expertise: ["Green Bonds", "Sustainability-linked Loans", "ESG Ratings"]
    },
    provider: {
      id: 5,
      name: "HSBC Sustainable Finance Academy",
      logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=hsbc"
    },
    syllabus: [
      {
        week: 1,
        topic: "Introduction to Sustainable Finance",
        description: "Overview of sustainable finance ecosystem and market trends"
      },
      {
        week: 2,
        topic: "Green Bonds & Social Bonds",
        description: "Structuring, issuing and reporting on use-of-proceeds bonds"
      },
      {
        week: 3,
        topic: "Sustainability-linked Financial Instruments",
        description: "KPI-linked loans, bonds and financial products"
      },
      {
        week: 4,
        topic: "ESG Integration in Banking",
        description: "Implementing ESG risk assessment in lending decisions"
      },
      {
        week: 5,
        topic: "Impact Measurement & Reporting",
        description: "Methodologies for measuring and reporting sustainability impact"
      },
      {
        week: 6,
        topic: "Regulatory Trends & Future Developments",
        description: "Navigating evolving sustainable finance regulations and taxonomies"
      }
    ],
    learningOutcomes: [
      "Structure green bonds and sustainability-linked loans",
      "Evaluate ESG risks in financial transactions",
      "Develop sustainable finance frameworks",
      "Navigate sustainable finance regulations"
    ],
    prerequisites: [
      "Background in finance or banking",
      "Basic understanding of sustainability concepts"
    ],
    maxStudents: 25,
    startDate: "2025-09-15",
    endDate: "2025-10-27",
    language: "English",
    certificationType: "Certificate in Sustainable Finance",
    location: "Frankfurt, Germany",
    isVirtual: false,
    targetAudience: "Banking professionals, financial analysts, and corporate finance teams"
  },
  {
    id: 6,
    title: "Biodiversity & Natural Capital Assessment",
    description: "Comprehensive training on how to measure, value, and protect biodiversity and natural capital in business operations.",
    price: 1399,
    duration: "7 weeks",
    totalHours: 35,
    level: "advanced",
    category: "Environmental",
    courseImage: "https://api.dicebear.com/7.x/shapes/svg?seed=course6",
    instructor: {
      name: "Dr. Maria Garcia",
      title: "Natural Capital Director, Conservation International",
      bio: "Environmental scientist with 15+ years specializing in biodiversity metrics and nature-based solutions.",
      photoUrl: "https://api.dicebear.com/7.x/personas/svg?seed=maria",
      expertise: ["TNFD Framework", "Biodiversity Metrics", "Natural Capital Accounting"]
    },
    provider: {
      id: 6,
      name: "Conservation International Learning Hub",
      logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=conservation"
    },
    syllabus: [
      {
        week: 1,
        topic: "Introduction to Natural Capital",
        description: "Understanding ecosystem services and natural capital dependencies"
      },
      {
        week: 2,
        topic: "Biodiversity Impact Assessment",
        description: "Methodologies for measuring biodiversity impacts and dependencies"
      },
      {
        week: 3,
        topic: "TNFD Framework Implementation",
        description: "Applying the Taskforce on Nature-related Financial Disclosures framework"
      },
      {
        week: 4,
        topic: "Natural Capital Accounting",
        description: "Valuation techniques and accounting for natural capital"
      },
      {
        week: 5,
        topic: "Biodiversity Footprinting",
        description: "Tools and methods for measuring corporate biodiversity footprints"
      },
      {
        week: 6,
        topic: "Nature-based Solutions",
        description: "Designing and implementing nature-based solutions for climate and biodiversity"
      },
      {
        week: 7,
        topic: "Biodiversity Strategy Development",
        description: "Creating corporate biodiversity strategies with measurable targets"
      }
    ],
    learningOutcomes: [
      "Conduct biodiversity impact assessments",
      "Implement the TNFD framework",
      "Value ecosystem services and natural capital",
      "Develop nature-positive business strategies"
    ],
    prerequisites: [
      "Environmental science background",
      "Understanding of corporate sustainability",
      "Familiarity with environmental assessment methods"
    ],
    maxStudents: 20,
    startDate: "2025-10-05",
    endDate: "2025-11-21",
    language: "English",
    certificationType: "Advanced Certificate in Natural Capital Management",
    location: "Virtual",
    isVirtual: true,
    targetAudience: "Environmental managers, sustainability professionals, and conservation specialists"
  },
  {
    id: 7,
    title: "ESG Data Management & Analytics",
    description: "Master the collection, management, analysis and visualization of ESG data for decision-making and reporting.",
    price: 1099,
    duration: "5 weeks",
    totalHours: 30,
    level: "intermediate",
    category: "Data & Technology",
    courseImage: "https://api.dicebear.com/7.x/shapes/svg?seed=course7",
    instructor: {
      name: "Alex Patel",
      title: "ESG Data Lead, EY",
      bio: "Data scientist with 10+ years in sustainability data systems and ESG analytics solutions.",
      photoUrl: "https://api.dicebear.com/7.x/personas/svg?seed=alex",
      expertise: ["ESG Data Systems", "Sustainability Analytics", "Data Visualization"]
    },
    provider: {
      id: 7,
      name: "EY Sustainability Data Academy",
      logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=ey"
    },
    syllabus: [
      {
        week: 1,
        topic: "ESG Data Strategy",
        description: "Developing comprehensive ESG data collection strategies"
      },
      {
        week: 2,
        topic: "Data Collection & Validation",
        description: "Methods and tools for efficient ESG data collection and quality control"
      },
      {
        week: 3,
        topic: "ESG Analytics & Insights",
        description: "Techniques for analyzing ESG data and generating meaningful insights"
      },
      {
        week: 4,
        topic: "ESG Data Visualization",
        description: "Creating impactful dashboards and visualizations for ESG reporting"
      },
      {
        week: 5,
        topic: "Technology Solutions",
        description: "ESG software platforms and technology solutions for sustainability management"
      }
    ],
    learningOutcomes: [
      "Develop ESG data collection systems",
      "Implement data quality control processes",
      "Build ESG analytics dashboards",
      "Select appropriate ESG technology solutions"
    ],
    prerequisites: [
      "Basic data analysis skills",
      "Familiarity with sustainability reporting",
      "Knowledge of Excel or similar tools"
    ],
    maxStudents: 30,
    startDate: "2025-08-20",
    endDate: "2025-09-24",
    language: "English",
    certificationType: "Certificate in ESG Data Management",
    location: "Chicago, IL",
    isVirtual: true,
    targetAudience: "Sustainability data managers, ESG analysts, and corporate reporting teams"
  },
  {
    id: 8,
    title: "Sustainable Product Design & Lifecycle Assessment",
    description: "Learn methodologies for designing sustainable products and conducting lifecycle assessments to minimize environmental impacts.",
    price: 1199,
    duration: "6 weeks",
    totalHours: 36,
    level: "intermediate",
    category: "Product Development",
    courseImage: "https://api.dicebear.com/7.x/shapes/svg?seed=course8",
    instructor: {
      name: "Nina Thompson",
      title: "Head of Sustainable Design, Unilever",
      bio: "Product design expert with 12+ years experience in ecodesign, lifecycle assessment, and circular economy principles.",
      photoUrl: "https://api.dicebear.com/7.x/personas/svg?seed=nina",
      expertise: ["Lifecycle Assessment", "Circular Design", "Ecodesign Principles"]
    },
    provider: {
      id: 8,
      name: "Unilever Sustainable Living Academy",
      logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=unilever"
    },
    syllabus: [
      {
        week: 1,
        topic: "Sustainable Design Principles",
        description: "Introduction to ecodesign principles and frameworks"
      },
      {
        week: 2,
        topic: "Lifecycle Assessment Methodology",
        description: "Understanding LCA methodology and standards (ISO 14040/14044)"
      },
      {
        week: 3,
        topic: "Materials Selection & Sourcing",
        description: "Evaluating and selecting sustainable materials"
      },
      {
        week: 4,
        topic: "Circular Economy Strategies",
        description: "Implementing circular design principles in product development"
      },
      {
        week: 5,
        topic: "Product Carbon Footprinting",
        description: "Calculating and reducing product carbon footprints"
      },
      {
        week: 6,
        topic: "Sustainability Communication",
        description: "Effectively communicating product sustainability attributes"
      }
    ],
    learningOutcomes: [
      "Conduct product lifecycle assessments",
      "Apply ecodesign principles to product development",
      "Implement circular economy strategies",
      "Calculate and reduce product environmental footprints"
    ],
    prerequisites: [
      "Background in product design or development",
      "Basic understanding of sustainability principles",
      "Familiarity with manufacturing processes"
    ],
    maxStudents: 25,
    startDate: "2025-11-01",
    endDate: "2025-12-13",
    language: "English",
    certificationType: "Certificate in Sustainable Product Design",
    location: "Amsterdam, Netherlands",
    isVirtual: false,
    targetAudience: "Product designers, engineers, and sustainability product managers"
  },
  {
    id: 9,
    title: "Corporate Social Responsibility & Stakeholder Engagement",
    description: "Develop strategies for effective CSR programs and meaningful stakeholder engagement across your organization.",
    price: 849,
    duration: "4 weeks",
    totalHours: 20,
    level: "beginner",
    category: "Social",
    courseImage: "https://api.dicebear.com/7.x/shapes/svg?seed=course9",
    instructor: {
      name: "Robert Kim",
      title: "Global CSR Director, Microsoft",
      bio: "CSR strategist with 15+ years experience developing award-winning corporate citizenship programs.",
      photoUrl: "https://api.dicebear.com/7.x/personas/svg?seed=robert",
      expertise: ["Stakeholder Management", "Community Investment", "Social Impact Measurement"]
    },
    provider: {
      id: 9,
      name: "Microsoft Sustainability Academy",
      logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=microsoft"
    },
    syllabus: [
      {
        week: 1,
        topic: "CSR Strategy Development",
        description: "Creating purpose-driven CSR strategies aligned with business objectives"
      },
      {
        week: 2,
        topic: "Stakeholder Mapping & Engagement",
        description: "Identifying and engaging with key stakeholders effectively"
      },
      {
        week: 3,
        topic: "Community Investment Programs",
        description: "Designing impactful community investment and philanthropy initiatives"
      },
      {
        week: 4,
        topic: "Social Impact Measurement",
        description: "Approaches to measuring and communicating social impact"
      }
    ],
    learningOutcomes: [
      "Develop strategic CSR programs",
      "Create stakeholder engagement plans",
      "Design community investment initiatives",
      "Measure and report on social impact"
    ],
    prerequisites: [
      "Interest in corporate social responsibility",
      "No specific prior experience required"
    ],
    maxStudents: 40,
    startDate: "2025-07-15",
    endDate: "2025-08-12",
    language: "English",
    certificationType: "Certificate in Corporate Social Responsibility",
    location: "Virtual",
    isVirtual: true,
    targetAudience: "CSR managers, community relations professionals, and corporate communications teams"
  }
];

export default function Courses() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDelivery, setSelectedDelivery] = useState("");
  const [selectedTab, setSelectedTab] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Get all unique categories from the courses
  const categories = Array.from(new Set(mockCourses.map(course => course.category)));
  
  const { data: courses = mockCourses } = useQuery<Course[]>({
    queryKey: ['/api/courses', searchTerm, selectedLevel, selectedCategory, selectedDelivery],
  });

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (course.targetAudience && course.targetAudience.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          course.provider.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = !selectedLevel || course.level === selectedLevel;
    const matchesCategory = !selectedCategory || course.category === selectedCategory;
    const matchesDelivery = !selectedDelivery || 
                          (selectedDelivery === "virtual" && course.isVirtual) || 
                          (selectedDelivery === "inperson" && !course.isVirtual);
    return matchesSearch && matchesLevel && matchesCategory && matchesDelivery;
  });

  const [, navigate] = useLocation();
  
  const { addItem } = useCart();
  const { language } = useTranslations();
  
  const handleEnroll = (course: Course) => {
    if (!user) {
      toast({
        title: language === "en" ? "Authentication required" : "需要驗證",
        description: language === "en" 
          ? "Please log in to enroll in this course" 
          : "請登入以報名本課程",
        variant: "destructive"
      });
      return;
    }
    
    // Add the course to the shopping cart
    addItem({
      id: course.id,
      type: "course",
      name: course.title,
      price: course.price,
      details: {
        duration: course.duration,
        level: course.level,
        startDate: course.startDate,
        provider: course.provider.name
      }
    });
    
    toast({
      title: language === "en" ? "Added to cart!" : "已加入購物車！",
      description: language === "en" 
        ? `"${course.title}" has been added to your cart` 
        : `"${course.title}" 已加入您的購物車`,
    });
  };

  const openCourseDetails = (course: Course) => {
    setSelectedCourse(course);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ESG Training Programs</h1>
          <p className="text-muted-foreground mt-2">
            Professional certification courses led by industry experts
          </p>
        </div>
        <div className="flex items-center gap-4">
          {!user && (
            <Button 
              variant="outline"
              onClick={() => navigate("/auth?next=/provider-management")}
              className="md:mr-4"
            >
              Become a Course Provider
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Button 
              variant={selectedTab === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTab("grid")}
            >
              Grid View
            </Button>
            <Button 
              variant={selectedTab === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTab("list")}
            >
              List View
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Label>Search courses</Label>
          <Input
            placeholder="Search by title, description, audience or provider"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters {showFilters ? "▲" : "▼"}
        </Button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-md bg-muted/20">
          <div>
            <Label>Level</Label>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger>
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Delivery Method</Label>
            <Select value={selectedDelivery} onValueChange={setSelectedDelivery}>
              <SelectTrigger>
                <SelectValue placeholder="All delivery methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All delivery methods</SelectItem>
                <SelectItem value="virtual">Virtual</SelectItem>
                <SelectItem value="inperson">In-person</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button 
              variant="ghost" 
              className="text-sm" 
              onClick={() => {
                setSelectedLevel("");
                setSelectedCategory("");
                setSelectedDelivery("");
                setSearchTerm("");
              }}
            >
              Clear all filters
            </Button>
          </div>
        </div>
      )}

      {filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-muted/10">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-xl font-medium mb-2">No courses found</h3>
          <p className="text-muted-foreground text-center max-w-md">
            We couldn't find any courses matching your search criteria. Try adjusting your filters or search term.
          </p>
        </div>
      ) : selectedTab === "grid" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="flex flex-col hover:shadow-lg transition-all">
              <CardHeader className="p-0">
                <div className="relative h-48">
                  <img
                    src={course.courseImage}
                    alt={course.title}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Badge>{course.level}</Badge>
                    <Badge variant="secondary">{course.category}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-6 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <img 
                      src={course.provider.logoUrl || "https://api.dicebear.com/7.x/initials/svg?seed=" + course.provider.name}
                      alt={course.provider.name}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm text-muted-foreground">{course.provider.name}</span>
                  </div>
                  <CardTitle className="text-xl mb-2">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>${course.price}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(course.startDate), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {course.isVirtual ? (
                      <>
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span>Virtual</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{course.location}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mt-4">
                  <Button variant="outline" className="w-full" onClick={() => openCourseDetails(course)}>
                    View Details
                  </Button>
                  <Button className="w-full" onClick={() => handleEnroll(course)}>
                    Enroll Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCourses.map((course) => (
            <div key={course.id} className="flex flex-col md:flex-row border rounded-lg overflow-hidden hover:shadow-md transition-all">
              <div className="md:w-1/4 h-48 md:h-auto">
                <img
                  src={course.courseImage}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <img 
                    src={course.provider.logoUrl || "https://api.dicebear.com/7.x/initials/svg?seed=" + course.provider.name}
                    alt={course.provider.name}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-sm text-muted-foreground">{course.provider.name}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                <p className="text-muted-foreground mb-4 line-clamp-2">{course.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>${course.price}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(course.startDate), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {course.isVirtual ? (
                      <>
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span>Virtual</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{course.location}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 mb-4">
                  <Badge>{course.level}</Badge>
                  <Badge variant="secondary">{course.category}</Badge>
                  {course.targetAudience && (
                    <Badge variant="outline">
                      <Target className="h-3 w-3 mr-1" />
                      {course.targetAudience.split(',')[0]}
                    </Badge>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => openCourseDetails(course)}>
                    View Details
                  </Button>
                  <Button onClick={() => handleEnroll(course)}>
                    Enroll Now
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Detail Dialog */}
      <Dialog open={!!selectedCourse} onOpenChange={(open) => !open && setSelectedCourse(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedCourse && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <img 
                    src={selectedCourse.provider.logoUrl || "https://api.dicebear.com/7.x/initials/svg?seed=" + selectedCourse.provider.name}
                    alt={selectedCourse.provider.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-sm">{selectedCourse.provider.name}</span>
                </div>
                <DialogTitle className="text-2xl">{selectedCourse.title}</DialogTitle>
                <DialogDescription>{selectedCourse.description}</DialogDescription>
              </DialogHeader>

              <div className="mt-6">
                <Tabs defaultValue="overview">
                  <TabsList className="w-full">
                    <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                    <TabsTrigger value="syllabus" className="flex-1">Syllabus</TabsTrigger>
                    <TabsTrigger value="instructor" className="flex-1">Instructor</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-6 mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 p-4 bg-muted/20 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Duration</h4>
                        <p className="flex items-center gap-2 mt-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {selectedCourse.duration} ({selectedCourse.totalHours} hours)
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Price</h4>
                        <p className="flex items-center gap-2 mt-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          ${selectedCourse.price}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Level</h4>
                        <p className="mt-1">
                          <Badge>{selectedCourse.level}</Badge>
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Start Date</h4>
                        <p className="flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(selectedCourse.startDate), 'MMMM d, yyyy')}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Location</h4>
                        <p className="flex items-center gap-2 mt-1">
                          {selectedCourse.isVirtual ? (
                            <>
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              Virtual
                            </>
                          ) : (
                            <>
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              {selectedCourse.location}
                            </>
                          )}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Max Students</h4>
                        <p className="flex items-center gap-2 mt-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {selectedCourse.maxStudents}
                        </p>
                      </div>
                    </div>
                    
                    {selectedCourse.targetAudience && (
                      <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                          <Target className="h-5 w-5" />
                          Target Audience
                        </h3>
                        <p className="text-muted-foreground">{selectedCourse.targetAudience}</p>
                      </div>
                    )}
                    
                    {selectedCourse.learningOutcomes && selectedCourse.learningOutcomes.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                          <BookOpen className="h-5 w-5" />
                          Learning Outcomes
                        </h3>
                        <ul className="grid md:grid-cols-2 gap-2">
                          {selectedCourse.learningOutcomes.map((outcome, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="mt-1">•</div>
                              <div>{outcome}</div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {selectedCourse.prerequisites && selectedCourse.prerequisites.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Prerequisites</h3>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          {selectedCourse.prerequisites.map((prerequisite, index) => (
                            <li key={index}>{prerequisite}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                        <Award className="h-5 w-5" />
                        Certification
                      </h3>
                      <p className="text-muted-foreground">{selectedCourse.certificationType}</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="syllabus" className="space-y-6 mt-4">
                    <div className="space-y-6">
                      {selectedCourse.syllabus && selectedCourse.syllabus.length > 0 ? (
                        selectedCourse.syllabus.map((week) => (
                          <div key={week.week} className="border-l-2 border-primary pl-4 py-2">
                            <h4 className="font-semibold">Week {week.week}: {week.topic}</h4>
                            <p className="text-muted-foreground mt-1">{week.description}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground">No syllabus information available for this course.</p>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="instructor" className="mt-4">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      <img
                        src={selectedCourse.instructor.photoUrl}
                        alt={selectedCourse.instructor.name}
                        className="w-24 h-24 rounded-full object-cover"
                      />
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-semibold">{selectedCourse.instructor.name}</h3>
                          <p className="text-muted-foreground">{selectedCourse.instructor.title}</p>
                        </div>
                        <p>{selectedCourse.instructor.bio}</p>
                        
                        <div>
                          <h4 className="font-medium mb-2">Areas of Expertise</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedCourse.instructor.expertise.map((expertise, index) => (
                              <Badge key={index} variant="outline">{expertise}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2">
                <Button variant="outline" className="sm:ml-auto" onClick={() => setSelectedCourse(null)}>
                  Close
                </Button>
                <Button onClick={() => handleEnroll(selectedCourse)}>
                  Enroll Now - ${selectedCourse.price}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}