import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  CalendarIcon, 
  Pencil, 
  Trash2, 
  PlusCircle, 
  UploadCloud,
  Check,
  Building,
  User,
  BookOpen,
  GraduationCap
} from "lucide-react";

// Provider schema
const providerFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  website: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  contactEmail: z.string().email({ message: "Please enter a valid email address" }),
  contactPhone: z.string().optional(),
  logoUrl: z.string().optional()
});

// Instructor schema
const instructorFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  title: z.string().min(2, { message: "Title must be at least 2 characters" }),
  bio: z.string().min(10, { message: "Bio must be at least 10 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }).optional().or(z.literal("")),
  linkedin: z.string().optional(),
  expertise: z.string().array().min(1, { message: "Please add at least one area of expertise" })
});

// Course schema
const courseFormSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z.string().min(20, { message: "Description must be at least 20 characters" }),
  price: z.coerce.number().min(0, { message: "Price must be a positive number" }),
  duration: z.string().min(2, { message: "Duration is required" }),
  totalHours: z.coerce.number().min(1, { message: "Total hours must be at least 1" }),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  category: z.string().min(2, { message: "Category is required" }),
  maxStudents: z.coerce.number().min(1, { message: "Maximum students must be at least 1" }),
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date({ required_error: "End date is required" }),
  language: z.string().min(2, { message: "Language is required" }),
  certificationType: z.string().min(2, { message: "Certification type is required" }),
  location: z.string().optional(),
  isVirtual: z.boolean().default(false),
  targetAudience: z.string().min(5, { message: "Target audience is required" })
});

// Mock data for demo
const mockProvider = {
  id: 1,
  name: "KPMG ESG Academy",
  description: "A leading provider of ESG education and training for professionals and organizations.",
  website: "https://www.kpmg.com/esg-academy",
  contactEmail: "esg-academy@kpmg.com",
  contactPhone: "+1 (555) 123-4567",
  logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=kpmg"
};

const mockInstructors = [
  {
    id: 1,
    name: "Dr. Sarah Chen",
    title: "Head of ESG Research",
    bio: "Former UN sustainable development advisor with 15+ years of experience in ESG reporting and sustainability strategy.",
    email: "sarah.chen@kpmg.com",
    linkedin: "linkedin.com/in/sarahchen",
    photoUrl: "https://api.dicebear.com/7.x/personas/svg?seed=sarah",
    expertise: ["GRI Standards", "SASB Framework", "Carbon Accounting"]
  },
  {
    id: 2,
    name: "David Johnson",
    title: "Governance & Compliance Director",
    bio: "Corporate governance specialist with 12+ years experience in regulatory compliance and ESG governance frameworks.",
    email: "david.johnson@kpmg.com",
    linkedin: "linkedin.com/in/davidjohnson",
    photoUrl: "https://api.dicebear.com/7.x/personas/svg?seed=david",
    expertise: ["Corporate Governance", "Risk Management", "Regulatory Compliance"]
  }
];

const mockCourses = [
  {
    id: 1,
    title: "ESG Reporting Fundamentals",
    description: "Master the essentials of ESG reporting and learn how to create comprehensive sustainability reports that meet global standards.",
    price: 999,
    duration: "8 weeks",
    totalHours: 32,
    level: "beginner",
    category: "Reporting & Compliance",
    instructor: mockInstructors[0],
    enrolledStudents: 18,
    maxStudents: 30,
    startDate: new Date("2025-06-15"),
    endDate: new Date("2025-08-10"),
    status: "scheduled"
  },
  {
    id: 2,
    title: "Corporate Governance & ESG Compliance",
    description: "Learn best practices for implementing robust ESG governance frameworks and compliance mechanisms in your organization.",
    price: 1299,
    duration: "6 weeks",
    totalHours: 30,
    level: "intermediate",
    category: "Governance",
    instructor: mockInstructors[1],
    enrolledStudents: 12,
    maxStudents: 25,
    startDate: new Date("2025-09-05"),
    endDate: new Date("2025-10-17"),
    status: "scheduled"
  }
];

export default function ProviderManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("profile");
  
  // State for provider profile
  const [provider, setProvider] = useState(mockProvider);
  const [editingProvider, setEditingProvider] = useState(false);
  
  // State for instructors
  const [instructors, setInstructors] = useState(mockInstructors);
  const [selectedInstructor, setSelectedInstructor] = useState<any>(null);
  const [showInstructorForm, setShowInstructorForm] = useState(false);
  
  // State for courses
  const [courses, setCourses] = useState(mockCourses);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [showCourseForm, setShowCourseForm] = useState(false);
  
  // Forms
  const providerForm = useForm<z.infer<typeof providerFormSchema>>({
    resolver: zodResolver(providerFormSchema),
    defaultValues: {
      name: provider.name,
      description: provider.description,
      website: provider.website,
      contactEmail: provider.contactEmail,
      contactPhone: provider.contactPhone,
      logoUrl: provider.logoUrl
    }
  });

  const instructorForm = useForm<z.infer<typeof instructorFormSchema>>({
    resolver: zodResolver(instructorFormSchema),
    defaultValues: selectedInstructor ? {
      name: selectedInstructor.name,
      title: selectedInstructor.title,
      bio: selectedInstructor.bio,
      email: selectedInstructor.email,
      linkedin: selectedInstructor.linkedin,
      expertise: selectedInstructor.expertise
    } : {
      name: "",
      title: "",
      bio: "",
      email: "",
      linkedin: "",
      expertise: []
    }
  });

  const courseForm = useForm<z.infer<typeof courseFormSchema>>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: selectedCourse ? {
      title: selectedCourse.title,
      description: selectedCourse.description,
      price: selectedCourse.price,
      duration: selectedCourse.duration,
      totalHours: selectedCourse.totalHours,
      level: selectedCourse.level,
      category: selectedCourse.category,
      maxStudents: selectedCourse.maxStudents,
      startDate: selectedCourse.startDate,
      endDate: selectedCourse.endDate,
      language: "English",
      certificationType: "Professional Certificate",
      location: selectedCourse.location || "",
      isVirtual: selectedCourse.isVirtual || false,
      targetAudience: selectedCourse.targetAudience || ""
    } : {
      title: "",
      description: "",
      price: 999,
      duration: "8 weeks",
      totalHours: 32,
      level: "beginner",
      category: "",
      maxStudents: 30,
      startDate: new Date(),
      endDate: new Date(),
      language: "English",
      certificationType: "",
      location: "",
      isVirtual: false,
      targetAudience: ""
    }
  });

  // Handler for editing provider profile
  const onSaveProvider = (data: z.infer<typeof providerFormSchema>) => {
    setProvider({
      ...provider,
      ...data
    });
    setEditingProvider(false);
    toast({
      title: "Profile updated",
      description: "Your provider profile has been updated successfully.",
    });
  };

  // Handlers for instructors
  const onCreateInstructor = (data: z.infer<typeof instructorFormSchema>) => {
    const newInstructor = {
      id: instructors.length + 1,
      ...data,
      photoUrl: `https://api.dicebear.com/7.x/personas/svg?seed=${data.name.toLowerCase().replace(/\s/g, '')}`
    };
    
    setInstructors([...instructors, newInstructor]);
    setShowInstructorForm(false);
    instructorForm.reset();
    
    toast({
      title: "Instructor added",
      description: "New instructor has been added successfully.",
    });
  };

  const onUpdateInstructor = (data: z.infer<typeof instructorFormSchema>) => {
    if (!selectedInstructor) return;
    
    const updatedInstructors = instructors.map(instructor => 
      instructor.id === selectedInstructor.id 
        ? { 
            ...instructor, 
            ...data 
          } 
        : instructor
    );
    
    setInstructors(updatedInstructors);
    setSelectedInstructor(null);
    setShowInstructorForm(false);
    
    toast({
      title: "Instructor updated",
      description: "Instructor details have been updated successfully.",
    });
  };

  const onDeleteInstructor = (id: number) => {
    setInstructors(instructors.filter(instructor => instructor.id !== id));
    toast({
      title: "Instructor removed",
      description: "Instructor has been removed successfully.",
    });
  };

  const editInstructor = (instructor: any) => {
    setSelectedInstructor(instructor);
    instructorForm.reset({
      name: instructor.name,
      title: instructor.title,
      bio: instructor.bio,
      email: instructor.email || "",
      linkedin: instructor.linkedin || "",
      expertise: instructor.expertise || []
    });
    setShowInstructorForm(true);
  };

  // Handlers for courses
  const onCreateCourse = (data: z.infer<typeof courseFormSchema>) => {
    const newCourse = {
      id: courses.length + 1,
      ...data,
      instructor: instructors[0], // Default to first instructor
      enrolledStudents: 0,
      status: "draft"
    };
    
    setCourses([...courses, newCourse]);
    setShowCourseForm(false);
    courseForm.reset();
    
    toast({
      title: "Course created",
      description: "New course has been created successfully.",
    });
  };

  const onUpdateCourse = (data: z.infer<typeof courseFormSchema>) => {
    if (!selectedCourse) return;
    
    const updatedCourses = courses.map(course => 
      course.id === selectedCourse.id 
        ? { 
            ...course, 
            ...data 
          } 
        : course
    );
    
    setCourses(updatedCourses);
    setSelectedCourse(null);
    setShowCourseForm(false);
    
    toast({
      title: "Course updated",
      description: "Course details have been updated successfully.",
    });
  };

  const onDeleteCourse = (id: number) => {
    setCourses(courses.filter(course => course.id !== id));
    toast({
      title: "Course removed",
      description: "Course has been removed successfully.",
    });
  };

  const editCourse = (course: any) => {
    setSelectedCourse(course);
    courseForm.reset({
      title: course.title,
      description: course.description,
      price: course.price,
      duration: course.duration,
      totalHours: course.totalHours,
      level: course.level,
      category: course.category,
      maxStudents: course.maxStudents,
      startDate: course.startDate,
      endDate: course.endDate,
      language: course.language || "English",
      certificationType: course.certificationType || "Professional Certificate",
      location: course.location || "",
      isVirtual: course.isVirtual || false,
      targetAudience: course.targetAudience || ""
    });
    setShowCourseForm(true);
  };

  // Authentication check
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to manage your course provider profile
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

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Course Provider Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage your provider profile, instructors, and course offerings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            <span className="text-sm">Active Provider</span>
          </div>
          <Button variant="outline" onClick={() => navigate("/courses")}>
            View Public Listings
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full md:w-auto">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span className="hidden md:inline">Provider Profile</span>
            <span className="inline md:hidden">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="instructors" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden md:inline">Instructors</span>
            <span className="inline md:hidden">Instructors</span>
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden md:inline">Course Management</span>
            <span className="inline md:hidden">Courses</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Provider Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Provider Profile</CardTitle>
                  <CardDescription>
                    Manage your organization's details and contact information
                  </CardDescription>
                </div>
                <Button
                  variant={editingProvider ? "default" : "outline"}
                  onClick={() => setEditingProvider(!editingProvider)}
                >
                  {editingProvider ? "Cancel" : "Edit Profile"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {editingProvider ? (
                <Form {...providerForm}>
                  <form 
                    onSubmit={providerForm.handleSubmit(onSaveProvider)} 
                    className="space-y-6"
                  >
                    <FormField
                      control={providerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Provider Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your organization name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={providerForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your organization and the types of courses you offer" 
                              {...field}
                              className="min-h-[120px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={providerForm.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input placeholder="https://your-website.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={providerForm.control}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Email</FormLabel>
                            <FormControl>
                              <Input placeholder="contact@your-org.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={providerForm.control}
                        name="contactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="+1 (123) 456-7890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={providerForm.control}
                        name="logoUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Logo URL</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input placeholder="URL to your organization logo" {...field} />
                              </FormControl>
                              <Button type="button" variant="outline" size="icon">
                                <UploadCloud className="h-4 w-4" />
                              </Button>
                            </div>
                            <FormDescription>
                              Provide a URL to your logo or upload a new one
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="submit">Save Changes</Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/3 flex justify-center">
                      {provider.logoUrl ? (
                        <img 
                          src={provider.logoUrl} 
                          alt={provider.name} 
                          className="w-48 h-48 object-contain rounded-md"
                        />
                      ) : (
                        <div className="w-48 h-48 flex items-center justify-center bg-muted rounded-md">
                          <Building className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="md:w-2/3 space-y-4">
                      <div>
                        <h3 className="text-lg font-medium">About</h3>
                        <p className="text-muted-foreground mt-1">{provider.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Website</h4>
                          <p className="mt-1">
                            {provider.website ? (
                              <a 
                                href={provider.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {provider.website}
                              </a>
                            ) : (
                              <span className="text-muted-foreground italic">Not provided</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Contact Email</h4>
                          <p className="mt-1">
                            <a 
                              href={`mailto:${provider.contactEmail}`}
                              className="text-blue-600 hover:underline"
                            >
                              {provider.contactEmail}
                            </a>
                          </p>
                        </div>
                        {provider.contactPhone && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Contact Phone</h4>
                            <p className="mt-1">{provider.contactPhone}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="border p-4 rounded-md bg-muted/20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div>
                        <h4 className="text-lg font-semibold">{instructors.length}</h4>
                        <p className="text-sm text-muted-foreground">Instructors</p>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold">{courses.length}</h4>
                        <p className="text-sm text-muted-foreground">Active Courses</p>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold">
                          {courses.reduce((total, course) => total + course.enrolledStudents, 0)}
                        </h4>
                        <p className="text-sm text-muted-foreground">Total Enrollments</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Instructors Tab */}
        <TabsContent value="instructors">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Instructors</CardTitle>
                  <CardDescription>
                    Manage your instructors and their profiles
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => {
                    setSelectedInstructor(null);
                    instructorForm.reset({
                      name: "",
                      title: "",
                      bio: "",
                      email: "",
                      linkedin: "",
                      expertise: []
                    });
                    setShowInstructorForm(true);
                  }}
                >
                  Add Instructor
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {instructors.length === 0 ? (
                <div className="text-center py-12 border rounded-md bg-muted/10">
                  <User className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No instructors yet</h3>
                  <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                    Add instructors to your profile to showcase the expertise behind your courses
                  </p>
                  <Button 
                    className="mt-4" 
                    onClick={() => {
                      setSelectedInstructor(null);
                      instructorForm.reset({
                        name: "",
                        title: "",
                        bio: "",
                        email: "",
                        linkedin: "",
                        expertise: []
                      });
                      setShowInstructorForm(true);
                    }}
                  >
                    Add Your First Instructor
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {instructors.map((instructor) => (
                    <div 
                      key={instructor.id} 
                      className="flex flex-col md:flex-row gap-4 p-4 border rounded-md hover:border-primary/50 transition-colors"
                    >
                      <div className="md:w-1/6 flex justify-center">
                        <img 
                          src={instructor.photoUrl} 
                          alt={instructor.name} 
                          className="w-24 h-24 rounded-full object-cover"
                        />
                      </div>
                      <div className="md:w-4/6 space-y-2">
                        <div>
                          <h3 className="text-lg font-medium">{instructor.name}</h3>
                          <p className="text-muted-foreground">{instructor.title}</p>
                        </div>
                        <p className="text-sm">{instructor.bio}</p>
                        {instructor.expertise && instructor.expertise.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {instructor.expertise.map((exp, i) => (
                              <span 
                                key={i} 
                                className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full"
                              >
                                {exp}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="md:w-1/6 flex md:flex-col gap-2 justify-end md:items-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editInstructor(instructor)}
                        >
                          <Pencil className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteInstructor(instructor.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Instructor Form Dialog */}
              <Dialog open={showInstructorForm} onOpenChange={setShowInstructorForm}>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedInstructor ? "Edit Instructor" : "Add New Instructor"}
                    </DialogTitle>
                    <DialogDescription>
                      {selectedInstructor 
                        ? "Update the instructor's details below" 
                        : "Add a new instructor to your provider profile"}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...instructorForm}>
                    <form 
                      onSubmit={instructorForm.handleSubmit(
                        selectedInstructor ? onUpdateInstructor : onCreateInstructor
                      )}
                      className="space-y-6"
                    >
                      <FormField
                        control={instructorForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Dr. Jane Smith" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={instructorForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title / Position</FormLabel>
                            <FormControl>
                              <Input placeholder="ESG Director, Sustainability Expert" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={instructorForm.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Biography</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Professional background and expertise..." 
                                {...field}
                                className="min-h-[100px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={instructorForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email (optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="instructor@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={instructorForm.control}
                          name="linkedin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>LinkedIn Profile (optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="linkedin.com/in/username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={instructorForm.control}
                        name="expertise"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Areas of Expertise</FormLabel>
                            <FormControl>
                              <div className="flex flex-wrap gap-2 border p-2 rounded-md min-h-[80px]">
                                {field.value.map((expertise, index) => (
                                  <div 
                                    key={index} 
                                    className="bg-primary/10 text-primary-foreground px-3 py-1 rounded-full flex items-center gap-1"
                                  >
                                    {expertise}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newValue = [...field.value];
                                        newValue.splice(index, 1);
                                        field.onChange(newValue);
                                      }}
                                      className="text-primary-foreground hover:bg-primary/20 h-4 w-4 rounded-full flex items-center justify-center"
                                    >
                                      &times;
                                    </button>
                                  </div>
                                ))}
                                <input
                                  type="text"
                                  placeholder={field.value.length === 0 ? "Type and press Enter to add expertise..." : "Add more..."}
                                  className="flex-1 min-w-[180px] bg-transparent outline-none border-none text-sm"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                      e.preventDefault();
                                      const newValue = [...field.value, (e.target as HTMLInputElement).value.trim()];
                                      field.onChange(newValue);
                                      (e.target as HTMLInputElement).value = '';
                                    }
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Press Enter after each area of expertise
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowInstructorForm(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">
                          {selectedInstructor ? "Update Instructor" : "Add Instructor"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Courses Tab */}
        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Course Management</CardTitle>
                  <CardDescription>
                    Create and manage your course offerings
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => {
                    setSelectedCourse(null);
                    courseForm.reset({
                      title: "",
                      description: "",
                      price: 999,
                      duration: "8 weeks",
                      totalHours: 32,
                      level: "beginner",
                      category: "",
                      maxStudents: 30,
                      startDate: new Date(),
                      endDate: new Date(),
                      language: "English",
                      certificationType: "",
                      location: "",
                      isVirtual: false,
                      targetAudience: ""
                    });
                    setShowCourseForm(true);
                  }}
                >
                  Create New Course
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {courses.length === 0 ? (
                <div className="text-center py-12 border rounded-md bg-muted/10">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No courses yet</h3>
                  <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                    Start creating courses to share your expertise with the ESG community
                  </p>
                  <Button 
                    className="mt-4" 
                    onClick={() => {
                      setSelectedCourse(null);
                      courseForm.reset({
                        title: "",
                        description: "",
                        price: 999,
                        duration: "8 weeks",
                        totalHours: 32,
                        level: "beginner",
                        category: "",
                        maxStudents: 30,
                        startDate: new Date(),
                        endDate: new Date(),
                        language: "English",
                        certificationType: "",
                        location: "",
                        isVirtual: false,
                        targetAudience: ""
                      });
                      setShowCourseForm(true);
                    }}
                  >
                    Create Your First Course
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Course</TableHead>
                        <TableHead>Instructor</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Enrollments</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">
                            <div>
                              {course.title}
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{course.level}</Badge>
                                <Badge variant="secondary">{course.category}</Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{course.instructor.name}</TableCell>
                          <TableCell>${course.price}</TableCell>
                          <TableCell>
                            {course.enrolledStudents}/{course.maxStudents}
                          </TableCell>
                          <TableCell>
                            {format(course.startDate, 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => editCourse(course)}
                              >
                                <Pencil className="h-4 w-4 mr-1" /> 
                                <span className="hidden md:inline">Edit</span>
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => onDeleteCourse(course.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" /> 
                                <span className="hidden md:inline">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {/* Course Form Dialog */}
              <Dialog open={showCourseForm} onOpenChange={setShowCourseForm}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedCourse ? "Edit Course" : "Create New Course"}
                    </DialogTitle>
                    <DialogDescription>
                      {selectedCourse 
                        ? "Update the course details below" 
                        : "Add a new course to your offerings"}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...courseForm}>
                    <form 
                      onSubmit={courseForm.handleSubmit(
                        selectedCourse ? onUpdateCourse : onCreateCourse
                      )}
                      className="space-y-6"
                    >
                      <FormField
                        control={courseForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Course Title</FormLabel>
                            <FormControl>
                              <Input placeholder="ESG Reporting Fundamentals" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={courseForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Provide a compelling description of your course..." 
                                {...field}
                                className="min-h-[100px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={courseForm.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price ($)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  placeholder="999" 
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={courseForm.control}
                          name="duration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Duration</FormLabel>
                              <FormControl>
                                <Input placeholder="8 weeks" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={courseForm.control}
                          name="totalHours"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Total Hours</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  placeholder="32" 
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={courseForm.control}
                          name="level"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Level</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="beginner">Beginner</SelectItem>
                                  <SelectItem value="intermediate">Intermediate</SelectItem>
                                  <SelectItem value="advanced">Advanced</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={courseForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <FormControl>
                                <Input placeholder="Environmental, Reporting, etc." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={courseForm.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Start Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date < new Date()}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={courseForm.control}
                          name="endDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>End Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => 
                                      date < new Date() || 
                                      (courseForm.getValues("startDate") && date < courseForm.getValues("startDate"))
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={courseForm.control}
                          name="maxStudents"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Maximum Students</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  placeholder="30" 
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={courseForm.control}
                          name="language"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Language</FormLabel>
                              <FormControl>
                                <Input placeholder="English" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={courseForm.control}
                        name="certificationType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Certification Type</FormLabel>
                            <FormControl>
                              <Input placeholder="Professional Certificate in..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={courseForm.control}
                          name="isVirtual"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                <FormLabel>Virtual Course</FormLabel>
                                <FormDescription>
                                  Is this course delivered virtually?
                                </FormDescription>
                              </div>
                              <FormControl>
                                <div className="flex items-center space-x-2">
                                  <Check className={cn(
                                    "h-4 w-4",
                                    field.value ? "opacity-100 text-primary" : "opacity-0"
                                  )} />
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={courseForm.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location {courseForm.watch("isVirtual") && "(for virtual courses, you can put 'Virtual')"}</FormLabel>
                              <FormControl>
                                <Input placeholder="City, Country or Virtual" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={courseForm.control}
                        name="targetAudience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Audience</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Who is this course designed for?" 
                                {...field}
                                className="min-h-[80px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowCourseForm(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">
                          {selectedCourse ? "Update Course" : "Create Course"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}