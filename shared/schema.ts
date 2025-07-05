import { pgTable, text, serial, integer, timestamp, boolean, json, date, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define sessions table to prevent it from being deleted during migrations
export const sessions = pgTable("sessions", {
  sess: json("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

export const users = pgTable("users", {
  username: text("username").notNull().unique(),
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  bio: text("bio"),
  profileImageUrl: text("profile_image_url"),
  subscriptionTier: text("subscription_tier").default("free"),
  subscriptionId: text("subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLogin: timestamp("last_login"),
});

// Defining the goals table structure
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  // Define self-referential relation properly
  parentId: integer("parent_id").references((): any => goals.id),
  userId: integer("user_id").references(() => users.id),
  content: json("content").$type<{
    images: string[];
    websites: string[];
    youtubeLinks: string[];
    documents: Array<{
      url: string;
      name: string;
      size: string;
      type: string;
      icon?: string; // Base64 icon for thumbnails
    }>;
    journals: Array<{
      date: string;
      text: string;
      meta?: {
        date?: string;
      };
    }>;
    books: Array<{
      title: string;
      notes: string;
    }>;
  }>(),
  order: integer("order").default(0),
});

export const userActivity = pgTable("user_activity", {
  userId: integer("user_id").references(() => users.id).notNull(),
  activityType: text("activity_type").notNull(), // login, goal_creation, transcription, etc.
  timestamp: timestamp("timestamp").defaultNow(),
  details: json("details").$type<{
    goalId?: number;
    transcriptionId?: number;
    duration?: number;
    pageViewed?: string;
  }>(),
});

export const projectTracking = pgTable("project_tracking", {
  userId: integer("user_id").references(() => users.id).notNull(),
  goalId: integer("goal_id").references(() => goals.id).notNull(),
  totalTime: integer("total_time").default(0), // in seconds
  lastActivity: timestamp("last_activity").defaultNow(),
  sessionsCount: integer("sessions_count").default(0),
  dateGrouping: date("date_grouping").notNull(), // To group by day for charts
});

export const transcriptions = pgTable("transcriptions", {
  content: text("content").notNull(),
  correctedContent: text("corrected_content"),
  analysis: json("analysis"),
  createdAt: timestamp("created_at").defaultNow(),
  goalId: integer("goal_id").references(() => goals.id),
  userId: integer("user_id").references(() => users.id),
  duration: integer("duration").default(0), // in seconds
  goalMatches: integer("goal_matches").array(),
  media: json("media").$type<{
    images: Array<{
      url: string;
      thumbnail: string; // Base64 thumbnail for display
      title?: string;
    }>;
    documents: Array<{
      url: string;
      name: string;
      size: string;
      type: string;
      icon?: string; // Base64 icon for thumbnails
    }>;
  }>(),
});

export const quotes = pgTable("quotes", {
  text: text("text").notNull(),
  category: text("category"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const upsertUserSchema = createInsertSchema(users);

export const insertUserSchema = upsertUserSchema.pick({
  username: true,
  email: true,
  replitId: true,
  firstName: true,
  lastName: true,
  bio: true,
  profileImageUrl: true,
});

export const insertUserActivitySchema = createInsertSchema(userActivity).pick({
  userId: true,
  activityType: true,
  details: true,
});

export const insertProjectTrackingSchema = createInsertSchema(projectTracking).pick({
  userId: true,
  goalId: true,
  totalTime: true,
  sessionsCount: true,
  dateGrouping: true,
});

export const insertGoalSchema = createInsertSchema(goals).pick({
  title: true,
  description: true,
  parentId: true,
  userId: true,
  content: true,
  order: true,
});

export const insertTranscriptionSchema = createInsertSchema(transcriptions).pick({
  content: true,
  goalId: true,
  userId: true,
  duration: true,
  media: true,
});

export const insertQuoteSchema = createInsertSchema(quotes).pick({
  text: true,
  category: true,
});

// Subscription schema for updates
export const subscriptionSchema = z.object({
  subscriptionId: z.string(),
  subscriptionTier: z.enum(['free', 'trial', 'premium', 'paid']),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type SubscriptionUpdate = z.infer<typeof subscriptionSchema>;
export type UserActivity = typeof userActivity.$inferSelect;
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;
export type ProjectTracking = typeof projectTracking.$inferSelect;
export type InsertProjectTracking = z.infer<typeof insertProjectTrackingSchema>;
export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Transcription = typeof transcriptions.$inferSelect;
export type InsertTranscription = z.infer<typeof insertTranscriptionSchema>;
export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
