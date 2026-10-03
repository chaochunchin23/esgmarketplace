import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { 
  consultantProfiles, 
  consultantReviews, 
  reviewVotes, 
  users, 
  courseProviders,
  consultantBookings,
  messages,
  enrollments,
  courses,
  consultantAvailability,
  consultantBlockedSlots
} from "@db/schema";
import { and, ilike, eq, desc, sql, or, inArray } from "drizzle-orm";
import { setupAuth } from "./auth";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { translateText, analyzeReviewSentiment } from "./services/openai";
import { getMessages, sendMessage, ensureMessagesTableExists } from "./messages";

async function generateReviewInsights(reviewText: string) {
  try {
    // Use the analyzeReviewSentiment function imported from services/openai
    return await analyzeReviewSentiment(reviewText);
  } catch (error) {
    console.error("Error generating AI insights:", error);
    return null;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Initialize messages table
  try {
    await ensureMessagesTableExists();
    console.log("Messages table initialized successfully");
  } catch (err) {
    console.error("Failed to initialize messages table:", err);
  }
  
  // Translation API endpoint
  app.post("/api/translate", async (req, res) => {
    try {
      const { text, targetLanguage } = req.body;
      
      if (!text || !targetLanguage) {
        return res.status(400).json({ error: "Missing required parameters" });
      }
      
      const translatedText = await translateText(text, targetLanguage);
      res.json({ translatedText });
    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({ error: "Translation failed" });
    }
  });
  
  // PayPal integration endpoints
  // PayPal routes - modified to match client component expectations
  app.get("/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/order", async (req, res) => {
    // Request body should contain: { intent, amount, currency }
    await createPaypalOrder(req, res);
  });

  app.post("/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });
  
  // Messaging system routes
  // Get messages between user and consultant
  app.get("/api/messages/:consultantId", getMessages);
  
  // Send a message to a consultant
  app.post("/api/messages/:consultantId", sendMessage);
  
  // Extended user profile with role-specific information
  app.get("/api/user/extended", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      // First get the basic user info
      const user = req.user;
      
      // Create the extended user object
      const extendedUser = {
        ...user,
        consultantProfile: null,
        providerProfile: null
      };
      
      // If user is a consultant, fetch consultant profile
      if (user.role === "consultant") {
        const [consultantProfile] = await db.select()
          .from(consultantProfiles)
          .where(eq(consultantProfiles.userId, user.id))
          .limit(1);
          
        if (consultantProfile) {
          extendedUser.consultantProfile = consultantProfile;
        }
      }
      
      // If user is a provider, fetch provider profile
      if (user.role === "provider") {
        const [providerProfile] = await db.select()
          .from(courseProviders)
          .where(eq(courseProviders.userId, user.id))
          .limit(1);
          
        if (providerProfile) {
          extendedUser.providerProfile = providerProfile;
        }
      }
      
      res.json(extendedUser);
    } catch (error) {
      console.error("Error fetching extended user profile:", error);
      res.status(500).json({ error: "Error fetching extended user profile" });
    }
  });
  
  // User profile endpoints
  app.patch("/api/user/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { 
        firstName, lastName, email, bio, jobTitle, company, 
        phone, location, website, linkedinUrl, twitterUrl 
      } = req.body;
      
      // Update user profile
      const [updatedUser] = await db.update(users)
        .set({
          firstName,
          lastName,
          email,
          bio,
          jobTitle,
          company,
          phone,
          location,
          website,
          linkedinUrl,
          twitterUrl,
          profileCompleted: true
        })
        .where(eq(users.id, req.user.id))
        .returning();
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Error updating user profile" });
    }
  });
  
  // Change user role
  app.post("/api/user/role", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { role } = req.body;
      
      if (!["user", "consultant", "provider", "admin"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      
      // Update user role
      const [updatedUser] = await db.update(users)
        .set({ role })
        .where(eq(users.id, req.user.id))
        .returning();
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error changing user role:", error);
      res.status(500).json({ error: "Error changing user role" });
    }
  });
  
  // Consultant profile
  app.post("/api/consultant-profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    if (req.user.role !== "consultant") {
      return res.status(403).json({ error: "Only consultants can update consultant profiles" });
    }
    
    try {
      const { 
        expertise, hourlyRate, yearsExperience, availability,
        frameworks, certifications, languages, industries
      } = req.body;
      
      // Check if consultant profile exists
      const [existingProfile] = await db.select()
        .from(consultantProfiles)
        .where(eq(consultantProfiles.userId, req.user.id))
        .limit(1);
      
      // Format data for database
      const profileData = {
        userId: req.user.id,
        fullName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.username,
        photoUrl: req.user.photoUrl || `https://api.dicebear.com/7.x/personas/svg?seed=${req.user.username}`,
        bio: req.user.bio || "",
        expertise,
        subExpertise: {
          frameworks,
          keywords: frameworks.map((fw: string) => fw.toLowerCase())
        },
        trainingOfferings: [],
        hourlyRate,
        yearsExperience,
        company: req.user.company || "",
        position: req.user.jobTitle || "",
        reportsGenerated: 0,
        certifications,
        availability,
        linkedinUrl: req.user.linkedinUrl || "",
        languages,
        industries,
        avgRating: null,
        totalReviews: 0
      };
      
      let result;
      
      if (existingProfile) {
        // Update existing profile
        [result] = await db.update(consultantProfiles)
          .set(profileData)
          .where(eq(consultantProfiles.id, existingProfile.id))
          .returning();
      } else {
        // Create new profile
        [result] = await db.insert(consultantProfiles)
          .values(profileData)
          .returning();
        
        // Update user to mark profile as completed
        await db.update(users)
          .set({ profileCompleted: true })
          .where(eq(users.id, req.user.id));
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error updating consultant profile:", error);
      res.status(500).json({ error: "Error updating consultant profile" });
    }
  });
  
  // Course provider profile endpoints
  app.post("/api/provider-profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    if (req.user.role !== "provider") {
      return res.status(403).json({ error: "Only providers can update provider profiles" });
    }
    
    try {
      const { 
        providerName, providerDescription, providerWebsite,
        providerLogoUrl, providerType, serviceAreas
      } = req.body;
      
      // Check if provider already exists in courseProviders table
      const [existingProvider] = await db.select()
        .from(courseProviders)
        .where(eq(courseProviders.userId, req.user.id))
        .limit(1);
      
      // Format data for database
      const providerData = {
        userId: req.user.id,
        name: providerName,
        description: providerDescription,
        website: providerWebsite,
        logoUrl: providerLogoUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${providerName}`,
        providerType: providerType || "Other",
        serviceAreas: serviceAreas || "Global"
      };
      
      let result;
      
      if (existingProvider) {
        // Update existing provider
        [result] = await db.update(courseProviders)
          .set(providerData)
          .where(eq(courseProviders.id, existingProvider.id))
          .returning();
      } else {
        // Create new provider
        [result] = await db.insert(courseProviders)
          .values(providerData)
          .returning();
        
        // Update user to mark profile as completed
        await db.update(users)
          .set({ profileCompleted: true })
          .where(eq(users.id, req.user.id));
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error updating provider profile:", error);
      res.status(500).json({ error: "Error updating provider profile" });
    }
  });
  
  // Add endpoints for profile data
  app.get("/api/bookings", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    // Return empty array for now
    res.json([]);
  });
  
  app.get("/api/enrollments", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    // Return empty array for now
    res.json([]);
  });
  
  // Add courses endpoint
  app.get("/api/courses", (req, res) => {
    // This endpoint doesn't require authentication
    const { searchTerm, level, category, provider } = req.query;
    
    // Mock course data for demo purposes
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
    
    // Return mock data
    res.json(mockCourses);
  });
  // Consultants
  app.get("/api/consultants", async (req, res) => {
    try {
      const consultants = await db.query.consultantProfiles.findMany({
        with: {
          user: true,
          reviews: {
            with: {
              reviewer: true
            }
          }
        },
        orderBy: (consultantProfiles, { desc }) => [desc(consultantProfiles.yearsExperience)]
      });

      // Format the response data
      const formattedConsultants = consultants.map(consultant => {
        const totalReviews = consultant.reviews.length;
        const avgRating = totalReviews > 0 
          ? (consultant.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1)
          : null;
          
        return {
          id: consultant.id,
          fullName: consultant.fullName,
          photoUrl: consultant.photoUrl,
          bio: consultant.bio,
          expertise: consultant.expertise,
          subExpertise: consultant.subExpertise,
          trainingOfferings: consultant.trainingOfferings,
          hourlyRate: consultant.hourlyRate,
          yearsExperience: consultant.yearsExperience,
          company: consultant.company,
          position: consultant.position,
          reportsGenerated: consultant.reportsGenerated,
          certifications: consultant.certifications,
          availability: consultant.availability,
          linkedinUrl: consultant.linkedinUrl,
          languages: consultant.languages,
          industries: consultant.industries,
          avgRating,
          totalReviews
        };
      });

      res.json(formattedConsultants);
    } catch (error) {
      console.error("Consultants fetch error:", error);
      res.status(500).json({ message: "Failed to fetch consultants" });
    }
  });

  app.get("/api/consultants/search", async (req, res) => {
    try {
      const { 
        search, 
        expertise, 
        frameworks,
        industries,
        languages,
        minRate, 
        maxRate,
        minExperience,
        maxExperience
      } = req.query;
      
      const conditions = [];

      // Text search in name, bio, or company
      if (typeof search === 'string' && search) {
        conditions.push(
          or(
            ilike(consultantProfiles.fullName, `%${search}%`),
            ilike(consultantProfiles.bio, `%${search}%`),
            ilike(consultantProfiles.company, `%${search}%`)
          )
        );
      }

      // Expertise filter (can be a comma-separated list)
      if (typeof expertise === 'string' && expertise) {
        const expertiseList = expertise.split(',');
        if (expertiseList.length === 1) {
          conditions.push(eq(consultantProfiles.expertise, expertiseList[0]));
        } else if (expertiseList.length > 1) {
          conditions.push(inArray(consultantProfiles.expertise, expertiseList));
        }
      }
      
      // Frameworks filter using JSON containment
      if (typeof frameworks === 'string' && frameworks) {
        const frameworkList = frameworks.split(',');
        frameworkList.forEach(framework => {
          conditions.push(
            sql`${consultantProfiles.subExpertise}->>'frameworks' @> ${JSON.stringify([framework])}`
          );
        });
      }
      
      // Industries filter
      if (typeof industries === 'string' && industries) {
        const industriesList = industries.split(',');
        industriesList.forEach(industry => {
          conditions.push(
            sql`${consultantProfiles.industries} @> ${JSON.stringify([industry])}`
          );
        });
      }
      
      // Languages filter
      if (typeof languages === 'string' && languages) {
        const languagesList = languages.split(',');
        languagesList.forEach(language => {
          conditions.push(
            sql`${consultantProfiles.languages} @> ${JSON.stringify([language])}`
          );
        });
      }

      // Hourly rate range
      if (typeof minRate === 'string' && !isNaN(Number(minRate))) {
        conditions.push(sql`CAST(${consultantProfiles.hourlyRate} AS NUMERIC) >= ${Number(minRate)}`);
      }
      
      if (typeof maxRate === 'string' && !isNaN(Number(maxRate))) {
        conditions.push(sql`CAST(${consultantProfiles.hourlyRate} AS NUMERIC) <= ${Number(maxRate)}`);
      }
      
      // Years of experience range
      if (typeof minExperience === 'string' && !isNaN(Number(minExperience))) {
        conditions.push(sql`CAST(${consultantProfiles.yearsExperience} AS NUMERIC) >= ${Number(minExperience)}`);
      }
      
      if (typeof maxExperience === 'string' && !isNaN(Number(maxExperience))) {
        conditions.push(sql`CAST(${consultantProfiles.yearsExperience} AS NUMERIC) <= ${Number(maxExperience)}`);
      }

      const consultants = await db
        .select({
          id: consultantProfiles.id,
          bio: consultantProfiles.bio,
          photoUrl: consultantProfiles.photoUrl,
          company: consultantProfiles.company,
          linkedinUrl: consultantProfiles.linkedinUrl,
          userId: consultantProfiles.userId,
          fullName: consultantProfiles.fullName,
          expertise: consultantProfiles.expertise,
          subExpertise: consultantProfiles.subExpertise,
          trainingOfferings: consultantProfiles.trainingOfferings,
          hourlyRate: consultantProfiles.hourlyRate,
          yearsExperience: consultantProfiles.yearsExperience,
          position: consultantProfiles.position,
          reportsGenerated: consultantProfiles.reportsGenerated,
          certifications: consultantProfiles.certifications,
          availability: consultantProfiles.availability,
          languages: consultantProfiles.languages,
          industries: consultantProfiles.industries,
        })
        .from(consultantProfiles)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(consultantProfiles.yearsExperience));

      // Format the response data
      const formattedConsultants = consultants.map(consultant => {
        const totalReviews = consultant.reviews.length;
        const avgRating = totalReviews > 0 
          ? (consultant.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1)
          : null;
          
        return {
          id: consultant.id,
          fullName: consultant.fullName,
          photoUrl: consultant.photoUrl,
          bio: consultant.bio,
          expertise: consultant.expertise,
          subExpertise: consultant.subExpertise,
          trainingOfferings: consultant.trainingOfferings,
          hourlyRate: consultant.hourlyRate,
          yearsExperience: consultant.yearsExperience,
          company: consultant.company,
          position: consultant.position,
          reportsGenerated: consultant.reportsGenerated,
          certifications: consultant.certifications,
          availability: consultant.availability,
          linkedinUrl: consultant.linkedinUrl,
          languages: consultant.languages,
          industries: consultant.industries,
          avgRating,
          totalReviews
        };
      });

      res.json(formattedConsultants);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: "Failed to search consultants" });
    }
  });

  app.get("/api/consultants/:id", async (req, res) => {
    try {
      const consultantId = parseInt(req.params.id);
      if (isNaN(consultantId)) {
        res.status(400).json({ message: "Invalid consultant ID" });
        return;
      }

      const consultant = await db.query.consultantProfiles.findFirst({
        where: eq(consultantProfiles.id, consultantId),
        with: {
          user: true,
          reviews: {
            with: {
              reviewer: true,
              votes: true
            }
          }
        }
      });

      if (!consultant) {
        res.status(404).json({ message: "Consultant not found" });
        return;
      }

      res.json(consultant);
    } catch (error) {
      console.error("Fetch error:", error);
      res.status(500).json({ message: "Failed to fetch consultant details" });
    }
  });

  // Reviews
  app.post("/api/reviews", async (req, res) => {
    try {
      const { consultantId, reviewerId, rating, reviewText, projectDetails } = req.body;

      // Generate AI insights
      const aiInsights = await generateReviewInsights(reviewText);

      // Create review
      const [review] = await db.insert(consultantReviews)
        .values({
          consultantId: parseInt(consultantId),
          reviewerId: parseInt(reviewerId),
          rating: parseInt(rating),
          reviewText,
          projectDetails,
          aiInsights,
          isVerified: false,
          helpfulVotes: 0
        })
        .returning();

      // Update consultant's average rating and total reviews
      const reviews = await db.query.consultantReviews.findMany({
        where: eq(consultantReviews.consultantId, parseInt(consultantId))
      });

      const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

      await db
        .update(consultantProfiles)
        .set({
          avgRating: avgRating.toFixed(2),
          totalReviews: reviews.length
        })
        .where(eq(consultantProfiles.id, parseInt(consultantId)));

      res.json(review);
    } catch (error) {
      console.error("Review creation error:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.get("/api/consultants/:id/reviews", async (req, res) => {
    try {
      const consultantId = parseInt(req.params.id);
      if (isNaN(consultantId)) {
        res.status(400).json({ message: "Invalid consultant ID" });
        return;
      }

      const reviews = await db.query.consultantReviews.findMany({
        where: eq(consultantReviews.consultantId, consultantId),
        with: {
          reviewer: true,
          votes: true
        },
        orderBy: [desc(consultantReviews.createdAt)]
      });

      res.json(reviews);
    } catch (error) {
      console.error("Reviews fetch error:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post("/api/reviews/:id/vote", async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      if (isNaN(reviewId)) {
        res.status(400).json({ message: "Invalid review ID" });
        return;
      }

      const { userId, isHelpful } = req.body;

      // Check if user has already voted
      const existingVote = await db.query.reviewVotes.findFirst({
        where: and(
          eq(reviewVotes.reviewId, reviewId),
          eq(reviewVotes.userId, parseInt(userId))
        )
      });

      if (existingVote) {
        res.status(400).json({ message: "User has already voted on this review" });
        return;
      }

      // Create vote
      const [vote] = await db.insert(reviewVotes)
        .values({
          reviewId,
          userId: parseInt(userId),
          isHelpful
        })
        .returning();

      // Update helpful votes count
      const votes = await db.query.reviewVotes.findMany({
        where: eq(reviewVotes.reviewId, reviewId)
      });

      const helpfulVotes = votes.filter(v => v.isHelpful).length;

      await db
        .update(consultantReviews)
        .set({ helpfulVotes })
        .where(eq(consultantReviews.id, reviewId));

      res.json(vote);
    } catch (error) {
      res.status(500).json({ message: "Failed to vote on review" });
    }
  });

  // Dashboard API routes
  
  // Get user bookings
  app.get("/api/user/bookings", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const userBookings = await db.select({
        id: consultantBookings.id,
        consultantId: consultantBookings.consultantId,
        sessionDate: consultantBookings.sessionDate,
        sessionDuration: consultantBookings.sessionDuration,
        status: consultantBookings.status,
        totalAmount: consultantBookings.totalAmount,
        paymentStatus: consultantBookings.paymentStatus,
        sessionType: consultantBookings.sessionType,
        notes: consultantBookings.notes,
        meetingLink: consultantBookings.meetingLink,
        createdAt: consultantBookings.createdAt,
      })
      .from(consultantBookings)
      .where(eq(consultantBookings.userId, req.user.id))
      .orderBy(desc(consultantBookings.sessionDate));
      
      // Fetch consultant details for each booking
      const bookingsWithConsultant = await Promise.all(
        userBookings.map(async (booking) => {
          const [consultant] = await db.select({
            fullName: consultantProfiles.fullName,
            photoUrl: consultantProfiles.photoUrl,
            expertise: consultantProfiles.expertise,
          })
          .from(consultantProfiles)
          .where(eq(consultantProfiles.id, booking.consultantId))
          .limit(1);
          
          return {
            ...booking,
            consultant
          };
        })
      );
      
      res.json(bookingsWithConsultant);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ error: "Error fetching bookings" });
    }
  });
  
  // Get user enrollments
  app.get("/api/user/enrollments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const userEnrollments = await db.select({
        id: enrollments.id,
        courseId: enrollments.courseId,
        enrolledAt: enrollments.enrolledAt,
        status: enrollments.status,
        paymentStatus: enrollments.paymentStatus,
        paymentAmount: enrollments.paymentAmount,
        completionDate: enrollments.completionDate,
      })
      .from(enrollments)
      .where(eq(enrollments.userId, req.user.id))
      .orderBy(desc(enrollments.enrolledAt));
      
      // Fetch course details for each enrollment
      const enrollmentsWithCourse = await Promise.all(
        userEnrollments.map(async (enrollment) => {
          const [course] = await db.select({
            title: courses.title,
            level: courses.level,
            duration: courses.duration,
            providerId: courses.providerId,
          })
          .from(courses)
          .where(eq(courses.id, enrollment.courseId))
          .limit(1);
          
          let provider = null;
          if (course?.providerId) {
            const [providerData] = await db.select({
              name: courseProviders.name,
            })
            .from(courseProviders)
            .where(eq(courseProviders.id, course.providerId))
            .limit(1);
            provider = providerData;
          }
          
          return {
            ...enrollment,
            course: course ? { ...course, provider } : null
          };
        })
      );
      
      res.json(enrollmentsWithCourse);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ error: "Error fetching enrollments" });
    }
  });
  
  // Get user messages
  app.get("/api/user/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const userMessages = await db.select()
        .from(messages)
        .where(
          or(
            eq(messages.senderId, req.user.id),
            eq(messages.receiverId, req.user.id)
          )
        )
        .orderBy(desc(messages.createdAt))
        .limit(50);
      
      // Fetch sender details for each message
      const messagesWithSender = await Promise.all(
        userMessages.map(async (message) => {
          const [sender] = await db.select({
            username: users.username,
            photoUrl: users.photoUrl,
          })
          .from(users)
          .where(eq(users.id, message.senderId))
          .limit(1);
          
          return {
            ...message,
            sender
          };
        })
      );
      
      res.json(messagesWithSender);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Error fetching messages" });
    }
  });
  
  // Get dashboard stats
  app.get("/api/user/dashboard-stats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      // Get booking stats
      const userBookings = await db.select()
        .from(consultantBookings)
        .where(eq(consultantBookings.userId, req.user.id));
      
      // Get enrollment stats
      const userEnrollments = await db.select()
        .from(enrollments)
        .where(eq(enrollments.userId, req.user.id));
      
      // Get unread messages count
      const unreadMessages = await db.select()
        .from(messages)
        .where(
          and(
            eq(messages.receiverId, req.user.id),
            eq(messages.isRead, false)
          )
        );
      
      // Calculate stats
      const stats = {
        totalBookings: userBookings.length,
        pendingBookings: userBookings.filter(b => b.status === "pending").length,
        completedBookings: userBookings.filter(b => b.status === "completed").length,
        totalEnrollments: userEnrollments.length,
        activeEnrollments: userEnrollments.filter(e => e.status === "active").length,
        completedEnrollments: userEnrollments.filter(e => e.status === "completed").length,
        unreadMessages: unreadMessages.length,
        totalSpent: userBookings.reduce((sum, b) => sum + parseFloat(b.totalAmount || "0"), 0),
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Error fetching dashboard stats" });
    }
  });
  
  // Create a booking
  app.post("/api/bookings", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { consultantId, sessionDate, sessionDuration, sessionType, notes, totalAmount } = req.body;
      
      const [booking] = await db.insert(consultantBookings)
        .values({
          userId: req.user.id,
          consultantId,
          sessionDate: new Date(sessionDate),
          sessionDuration,
          sessionType,
          notes,
          totalAmount,
          status: "pending",
          paymentStatus: "pending",
        })
        .returning();
      
      res.json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ error: "Error creating booking" });
    }
  });
  
  // Update booking status
  app.patch("/api/bookings/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const bookingId = parseInt(req.params.id);
      const { status, paymentStatus, meetingLink } = req.body;
      
      // First, fetch the booking to verify ownership
      const [existingBooking] = await db.select()
        .from(consultantBookings)
        .where(eq(consultantBookings.id, bookingId))
        .limit(1);
      
      if (!existingBooking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      // Check if user is the booking owner
      const isBookingOwner = existingBooking.userId === req.user.id;
      
      // Check if user is the consultant for this booking
      let isConsultant = false;
      if (req.user.role === "consultant") {
        const [consultantProfile] = await db.select()
          .from(consultantProfiles)
          .where(eq(consultantProfiles.userId, req.user.id))
          .limit(1);
        
        if (consultantProfile && existingBooking.consultantId === consultantProfile.id) {
          isConsultant = true;
        }
      }
      
      // Verify authorization
      if (!isBookingOwner && !isConsultant) {
        return res.status(403).json({ error: "Not authorized to update this booking" });
      }
      
      // Only allow consultants to confirm/complete bookings
      if (status === "confirmed" || status === "completed") {
        if (!isConsultant) {
          return res.status(403).json({ error: "Only consultants can confirm or complete bookings" });
        }
      }
      
      // Only allow booking owner or consultant to cancel
      if (status === "cancelled" && !isBookingOwner && !isConsultant) {
        return res.status(403).json({ error: "Not authorized to cancel this booking" });
      }
      
      // Build update object
      const updateData: Record<string, any> = { updatedAt: new Date() };
      if (status) updateData.status = status;
      if (paymentStatus) updateData.paymentStatus = paymentStatus;
      if (meetingLink !== undefined) updateData.meetingLink = meetingLink;
      
      const [updatedBooking] = await db.update(consultantBookings)
        .set(updateData)
        .where(eq(consultantBookings.id, bookingId))
        .returning();
      
      res.json(updatedBooking);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ error: "Error updating booking" });
    }
  });
  
  // Send a new message
  app.post("/api/user/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { receiverId, content, bookingId } = req.body;
      
      const [message] = await db.insert(messages)
        .values({
          senderId: req.user.id,
          receiverId,
          content,
          bookingId: bookingId || null,
          isRead: false,
        })
        .returning();
      
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Error sending message" });
    }
  });
  
  // Consultant-specific routes
  
  // Get consultant's bookings (for consultant dashboard)
  app.get("/api/consultant/bookings", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    if (req.user.role !== "consultant") {
      return res.status(403).json({ error: "Only consultants can access this endpoint" });
    }
    
    try {
      // First get the consultant profile for this user
      const [consultantProfile] = await db.select()
        .from(consultantProfiles)
        .where(eq(consultantProfiles.userId, req.user.id))
        .limit(1);
      
      if (!consultantProfile) {
        return res.json([]);
      }
      
      // Get bookings for this consultant
      const consultantBookings$ = await db.select({
        id: consultantBookings.id,
        userId: consultantBookings.userId,
        sessionDate: consultantBookings.sessionDate,
        sessionDuration: consultantBookings.sessionDuration,
        status: consultantBookings.status,
        totalAmount: consultantBookings.totalAmount,
        paymentStatus: consultantBookings.paymentStatus,
        sessionType: consultantBookings.sessionType,
        notes: consultantBookings.notes,
        meetingLink: consultantBookings.meetingLink,
        createdAt: consultantBookings.createdAt,
      })
      .from(consultantBookings)
      .where(eq(consultantBookings.consultantId, consultantProfile.id))
      .orderBy(desc(consultantBookings.sessionDate));
      
      // Fetch user details for each booking
      const bookingsWithUser = await Promise.all(
        consultantBookings$.map(async (booking) => {
          const [user] = await db.select({
            username: users.username,
            email: users.email,
            company: users.company,
            photoUrl: users.photoUrl,
          })
          .from(users)
          .where(eq(users.id, booking.userId))
          .limit(1);
          
          return {
            ...booking,
            user
          };
        })
      );
      
      res.json(bookingsWithUser);
    } catch (error) {
      console.error("Error fetching consultant bookings:", error);
      res.status(500).json({ error: "Error fetching consultant bookings" });
    }
  });
  
  // Get consultant statistics
  app.get("/api/consultant/stats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    if (req.user.role !== "consultant") {
      return res.status(403).json({ error: "Only consultants can access this endpoint" });
    }
    
    try {
      // First get the consultant profile for this user
      const [consultantProfile] = await db.select()
        .from(consultantProfiles)
        .where(eq(consultantProfiles.userId, req.user.id))
        .limit(1);
      
      if (!consultantProfile) {
        return res.json({
          totalBookings: 0,
          pendingBookings: 0,
          confirmedBookings: 0,
          completedBookings: 0,
          totalEarnings: 0,
          monthlyEarnings: 0,
          totalClients: 0,
          averageRating: 0,
        });
      }
      
      // Get all bookings for this consultant
      const allBookings = await db.select()
        .from(consultantBookings)
        .where(eq(consultantBookings.consultantId, consultantProfile.id));
      
      // Calculate monthly earnings (current month)
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyPaidBookings = allBookings.filter(b => 
        b.paymentStatus === "paid" && 
        new Date(b.createdAt) >= startOfMonth
      );
      
      const stats = {
        totalBookings: allBookings.length,
        pendingBookings: allBookings.filter(b => b.status === "pending").length,
        confirmedBookings: allBookings.filter(b => b.status === "confirmed").length,
        completedBookings: allBookings.filter(b => b.status === "completed").length,
        totalEarnings: allBookings
          .filter(b => b.paymentStatus === "paid")
          .reduce((sum, b) => sum + parseFloat(b.totalAmount || "0"), 0),
        monthlyEarnings: monthlyPaidBookings
          .reduce((sum, b) => sum + parseFloat(b.totalAmount || "0"), 0),
        totalClients: new Set(allBookings.map(b => b.userId)).size,
        averageRating: consultantProfile.avgRating ? parseFloat(consultantProfile.avgRating) : 0,
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching consultant stats:", error);
      res.status(500).json({ error: "Error fetching consultant stats" });
    }
  });

  // Mark message as read
  app.patch("/api/user/messages/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const messageId = parseInt(req.params.id);
      
      const [updatedMessage] = await db.update(messages)
        .set({ isRead: true })
        .where(
          and(
            eq(messages.id, messageId),
            eq(messages.receiverId, req.user.id)
          )
        )
        .returning();
      
      res.json(updatedMessage);
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ error: "Error marking message as read" });
    }
  });

  // Get consultant availability slots for a specific consultant
  app.get("/api/consultants/:id/availability", async (req, res) => {
    try {
      const consultantId = parseInt(req.params.id);
      const { date } = req.query;
      
      // Get regular availability
      const availability = await db.select()
        .from(consultantAvailability)
        .where(
          and(
            eq(consultantAvailability.consultantId, consultantId),
            eq(consultantAvailability.isActive, true)
          )
        );
      
      // Get existing bookings for the requested date if provided
      let existingBookings: any[] = [];
      if (date) {
        const targetDate = new Date(date as string);
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        existingBookings = await db.select()
          .from(consultantBookings)
          .where(
            and(
              eq(consultantBookings.consultantId, consultantId),
              sql`${consultantBookings.sessionDate} >= ${startOfDay}`,
              sql`${consultantBookings.sessionDate} <= ${endOfDay}`,
              or(
                eq(consultantBookings.status, "pending"),
                eq(consultantBookings.status, "confirmed")
              )
            )
          );
      }
      
      // Get blocked slots
      const blockedSlots = date ? await db.select()
        .from(consultantBlockedSlots)
        .where(
          and(
            eq(consultantBlockedSlots.consultantId, consultantId),
            eq(consultantBlockedSlots.blockedDate, date as string)
          )
        ) : [];
      
      res.json({
        availability,
        existingBookings: existingBookings.map(b => ({
          sessionDate: b.sessionDate,
          sessionDuration: b.sessionDuration
        })),
        blockedSlots
      });
    } catch (error) {
      console.error("Error fetching availability:", error);
      res.status(500).json({ error: "Error fetching availability" });
    }
  });
  
  // Update consultant availability (for consultants)
  app.put("/api/consultant/availability", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "consultant") {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    try {
      const { slots } = req.body;
      
      // Get consultant profile
      const [consultantProfile] = await db.select()
        .from(consultantProfiles)
        .where(eq(consultantProfiles.userId, req.user.id))
        .limit(1);
      
      if (!consultantProfile) {
        return res.status(404).json({ error: "Consultant profile not found" });
      }
      
      // Delete existing availability
      await db.delete(consultantAvailability)
        .where(eq(consultantAvailability.consultantId, consultantProfile.id));
      
      // Insert new availability slots
      if (slots && slots.length > 0) {
        await db.insert(consultantAvailability)
          .values(slots.map((slot: any) => ({
            consultantId: consultantProfile.id,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isActive: true
          })));
      }
      
      res.json({ message: "Availability updated successfully" });
    } catch (error) {
      console.error("Error updating availability:", error);
      res.status(500).json({ error: "Error updating availability" });
    }
  });
  
  // Block a time slot (for consultants)
  app.post("/api/consultant/block-slot", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "consultant") {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    try {
      const { blockedDate, startTime, endTime, reason } = req.body;
      
      // Get consultant profile
      const [consultantProfile] = await db.select()
        .from(consultantProfiles)
        .where(eq(consultantProfiles.userId, req.user.id))
        .limit(1);
      
      if (!consultantProfile) {
        return res.status(404).json({ error: "Consultant profile not found" });
      }
      
      const [blockedSlot] = await db.insert(consultantBlockedSlots)
        .values({
          consultantId: consultantProfile.id,
          blockedDate,
          startTime,
          endTime,
          reason
        })
        .returning();
      
      res.json(blockedSlot);
    } catch (error) {
      console.error("Error blocking slot:", error);
      res.status(500).json({ error: "Error blocking slot" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}