
import { Request, Response, NextFunction } from "express";
import { storage } from "../index";
import { User } from "@shared/schema";
import session from "express-session";

// Declare session properties
declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      session: session.Session & Partial<session.SessionData>;
    }
  }
}

// Middleware to require authentication
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user ID exists in session
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Get user from storage
    const userId = req.session.userId;
    const user = await storage.getUser(userId);
    
    if (!user) {
      // Clear invalid session
      if (req.session) {
        req.session.destroy((err) => {
          if (err) console.error("Session destruction error:", err);
        });
      }
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Middleware to require specific roles
export const requireRoles = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // requireAuth middleware should be used before this one
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Permission denied" });
    }
    
    next();
  };
};
