import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { setupVite } from "./vite";
import * as schema from "../shared/schema";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import ws from "ws";
import { createServer } from "http";
import { sql, eq, and, gte, lte, desc } from "drizzle-orm";
import { storage } from "./storage";
import helmet from "helmet";
import csurf from "csurf";
import { registerRoutes } from "./routes";
import session from "express-session";
import passport from "passport";

// Configure WebSocket for Neon database
if (!global.WebSocket) {
  global.WebSocket = ws;
}

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const db = drizzle(pool, { schema });

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: multerStorage });

export async function createApp() {
  const app = express();

  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://mindvault.replit.app', 'https://*.replit.app', 'https://*.replit.dev'] 
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    exposedHeaders: ['set-cookie']
  }));
  app.use(express.json());
  
  // Add security headers with helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://replit.com", "'unsafe-inline'"], 
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https://*.replit.com", "https://replit.com"],
        connectSrc: ["'self'", "https://replit.com", "wss://*.replit.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'", "https://*.replit.com"]
      }
    }
  }));

  // Set up trust proxy for secure cookies behind proxies
  app.set("trust proxy", 1);
  
  // Add session validation middleware
  // Unified session configuration
  app.use(
    session({
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        domain: process.env.NODE_ENV === "production" ? ".replit.app" : undefined
      }
    })
  );

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  
  // Add session validation middleware to refresh session on activity
  app.use((req, res, next) => {
    // Refresh session expiration on activity
    if (req.session && req.user) {
      req.session.touch();
      req.session.save();
    }
    next();
  });
  
  // CSRF protection for state-changing operations
  const csrfProtection = csurf({
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      httpOnly: true
    }
  });
  
  // Middleware to catch CSRF errors and provide better error messages
  app.use((err: any, req: any, res: any, next: any) => {
    if (err.code === 'EBADCSRFTOKEN') {
      return res.status(403).json({ 
        message: 'Invalid CSRF token',
        error: 'CSRF token validation failed'
      });
    }
    next(err);
  });

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "healthy" });
  });
  
  // Debug endpoint to check database status
  app.get("/api/debug/db", async (_req, res) => {
    try {
      const users = await db.query.users.findMany();
      const goals = await db.query.goals.findMany();
      const transcriptions = await db.query.transcriptions.findMany();
      const activities = await db.query.userActivity.findMany();
      const tracking = await db.query.projectTracking.findMany();
      
      res.json({
        usersCount: users.length,
        goalsCount: goals.length,
        transcriptionsCount: transcriptions.length,
        activitiesCount: activities.length,
        trackingCount: tracking.length,
        sample: {
          user: users.length > 0 ? { id: users[0].id, username: users[0].username } : null,
          goal: goals.length > 0 ? { id: goals[0].id, title: goals[0].title, userId: goals[0].userId } : null,
          transcription: transcriptions.length > 0 ? { id: transcriptions[0].id, userId: transcriptions[0].userId, content: transcriptions[0].content?.slice(0, 50) + '...' } : null
        }
      });
    } catch (error) {
      console.error("Debug endpoint error:", error);
      res.status(500).json({ error: "Failed to fetch debug data" });
    }
  });

  // API Routes
  app.get("/api/goals", async (req: any, res) => {
    try {
      const userId = req.user.id;
      const goals = await db.query.goals.findMany({
        where: (goals, { eq }) => eq(goals.userId, userId)
      });
      res.json(goals);
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ message: "Error fetching goals", error: error.message });
    }
  });

  app.post("/api/goals", async (req: any, res) => {
    const { title, description, parentId, order } = req.body;
    try {
      const userId = req.user.id;
      
      // Make sure the user exists before creating the goal
      try {
        const user = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.id, userId) 
        });
        
        if (!user) {
          // This handles the case where we migrated from memory storage to database
          console.log(`User ${userId} not found in DB. Creating user record from session data...`);
          await db.insert(schema.users).values({
            id: userId,
            username: req.user.username,
            email: req.user.email || `user${userId}@example.com`,
            createdAt: new Date(),
            updatedAt: new Date(),
            subscriptionTier: req.user.subscriptionTier || 'free',
            lastLogin: new Date(),
            trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          });
        }
      } catch (userCheckError) {
        console.error("Error checking/creating user:", userCheckError);
      }
      
      // Now create the goal
      const result = await db.insert(schema.goals).values({
        title,
        description,
        parentId,
        userId,
        active: true,
        order: order || 0,
        createdAt: new Date()
      }).returning();
      
      res.json(result[0]);
    } catch (error) {
      console.error("Error creating goal:", error);
      res.status(500).json({ message: "Error creating goal", error: error.message });
    }
  });

  app.put("/api/goals/:id", async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      const { title, description } = req.body;
      
      // Verify goal belongs to the current user
      const goal = await db.query.goals.findFirst({
        where: (goals, { and, eq }) => and(eq(goals.id, id), eq(goals.userId, userId))
      });
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      const result = await db
        .update(schema.goals)
        .set({ title, description })
        .where(sql`id = ${id}`)
        .returning();
      res.json(result[0]);
    } catch (error) {
      console.error("Error updating goal:", error);
      res.status(500).json({ message: "Error updating goal", error: error.message });
    }
  });

  app.delete("/api/goals/:id", async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Verify goal belongs to the current user
      const goal = await db.query.goals.findFirst({
        where: (goals, { and, eq }) => and(eq(goals.id, id), eq(goals.userId, userId))
      });
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }

      const deleteRelatedData = async (goalId: number) => {
        try {
          // Step 1: Find and delete project tracking entries
          const trackingEntries = await db.query.projectTracking.findMany({
            where: (tracking, { eq }) => eq(tracking.goalId, goalId)
          });
          
          if (trackingEntries.length > 0) {
            console.log(`Deleting ${trackingEntries.length} tracking entries for goal ${goalId}`);
            for (const entry of trackingEntries) {
              await db.delete(schema.projectTracking).where(sql`id = ${entry.id}`);
            }
          }

          // Step 2: Find and handle transcriptions with this goal
          const transcriptions = await db.query.transcriptions.findMany({
            where: (transcriptions, { eq }) => eq(transcriptions.goalId, goalId)
          });

          if (transcriptions.length > 0) {
            console.log(`Handling ${transcriptions.length} transcriptions for goal ${goalId}`);
            
            // Option 1: Remove the goalId reference but keep the transcriptions
            for (const transcription of transcriptions) {
              await db.update(schema.transcriptions)
                .set({ goalId: null })
                .where(sql`id = ${transcription.id}`);
            }

            // Option 2 (alternative): Delete the transcriptions
            // Uncomment if you want to delete transcriptions instead of just removing references
            /*
            for (const transcription of transcriptions) {
              await db.delete(schema.transcriptions).where(sql`id = ${transcription.id}`);
            }
            */
          }

          // Step 3: Handle any userActivity references
          const activities = await db.query.userActivity.findMany({
            where: (userActivity, { eq }) => {
              // Check if the activity details contain this goalId
              // Use SQL to parse the JSON details
              return sql`${userActivity.details}->>'goalId' = ${goalId.toString()}`;
            }
          });

          if (activities.length > 0) {
            console.log(`Handling ${activities.length} activity entries for goal ${goalId}`);
            // Remove goal references from activities
            for (const activity of activities) {
              // Set the goalId to undefined in the details JSON if it exists
              if (activity.details && typeof activity.details === 'object') {
                // Cast details to any to avoid type issues
                const details = activity.details as any;
                const updatedDetails = { ...details };
                
                // Set goalId to undefined instead of null to match the type
                if ('goalId' in updatedDetails) {
                  updatedDetails.goalId = undefined;
                }
                
                await db.update(schema.userActivity)
                  .set({ details: updatedDetails })
                  .where(sql`id = ${activity.id}`);
              }
            }
          }
        } catch (err) {
          console.error(`Error deleting related data for goal ${goalId}:`, err);
          // Continue with the process even if there's an error
        }
      };

      // First delete all sub-goals recursively
      const deleteSubGoals = async (parentId: number) => {
        const subGoals = await db.query.goals.findMany({
          where: (goals, { eq }) => eq(goals.parentId, parentId)
        });

        for (const subGoal of subGoals) {
          // Delete related data first (tracking, transcriptions, user activity)
          await deleteRelatedData(subGoal.id);
          
          await deleteSubGoals(subGoal.id); // Delete nested sub-goals next
          await db.delete(schema.goals).where(sql`id = ${subGoal.id}`);
        }
      };

      // Delete related data for the main goal
      await deleteRelatedData(id);
      
      // Delete all sub-goals
      await deleteSubGoals(id);
      
      // Delete the parent goal
      await db.delete(schema.goals).where(sql`id = ${id}`);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting goal:", error);
      res.status(500).json({ message: "Error deleting goal", error: error.message });
    }
  });

  app.get("/api/transcriptions", async (req: any, res) => {
    try {
      const userId = req.user.id;
      const transcriptions = await db.query.transcriptions.findMany({
        where: (transcriptions, { eq }) => eq(transcriptions.userId, userId),
        orderBy: (transcriptions, { desc }) => [desc(transcriptions.createdAt)]
      });
      res.json(transcriptions);
    } catch (error) {
      console.error("Error fetching transcriptions:", error);
      res.status(500).json({ message: "Error fetching transcriptions", error: error.message });
    }
  });

  app.post("/api/transcriptions", async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { content, goalId } = req.body;
      
      // Make sure the user exists before creating the transcription
      try {
        const user = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.id, userId)
        });
        
        if (!user) {
          // This handles the case where we migrated from memory storage to database
          console.log(`User ${userId} not found in DB. Creating user record from session data...`);
          await db.insert(schema.users).values({
            id: userId,
            username: req.user.username,
            email: req.user.email || `user${userId}@example.com`,
            createdAt: new Date(),
            updatedAt: new Date(),
            subscriptionTier: req.user.subscriptionTier || 'free',
            lastLogin: new Date(),
            trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          });
        }
      } catch (userCheckError) {
        console.error("Error checking/creating user:", userCheckError);
      }
      
      // Now create the transcription
      const result = await db.insert(schema.transcriptions).values({
        content,
        goalId,
        userId,
        createdAt: new Date(),
        duration: 0,
        goalMatches: null,
        correctedContent: null,
        analysis: null,
        media: null
      }).returning();
      
      // Also log this activity
      try {
        await db.insert(schema.userActivity).values({
          userId,
          activityType: 'transcription',
          timestamp: new Date(),
          details: {
            goalId,
            transcriptionId: result[0].id,
            duration: 0
          }
        });
      } catch (activityError) {
        console.error("Error logging activity:", activityError);
      }
      
      res.json(result[0]);
    } catch (error) {
      console.error("Error creating transcription:", error);
      res.status(500).json({ message: "Error creating transcription", error: error.message });
    }
  });

  app.delete("/api/transcriptions/:id", async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Verify transcription belongs to the current user
      const transcription = await db.query.transcriptions.findFirst({
        where: (transcriptions, { and, eq }) => and(eq(transcriptions.id, id), eq(transcriptions.userId, userId))
      });
      
      if (!transcription) {
        return res.status(404).json({ message: "Transcription not found" });
      }
      
      await db.delete(schema.transcriptions).where(sql`id = ${id}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting transcription:", error);
      res.status(500).json({ message: "Error deleting transcription", error: error.message });
    }
  });

  // Add user activity endpoints for tracking engagement
  app.get("/api/user-activity", async (req: any, res) => {
    try {
      const userId = req.user.id;
      const activities = await db.query.userActivity.findMany({
        where: (userActivity, { eq }) => eq(userActivity.userId, userId),
        orderBy: (userActivity, { desc }) => [desc(userActivity.timestamp)]
      });
      res.json(activities);
    } catch (error) {
      console.error("Error fetching user activities:", error);
      res.status(500).json({ message: "Error fetching user activities", error: error.message });
    }
  });

  app.post("/api/user-activity", async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { activityType, details } = req.body;
      const result = await db.insert(schema.userActivity).values({
        userId,
        activityType,
        details,
        timestamp: new Date()
      }).returning();
      res.json(result[0]);
    } catch (error) {
      console.error("Error logging user activity:", error);
      res.status(500).json({ message: "Error logging user activity", error: error.message });
    }
  });

  // Project tracking endpoints for analysis
  app.get("/api/project-tracking", async (req: any, res) => {
    try {
      const userId = req.user.id;
      let tracking;
      
      // Check if date range is specified
      if (req.query.startDate && req.query.endDate) {
        const startDate = new Date(req.query.startDate as string);
        const endDate = new Date(req.query.endDate as string);
        tracking = await db.query.projectTracking.findMany({
          where: (projectTracking, { and, eq, gte, lte }) => and(
            eq(projectTracking.userId, userId),
            gte(projectTracking.dateGrouping, startDate),
            lte(projectTracking.dateGrouping, endDate)
          )
        });
      } else {
        tracking = await db.query.projectTracking.findMany({
          where: (projectTracking, { eq }) => eq(projectTracking.userId, userId),
          orderBy: (projectTracking, { desc }) => [desc(projectTracking.lastActivity)]
        });
      }
      
      res.json(tracking);
    } catch (error) {
      console.error("Error fetching project tracking:", error);
      res.status(500).json({ message: "Error fetching project tracking", error: error.message });
    }
  });

  app.post("/api/project-tracking", async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { goalId, totalTime, sessionsCount, dateGrouping } = req.body;
      
      // Parse and validate goalId if it's a string
      const parsedGoalId = typeof goalId === 'string' ? parseInt(goalId, 10) : goalId;
      const validatedGoalId = !isNaN(parsedGoalId) ? parsedGoalId : null;
      
      if (!validatedGoalId || validatedGoalId <= 0) {
        console.error("Invalid goal ID received:", { goalId, parsed: parsedGoalId });
        return res.status(400).json({ 
          message: "Invalid goal ID", 
          error: `Goal ID must be a positive number, received: ${JSON.stringify(goalId)}` 
        });
      }
      
      // Verify the goal exists and belongs to this user
      const goalExists = await db.query.goals.findFirst({
        where: (goals, { and, eq }) => and(
          eq(goals.id, validatedGoalId),
          eq(goals.userId, userId)
        )
      });
      
      if (!goalExists) {
        return res.status(404).json({ 
          message: "Goal not found", 
          error: "The specified goal does not exist or does not belong to this user" 
        });
      }
      
      // Format today's date in YYYY-MM-DD format
      const today = new Date();
      const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      // Check if an entry already exists for this day and goal
      const existing = await db.query.projectTracking.findFirst({
        where: (projectTracking, { and, eq }) => and(
          eq(projectTracking.userId, userId),
          eq(projectTracking.goalId, validatedGoalId)
        )
      });
      
      if (existing) {
        console.log("Updating existing tracking record:", {
          id: existing.id,
          userId,
          goalId,
          currentTotal: existing.totalTime,
          newTime: totalTime,
          updatedTotal: (existing.totalTime || 0) + totalTime
        });
        
        // Update existing record
        const result = await db
          .update(schema.projectTracking)
          .set({
            totalTime: (existing.totalTime || 0) + totalTime,
            sessionsCount: (existing.sessionsCount || 0) + (sessionsCount || 1),
            lastActivity: new Date()
          })
          .where(eq(schema.projectTracking.id, existing.id))
          .returning();
        res.json(result[0]);
      } else {
        console.log("Creating new tracking record:", {
          userId,
          goalId: validatedGoalId,
          totalTime,
          dateGrouping: formattedDate
        });
        
        // Create new record with validated data
        const result = await db.insert(schema.projectTracking).values({
          userId,
          goalId: validatedGoalId,
          totalTime: totalTime || 0,
          sessionsCount: sessionsCount || 1,
          dateGrouping: formattedDate,
          lastActivity: new Date()
        }).returning();
        res.json(result[0]);
      }
    } catch (error) {
      console.error("Error tracking project activity:", error);
      res.status(500).json({ message: "Error tracking project activity", error: error.message });
    }
  });

  // File upload route
  app.post("/api/upload", upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `/files/${req.file.filename}`
      };

      res.json(fileData);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Error uploading file", error: error.message });
    }
  });

  // Serve files
  app.get("/files/:filename", (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(uploadDir, filename);
    res.sendFile(filepath);
  });

  // Get all files
  app.get("/api/files", (_req, res) => {
    fs.readdir(uploadDir, (err, files) => {
      if (err) {
        return res.status(500).json({ message: "Error reading files", error: err.message });
      }
      const fileList = files.map(filename => {
        const stats = fs.statSync(path.join(uploadDir, filename));
        return {
          filename,
          size: stats.size,
          url: `/files/${filename}`
        };
      });
      res.json(fileList);
    });
  });
  
  // Quote Routes
  app.get("/api/quotes", async (_req, res) => {
    try {
      const quotes = await db.query.quotes.findMany();
      res.json(quotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ message: "Error fetching quotes", error: error.message });
    }
  });

  app.get("/api/quotes/daily", async (_req, res) => {
    try {
      // Get a random quote based on the current date seed for consistency within the same day
      const today = new Date();
      const quotes = await db.query.quotes.findMany();
      
      if (quotes.length === 0) {
        // Add a default quote if none exists
        const defaultQuote = await db.insert(schema.quotes).values({
          text: "The only way to do great work is to love what you do.",
          category: "inspiration",
          createdAt: new Date()
        }).returning();
        return res.json(defaultQuote[0]);
      }
      
      // Get a consistent quote based on the day
      const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
      const quoteIndex = dateSeed % quotes.length;
      res.json(quotes[quoteIndex]);
    } catch (error) {
      console.error("Error fetching daily quote:", error);
      res.status(500).json({ message: "Error fetching daily quote", error: error.message });
    }
  });

  app.post("/api/quotes", async (req: any, res) => {
    const { text, category } = req.body;
    try {
      const result = await db.insert(schema.quotes).values({
        text,
        category,
        createdAt: new Date()
      }).returning();
      res.json(result[0]);
    } catch (error) {
      console.error("Error creating quote:", error);
      res.status(500).json({ message: "Error creating quote", error: error.message });
    }
  });

  // Error handling middleware
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  if (process.env.NODE_ENV === "production") {
    console.log("Running in production mode - serving static files");
    // In production, serve static files
    const distPath = path.resolve(process.cwd(), "dist", "public");
    
    if (fs.existsSync(distPath)) {
      console.log(`Serving static files from: ${distPath}`);
      app.use(express.static(distPath));
      
      // Handle SPA routing - serve index.html for any non-API routes
      app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api")) {
          return next();
        }
        res.sendFile(path.resolve(distPath, "index.html"));
      });
    } else {
      console.error(`Static file directory not found: ${distPath}`);
    }
  } else {
    // In development mode, use Vite
    console.log("Running in development mode - using Vite");
    const httpServer = createServer(app);
    await setupVite(app, httpServer);
  }

  return app;
}

if (process.env.NODE_ENV !== "test") {
  createApp().then(async (app) => {
    try {
      // Create drizzle directory if it doesn't exist
      const drizzleDir = path.join(process.cwd(), "drizzle", "meta");
      if (!fs.existsSync(drizzleDir)) {
        fs.mkdirSync(drizzleDir, { recursive: true });
      }

      // Create empty migration journal if it doesn't exist
      const journalPath = path.join(drizzleDir, "_journal.json");
      if (!fs.existsSync(journalPath)) {
        fs.writeFileSync(journalPath, JSON.stringify({ entries: [] }));
      }

      // Attempt migration but don't fail if it errors
      try {
        await migrate(db, { migrationsFolder: "./drizzle" });
      } catch (err) {
        console.warn("Migration failed, but continuing startup:", err);
      }

      const port = process.env.PORT || 5000;
      const host = "0.0.0.0";
      
      // This also creates and returns the HTTP server
      const httpServer = await registerRoutes(app);
      
      httpServer.listen(port, host, () => {
        console.log(`Server is running at http://${host}:${port}`);
      });
    } catch (error) {
      console.error("Failed to start server:", error);
      process.exit(1);
    }
  });
}