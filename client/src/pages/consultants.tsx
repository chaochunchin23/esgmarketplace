import { useQuery } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { debounce } from "@/lib/utils";
import { Link } from "wouter";
import {
  SlidersHorizontal,
  User,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  DollarSign,
  Building2,
  FileText,
} from "lucide-react";
import { FilterGroup, MultiSelectFilter, RangeFilter, TextFilter } from "@/components/ui/filters";

type ESGFramework = "GRI" | "SASB" | "TCFD" | "TNFD" | "SDGs";
type ExpertiseArea = "environmental" | "social" | "governance";

type Consultant = {
  id: number;
  fullName: string;
  photoUrl: string;
  bio: string;
  expertise: ExpertiseArea;
  subExpertise: {
    frameworks: ESGFramework[];
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
};

interface Filters {
  search: string;
  expertise: ExpertiseArea[];
  industries: string[];
  languages: string[];
  frameworks: ESGFramework[];
  hourlyRate: [number, number];
  yearsExperience: [number, number];
}

const defaultFilters: Filters = {
  search: "",
  expertise: [],
  industries: [],
  languages: [],
  frameworks: [],
  hourlyRate: [0, 500],
  yearsExperience: [0, 20],
};

const mockConsultants: Consultant[] = [
  {
    id: 1,
    fullName: "Sarah Chen",
    photoUrl: "https://api.dicebear.com/7.x/personas/svg?seed=sarah-chen&backgroundColor=b6e3f4",
    bio: "KPMG veteran specializing in sustainable finance and ESG integration. Led over 45 successful ESG reporting projects for Fortune 500 companies.",
    expertise: "environmental",
    subExpertise: {
      frameworks: ["GRI", "TCFD", "SASB"],
      keywords: ["Carbon Accounting", "Net Zero Strategy", "Climate Risk Assessment"]
    },
    trainingOfferings: [
      {
        title: "Materiality Assessment Workshop",
        description: "Learn how to conduct comprehensive materiality assessments"
      }
    ],
    hourlyRate: 250,
    yearsExperience: 12,
    company: "KPMG",
    position: "Senior Manager, ESG Advisory",
    reportsGenerated: 45,
    certifications: ["GRI Certified", "SASB FSA Credential"],
    availability: "20 hours/week",
    linkedinUrl: "https://linkedin.com",
    languages: ["English", "Mandarin"],
    industries: ["Financial Services", "Technology"]
  },
  {
    id: 2,
    fullName: "Michael Park",
    photoUrl: "https://api.dicebear.com/7.x/personas/svg?seed=michael-park&backgroundColor=b6e3f4",
    bio: "Distinguished PwC Director with expertise in ESG governance frameworks.",
    expertise: "governance",
    subExpertise: {
      frameworks: ["SASB", "SDGs"],
      keywords: ["Board Oversight", "ESG Integration"]
    },
    trainingOfferings: [
      {
        title: "ESG Governance Workshop",
        description: "Design and implement effective ESG governance structures"
      }
    ],
    hourlyRate: 300,
    yearsExperience: 15,
    company: "PwC",
    position: "Director, Sustainable Finance",
    reportsGenerated: 60,
    certifications: ["SASB FSA Credential"],
    availability: "15 hours/week",
    linkedinUrl: "https://linkedin.com",
    languages: ["English", "Korean"],
    industries: ["Banking", "Insurance"]
  },
  {
    id: 3,
    fullName: "Emma Thompson",
    photoUrl: "https://api.dicebear.com/7.x/personas/svg?seed=emma-thompson&backgroundColor=b6e3f4",
    bio: "Social impact specialist with focus on human rights and supply chain sustainability.",
    expertise: "social",
    subExpertise: {
      frameworks: ["GRI", "SDGs"],
      keywords: ["Human Rights", "Supply Chain"]
    },
    trainingOfferings: [
      {
        title: "Social Impact Assessment",
        description: "Learn to measure and report social impact"
      }
    ],
    hourlyRate: 200,
    yearsExperience: 8,
    company: "Deloitte",
    position: "Manager, Sustainability",
    reportsGenerated: 30,
    certifications: ["GRI Certified"],
    availability: "30 hours/week",
    linkedinUrl: "https://linkedin.com",
    languages: ["English", "Spanish"],
    industries: ["Retail", "Manufacturing"]
  },
  {
    id: 4,
    fullName: "James Wilson",
    photoUrl: "https://api.dicebear.com/7.x/personas/svg?seed=james-wilson&backgroundColor=b6e3f4",
    bio: "Climate change expert specializing in TCFD reporting and scenario analysis.",
    expertise: "environmental",
    subExpertise: {
      frameworks: ["TCFD", "TNFD"],
      keywords: ["Climate Risk", "Scenario Analysis"]
    },
    trainingOfferings: [
      {
        title: "TCFD Implementation",
        description: "Step-by-step guidance on TCFD reporting"
      }
    ],
    hourlyRate: 275,
    yearsExperience: 10,
    company: "EY",
    position: "Senior Manager, Climate Change",
    reportsGenerated: 40,
    certifications: ["TCFD Certified"],
    availability: "25 hours/week",
    linkedinUrl: "https://linkedin.com",
    languages: ["English", "French"],
    industries: ["Energy", "Utilities"]
  },
  {
    id: 5,
    fullName: "Nina Rodriguez",
    photoUrl: "https://api.dicebear.com/7.x/personas/svg?seed=nina-rodriguez&backgroundColor=b6e3f4",
    bio: "Corporate governance expert with focus on ESG integration in board decisions.",
    expertise: "governance",
    subExpertise: {
      frameworks: ["GRI", "SASB"],
      keywords: ["Corporate Governance", "ESG Integration"]
    },
    trainingOfferings: [
      {
        title: "Board ESG Training",
        description: "ESG integration for board members"
      }
    ],
    hourlyRate: 350,
    yearsExperience: 18,
    company: "Independent",
    position: "ESG Advisor",
    reportsGenerated: 75,
    certifications: ["GRI Certified", "SASB FSA"],
    availability: "20 hours/week",
    linkedinUrl: "https://linkedin.com",
    languages: ["English", "Spanish"],
    industries: ["Financial Services", "Healthcare"]
  },
  {
    id: 6,
    fullName: "David Kim",
    photoUrl: "https://api.dicebear.com/7.x/personas/svg?seed=david-kim&backgroundColor=b6e3f4",
    bio: "Sustainable finance expert specializing in green bonds and ESG investing.",
    expertise: "environmental",
    subExpertise: {
      frameworks: ["GRI", "SASB"],
      keywords: ["Green Bonds", "ESG Investing"]
    },
    trainingOfferings: [
      {
        title: "Sustainable Finance",
        description: "Understanding green financial instruments"
      }
    ],
    hourlyRate: 325,
    yearsExperience: 14,
    company: "Morgan Stanley",
    position: "VP, Sustainable Finance",
    reportsGenerated: 55,
    certifications: ["CFA ESG"],
    availability: "15 hours/week",
    linkedinUrl: "https://linkedin.com",
    languages: ["English", "Korean"],
    industries: ["Banking", "Investment Management"]
  },
  {
    id: 7,
    fullName: "Lisa Chen",
    photoUrl: "https://api.dicebear.com/7.x/personas/svg?seed=lisa-chen&backgroundColor=b6e3f4",
    bio: "Supply chain sustainability expert with focus on scope 3 emissions.",
    expertise: "environmental",
    subExpertise: {
      frameworks: ["GRI", "TCFD"],
      keywords: ["Supply Chain", "Scope 3 Emissions"]
    },
    trainingOfferings: [
      {
        title: "Supply Chain ESG",
        description: "Managing scope 3 emissions"
      }
    ],
    hourlyRate: 275,
    yearsExperience: 11,
    company: "BSR",
    position: "Director, Supply Chain",
    reportsGenerated: 50,
    certifications: ["GRI Certified"],
    availability: "25 hours/week",
    linkedinUrl: "https://linkedin.com",
    languages: ["English", "Mandarin"],
    industries: ["Manufacturing", "Retail"]
  },
  {
    id: 8,
    fullName: "Mark Johnson",
    photoUrl: "https://api.dicebear.com/7.x/personas/svg?seed=mark-johnson&backgroundColor=b6e3f4",
    bio: "Biodiversity and natural capital assessment specialist.",
    expertise: "environmental",
    subExpertise: {
      frameworks: ["TNFD", "SASB"],
      keywords: ["Biodiversity", "Natural Capital"]
    },
    trainingOfferings: [
      {
        title: "Biodiversity Assessment",
        description: "Natural capital valuation methods"
      }
    ],
    hourlyRate: 290,
    yearsExperience: 13,
    company: "Natural Capital Alliance",
    position: "Senior Advisor",
    reportsGenerated: 45,
    certifications: ["TNFD Expert"],
    availability: "20 hours/week",
    linkedinUrl: "https://linkedin.com",
    languages: ["English", "Portuguese"],
    industries: ["Agriculture", "Mining"]
  },
  {
    id: 9,
    fullName: "Sophie Martin",
    photoUrl: "https://api.dicebear.com/7.x/personas/svg?seed=sophie-martin&backgroundColor=b6e3f4",
    bio: "Human rights and social impact measurement expert.",
    expertise: "social",
    subExpertise: {
      frameworks: ["GRI", "SDGs"],
      keywords: ["Human Rights", "Social Impact"]
    },
    trainingOfferings: [
      {
        title: "Human Rights Assessment",
        description: "Social impact measurement"
      }
    ],
    hourlyRate: 240,
    yearsExperience: 9,
    company: "Social Value International",
    position: "Principal Consultant",
    reportsGenerated: 35,
    certifications: ["GRI Certified"],
    availability: "30 hours/week",
    linkedinUrl: "https://linkedin.com",
    languages: ["English", "French"],
    industries: ["Consumer Goods", "Apparel"]
  }
];

export default function Consultants() {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(defaultFilters);
  const consultantsPerPage = 9;

  const debouncedSetFilters = useCallback(
    debounce((value: string) => {
      setFilters(prev => ({ ...prev, search: value }));
    }, 300),
    []
  );

  // Prepare query parameters for API request
  const getQueryParams = (filters: Filters) => {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    
    if (filters.expertise.length > 0) {
      params.append('expertise', filters.expertise.join(','));
    }
    
    if (filters.frameworks.length > 0) {
      params.append('frameworks', filters.frameworks.join(','));
    }
    
    if (filters.industries.length > 0) {
      params.append('industries', filters.industries.join(','));
    }
    
    if (filters.languages.length > 0) {
      params.append('languages', filters.languages.join(','));
    }
    
    params.append('minRate', filters.hourlyRate[0].toString());
    params.append('maxRate', filters.hourlyRate[1].toString());
    params.append('minExperience', filters.yearsExperience[0].toString());
    params.append('maxExperience', filters.yearsExperience[1].toString());
    
    return params.toString();
  };

  // Fetch consultants from the API with filters
  const { data: consultants = mockConsultants, isLoading } = useQuery<Consultant[]>({
    queryKey: ['/api/consultants', appliedFilters],
    queryFn: async () => {
      if (Object.values(appliedFilters).some(val => 
        Array.isArray(val) ? val.length > 0 : Boolean(val))) {
        // If any filters are applied, use the search endpoint
        const queryParams = getQueryParams(appliedFilters);
        const response = await fetch(`/api/consultants/search?${queryParams}`);
        if (!response.ok) throw new Error('Failed to fetch consultants');
        return response.json();
      } else {
        // Otherwise, get all consultants
        const response = await fetch('/api/consultants');
        if (!response.ok) throw new Error('Failed to fetch consultants');
        return response.json();
      }
    }
  });

  const handleSearch = () => {
    setAppliedFilters(filters);
    setCurrentPage(1);
  };

  const expertiseOptions = [
    { value: "environmental", label: "Environmental" },
    { value: "social", label: "Social" },
    { value: "governance", label: "Governance" },
  ];

  const frameworkOptions = [
    { value: "GRI", label: "GRI Standards" },
    { value: "SASB", label: "SASB Standards" },
    { value: "TCFD", label: "TCFD Framework" },
    { value: "TNFD", label: "TNFD Framework" },
    { value: "SDGs", label: "UN SDGs" },
  ];

  const industryOptions = Array.from(
    new Set(mockConsultants.flatMap(c => c.industries))
  ).map(industry => ({
    value: industry,
    label: industry,
  }));

  const languageOptions = Array.from(
    new Set(mockConsultants.flatMap(c => c.languages))
  ).map(language => ({
    value: language,
    label: language,
  }));

  const filteredConsultants = consultants.filter(consultant => {
    const matchesSearch = filters.search === "" ||
      consultant.fullName.toLowerCase().includes(filters.search.toLowerCase()) ||
      consultant.bio.toLowerCase().includes(filters.search.toLowerCase()) ||
      consultant.company.toLowerCase().includes(filters.search.toLowerCase());

    const matchesExpertise = filters.expertise.length === 0 ||
      filters.expertise.includes(consultant.expertise);

    const matchesIndustries = filters.industries.length === 0 ||
      consultant.industries.some(i => filters.industries.includes(i));

    const matchesLanguages = filters.languages.length === 0 ||
      consultant.languages.some(l => filters.languages.includes(l));

    const matchesFrameworks = filters.frameworks.length === 0 ||
      consultant.subExpertise.frameworks.some(f => filters.frameworks.includes(f));

    const matchesRate = consultant.hourlyRate >= filters.hourlyRate[0] &&
      consultant.hourlyRate <= filters.hourlyRate[1];

    const matchesExperience = consultant.yearsExperience >= filters.yearsExperience[0] &&
      consultant.yearsExperience <= filters.yearsExperience[1];

    return matchesSearch && matchesExpertise && matchesIndustries &&
      matchesLanguages && matchesRate && matchesExperience && matchesFrameworks;
  });

  const totalPages = Math.ceil(filteredConsultants.length / consultantsPerPage);
  const startIndex = (currentPage - 1) * consultantsPerPage;
  const paginatedConsultants = filteredConsultants.slice(startIndex, startIndex + consultantsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ESG Consultants</h1>
          <p className="text-muted-foreground mt-2">
            Connect with experienced ESG professionals from leading firms
          </p>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] flex flex-col h-full">
            <div className="flex-1 overflow-y-auto">
              <FilterGroup className="mb-20">
                <TextFilter
                  label="Search"
                  value={filters.search}
                  onChange={(value) => debouncedSetFilters(value)}
                />
                <MultiSelectFilter
                  label="Expertise"
                  value={filters.expertise}
                  onChange={(value) => setFilters(prev => ({ ...prev, expertise: value as ExpertiseArea[] }))}
                  options={expertiseOptions}
                />
                <MultiSelectFilter
                  label="ESG Frameworks"
                  value={filters.frameworks}
                  onChange={(value) => setFilters(prev => ({ ...prev, frameworks: value as ESGFramework[] }))}
                  options={frameworkOptions}
                />
                <MultiSelectFilter
                  label="Industries"
                  value={filters.industries}
                  onChange={(value) => setFilters(prev => ({ ...prev, industries: value }))}
                  options={industryOptions}
                />
                <MultiSelectFilter
                  label="Languages"
                  value={filters.languages}
                  onChange={(value) => setFilters(prev => ({ ...prev, languages: value }))}
                  options={languageOptions}
                />
                <RangeFilter
                  label="Hourly Rate"
                  value={filters.hourlyRate}
                  onChange={(value) => setFilters(prev => ({ ...prev, hourlyRate: value }))}
                  min={0}
                  max={500}
                  step={10}
                  formatValue={(value) => `$${value}`}
                />
                <RangeFilter
                  label="Years of Experience"
                  value={filters.yearsExperience}
                  onChange={(value) => setFilters(prev => ({ ...prev, yearsExperience: value }))}
                  min={0}
                  max={20}
                  step={1}
                  formatValue={(value) => `${value} years`}
                />
              </FilterGroup>
            </div>
            <div className="sticky bottom-0 p-4 bg-background border-t mt-auto">
              <div className="space-y-2">
                <Button className="w-full" onClick={handleSearch}>
                  Apply Filters
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    setFilters(defaultFilters);
                    setAppliedFilters(defaultFilters);
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          layout
          initial={false}
        >
          {paginatedConsultants.map((consultant, index) => (
            <motion.div
              key={consultant.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.3,
                  delay: index * 0.1,
                  ease: "easeOut"
                }
              }}
              exit={{
                opacity: 0,
                y: -20,
                transition: { duration: 0.2 }
              }}
              whileHover={{
                y: -5,
                transition: { duration: 0.2 }
              }}
              className="transition-all"
            >
              <Card className="group transition-all duration-300 hover:shadow-lg">
                <motion.div
                  className="aspect-square relative flex flex-col"
                  whileHover={{
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                >
                  <div className="relative h-2/5 bg-muted">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Avatar className="h-20 w-20 transition-transform group-hover:scale-110">
                        <AvatarImage
                          src={consultant.photoUrl}
                          alt={consultant.fullName}
                          className="object-cover"
                        />
                        <AvatarFallback>
                          <User className="h-10 w-10 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-background/0 p-3">
                      <h3 className="font-semibold text-white">{consultant.fullName}</h3>
                      <p className="text-xs text-white/80">{consultant.position}</p>
                    </div>
                  </div>

                  <div className="flex-1 p-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {consultant.bio}
                      </div>

                      <div className="flex flex-wrap gap-1">
                        <Badge variant="default" className="text-[0.65rem]">
                          {consultant.expertise}
                        </Badge>
                        {consultant.subExpertise.frameworks.slice(0, 1).map(framework => (
                          <Badge key={framework} variant="outline" className="text-[0.65rem]">
                            {framework}
                          </Badge>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[0.65rem]">
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3 text-muted-foreground" />
                          <span>{consultant.yearsExperience}y exp</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <span>${consultant.hourlyRate}/h</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate">{consultant.company}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <span>{consultant.reportsGenerated} reports</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-3">
                      <Button size="sm" className="w-full" asChild>
                        <Link href={`/consultants/${consultant.id}`}>
                          View Profile
                        </Link>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {totalPages > 1 && (
        <motion.div
          className="flex justify-center gap-2 mt-6"
          layout
          initial={false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="flex items-center px-4 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}