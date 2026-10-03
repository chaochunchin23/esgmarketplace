import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  User, 
  Briefcase, 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Linkedin,
  Calendar,
  Edit3,
  Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest, queryClient } from "@/lib/queryClient";

type Booking = {
  id: number;
  consultantId: number;
  startTime: string;
  endTime: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  totalAmount: number;
  consultant: {
    user: {
      username: string;
    };
  };
};

type Enrollment = {
  id: number;
  courseId: number;
  enrolledAt: string;
  status: "active" | "completed" | "cancelled";
  course: {
    title: string;
    level: string;
  };
};

// Form schemas for different profile types
const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  bio: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  company: z.string().optional(),
  website: z.string().url().optional().or(z.string().length(0)),
  linkedinUrl: z.string().url().optional().or(z.string().length(0)),
});

const consultantSchema = z.object({
  expertise: z.enum(["environmental", "social", "governance"]),
  hourlyRate: z.string().min(1, "Hourly rate is required"),
  yearsExperience: z.string().min(1, "Years of experience is required"),
  availability: z.string().min(1, "Availability is required"),
  frameworks: z.string(),
  certifications: z.string(),
  languages: z.string(),
  industries: z.string(),
});

const providerSchema = z.object({
  providerName: z.string().min(1, "Organization name is required"),
  providerDescription: z.string().min(1, "Organization description is required"),
  providerWebsite: z.string().url().optional().or(z.string().length(0)),
  providerLogoUrl: z.string().url().optional().or(z.string().length(0)),
  providerType: z.string().optional(),
  serviceAreas: z.string().optional(),
});

const roleChangeSchema = z.object({
  role: z.enum(["user", "consultant", "provider", "admin"]),
});

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [editMode, setEditMode] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);

  // Initialize forms with default values
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      bio: user?.bio || "",
      location: user?.location || "",
      phone: user?.phone || "",
      jobTitle: user?.jobTitle || "",
      company: user?.company || "",
      website: user?.website || "",
      linkedinUrl: user?.linkedinUrl || "",
    },
  });

  const consultantForm = useForm<z.infer<typeof consultantSchema>>({
    resolver: zodResolver(consultantSchema),
    defaultValues: {
      expertise: "environmental",
      hourlyRate: "",
      yearsExperience: "",
      availability: "",
      frameworks: "",
      certifications: "",
      languages: "",
      industries: "",
    },
  });

  const providerForm = useForm<z.infer<typeof providerSchema>>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      providerName: "",
      providerDescription: "",
      providerWebsite: "",
      providerLogoUrl: "",
      providerType: "",
      serviceAreas: "",
    },
  });

  const roleChangeForm = useForm<z.infer<typeof roleChangeSchema>>({
    resolver: zodResolver(roleChangeSchema),
    defaultValues: {
      role: (user?.role as "user" | "consultant" | "provider" | "admin") || "user",
    },
  });

  // Queries
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings", user?.id],
    enabled: !!user,
  });

  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery<Enrollment[]>({
    queryKey: ["/api/enrollments", user?.id],
    enabled: !!user,
  });

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      const response = await apiRequest("PATCH", "/api/user/profile", data);
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated",
      });
      setEditMode(false);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateConsultantProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof consultantSchema>) => {
      const response = await apiRequest("POST", "/api/consultant-profile", {
        ...data,
        hourlyRate: parseFloat(data.hourlyRate),
        yearsExperience: parseInt(data.yearsExperience),
        frameworks: data.frameworks.split(",").map(item => item.trim()),
        certifications: data.certifications.split(",").map(item => item.trim()),
        languages: data.languages.split(",").map(item => item.trim()),
        industries: data.industries.split(",").map(item => item.trim()),
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Consultant Profile Updated",
        description: "Your consultant profile has been successfully updated",
      });
      setEditMode(false);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProviderProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof providerSchema>) => {
      const response = await apiRequest("POST", "/api/provider-profile", data);
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Provider Profile Updated",
        description: "Your provider profile has been successfully updated",
      });
      setEditMode(false);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof roleChangeSchema>) => {
      const response = await apiRequest("POST", "/api/user/role", data);
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Role Updated",
        description: "Your account role has been changed",
      });
      setRoleDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form handlers
  const onProfileSubmit = (data: z.infer<typeof profileSchema>) => {
    updateProfileMutation.mutate(data);
  };

  const onConsultantProfileSubmit = (data: z.infer<typeof consultantSchema>) => {
    updateConsultantProfileMutation.mutate(data);
  };

  const onProviderProfileSubmit = (data: z.infer<typeof providerSchema>) => {
    updateProviderProfileMutation.mutate(data);
  };

  const onRoleChangeSubmit = (data: z.infer<typeof roleChangeSchema>) => {
    changeRoleMutation.mutate(data);
  };

  if (bookingsLoading || enrollmentsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Determine whether to show specialized profile tabs
  const showConsultantTab = user?.role === "consultant";
  const showProviderTab = user?.role === "provider";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <div className="flex gap-2">
          <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Change Role</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Your Account Role</DialogTitle>
                <DialogDescription>
                  Select a role that matches how you want to use the platform
                </DialogDescription>
              </DialogHeader>
              <Form {...roleChangeForm}>
                <form onSubmit={roleChangeForm.handleSubmit(onRoleChangeSubmit)} className="space-y-4">
                  <FormField
                    control={roleChangeForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Role</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="user">Regular User</SelectItem>
                            <SelectItem value="consultant">ESG Consultant</SelectItem>
                            <SelectItem value="provider">Course Provider</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          This will determine what features you can access on the platform
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={changeRoleMutation.isPending}>
                    {changeRoleMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Button onClick={() => setEditMode(!editMode)}>
            {editMode ? (
              <><Save className="h-4 w-4 mr-2" /> Save</>
            ) : (
              <><Edit3 className="h-4 w-4 mr-2" /> Edit Profile</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Profile sidebar */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={user?.photoUrl || `https://api.dicebear.com/7.x/personas/svg?seed=${user?.username}`} alt={user?.username} />
              <AvatarFallback><User className="h-10 w-10" /></AvatarFallback>
            </Avatar>
            
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.username}
              </h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {user?.jobTitle && <p className="text-sm text-muted-foreground">{user?.jobTitle}</p>}
            </div>
            
            <div className="flex gap-2 mb-4">
              <Badge className="capitalize">{user?.role}</Badge>
              <Badge variant={user?.subscriptionStatus === "active" ? "default" : "secondary"}>
                {user?.subscriptionStatus === "active" ? "Subscribed" : "Not Subscribed"}
              </Badge>
            </div>
            
            {!editMode && (
              <div className="w-full space-y-3 text-sm">
                {user?.bio && (
                  <p className="text-muted-foreground">{user.bio}</p>
                )}
                
                {user?.company && (
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{user.company}</span>
                  </div>
                )}
                
                {user?.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{user.location}</span>
                  </div>
                )}
                
                {user?.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{user.phone}</span>
                  </div>
                )}
                
                {user?.website && (
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                    <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Website
                    </a>
                  </div>
                )}
                
                {user?.linkedinUrl && (
                  <div className="flex items-center">
                    <Linkedin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      LinkedIn
                    </a>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main content */}
        <div className="md:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full md:w-auto">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="bookings">Consultations</TabsTrigger>
              <TabsTrigger value="courses">Course Enrollments</TabsTrigger>
            </TabsList>

            {/* Basic Profile Tab */}
            <TabsContent value="profile" className="space-y-4">
              {editMode ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Edit Profile</CardTitle>
                    <CardDescription>
                      Update your personal information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="First Name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Last Name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input placeholder="Email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bio</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Tell us about yourself" 
                                  className="resize-none" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="jobTitle"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Job Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="Job Title" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="company"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company</FormLabel>
                                <FormControl>
                                  <Input placeholder="Company" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="location"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Location</FormLabel>
                                <FormControl>
                                  <Input placeholder="Location" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                  <Input placeholder="Phone Number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={profileForm.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website</FormLabel>
                              <FormControl>
                                <Input placeholder="https://example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="linkedinUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>LinkedIn URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://linkedin.com/in/username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium text-sm">Full Name</h3>
                        <p>{user?.firstName} {user?.lastName}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">Email</h3>
                        <p>{user?.email}</p>
                      </div>
                      {user?.jobTitle && (
                        <div>
                          <h3 className="font-medium text-sm">Job Title</h3>
                          <p>{user.jobTitle}</p>
                        </div>
                      )}
                      {user?.company && (
                        <div>
                          <h3 className="font-medium text-sm">Company</h3>
                          <p>{user.company}</p>
                        </div>
                      )}
                      {user?.location && (
                        <div>
                          <h3 className="font-medium text-sm">Location</h3>
                          <p>{user.location}</p>
                        </div>
                      )}
                      {user?.phone && (
                        <div>
                          <h3 className="font-medium text-sm">Phone</h3>
                          <p>{user.phone}</p>
                        </div>
                      )}
                    </div>
                    
                    {user?.bio && (
                      <div>
                        <h3 className="font-medium text-sm">Bio</h3>
                        <p>{user.bio}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Consultant-specific profile form when in edit mode */}
              {showConsultantTab && editMode && (
                <Card>
                  <CardHeader>
                    <CardTitle>Consultant Profile</CardTitle>
                    <CardDescription>
                      Complete your consultant profile to be discovered by potential clients
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...consultantForm}>
                      <form onSubmit={consultantForm.handleSubmit(onConsultantProfileSubmit)} className="space-y-4">
                        <FormField
                          control={consultantForm.control}
                          name="expertise"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Primary Expertise Area</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select primary expertise" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="environmental">Environmental</SelectItem>
                                  <SelectItem value="social">Social</SelectItem>
                                  <SelectItem value="governance">Governance</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Your main area of ESG expertise
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={consultantForm.control}
                            name="hourlyRate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Hourly Rate (USD)</FormLabel>
                                <FormControl>
                                  <Input placeholder="150" {...field} type="number" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={consultantForm.control}
                            name="yearsExperience"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Years of Experience</FormLabel>
                                <FormControl>
                                  <Input placeholder="5" {...field} type="number" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={consultantForm.control}
                          name="availability"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Availability</FormLabel>
                              <FormControl>
                                <Input placeholder="20 hours/week" {...field} />
                              </FormControl>
                              <FormDescription>
                                Your typical availability for consulting engagements
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={consultantForm.control}
                          name="frameworks"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ESG Frameworks</FormLabel>
                              <FormControl>
                                <Input placeholder="GRI, SASB, TCFD" {...field} />
                              </FormControl>
                              <FormDescription>
                                Frameworks you specialize in, separated by commas
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={consultantForm.control}
                          name="certifications"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Certifications</FormLabel>
                              <FormControl>
                                <Input placeholder="GRI Certified, SASB FSA" {...field} />
                              </FormControl>
                              <FormDescription>
                                Your ESG certifications, separated by commas
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={consultantForm.control}
                          name="industries"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Industries</FormLabel>
                              <FormControl>
                                <Input placeholder="Finance, Energy, Technology" {...field} />
                              </FormControl>
                              <FormDescription>
                                Industries you specialize in, separated by commas
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={consultantForm.control}
                          name="languages"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Languages</FormLabel>
                              <FormControl>
                                <Input placeholder="English, Spanish" {...field} />
                              </FormControl>
                              <FormDescription>
                                Languages you're fluent in, separated by commas
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={updateConsultantProfileMutation.isPending}
                        >
                          {updateConsultantProfileMutation.isPending ? "Saving..." : "Save Consultant Profile"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}

              {/* Provider-specific profile form when in edit mode */}
              {showProviderTab && editMode && (
                <Card>
                  <CardHeader>
                    <CardTitle>Course Provider Profile</CardTitle>
                    <CardDescription>
                      Complete your provider profile to offer ESG courses on the platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...providerForm}>
                      <form onSubmit={providerForm.handleSubmit(onProviderProfileSubmit)} className="space-y-4">
                        <FormField
                          control={providerForm.control}
                          name="providerName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Organization Name</FormLabel>
                              <FormControl>
                                <Input placeholder="ESG Academy" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={providerForm.control}
                          name="providerDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Organization Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe your organization" 
                                  className="resize-none" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={providerForm.control}
                            name="providerWebsite"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Website</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={providerForm.control}
                            name="providerLogoUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Logo URL</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://example.com/logo.png" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={providerForm.control}
                          name="providerType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Provider Type</FormLabel>
                              <FormControl>
                                <Input placeholder="Consulting Firm, Academic Institution, etc." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={providerForm.control}
                          name="serviceAreas"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Service Areas</FormLabel>
                              <FormControl>
                                <Input placeholder="Global, North America, Europe" {...field} />
                              </FormControl>
                              <FormDescription>
                                Geographical areas where you offer courses
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={updateProviderProfileMutation.isPending}
                        >
                          {updateProviderProfileMutation.isPending ? "Saving..." : "Save Provider Profile"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Your Consultations</CardTitle>
                  <CardDescription>
                    View and manage your ESG consultant bookings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {bookings && bookings.length > 0 ? (
                    <div className="space-y-4">
                      {bookings.map((booking) => (
                        <Card key={booking.id}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">
                                  Consultation with {booking.consultant.user.username}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  <Calendar className="h-4 w-4 inline mr-1" />
                                  {new Date(booking.startTime).toLocaleDateString()}{" "}
                                  {new Date(booking.startTime).toLocaleTimeString()} - {" "}
                                  {new Date(booking.endTime).toLocaleTimeString()}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  <Briefcase className="h-4 w-4 inline mr-1" />
                                  ${booking.totalAmount}
                                </div>
                              </div>
                              <Badge variant={
                                booking.status === "confirmed" ? "default" : 
                                booking.status === "completed" ? "secondary" :
                                booking.status === "cancelled" ? "destructive" : "outline"
                              }>
                                {booking.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">You don't have any consultations yet.</p>
                      <Button variant="outline" className="mt-4">Find a Consultant</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Courses Tab */}
            <TabsContent value="courses" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Your Course Enrollments</CardTitle>
                  <CardDescription>
                    Courses you've enrolled in
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {enrollments && enrollments.length > 0 ? (
                    <div className="space-y-4">
                      {enrollments.map((enrollment) => (
                        <Card key={enrollment.id}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">{enrollment.course.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  <Calendar className="h-4 w-4 inline mr-1" />
                                  Enrolled on {new Date(enrollment.enrolledAt).toLocaleDateString()}
                                </div>
                                <Badge variant="outline" className="mt-2">
                                  {enrollment.course.level}
                                </Badge>
                              </div>
                              <Badge variant={
                                enrollment.status === "active" ? "default" : 
                                enrollment.status === "completed" ? "secondary" : "destructive"
                              }>
                                {enrollment.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">You haven't enrolled in any courses yet.</p>
                      <Button variant="outline" className="mt-4">Browse Courses</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
