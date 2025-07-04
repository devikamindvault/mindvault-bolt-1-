import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";
import { randomUUID } from "crypto";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);

// Create PostgreSQL session store
const PostgresSessionStore = connectPg(session);

// Export sessionStore for use in index.ts
export const sessionStore = new PostgresSessionStore({
  pool,
  tableName: 'sessions',
  createTableIfMissing: true
});

  const salt = randomBytes(16).toString("hex");
  return `${buf.toString("hex")}.${salt}`;
}

  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

    return next();
  }
};

  // Session is now set up in index.ts with the shared sessionStore

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy
  passport.use(
      try {
        // Find user by username
        const user = await storage.getUserByUsername(username);
        
        }
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, {
      id: user.id,
    });
  });

  // Deserialize user from session
  passport.deserializeUser(async (payload: any, done) => {
    try {
      const user = await storage.getUser(payload.id);
      if (!user) return done(null, false);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Registration endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }


      const user = await storage.createUser({
        ...req.body,
      });

      // Login the newly registered user
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({ user: userInfo });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Error creating account" });
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Update last login timestamp
        storage.updateUser(user.id, { lastLogin: new Date() })
          .catch(err => console.error("Failed to update last login:", err));
        
        res.json({ user: userInfo });
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error during logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    }
    
  });

    try {
      const { email } = req.body;
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      // If no user found with this email, still return success to prevent email enumeration
      if (!user) {
      }
      
      
      try {
          email,
          user.username
        );
        
        if (emailSent) {
        } else {
        }
      } catch (emailError) {
        // Don't expose error details to the client
      }
      
      // Return success regardless of whether email was sent to prevent email enumeration
    } catch (error) {
    }
  });

    try {
      
      
      }
      
      
      
      
    } catch (error) {
    }
  });
}