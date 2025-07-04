import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
// Import SendGrid email service
import bcrypt from 'bcryptjs';
import { 
  insertGoalSchema, 
  insertTranscriptionSchema, 
  insertUserActivitySchema,
  insertProjectTrackingSchema,
  insertQuoteSchema,
  subscriptionSchema,
  insertUserSchema
} from "@shared/schema";
import { ZodError } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "./db";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storageMulter = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storageMulter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // We'll use the same Express app for our routes
  
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({
        ...user,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
    try {
      
      // Validate input
        return res.status(400).json({ 
          success: false,
        });
      }
      
      // Check if user with email already exists
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ 
          success: false, 
          message: 'An account with this email already exists' 
        });
      }
      
      // Check if user with username already exists
      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username already taken' 
        });
      }
      
      const saltRounds = 10;
      
      // Create user
      const user = await storage.createUser({
        username,
        email,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date()
      });
      
      // Log the registration activity
      await storage.logUserActivity({
        userId: user.id,
        activityType: 'account_created',
        timestamp: new Date()
      });
      
      res.status(201).json({ 
        success: true,
        message: 'User registered successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error during registration'
      });
    }
  });
  
    try {
      
      // Validate input
        return res.status(400).json({ 
          success: false, 
        });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ 
          success: false, 
        });
      }
      
        return res.status(401).json({ 
          success: false, 
        });
      }
      
      // Update last login time
      await storage.updateUser(user.id, {
        lastLogin: new Date(),
        updatedAt: new Date()
      });
      
      // Log the login activity
      await storage.logUserActivity({
        userId: user.id,
        activityType: 'login',
        timestamp: new Date()
      });
      
      // Set session data
      (req as any).login(user, (err: any) => {
        if (err) {
          console.error('Session login error:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to create session' 
          });
        }
        
        // Return success with user data
        res.status(200).json({
          success: true,
          message: 'Login successful',
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
          }
        });
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error during login' 
      });
    }
  });
  
  // Server status endpoint for diagnostics - Enhanced version
  app.get("/api/status", (req, res) => {
    try {
      const adminSdkInitialized = getApps().length > 0;
      
      // Get environment variable status
      const envStatus = {
        client: {
        },
        server: {
        }
      };
      
      // Calculate an overall status
      const isFullyConfigured = 
        Object.values(envStatus.client).every(status => status === 'configured') &&
        Object.values(envStatus.server).every(status => status === 'configured');
      
      res.json({
        status: 'running',
        timestamp: new Date().toISOString(),
        environment: envStatus,
        isFullyConfigured: isFullyConfigured,
        server: {
          version: process.version,
          platform: process.platform,
          memory: process.memoryUsage().rss / (1024 * 1024) + ' MB'
        }
      });
    } catch (error) {
      console.error("Error in status endpoint:", error);
      res.status(500).json({
        status: 'error',
        message: 'Server status check failed',
        error: error.message
      });
    }
  });
  
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          success: false,
          message: 'Email is required' 
        });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: 'No account found with this email address' 
        });
      }
      
      
        email,
        user.username
      );
      
      if (!emailSent) {
        return res.status(500).json({
          success: false,
        });
      }
      
      res.status(200).json({
        success: true,
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
      });
    }
  });
  
    try {
      
        return res.status(400).json({
          success: false,
        });
      }
      
      
        return res.status(404).json({
          success: false,
        });
      }
      
        return res.status(400).json({
          success: false,
        });
      }
      
        return res.status(400).json({
          success: false,
        });
      }
      
      const bcrypt = require('bcryptjs');
      const saltRounds = 10;
      
        updatedAt: new Date()
      });
      
      
      res.status(200).json({
        success: true,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
      });
    }
  });
  // Goals Routes
    try {
      // Get user ID directly from the session
      const userId = (req.user as any)?.id;
      
      if (userId) {
        const goals = await storage.getUserGoals(userId);
        console.log(`Fetched ${goals.length} goals for user ID ${userId}`);
        return res.json(goals);
      }
      
      // Default behavior
      const goals = await storage.getAllGoals();
      console.log(`Fetched all ${goals.length} goals`);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  app.post("/api/goals", async (req, res) => {
    try {
      const data = insertGoalSchema.parse(req.body);
      const goal = await storage.createGoal(data);
      res.json(goal);
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({ message: err.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.patch("/api/goals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertGoalSchema.parse(req.body);
      const goal = await storage.updateGoal(id, data);
      res.json(goal);
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({ message: err.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/goals/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteGoal(id);
    res.status(204).end();
  });

  // Transcriptions Routes
    try {
      // Get user ID directly from the session
      const userId = (req.user as any)?.id;
      
      if (!userId) {
      }
      
      let transcriptions = await storage.getUserTranscriptions(userId);
      
      // If no user-specific transcriptions found, get a sample set for demonstration
      if (transcriptions.length === 0) {
        console.log("No transcriptions found for user, fetching all transcriptions for demo");
        transcriptions = await storage.getAllTranscriptions();
      }
      
      console.log(`Fetched ${transcriptions.length} transcriptions:`, 
                  transcriptions.map(t => ({ id: t.id, content: t.content?.substring(0, 20) + '...' })));
      
      res.json(transcriptions);
    } catch (error) {
      console.error("Error fetching transcriptions:", error);
      res.status(500).json({ 
        message: "Failed to fetch transcriptions",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

    try {
      // Get user ID directly from the session
      const userId = (req.user as any)?.id;
      
      if (!userId) {
      }
      
      let data = insertTranscriptionSchema.parse({
        ...req.body,
        userId
      });
      
      console.log("Creating transcription with data:", data);
      const transcription = await storage.createTranscription(data);
      console.log("Created transcription:", transcription);
      
      res.json(transcription);
    } catch (err) {
      console.error("Error creating transcription:", err);
      if (err instanceof ZodError) {
        res.status(400).json({ message: err.errors });
      } else {
        res.status(500).json({ 
          message: "Internal server error", 
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }
  });

  // Delete transcription route
  app.delete("/api/transcriptions/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteTranscription(id);
    res.status(204).end();
  });

  // User Activities Route
    try {
      const userId = (req.user as any)?.id;
      
      if (!userId) {
      }
      
      console.log("Fetching user activities for userId:", userId);
      const activities = await storage.getUserActivities(userId);
      console.log(`Found ${activities.length} activities for user ${userId}`);
      
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // This endpoint is a duplicate and has been updated with the one below

  // Analysis Route
  app.get("/api/analyze", async (req, res) => {
    const text = req.query.text as string;
    if (!text) {
      return res.status(400).json({ message: "Text parameter is required" });
    }

    // Mock analysis response for now
    // In a real implementation, this would call an AI service
    res.json({
      correctedText: text,
      sentiment: "positive", 
      categories: ["general"],
    });
  });

  // File upload route
  app.post("/api/upload", upload.single('file'), (req, res) => {
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
      res.status(500).json({ message: "Error uploading file" });
    }
  });

  // Serve files
  app.get("/files/:filename", (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(uploadDir, filename);
    res.sendFile(filepath);
  });

  // Get all files
  app.get("/api/files", (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
      if (err) {
        return res.status(500).json({ message: "Error reading files" });
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

  // This route was duplicated - removed

    try {
      const userId = (req.user as any)?.id;
      
      if (!userId) {
      }
      
      const data = insertUserActivitySchema.parse({
        ...req.body,
        userId: userId
      });
      
      const activity = await storage.logUserActivity(data);
      res.json(activity);
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({ message: err.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Project Tracking Routes
    try {
      const userId = (req.user as any)?.id;
      
      if (!userId) {
      }
      
      console.log("Fetching project tracking for userId:", userId);
      
      // Check if date range is specified
      if (req.query.startDate && req.query.endDate) {
        const startDate = new Date(req.query.startDate as string);
        const endDate = new Date(req.query.endDate as string);
        const tracking = await storage.getProjectTrackingByDate(userId, startDate, endDate);
        console.log(`Found ${tracking.length} tracking records for date range:`, {startDate, endDate});
        return res.json(tracking);
      }
      
      // Otherwise return all tracking data for the user
      const tracking = await storage.getProjectTracking(userId);
      console.log(`Found ${tracking.length} total tracking records for user ${userId}`);
      res.json(tracking);
    } catch (err) {
      console.error("Error fetching project tracking:", err);
      res.status(500).json({ message: "Error fetching project tracking data" });
    }
  });

    try {
      const userId = (req.user as any)?.id;
      
      if (!userId) {
      }
      
      console.log("Creating project tracking for userId:", userId, "with data:", req.body);
      
      // Ensure the userId is set
      const data = insertProjectTrackingSchema.parse({
        ...req.body,
        userId: userId
      });
      
      const tracking = await storage.trackProjectActivity(data);
      console.log("Project tracking created:", tracking);
      res.json(tracking);
    } catch (err) {
      if (err instanceof ZodError) {
        console.error("Validation error:", err.errors);
        res.status(400).json({ message: err.errors });
      } else {
        console.error("Error tracking project activity:", err);
        res.status(500).json({ 
          message: "Internal server error",
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }
  });

  // Quote Routes
  app.get("/api/quotes", async (_req, res) => {
    try {
      const quotes = await storage.getAllQuotes();
      res.json(quotes);
    } catch (err) {
      res.status(500).json({ message: "Error fetching quotes" });
    }
  });

  app.get("/api/quotes/daily", async (_req, res) => {
    try {
      const quote = await storage.getDailyQuote();
      res.json(quote);
    } catch (err) {
      res.status(500).json({ message: "Error fetching daily quote" });
    }
  });

  app.get("/api/quotes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quote = await storage.getQuoteById(id);
      res.json(quote);
    } catch (err) {
      res.status(404).json({ message: "Quote not found" });
    }
  });

  app.post("/api/quotes", async (req, res) => {
    try {
      const data = insertQuoteSchema.parse(req.body);
      const quote = await storage.createQuote(data);
      res.json(quote);
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({ message: err.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Subscription management route
    try {
      // Get user ID directly from the session
      const userId = (req.user as any)?.id;
      
      if (!userId) {
      }
      
      const data = subscriptionSchema.parse(req.body);
      
      console.log(`Updating subscription for user ${userId}:`, data);
      
      // Update user subscription details
      const updatedUser = await storage.updateUser(userId, {
        subscriptionTier: data.subscriptionTier,
        subscriptionId: data.subscriptionId
      });
      
      console.log(`User ${userId} subscription updated to: ${data.subscriptionTier}`);
      
      // Remove sensitive data before sending response
      
      res.json(userResponse);
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({ message: err.errors });
      } else {
        console.error("Subscription update error:", err);
        res.status(500).json({ message: "Error updating subscription", error: String(err) });
      }
    }
  });

  // PayPal Webhook Handler
  app.post("/api/webhooks/paypal", async (req, res) => {
    try {
      const event = req.body;
      
      // The custom_id should be the numeric user ID now
      const userId = parseInt(event.resource.custom_id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID in webhook payload' });
      }
      
      switch (event.event_type) {
        case 'BILLING.SUBSCRIPTION.CANCELLED':
          await storage.updateUser(userId, {
            subscriptionTier: 'free',
            subscriptionId: null
          });
          break;
          
        case 'BILLING.SUBSCRIPTION.SUSPENDED':
          await storage.updateUser(userId, {
            subscriptionTier: 'free',
            subscriptionId: null
          });
          break;
          
        case 'PAYMENT.SALE.COMPLETED':
          // Verify the payment and extend subscription
          await storage.updateUser(userId, {
            subscriptionTier: 'premium'
          });
          break;
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  });

  // Create and return the HTTP server
  return createServer(app);
}
