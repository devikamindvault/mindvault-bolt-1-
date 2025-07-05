import type { 
  Goal, 
  InsertGoal, 
  Transcription, 
  InsertTranscription, 
  User, 
  InsertUser,
  UserActivity,
  InsertUserActivity,
  ProjectTracking,
  InsertProjectTracking,
  Quote,
  InsertQuote,
  UpsertUser
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { db } from "./db";
import { and, eq, gte, lte, desc, sql } from "drizzle-orm";
import * as schema from "@shared/schema";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PgStore = connectPgSimple(session);

export interface IStorage {
  // Goal methods
  getAllGoals(): Promise<Goal[]>;
  getUserGoals(userId: string): Promise<Goal[]>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goal: InsertGoal): Promise<Goal>;
  deleteGoal(id: number): Promise<void>;
  
  // Transcription methods
  getAllTranscriptions(): Promise<Transcription[]>;
  getUserTranscriptions(userId: string): Promise<Transcription[]>;
  createTranscription(transcription: InsertTranscription): Promise<Transcription>;
  deleteTranscription(id: number): Promise<void>;

  // User management methods
  getUser(id: string | number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserByReplitId(replitId: string): Promise<User | null>;
  createUser(user: Partial<InsertUser>): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  upsertUser(userData: Partial<User>): Promise<User>;
  
  
  // User activity tracking methods
  logUserActivity(activity: InsertUserActivity): Promise<UserActivity>;
  getUserActivities(userId: number): Promise<UserActivity[]>;
  
  // Project tracking methods
  trackProjectActivity(tracking: InsertProjectTracking): Promise<ProjectTracking>;
  getProjectTracking(userId: number): Promise<ProjectTracking[]>;
  getProjectTrackingByDate(userId: number, startDate: Date, endDate: Date): Promise<ProjectTracking[]>;

  // Quote methods
  getAllQuotes(): Promise<Quote[]>;
  getQuoteById(id: number): Promise<Quote>;
  getDailyQuote(): Promise<Quote>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  sessionStore: session.Store;
}

// Database implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Initialize PostgreSQL session store
    this.sessionStore = new PgStore({
      pool,
      tableName: 'sessions',
      createTableIfMissing: true
    });
    
    // Add some initial quotes if none exist
    this.initializeQuotes();
  }
  
  // Initialize with some inspirational quotes if none exist
  private async initializeQuotes() {
    try {
      const quotes = await db.query.quotes.findMany({
        limit: 1
      });
      
      if (quotes.length === 0) {
        const initialQuotes = [
        ];
        
        for (const quote of initialQuotes) {
          await this.createQuote(quote);
        }
      }
    } catch (error) {
      console.error("Error initializing quotes:", error);
    }
  }

  // User methods
  async getUser(id: string | number): Promise<User | undefined> {
    if (typeof id === 'string') {
      // Try to find by replitId first
      const userByReplitId = await this.getUserByReplitId(id);
      if (userByReplitId) return userByReplitId;
      
      // If not found and the id is a number (as string), try to find by numeric id
      if (!isNaN(Number(id))) {
        const user = await db.query.users.findFirst({
          where: eq(schema.users.id, Number(id))
        });
        return user || undefined;
      }
      
      return undefined;
    } else {
      // If id is a number, find directly by id
      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, id)
      });
      return user || undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.username, username)
    });
    
    return user || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, email)
    });
    
    return user || null;
  }
  
  async getUserByReplitId(replitId: string): Promise<User | null> {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.replitId, replitId)
    });
    
    return user || null;
  }

  async createUser(insertUser: Partial<InsertUser> & { trialEndsAt?: Date }): Promise<User> {
    const [user] = await db.insert(schema.users).values({
      username: insertUser.username || `user_${Date.now()}`,
      email: insertUser.email || `${Date.now()}@example.com`,
      trialEndsAt: insertUser.trialEndsAt || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
      subscriptionTier: insertUser.subscriptionTier || 'free',
      replitId: insertUser.replitId, // Store Replit ID if provided
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date()
    }).returning();
    
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [updatedUser] = await db.update(schema.users)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(schema.users.id, id))
      .returning();
      
    return updatedUser;
  }
  
  async upsertUser(userData: Partial<User>): Promise<User> {
    // If replitId is provided, try to find an existing user
    if (userData.replitId) {
      const existingUser = await this.getUserByReplitId(userData.replitId);
      
      if (existingUser) {
        // If user exists, update their information
        const [updatedUser] = await db.update(schema.users)
          .set({
            ...userData,
            updatedAt: new Date(),
            lastLogin: new Date()
          })
          .where(eq(schema.users.id, existingUser.id))
          .returning();
          
        return updatedUser;
      }
    }
    
    // If email is provided, try to find an existing user by email
    if (userData.email) {
      const existingUserByEmail = await this.getUserByEmail(userData.email);
      
      if (existingUserByEmail) {
        // Update the existing user
        const [updatedUser] = await db.update(schema.users)
          .set({
            ...userData,
            updatedAt: new Date(),
            lastLogin: new Date()
          })
          .where(eq(schema.users.id, existingUserByEmail.id))
          .returning();
          
        return updatedUser;
      }
    }
    
    // If username is provided and user doesn't exist by replitId or email, check if it exists by username
    if (userData.username) {
      const existingUserByUsername = await this.getUserByUsername(userData.username);
      
      if (existingUserByUsername) {
        // Update the existing user
        const [updatedUser] = await db.update(schema.users)
          .set({
            ...userData,
            updatedAt: new Date(),
            lastLogin: new Date()
          })
          .where(eq(schema.users.id, existingUserByUsername.id))
          .returning();
          
        return updatedUser;
      }
    }
    
    // If no user exists, create a new one
    const [newUser] = await db.insert(schema.users)
      .values({
        ...userData,
        username: userData.username || `user_${Date.now()}`, // Default username
        email: userData.email || '', // Default empty email
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
        subscriptionTier: userData.subscriptionTier || 'free'
      })
      .returning();
      
    return newUser;
  }

  // Goal methods
  async getAllGoals(): Promise<Goal[]> {
    return await db.query.goals.findMany();
  }
  
  async getUserGoals(userId: number): Promise<Goal[]> {
    return await db.query.goals.findMany({
      where: eq(schema.goals.userId, userId)
    });
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const [goal] = await db.insert(schema.goals).values({
      title: insertGoal.title,
      description: insertGoal.description || null,
      active: true,
      parentId: insertGoal.parentId || null,
      userId: insertGoal.userId,
      content: insertGoal.content || null,
      order: insertGoal.order || 0,
      createdAt: new Date()
    }).returning();
    
    // Log user activity for goal creation
    try {
      await db.insert(schema.userActivity).values({
        userId: insertGoal.userId || 1,
        activityType: 'goal_created',
        timestamp: new Date(),
        details: {
          goalId: goal.id
        }
      });
      
      // Also add an entry to project tracking when a goal is created
      const today = new Date();
      await db.insert(schema.projectTracking).values({
        userId: insertGoal.userId || 1,
        goalId: goal.id,
        totalTime: 5, // Initial time in minutes
        sessionsCount: 1,
        dateGrouping: today,
        lastActivity: today
      });
    } catch (error) {
      console.error("Error logging goal creation activity:", error);
      // Don't throw the error as we still want to return the goal
    }
    
    return goal;
  }

  async updateGoal(id: number, updateGoal: InsertGoal): Promise<Goal> {
    const [updatedGoal] = await db.update(schema.goals)
      .set({
        title: updateGoal.title,
        description: updateGoal.description || null,
        parentId: updateGoal.parentId !== undefined ? updateGoal.parentId : undefined,
        content: updateGoal.content || undefined,
        order: updateGoal.order !== undefined ? updateGoal.order : undefined
      })
      .where(eq(schema.goals.id, id))
      .returning();
      
    // Log user activity for goal update
    try {
      await db.insert(schema.userActivity).values({
        userId: updateGoal.userId || 1,
        activityType: 'goal_updated',
        timestamp: new Date(),
        details: {
          goalId: id
        }
      });
      
      // Update project tracking when a goal is updated
      const today = new Date();
      
      // Check if there's an existing record for today
      const existing = await db.query.projectTracking.findFirst({
        where: and(
          eq(schema.projectTracking.userId, updateGoal.userId || 1),
          eq(schema.projectTracking.goalId, id),
          eq(schema.projectTracking.dateGrouping, today)
        )
      });
      
      if (existing) {
        // Update existing tracking record
        await db.update(schema.projectTracking)
          .set({
            totalTime: (existing.totalTime || 0) + 2, // Add 2 minutes for the update
            sessionsCount: (existing.sessionsCount || 0) + 1,
            lastActivity: today
          })
          .where(eq(schema.projectTracking.id, existing.id));
      } else {
        // Create new tracking record
        await db.insert(schema.projectTracking).values({
          userId: updateGoal.userId || 1,
          goalId: id,
          totalTime: 2, // 2 minutes for an update
          sessionsCount: 1,
          dateGrouping: today,
          lastActivity: today
        });
      }
    } catch (error) {
      console.error("Error logging goal update activity:", error);
      // Don't throw the error as we still want to return the goal
    }
      
    return updatedGoal;
  }

  async deleteGoal(id: number): Promise<void> {
    await db.delete(schema.goals)
      .where(eq(schema.goals.id, id));
  }

  // Transcription methods
  async getAllTranscriptions(): Promise<Transcription[]> {
    return await db.query.transcriptions.findMany({
      orderBy: [desc(schema.transcriptions.createdAt)]
    });
  }
  
  async getUserTranscriptions(userId: number): Promise<Transcription[]> {
    return await db.query.transcriptions.findMany({
      where: eq(schema.transcriptions.userId, userId),
      orderBy: [desc(schema.transcriptions.createdAt)]
    });
  }

  async createTranscription(insertTranscription: InsertTranscription): Promise<Transcription> {
    const [transcription] = await db.insert(schema.transcriptions).values({
      content: insertTranscription.content,
      goalId: insertTranscription.goalId || null,
      userId: insertTranscription.userId,
      duration: insertTranscription.duration || 0,
      media: insertTranscription.media || null,
      createdAt: new Date()
    }).returning();
    
    // Log activity for transcription creation
    try {
      await db.insert(schema.userActivity).values({
        userId: insertTranscription.userId,
        activityType: 'transcription',
        timestamp: new Date(),
        details: {
          transcriptionId: transcription.id,
          goalId: insertTranscription.goalId || undefined,
          duration: insertTranscription.duration || 0
        }
      });
      
      // If the transcription is associated with a goal, also update project tracking
      if (insertTranscription.goalId) {
        const today = new Date();
        const duration = insertTranscription.duration || 5; // Default to 5 minutes if not specified
        
        // Check if there's an existing record for today
        const existing = await db.query.projectTracking.findFirst({
          where: and(
            eq(schema.projectTracking.userId, insertTranscription.userId),
            eq(schema.projectTracking.goalId, insertTranscription.goalId),
            eq(schema.projectTracking.dateGrouping, today)
          )
        });
        
        if (existing) {
          // Update existing tracking record
          await db.update(schema.projectTracking)
            .set({
              totalTime: (existing.totalTime || 0) + duration,
              sessionsCount: (existing.sessionsCount || 0) + 1,
              lastActivity: today
            })
            .where(eq(schema.projectTracking.id, existing.id));
        } else {
          // Create new tracking record
          await db.insert(schema.projectTracking).values({
            userId: insertTranscription.userId,
            goalId: insertTranscription.goalId,
            totalTime: duration,
            sessionsCount: 1,
            dateGrouping: today,
            lastActivity: today
          });
        }
      }
    } catch (error) {
      console.error("Error logging transcription creation activity:", error);
      // Don't throw the error as we still want to return the transcription
    }
    
    return transcription;
  }

  async deleteTranscription(id: number): Promise<void> {
    await db.delete(schema.transcriptions)
      .where(eq(schema.transcriptions.id, id));
  }
  
  // User activity methods
  async logUserActivity(activity: InsertUserActivity): Promise<UserActivity> {
    const [userActivity] = await db.insert(schema.userActivity).values({
      userId: activity.userId,
      activityType: activity.activityType,
      details: activity.details || null,
      timestamp: new Date()
    }).returning();
    
    return userActivity;
  }
  
  async getUserActivities(userId: number): Promise<UserActivity[]> {
    return await db.query.userActivity.findMany({
      where: eq(schema.userActivity.userId, userId),
      orderBy: [desc(schema.userActivity.timestamp)]
    });
  }
  
  // Project tracking methods
  async trackProjectActivity(tracking: InsertProjectTracking): Promise<ProjectTracking> {
    // Check if there's an existing record for this user, goal, and date
    const existing = await db.query.projectTracking.findFirst({
      where: and(
        eq(schema.projectTracking.userId, tracking.userId),
        eq(schema.projectTracking.goalId, tracking.goalId),
        eq(schema.projectTracking.dateGrouping, tracking.dateGrouping)
      )
    });
    
    if (existing) {
      // Update existing record
      const [updated] = await db.update(schema.projectTracking)
        .set({
          totalTime: (existing.totalTime || 0) + (tracking.totalTime || 0),
          sessionsCount: (existing.sessionsCount || 0) + (tracking.sessionsCount || 1),
          lastActivity: new Date()
        })
        .where(eq(schema.projectTracking.id, existing.id))
        .returning();
        
      return updated;
    } else {
      // Create new record
      const [newTracking] = await db.insert(schema.projectTracking).values({
        userId: tracking.userId,
        goalId: tracking.goalId,
        totalTime: tracking.totalTime || 0,
        sessionsCount: tracking.sessionsCount || 1,
        dateGrouping: tracking.dateGrouping,
        lastActivity: new Date()
      }).returning();
      
      return newTracking;
    }
  }
  
  async getProjectTracking(userId: number): Promise<ProjectTracking[]> {
    return await db.query.projectTracking.findMany({
      where: eq(schema.projectTracking.userId, userId),
      orderBy: [desc(schema.projectTracking.lastActivity)]
    });
  }
  
  async getProjectTrackingByDate(userId: number, startDate: Date, endDate: Date): Promise<ProjectTracking[]> {
    return await db.query.projectTracking.findMany({
      where: and(
        eq(schema.projectTracking.userId, userId),
        gte(schema.projectTracking.dateGrouping, startDate),
        lte(schema.projectTracking.dateGrouping, endDate)
      ),
      orderBy: [schema.projectTracking.dateGrouping]
    });
  }
  
  // Quote methods
  async getAllQuotes(): Promise<Quote[]> {
    return await db.query.quotes.findMany();
  }
  
  async getQuoteById(id: number): Promise<Quote> {
    const quote = await db.query.quotes.findFirst({
      where: eq(schema.quotes.id, id)
    });
    
    if (!quote) {
      throw new Error("Quote not found");
    }
    
    return quote;
  }
  
  async getDailyQuote(): Promise<Quote> {
    // Get a random quote based on the current date seed for consistency within the same day
    const today = new Date();
    const quotes = await db.query.quotes.findMany();
    
    if (quotes.length === 0) {
      // Add a default quote if none exists
      const [defaultQuote] = await db.insert(schema.quotes).values({
        text: "The only way to do great work is to love what you do.",
        category: "inspiration",
        createdAt: new Date()
      }).returning();
      
      return defaultQuote;
    }
    
    // Get a consistent quote based on the day
    const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const quoteIndex = dateSeed % quotes.length;
    return quotes[quoteIndex];
  }
  
  async createQuote(insertQuote: InsertQuote): Promise<Quote> {
    const [quote] = await db.insert(schema.quotes).values({
      text: insertQuote.text,
      category: insertQuote.category || null,
      createdAt: new Date()
    }).returning();
    
    return quote;
  }
}

// Use the database storage implementation
export const storage = new DatabaseStorage();