
import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import { requireAuth, requireRoles } from "./middleware/auth";
import { storage } from "./index";

export function registerRoutes(app: Express): Promise<Server> {
  // Authentication Routes
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update user status
      await storage.updateUserStatus(user.id, true, new Date());

      // Store user ID in session
      req.session.userId = user.id;

      // Return user data (without password)
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/logout", requireAuth, async (req, res) => {
    try {
      if (req.user) {
        await storage.updateUserStatus(req.user.id, false, new Date());
      }

      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
          return res.status(500).json({ message: "Could not log out" });
        }
        res.json({ message: "Logged out successfully" });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/me", requireAuth, async (req, res) => {
    try {
      const { password: _, ...userWithoutPassword } = req.user!;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User Management Routes
  app.get("/api/users", requireAuth, requireRoles(['developer', 'master']), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users", requireAuth, requireRoles(['developer', 'master']), async (req, res) => {
    try {
      const userData = req.body;
      const newUser = await storage.createUser(userData);
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Status and Location Routes
  app.post("/api/update-status", requireAuth, async (req, res) => {
    try {
      const { userId, isOnline } = req.body;
      await storage.updateUserStatus(userId, isOnline, new Date());
      res.json({ message: "Status updated successfully" });
    } catch (error) {
      console.error("Update status error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/update-location", requireAuth, async (req, res) => {
    try {
      const { userId, latitude, longitude } = req.body;
      await storage.updateUserLocation(userId, latitude, longitude);
      res.json({ message: "Location updated successfully" });
    } catch (error) {
      console.error("Update location error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Awareness Sessions Routes
  app.get("/api/awareness-sessions", requireAuth, async (req, res) => {
    try {
      const sessions = await storage.getAllAwarenessSessions();
      res.json(sessions);
    } catch (error) {
      console.error("Get awareness sessions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/awareness-sessions", requireAuth, async (req, res) => {
    try {
      const sessionData = req.body;
      const newSession = await storage.createAwarenessSession(sessionData);
      res.status(201).json(newSession);
    } catch (error) {
      console.error("Create awareness session error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Attendees Routes
  app.get("/api/attendees/:sessionId", requireAuth, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const attendees = await storage.getAttendeesBySessionId(sessionId);
      res.json(attendees);
    } catch (error) {
      console.error("Get attendees error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/attendees", requireAuth, async (req, res) => {
    try {
      const attendeeData = req.body;
      const newAttendee = await storage.createAttendee(attendeeData);
      res.status(201).json(newAttendee);
    } catch (error) {
      console.error("Create attendee error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Child Screenings Routes
  app.get("/api/child-screenings", requireAuth, async (req, res) => {
    try {
      const screenings = await storage.getAllChildScreenings();
      res.json(screenings);
    } catch (error) {
      console.error("Get child screenings error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/child-screenings", requireAuth, async (req, res) => {
    try {
      const screeningData = req.body;
      const newScreening = await storage.createChildScreening(screeningData);
      res.status(201).json(newScreening);
    } catch (error) {
      console.error("Create child screening error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Screened Children Routes
  app.get("/api/screened-children/:screeningId", requireAuth, async (req, res) => {
    try {
      const screeningId = parseInt(req.params.screeningId);
      const children = await storage.getScreenedChildrenByScreeningId(screeningId);
      res.json(children);
    } catch (error) {
      console.error("Get screened children error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/screened-children", requireAuth, async (req, res) => {
    try {
      const childData = req.body;
      const newChild = await storage.createScreenedChild(childData);
      res.status(201).json(newChild);
    } catch (error) {
      console.error("Create screened child error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Blogs Routes
  app.get("/api/blogs", requireAuth, async (req, res) => {
    try {
      const blogs = await storage.getAllBlogs();
      res.json(blogs);
    } catch (error) {
      console.error("Get blogs error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/blogs", requireAuth, async (req, res) => {
    try {
      const blogData = req.body;
      const newBlog = await storage.createBlog(blogData);
      res.status(201).json(newBlog);
    } catch (error) {
      console.error("Create blog error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return Promise.resolve(httpServer);
}
