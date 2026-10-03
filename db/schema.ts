import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, date } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  email: text("email").unique().notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role", { enum: ["user", "consultant", "provider", "admin"] }).default("user").notNull(),
  profileCompleted: boolean("profile_completed").default(false),
  bio: text("bio"),
  photoUrl: text("photo_url"),
  jobTitle: text("job_title"),
  company: text("company"),
  phone: text("phone"),
  location: text("location"),
  website: text("website"),
  linkedinUrl: text("linkedin_url"),
  twitterUrl: text("twitter_url"),
  preferredLanguage: text("preferred_language").default("English"), 
  interests: text("interests").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  subscriptionStatus: text("subscription_status", { enum: ["none", "active", "expired"] }).default("none"),
  subscriptionExpiry: timestamp("subscription_expiry"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id")
});

export const consultantProfiles = pgTable("consultant_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  fullName: text("full_name").notNull(),
  photoUrl: text("photo_url").notNull(),
  bio: text("bio").notNull(),
  expertise: text("expertise", { enum: ["environmental", "social", "governance"] }).notNull(),
  subExpertise: jsonb("sub_expertise").$type<{
    frameworks: string[];
    keywords: string[];
  }>().notNull(),
  trainingOfferings: jsonb("training_offerings").$type<{
    title: string;
    description: string;
  }[]>().notNull(),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).notNull(),
  yearsExperience: integer("years_experience").notNull(),
  company: text("company").notNull(),
  position: text("position").notNull(),
  reportsGenerated: integer("reports_generated").notNull(),
  certifications: text("certifications").array().notNull(),
  availability: text("availability"),
  linkedinUrl: text("linkedin_url"),
  languages: text("languages").array().notNull(),
  industries: text("industries").array().notNull(),
  avgRating: decimal("avg_rating", { precision: 3, scale: 2 }),
  totalReviews: integer("total_reviews").default(0)
});

export const consultantReviews = pgTable("consultant_reviews", {
  id: serial("id").primaryKey(),
  consultantId: integer("consultant_id").references(() => consultantProfiles.id).notNull(),
  reviewerId: integer("reviewer_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(),
  reviewText: text("review_text").notNull(),
  projectDetails: text("project_details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  aiInsights: jsonb("ai_insights").$type<{
    sentiment: string;
    keyStrengths: string[];
    areasOfImprovement: string[];
    topicAnalysis: Record<string, number>;
  }>(),
  isVerified: boolean("is_verified").default(false),
  helpfulVotes: integer("helpful_votes").default(0)
});

export const reviewVotes = pgTable("review_votes", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").references(() => consultantReviews.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  isHelpful: boolean("is_helpful").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Relations setup
export const consultantProfileRelations = relations(consultantProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [consultantProfiles.userId],
    references: [users.id],
  }),
  reviews: many(consultantReviews)
}));

export const consultantReviewRelations = relations(consultantReviews, ({ one, many }) => ({
  consultant: one(consultantProfiles, {
    fields: [consultantReviews.consultantId],
    references: [consultantProfiles.id],
  }),
  reviewer: one(users, {
    fields: [consultantReviews.reviewerId],
    references: [users.id],
  }),
  votes: many(reviewVotes)
}));

export const reviewVoteRelations = relations(reviewVotes, ({ one }) => ({
  review: one(consultantReviews, {
    fields: [reviewVotes.reviewId],
    references: [consultantReviews.id],
  }),
  user: one(users, {
    fields: [reviewVotes.userId],
    references: [users.id],
  })
}));

// Schema types
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const insertConsultantProfileSchema = createInsertSchema(consultantProfiles);
export const selectConsultantProfileSchema = createSelectSchema(consultantProfiles);
export type ConsultantProfile = typeof consultantProfiles.$inferSelect;
export type NewConsultantProfile = typeof consultantProfiles.$inferInsert;

export const insertReviewSchema = createInsertSchema(consultantReviews);
export const selectReviewSchema = createSelectSchema(consultantReviews);
export type ConsultantReview = typeof consultantReviews.$inferSelect;
export type NewConsultantReview = typeof consultantReviews.$inferInsert;

// Course tables
export const courseProviders = pgTable("course_providers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  website: text("website"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  providerType: text("provider_type"),
  serviceAreas: text("service_areas"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const instructors = pgTable("instructors", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").references(() => courseProviders.id),
  name: text("name").notNull(),
  title: text("title"),
  bio: text("bio"),
  photoUrl: text("photo_url"),
  expertise: text("expertise").array(),
  email: text("email"),
  linkedin: text("linkedin"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").references(() => courseProviders.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
  duration: text("duration"),
  totalHours: integer("total_hours"),
  level: text("level", { enum: ["beginner", "intermediate", "advanced"] }).notNull(),
  category: text("category").notNull(),
  courseImage: text("course_image"),
  learningOutcomes: text("learning_outcomes").array(),
  prerequisites: text("prerequisites").array(),
  maxStudents: integer("max_students"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  language: text("language"),
  certificationType: text("certification_type"),
  location: text("location"),
  isVirtual: boolean("is_virtual").default(false),
  syllabus: jsonb("syllabus").$type<{
    week: number;
    topic: string;
    description: string;
  }[]>(),
  targetAudience: text("target_audience"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const courseInstructors = pgTable("course_instructors", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  instructorId: integer("instructor_id").references(() => instructors.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  status: text("status", { enum: ["active", "completed", "cancelled"] }).default("active").notNull(),
  paymentStatus: text("payment_status", { enum: ["pending", "paid", "refunded"] }).default("pending").notNull(),
  paymentAmount: decimal("payment_amount", { precision: 10, scale: 2 }),
  completionDate: timestamp("completion_date"),
});

// Course relations
export const courseProviderRelations = relations(courseProviders, ({ many }) => ({
  courses: many(courses),
  instructors: many(instructors),
}));

export const instructorRelations = relations(instructors, ({ one, many }) => ({
  provider: one(courseProviders, {
    fields: [instructors.providerId],
    references: [courseProviders.id],
  }),
  courses: many(courseInstructors),
}));

export const courseRelations = relations(courses, ({ one, many }) => ({
  provider: one(courseProviders, {
    fields: [courses.providerId],
    references: [courseProviders.id],
  }),
  instructors: many(courseInstructors),
  enrollments: many(enrollments),
}));

export const courseInstructorRelations = relations(courseInstructors, ({ one }) => ({
  course: one(courses, {
    fields: [courseInstructors.courseId],
    references: [courses.id],
  }),
  instructor: one(instructors, {
    fields: [courseInstructors.instructorId],
    references: [instructors.id],
  }),
}));

export const enrollmentRelations = relations(enrollments, ({ one }) => ({
  user: one(users, {
    fields: [enrollments.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
}));

// Schema types for courses
export const insertCourseProviderSchema = createInsertSchema(courseProviders);
export const selectCourseProviderSchema = createSelectSchema(courseProviders);
export type CourseProvider = typeof courseProviders.$inferSelect;
export type NewCourseProvider = typeof courseProviders.$inferInsert;

export const insertInstructorSchema = createInsertSchema(instructors);
export const selectInstructorSchema = createSelectSchema(instructors);
export type Instructor = typeof instructors.$inferSelect;
export type NewInstructor = typeof instructors.$inferInsert;

export const insertCourseSchema = createInsertSchema(courses);
export const selectCourseSchema = createSelectSchema(courses);
export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;

export const insertEnrollmentSchema = createInsertSchema(enrollments);
export const selectEnrollmentSchema = createSelectSchema(enrollments);
export type Enrollment = typeof enrollments.$inferSelect;
export type NewEnrollment = typeof enrollments.$inferInsert;

// Consultant bookings table
export const consultantBookings = pgTable("consultant_bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  consultantId: integer("consultant_id").references(() => consultantProfiles.id).notNull(),
  sessionDate: timestamp("session_date").notNull(),
  sessionDuration: integer("session_duration").notNull(), // in minutes
  status: text("status", { enum: ["pending", "confirmed", "completed", "cancelled"] }).default("pending").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: text("payment_status", { enum: ["pending", "paid", "refunded"] }).default("pending").notNull(),
  sessionType: text("session_type", { enum: ["consultation", "report_review", "strategy_session"] }).default("consultation").notNull(),
  notes: text("notes"),
  meetingLink: text("meeting_link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Messages table for communication
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  receiverId: integer("receiver_id").references(() => users.id).notNull(),
  bookingId: integer("booking_id").references(() => consultantBookings.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Booking relations
export const consultantBookingRelations = relations(consultantBookings, ({ one, many }) => ({
  user: one(users, {
    fields: [consultantBookings.userId],
    references: [users.id],
  }),
  consultant: one(consultantProfiles, {
    fields: [consultantBookings.consultantId],
    references: [consultantProfiles.id],
  }),
  messages: many(messages),
}));

// Message relations
export const messageRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receivedMessages",
  }),
  booking: one(consultantBookings, {
    fields: [messages.bookingId],
    references: [consultantBookings.id],
  }),
}));

// Schema types for bookings
export const insertBookingSchema = createInsertSchema(consultantBookings);
export const selectBookingSchema = createSelectSchema(consultantBookings);
export type ConsultantBooking = typeof consultantBookings.$inferSelect;
export type NewConsultantBooking = typeof consultantBookings.$inferInsert;

// Schema types for messages
export const insertMessageSchema = createInsertSchema(messages);
export const selectMessageSchema = createSelectSchema(messages);
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

// Consultant availability slots
export const consultantAvailability = pgTable("consultant_availability", {
  id: serial("id").primaryKey(),
  consultantId: integer("consultant_id").references(() => consultantProfiles.id).notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6, Sunday-Saturday
  startTime: text("start_time").notNull(), // "09:00"
  endTime: text("end_time").notNull(), // "17:00"
  isActive: boolean("is_active").default(true).notNull(),
});

// Blocked time slots for specific dates
export const consultantBlockedSlots = pgTable("consultant_blocked_slots", {
  id: serial("id").primaryKey(),
  consultantId: integer("consultant_id").references(() => consultantProfiles.id).notNull(),
  blockedDate: date("blocked_date").notNull(),
  startTime: text("start_time"), // Optional - if null, whole day is blocked
  endTime: text("end_time"),
  reason: text("reason"),
});

// Availability relations
export const consultantAvailabilityRelations = relations(consultantAvailability, ({ one }) => ({
  consultant: one(consultantProfiles, {
    fields: [consultantAvailability.consultantId],
    references: [consultantProfiles.id],
  }),
}));

export const consultantBlockedSlotsRelations = relations(consultantBlockedSlots, ({ one }) => ({
  consultant: one(consultantProfiles, {
    fields: [consultantBlockedSlots.consultantId],
    references: [consultantProfiles.id],
  }),
}));

// Schema types for availability
export const insertAvailabilitySchema = createInsertSchema(consultantAvailability);
export const selectAvailabilitySchema = createSelectSchema(consultantAvailability);
export type ConsultantAvailability = typeof consultantAvailability.$inferSelect;
export type NewConsultantAvailability = typeof consultantAvailability.$inferInsert;