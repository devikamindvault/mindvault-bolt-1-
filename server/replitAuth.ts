import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

// Session is now handled centrally in index.ts

function updateUserSession(
  user: any,
) {
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  // Check if user exists by replitId
  const existingUser = await storage.getUserByReplitId(claims["sub"]);
  
  if (existingUser) {
    // Update existing user
    await storage.updateUser(existingUser.id, {
      username: claims["username"],
      email: claims["email"],
      firstName: claims["first_name"],
      lastName: claims["last_name"],
      bio: claims["bio"],
      profileImageUrl: claims["profile_image_url"],
      lastLogin: new Date(),
    });
    return existingUser;
  } else {
    // Create new user
    const newUser = await storage.createUser({
      username: claims["username"],
      email: claims["email"],
      replitId: claims["sub"],
      firstName: claims["first_name"],
      lastName: claims["last_name"],
      bio: claims["bio"],
      profileImageUrl: claims["profile_image_url"],
    });
    return newUser;
  }
}

  // Passport is now initialized in index.ts

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
  ) => {
    const user = {};
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
  
  app.get("/api/user", (req, res) => {
      // Return user info but filter out sensitive data
      const user = req.user as any;
      const safeUser = {
        id: user.claims?.sub,
        username: user.claims?.username,
        email: user.claims?.email,
        firstName: user.claims?.first_name,
        lastName: user.claims?.last_name,
        profileImageUrl: user.claims?.profile_image_url,
      };
      res.json(safeUser);
    } else {
    }
  });
}

  const user = req.user as any;

    return res.status(401).json({ 
    });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

    return res.redirect("/api/login");
  }

  try {
    const config = await getOidcConfig();
    return next();
  } catch (error) {
    return res.redirect("/api/login");
  }
};