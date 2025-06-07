import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as authMiddleware from "./middleware/auth";
import * as validators from "./middleware/validators";
import { z } from "zod";
import { formatText } from "../client/src/lib/text-formatter";
import { getNutritionStatus } from "../client/src/lib/utils";
import { initializeDefaultData as initDefaultData } from "./routes/initData";
import bcrypt from "bcryptjs";

export async function registerRoutes(app: Express): Promise<Server> {
  // HTTP server
  const httpServer = createServer(app);

  // Initialize default data
  await initializeDefaultData();
  
  // ===== Authentication Routes =====
  
  // Login route
  app.post("/api/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    try {
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Check if the password is already hashed (starts with $2a$ for bcrypt)
      if (user.password.startsWith('$2a$')) {
        // Use bcrypt to compare the password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ message: "Invalid username or password" });
        }
      } else {
        // Legacy plain-text password comparison (for compatibility during migration)
        if (user.password !== password) {
          return res.status(401).json({ message: "Invalid username or password" });
        }
        
        // Upgrade to hashed password on successful login
        const hashedPassword = await bcrypt.hash(password, 10);
        // TODO: Update user's password in database to the hashed version
      }
      
      // Set user in session
      if (req.session) {
        req.session.userId = user.id;
      }
      
      // Update last active and online status
      await storage.updateUserStatus(user.id, true, new Date());
      
      // Return user data without password
      const { password: _, ...userData } = user;
      return res.status(200).json(userData);
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Logout route
  app.post("/api/logout", authMiddleware.requireAuth, async (req: Request, res: Response) => {
    try {
      if (req.session) {
        // Update user status to offline
        if (req.user) {
          await storage.updateUserStatus(req.user.id, false, new Date());
        }
        
        // Destroy session
        req.session.destroy((err) => {
          if (err) {
            return res.status(500).json({ message: "Failed to logout" });
          }
          res.clearCookie("connect.sid");
          return res.status(200).json({ message: "Logged out successfully" });
        });
      } else {
        return res.status(200).json({ message: "Logged out successfully" });
      }
    } catch (error) {
      console.error("Logout error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get current user
  app.get("/api/me", authMiddleware.requireAuth, (req: Request, res: Response) => {
    const { password, ...userData } = req.user!;
    return res.status(200).json(userData);
  });
  
  // Update user location
  app.post("/api/update-location", authMiddleware.requireAuth, async (req: Request, res: Response) => {
    const { userId, latitude, longitude } = req.body;
    
    // Only allow users to update their own location, or developers/masters to update any location
    if (req.user!.id !== userId && !['developer', 'master'].includes(req.user!.role)) {
      return res.status(403).json({ message: "Permission denied" });
    }
    
    try {
      await storage.updateUserLocation(userId, latitude, longitude);
      return res.status(200).json({ message: "Location updated successfully" });
    } catch (error) {
      console.error("Update location error:", error);
      return res.status(500).json({ message: "Failed to update location" });
    }
  });
  
  // Update user online status
  app.post("/api/update-status", authMiddleware.requireAuth, async (req: Request, res: Response) => {
    const { userId, isOnline } = req.body;
    
    // Only allow users to update their own status, or developers/masters to update any status
    if (req.user!.id !== userId && !['developer', 'master'].includes(req.user!.role)) {
      return res.status(403).json({ message: "Permission denied" });
    }
    
    try {
      await storage.updateUserStatus(userId, isOnline, new Date());
      return res.status(200).json({ message: "Status updated successfully" });
    } catch (error) {
      console.error("Update status error:", error);
      return res.status(500).json({ message: "Failed to update status" });
    }
  });
  
  // ===== User Management Routes =====
  
  // Get all users
  app.get("/api/users", authMiddleware.requireAuth, authMiddleware.requireRoles(['developer', 'master']), async (req: Request, res: Response) => {
    try {
      let users = await storage.getAllUsers();
      
      // Filter out sensitive information
      users = users.map(user => {
        const { password, ...userData } = user;
        return userData;
      });
      
      // If master, only return fmt and sm users
      if (req.user!.role === 'master') {
        users = users.filter(user => ['fmt', 'sm'].includes(user.role));
      }
      
      return res.status(200).json(users);
    } catch (error) {
      console.error("Get users error:", error);
      return res.status(500).json({ message: "Failed to get users" });
    }
  });
  
  // Get online users
  app.get("/api/users/online", authMiddleware.requireAuth, authMiddleware.requireRoles(['developer', 'master']), async (req: Request, res: Response) => {
    try {
      let users = await storage.getOnlineUsers();
      
      // Filter out sensitive information
      users = users.map(user => {
        const { password, ...userData } = user;
        return userData;
      });
      
      // If master, only return fmt and sm users
      if (req.user!.role === 'master') {
        users = users.filter(user => ['fmt', 'sm'].includes(user.role));
      }
      
      return res.status(200).json(users);
    } catch (error) {
      console.error("Get online users error:", error);
      return res.status(500).json({ message: "Failed to get online users" });
    }
  });
  
  // Get user location history
  app.get("/api/users/location-history/:userId", authMiddleware.requireAuth, authMiddleware.requireRoles(['developer', 'master']), async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    try {
      const locationHistory = await storage.getUserLocationHistory(userId);
      return res.status(200).json(locationHistory);
    } catch (error) {
      console.error("Get location history error:", error);
      return res.status(500).json({ message: "Failed to get location history" });
    }
  });
  
  // Create user
  app.post("/api/users", authMiddleware.requireAuth, authMiddleware.requireRoles(['developer', 'master']), validators.validateUser, async (req: Request, res: Response) => {
    try {
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      // Check role permissions:
      // - Developer can create masters, fmt, sm
      // - Master can only create fmt, sm
      if (req.user!.role === 'master' && req.body.role === 'master') {
        return res.status(403).json({ message: "You don't have permission to create a Master user" });
      }
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      
      // Format text inputs and create user with hashed password
      const userData = {
        ...req.body,
        password: hashedPassword,
        name: formatText(req.body.name)
      };
      
      const newUser = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = newUser;
      
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Create user error:", error);
      return res.status(500).json({ message: "Failed to create user" });
    }
  });
  
  // Delete user
  app.delete("/api/users/:id", authMiddleware.requireAuth, authMiddleware.requireRoles(['developer', 'master']), async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    try {
      // Get user to be deleted
      const userToDelete = await storage.getUser(userId);
      
      if (!userToDelete) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check permissions:
      // - Developer can delete any user except other developers
      // - Master can only delete fmt and sm
      if (req.user!.role === 'master' && userToDelete.role === 'master') {
        return res.status(403).json({ message: "You don't have permission to delete a Master user" });
      }
      
      if (userToDelete.role === 'developer') {
        return res.status(403).json({ message: "Developers cannot be deleted" });
      }
      
      await storage.deleteUser(userId);
      return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      return res.status(500).json({ message: "Failed to delete user" });
    }
  });
  
  // ===== Awareness Sessions Routes =====
  
  // Get all awareness sessions
  app.get("/api/awareness-sessions", authMiddleware.requireAuth, async (req: Request, res: Response) => {
    try {
      let sessions = await storage.getAllAwarenessSessions();
      
      // If user is fmt or sm, only return their own sessions
      if (['fmt', 'sm'].includes(req.user!.role)) {
        sessions = sessions.filter(session => session.userId === req.user!.id);
      }
      
      // Get attendee count for each session
      const sessionIds = sessions.map(session => session.id);
      const attendeeCounts = await storage.getAttendeeCountsBySessionIds(sessionIds);
      
      const sessionsWithCounts = sessions.map(session => ({
        ...session,
        attendeeCount: attendeeCounts[session.id] || 0
      }));
      
      // Get users for the response
      let users = await storage.getAllUsers();
      users = users.map(user => {
        const { password, ...userData } = user;
        return userData;
      });
      
      return res.status(200).json({ 
        sessions: sessionsWithCounts,
        users
      });
    } catch (error) {
      console.error("Get awareness sessions error:", error);
      return res.status(500).json({ message: "Failed to get awareness sessions" });
    }
  });
  
  // Get recent awareness sessions
  app.get("/api/awareness-sessions/recent", authMiddleware.requireAuth, async (req: Request, res: Response) => {
    try {
      // Parse date filter parameters
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      let sessions = await storage.getRecentAwarenessSessions(10); // Get 10 most recent
      
      // Apply date filters
      if (startDate && endDate) {
        sessions = sessions.filter(session => {
          const sessionDate = new Date(session.date);
          return sessionDate >= startDate && sessionDate <= endDate;
        });
      }
      
      // Apply user filters based on role
      if (['fmt', 'sm'].includes(req.user!.role)) {
        // For FMT and SM roles, only show their own data
        sessions = sessions.filter(session => session.userId === req.user!.id);
      } else if (userId && ['developer', 'master'].includes(req.user!.role)) {
        // For admin roles with specific user filter
        sessions = sessions.filter(session => session.userId === userId);
      }
      
      // Get attendee count for each session
      const sessionIds = sessions.map(session => session.id);
      const attendeeCounts = await storage.getAttendeeCountsBySessionIds(sessionIds);
      
      // Get users for each session
      const userIds = [...new Set(sessions.map(session => session.userId))];
      const users = await Promise.all(userIds.map(id => storage.getUser(id)));
      const userMap = new Map(users.map(user => [user!.id, user]));
      
      const enrichedSessions = sessions.map(session => {
        const user = userMap.get(session.userId);
        const { password, ...userData } = user!;
        
        return {
          ...session,
          attendeeCount: attendeeCounts[session.id] || 0,
          user: userData
        };
      });
      
      return res.status(200).json(enrichedSessions);
    } catch (error) {
      console.error("Get recent awareness sessions error:", error);
      return res.status(500).json({ message: "Failed to get recent awareness sessions" });
    }
  });
  
  // Create awareness session
  app.post("/api/awareness-sessions", authMiddleware.requireAuth, validators.validateAwarenessSession, async (req: Request, res: Response) => {
    try {
      const sessionData = {
        ...req.body,
        userId: req.user!.id
      };
      
      const newSession = await storage.createAwarenessSession(sessionData);
      return res.status(201).json(newSession);
    } catch (error) {
      console.error("Create awareness session error:", error);
      return res.status(500).json({ message: "Failed to create awareness session" });
    }
  });
  
  // Get attendees for a session
  app.get("/api/attendees/session/:sessionId", authMiddleware.requireAuth, async (req: Request, res: Response) => {
    const sessionId = parseInt(req.params.sessionId);
    
    if (isNaN(sessionId)) {
      return res.status(400).json({ message: "Invalid session ID" });
    }
    
    try {
      // Check if user has permission to access this session
      const session = await storage.getAwarenessSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Only the session creator, developers, and masters can access attendees
      if (session.userId !== req.user!.id && !['developer', 'master'].includes(req.user!.role)) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const attendees = await storage.getAttendeesBySessionId(sessionId);
      return res.status(200).json(attendees);
    } catch (error) {
      console.error("Get attendees error:", error);
      return res.status(500).json({ message: "Failed to get attendees" });
    }
  });
  
  // Create attendee
  app.post("/api/attendees", authMiddleware.requireAuth, validators.validateAttendee, async (req: Request, res: Response) => {
    try {
      // Check if user has permission to add attendees to this session
      const session = await storage.getAwarenessSession(req.body.sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Only the session creator, developers, and masters can add attendees
      if (session.userId !== req.user!.id && !['developer', 'master'].includes(req.user!.role)) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      // Format text inputs
      const attendeeData = {
        ...req.body,
        name: formatText(req.body.name),
        fatherOrHusbandName: formatText(req.body.fatherOrHusbandName)
      };
      
      const newAttendee = await storage.createAttendee(attendeeData);
      return res.status(201).json(newAttendee);
    } catch (error) {
      console.error("Create attendee error:", error);
      return res.status(500).json({ message: "Failed to create attendee" });
    }
  });
  
  // ===== Child Screening Routes =====
  
  // Get all child screenings
  app.get("/api/child-screenings", authMiddleware.requireAuth, async (req: Request, res: Response) => {
    try {
      // Parse date filter parameters
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      let screenings = await storage.getAllChildScreenings();
      
      // Apply date filters
      if (startDate && endDate) {
        screenings = screenings.filter(screening => {
          const screeningDate = new Date(screening.date);
          return screeningDate >= startDate && screeningDate <= endDate;
        });
      }
      
      // Apply user filters based on role
      if (['fmt', 'sm'].includes(req.user!.role)) {
        // For FMT and SM roles, only show their own data
        screenings = screenings.filter(screening => screening.userId === req.user!.id);
      } else if (userId && ['developer', 'master'].includes(req.user!.role)) {
        // For admin roles with specific user filter
        screenings = screenings.filter(screening => screening.userId === userId);
      }
      
      // Get child count and statistics for each screening
      const screeningIds = screenings.map(screening => screening.id);
      const childrenStats = await storage.getChildrenStatsByScreeningIds(screeningIds);
      
      const screeningsWithStats = screenings.map(screening => ({
        ...screening,
        childrenCount: childrenStats[screening.id]?.total || 0,
        stats: {
          normal: childrenStats[screening.id]?.normal || 0,
          mam: childrenStats[screening.id]?.mam || 0,
          sam: childrenStats[screening.id]?.sam || 0
        }
      }));
      
      // Get users for the response
      let users = await storage.getAllUsers();
      users = users.map(user => {
        const { password, ...userData } = user;
        return userData;
      });
      
      return res.status(200).json({ 
        screenings: screeningsWithStats,
        users
      });
    } catch (error) {
      console.error("Get child screenings error:", error);
      return res.status(500).json({ message: "Failed to get child screenings" });
    }
  });
  
  // Create child screening
  app.post("/api/child-screenings", authMiddleware.requireAuth, validators.validateChildScreening, async (req: Request, res: Response) => {
    try {
      const screeningData = {
        ...req.body,
        userId: req.user!.id
      };
      
      const newScreening = await storage.createChildScreening(screeningData);
      return res.status(201).json(newScreening);
    } catch (error) {
      console.error("Create child screening error:", error);
      return res.status(500).json({ message: "Failed to create child screening" });
    }
  });
  
  // Get screened children for a screening
  app.get("/api/screened-children/screening/:screeningId", authMiddleware.requireAuth, async (req: Request, res: Response) => {
    const screeningId = parseInt(req.params.screeningId);
    
    if (isNaN(screeningId)) {
      return res.status(400).json({ message: "Invalid screening ID" });
    }
    
    try {
      // Check if user has permission to access this screening
      const screening = await storage.getChildScreening(screeningId);
      
      if (!screening) {
        return res.status(404).json({ message: "Screening not found" });
      }
      
      // Only the screening creator, developers, and masters can access screened children
      if (screening.userId !== req.user!.id && !['developer', 'master'].includes(req.user!.role)) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const children = await storage.getScreenedChildrenByScreeningId(screeningId);
      return res.status(200).json(children);
    } catch (error) {
      console.error("Get screened children error:", error);
      return res.status(500).json({ message: "Failed to get screened children" });
    }
  });
  
  // Create screened child
  app.post("/api/screened-children", authMiddleware.requireAuth, validators.validateScreenedChild, async (req: Request, res: Response) => {
    try {
      // Check if user has permission to add children to this screening
      const screening = await storage.getChildScreening(req.body.screeningId);
      
      if (!screening) {
        return res.status(404).json({ message: "Screening not found" });
      }
      
      // Only the screening creator, developers, and masters can add children
      if (screening.userId !== req.user!.id && !['developer', 'master'].includes(req.user!.role)) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      // Format text inputs and calculate nutrition status if not provided
      let childData = {
        ...req.body,
        childName: formatText(req.body.childName),
        fatherName: formatText(req.body.fatherName)
      };
      
      // Auto-calculate nutrition status based on MUAC if not provided
      if (!childData.nutritionStatus && childData.muac) {
        childData.nutritionStatus = getNutritionStatus(childData.muac);
      }
      
      const newChild = await storage.createScreenedChild(childData);
      return res.status(201).json(newChild);
    } catch (error) {
      console.error("Create screened child error:", error);
      return res.status(500).json({ message: "Failed to create screened child" });
    }
  });
  
  // ===== Blog Routes =====
  
  // Get all blogs
  app.get("/api/blogs", async (req: Request, res: Response) => {
    try {
      let blogs = await storage.getAllBlogs();
      
      // If user is not authenticated, only return published blogs
      if (!req.user) {
        blogs = blogs.filter(blog => blog.isPublished);
      }
      // If user is fmt or sm, only show published blogs or their own
      else if (['fmt', 'sm'].includes(req.user.role)) {
        blogs = blogs.filter(blog => blog.isPublished || blog.authorId === req.user!.id);
      }
      
      // Get authors for the blogs
      const authorIds = [...new Set(blogs.map(blog => blog.authorId))];
      const authors = await Promise.all(authorIds.map(id => storage.getUser(id)));
      const authorMap = new Map(authors.map(author => [author!.id, author]));
      
      const blogsWithAuthors = blogs.map(blog => {
        const author = authorMap.get(blog.authorId);
        const { password, ...authorData } = author!;
        
        return {
          ...blog,
          author: authorData
        };
      });
      
      return res.status(200).json(blogsWithAuthors);
    } catch (error) {
      console.error("Get blogs error:", error);
      return res.status(500).json({ message: "Failed to get blogs" });
    }
  });
  
  // Get a specific blog
  app.get("/api/blogs/:id", async (req: Request, res: Response) => {
    const blogId = parseInt(req.params.id);
    
    if (isNaN(blogId)) {
      return res.status(400).json({ message: "Invalid blog ID" });
    }
    
    try {
      const blog = await storage.getBlog(blogId);
      
      if (!blog) {
        return res.status(404).json({ message: "Blog not found" });
      }
      
      // If user is not authenticated and blog is not published, deny access
      if (!req.user && !blog.isPublished) {
        return res.status(404).json({ message: "Blog not found" });
      }
      
      // If user is fmt or sm and not the author of an unpublished blog, deny access
      if (req.user && ['fmt', 'sm'].includes(req.user.role) && !blog.isPublished && blog.authorId !== req.user.id) {
        return res.status(404).json({ message: "Blog not found" });
      }
      
      // Get the author
      const author = await storage.getUser(blog.authorId);
      
      if (!author) {
        return res.status(500).json({ message: "Blog author not found" });
      }
      
      const { password, ...authorData } = author;
      
      return res.status(200).json({
        ...blog,
        author: authorData
      });
    } catch (error) {
      console.error("Get blog error:", error);
      return res.status(500).json({ message: "Failed to get blog" });
    }
  });
  
  // Create blog
  app.post("/api/blogs", authMiddleware.requireAuth, authMiddleware.requireRoles(['developer', 'master']), validators.validateBlog, async (req: Request, res: Response) => {
    try {
      const blogData = {
        ...req.body,
        authorId: req.user!.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const newBlog = await storage.createBlog(blogData);
      return res.status(201).json(newBlog);
    } catch (error) {
      console.error("Create blog error:", error);
      return res.status(500).json({ message: "Failed to create blog" });
    }
  });
  
  // Update blog
  app.put("/api/blogs/:id", authMiddleware.requireAuth, validators.validateBlog, async (req: Request, res: Response) => {
    const blogId = parseInt(req.params.id);
    
    if (isNaN(blogId)) {
      return res.status(400).json({ message: "Invalid blog ID" });
    }
    
    try {
      const blog = await storage.getBlog(blogId);
      
      if (!blog) {
        return res.status(404).json({ message: "Blog not found" });
      }
      
      // Only the author, developers, and masters can update blogs
      if (blog.authorId !== req.user!.id && !['developer', 'master'].includes(req.user!.role)) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const blogData = {
        ...req.body,
        id: blogId,
        authorId: blog.authorId, // Preserve original author
        updatedAt: new Date()
      };
      
      const updatedBlog = await storage.updateBlog(blogData);
      return res.status(200).json(updatedBlog);
    } catch (error) {
      console.error("Update blog error:", error);
      return res.status(500).json({ message: "Failed to update blog" });
    }
  });
  
  // Delete blog
  app.delete("/api/blogs/:id", authMiddleware.requireAuth, async (req: Request, res: Response) => {
    const blogId = parseInt(req.params.id);
    
    if (isNaN(blogId)) {
      return res.status(400).json({ message: "Invalid blog ID" });
    }
    
    try {
      const blog = await storage.getBlog(blogId);
      
      if (!blog) {
        return res.status(404).json({ message: "Blog not found" });
      }
      
      // Only the author, developers, and masters can delete blogs
      if (blog.authorId !== req.user!.id && !['developer', 'master'].includes(req.user!.role)) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      await storage.deleteBlog(blogId);
      return res.status(200).json({ message: "Blog deleted successfully" });
    } catch (error) {
      console.error("Delete blog error:", error);
      return res.status(500).json({ message: "Failed to delete blog" });
    }
  });
  
  // ===== Dashboard Stats Routes =====
  
  // Get dashboard stats
  app.get("/api/stats/dashboard", authMiddleware.requireAuth, async (req: Request, res: Response) => {
    try {
      // Parse date filter parameters
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      // Get total sessions
      let sessions = await storage.getAllAwarenessSessions();
      
      // Apply date filters
      if (startDate && endDate) {
        sessions = sessions.filter(session => {
          const sessionDate = new Date(session.date);
          return sessionDate >= startDate && sessionDate <= endDate;
        });
      }
      
      // Apply user filters based on role
      if (['fmt', 'sm'].includes(req.user!.role)) {
        // For FMT and SM roles, only show their own data
        sessions = sessions.filter(session => session.userId === req.user!.id);
      } else if (userId && ['developer', 'master'].includes(req.user!.role)) {
        // For admin roles with specific user filter
        sessions = sessions.filter(session => session.userId === userId);
      }
      
      // Get total children screened
      let screenings = await storage.getAllChildScreenings();
      
      // Apply date filters
      if (startDate && endDate) {
        screenings = screenings.filter(screening => {
          const screeningDate = new Date(screening.date);
          return screeningDate >= startDate && screeningDate <= endDate;
        });
      }
      
      // Apply user filters based on role
      if (['fmt', 'sm'].includes(req.user!.role)) {
        // For FMT and SM roles, only show their own data
        screenings = screenings.filter(screening => screening.userId === req.user!.id);
      } else if (userId && ['developer', 'master'].includes(req.user!.role)) {
        // For admin roles with specific user filter
        screenings = screenings.filter(screening => screening.userId === userId);
      }
      
      const screeningIds = screenings.map(screening => screening.id);
      let totalChildren = 0;
      let normalCount = 0;
      let mamCount = 0;
      let samCount = 0;
      
      if (screeningIds.length > 0) {
        const childrenStats = await storage.getChildrenStatsByScreeningIds(screeningIds);
        
        // Sum up counts from all screenings
        for (const stats of Object.values(childrenStats)) {
          totalChildren += stats.total || 0;
          normalCount += stats.normal || 0;
          mamCount += stats.mam || 0;
          samCount += stats.sam || 0;
        }
      }
      
      // Get active users count
      let activeUsers = await storage.getOnlineUsers();
      
      // If user is master, only count fmt and sm users
      if (req.user!.role === 'master') {
        activeUsers = activeUsers.filter(user => ['fmt', 'sm'].includes(user.role));
      }
      
      // Generate monthly activity data (this would use actual data in a real implementation)
      const activityData = generateActivityData();
      
      return res.status(200).json({
        totalSessions: sessions.length,
        totalChildren: totalChildren,
        activeUsers: activeUsers.length,
        nutritionStatus: {
          normal: normalCount,
          mam: mamCount,
          sam: samCount
        },
        activityData
      });
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      return res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });
  
  // Get export stats
  app.get("/api/stats/export", authMiddleware.requireAuth, authMiddleware.requireRoles(['developer', 'master']), async (req: Request, res: Response) => {
    try {
      // Get awareness sessions data
      let sessions = await storage.getAllAwarenessSessions();
      
      // If user is master, only include fmt and sm sessions
      if (req.user!.role === 'master') {
        // Get fmt and sm user IDs
        const users = await storage.getAllUsers();
        const fmtSmUserIds = users
          .filter(user => ['fmt', 'sm'].includes(user.role))
          .map(user => user.id);
        
        sessions = sessions.filter(session => fmtSmUserIds.includes(session.userId));
      }
      
      // Count last 30 days sessions
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const last30DaysSessions = sessions.filter(session => 
        new Date(session.date) >= thirtyDaysAgo
      ).length;
      
      // Get all attendees for the sessions
      const sessionIds = sessions.map(session => session.id);
      let attendees: any[] = [];
      
      if (sessionIds.length > 0) {
        for (const id of sessionIds) {
          const sessionAttendees = await storage.getAttendeesBySessionId(id);
          attendees = [...attendees, ...sessionAttendees];
        }
      }
      
      // Get child screenings data
      let screenings = await storage.getAllChildScreenings();
      
      // If user is master, only include fmt and sm screenings
      if (req.user!.role === 'master') {
        // Get fmt and sm user IDs
        const users = await storage.getAllUsers();
        const fmtSmUserIds = users
          .filter(user => ['fmt', 'sm'].includes(user.role))
          .map(user => user.id);
        
        screenings = screenings.filter(screening => fmtSmUserIds.includes(screening.userId));
      }
      
      // Count last 30 days screenings
      const last30DaysScreenings = screenings.filter(screening => 
        new Date(screening.date) >= thirtyDaysAgo
      ).length;
      
      // Get all screened children
      const screeningIds = screenings.map(screening => screening.id);
      let children: any[] = [];
      
      if (screeningIds.length > 0) {
        for (const id of screeningIds) {
          const screenedChildren = await storage.getScreenedChildrenByScreeningId(id);
          children = [...children, ...screenedChildren];
        }
      }
      
      return res.status(200).json({
        awarenessSessions: {
          total: sessions.length,
          last30Days: last30DaysSessions,
          sessions,
          attendees
        },
        childScreenings: {
          total: screenings.length,
          last30Days: last30DaysScreenings,
          screenings,
          children
        }
      });
    } catch (error) {
      console.error("Get export stats error:", error);
      return res.status(500).json({ message: "Failed to get export stats" });
    }
  });
  
  // Simple health check
  app.get("/api/health-check", (req: Request, res: Response) => {
    return res.status(200).json({ status: "ok" });
  });

  return httpServer;
}

// Initialize default data
async function initializeDefaultData() {
  try {
    // Check if developer exists
    const developer = await storage.getUserByUsername('asifjamali83');
    
    if (!developer) {
      // Create default developer
      await storage.createUser({
        username: 'asifjamali83',
        password: 'Atifkhan83##',
        fullName: 'Asif Jamali',
        role: 'developer',
        email: '',
        phoneNumber: '',
        district: ''
      });
      
      console.log('Created default developer account');
      
      // Create sample blog posts
      await storage.createBlog({
        title: 'Importance of Child Nutrition in Early Years',
        content: `Proper nutrition during the first five years of life is crucial for healthy development and growth. This period is characterized by rapid physical and cognitive development, making adequate nutrition essential.\n\nChildren with proper nutrition have stronger immune systems, better cognitive development, and reduced risk of chronic diseases later in life. Parents and caregivers should ensure that children receive a balanced diet containing all essential nutrients, including proteins, carbohydrates, fats, vitamins, and minerals.\n\nRegular health check-ups and monitoring growth parameters like height, weight, and mid-upper arm circumference (MUAC) can help identify nutritional issues early. Early intervention can prevent serious health problems and ensure optimal development.\n\nCommunity health programs play a vital role in promoting child nutrition through education, screenings, and support for families. By working together, we can ensure that every child has the opportunity to grow and thrive.`,
        authorId: 1,
        imageUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=1470&ixlib=rb-4.0.3',
        isPublished: true,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await storage.createBlog({
        title: 'Understanding the Importance of Vaccinations',
        content: `Vaccines have been one of the most successful public health interventions in history, preventing millions of illnesses, disabilities, and deaths worldwide. Despite this success, misconceptions about vaccines persist, leading some parents to delay or refuse vaccinations for their children.\n\nVaccinations work by stimulating the body's immune system to recognize and fight specific infectious agents. They contain weakened or killed versions of disease-causing microorganisms or their components, which trigger an immune response without causing the disease itself. This prepares the immune system to quickly respond if it encounters the actual pathogen in the future.\n\nImmunizing children according to the recommended schedule is crucial for protecting them against serious diseases such as measles, polio, tetanus, and whooping cough. Many of these diseases can cause severe complications, including pneumonia, encephalitis, meningitis, paralysis, and even death.\n\nVaccination not only protects individual children but also contributes to community immunity (also known as herd immunity). When a high percentage of a population is vaccinated, the spread of contagious diseases is limited, providing indirect protection to vulnerable individuals who cannot be vaccinated due to age or medical conditions.\n\nEnsuring your child receives all recommended vaccines on schedule is one of the most important steps you can take to protect their health. If you have questions or concerns about vaccines, talk to your healthcare provider, who can provide you with accurate, science-based information.`,
        authorId: 1,
        imageUrl: 'https://images.unsplash.com/photo-1632053001332-1b4d63cb9111?auto=format&fit=crop&q=80&w=1471&ixlib=rb-4.0.3',
        isPublished: true,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Created sample blog posts');
    }
  } catch (error) {
    console.error('Error initializing default data:', error);
  }
}

// Helper function to generate activity data for the dashboard
function generateActivityData() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  return months.slice(0, currentMonth + 1).map((month, index) => ({
    name: month,
    sessions: Math.floor(Math.random() * 30) + 10,
    screenings: Math.floor(Math.random() * 50) + 20
  }));
}
