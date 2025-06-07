import { 
  users, type User, type InsertUser,
  awarenessSessions, type AwarenessSession, type InsertAwarenessSession,
  attendees, type Attendee, type InsertAttendee,
  childScreenings, type ChildScreening, type InsertChildScreening,
  screenedChildren, type ScreenedChild, type InsertScreenedChild,
  blogs, type Blog, type InsertBlog,
  userLocations, pendingSyncItems
} from "@shared/schema";

// Interface for all storage methods
export interface IStorage {
  // User Management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getOnlineUsers(): Promise<User[]>;
  updateUserStatus(userId: number, isOnline: boolean, timestamp: Date): Promise<void>;
  updateUserLocation(userId: number, latitude: number, longitude: number): Promise<void>;
  getUserLocationHistory(userId: number): Promise<any[]>;
  deleteUser(userId: number): Promise<void>;
  
  // Awareness Sessions
  getAllAwarenessSessions(): Promise<AwarenessSession[]>;
  getRecentAwarenessSessions(limit: number): Promise<AwarenessSession[]>;
  getAwarenessSession(id: number): Promise<AwarenessSession | undefined>;
  createAwarenessSession(session: InsertAwarenessSession): Promise<AwarenessSession>;
  
  // Attendees
  getAttendeesBySessionId(sessionId: number): Promise<Attendee[]>;
  getAttendeeCountsBySessionIds(sessionIds: number[]): Promise<Record<number, number>>;
  createAttendee(attendee: InsertAttendee): Promise<Attendee>;
  
  // Child Screenings
  getAllChildScreenings(): Promise<ChildScreening[]>;
  getChildScreening(id: number): Promise<ChildScreening | undefined>;
  createChildScreening(screening: InsertChildScreening): Promise<ChildScreening>;
  
  // Screened Children
  getScreenedChildrenByScreeningId(screeningId: number): Promise<ScreenedChild[]>;
  getChildrenStatsByScreeningIds(screeningIds: number[]): Promise<Record<number, any>>;
  createScreenedChild(child: InsertScreenedChild): Promise<ScreenedChild>;
  
  // Blogs
  getAllBlogs(): Promise<Blog[]>;
  getBlog(id: number): Promise<Blog | undefined>;
  createBlog(blog: InsertBlog): Promise<Blog>;
  updateBlog(id: number, blog: Partial<InsertBlog>): Promise<Blog | undefined>;
  deleteBlog(id: number): Promise<void>;
  
  // Offline Sync
  storePendingSync(userId: number, entityType: string, entityData: any): Promise<void>;
  getPendingSyncItems(userId: number): Promise<any[]>;
  markSyncItemAsSynced(id: number): Promise<void>;
}

// In-memory storage implementation for development and testing
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private awarenessSessions: Map<number, AwarenessSession>;
  private attendees: Map<number, Attendee>;
  private childScreenings: Map<number, ChildScreening>;
  private screenedChildren: Map<number, ScreenedChild>;
  private blogs: Map<number, Blog>;
  private locationHistory: Map<number, any[]>;
  private pendingSyncItems: Map<number, any>;
  
  private userIdCounter: number;
  private sessionIdCounter: number;
  private attendeeIdCounter: number;
  private screeningIdCounter: number;
  private childIdCounter: number;
  private blogIdCounter: number;
  private syncIdCounter: number;

  constructor() {
    this.users = new Map();
    this.awarenessSessions = new Map();
    this.attendees = new Map();
    this.childScreenings = new Map();
    this.screenedChildren = new Map();
    this.blogs = new Map();
    this.locationHistory = new Map();
    this.pendingSyncItems = new Map();
    
    this.userIdCounter = 1;
    this.sessionIdCounter = 1;
    this.attendeeIdCounter = 1;
    this.screeningIdCounter = 1;
    this.childIdCounter = 1;
    this.blogIdCounter = 1;
    this.syncIdCounter = 1;
  }
  
  // ===== User Management =====
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      lastActive: null,
      isOnline: false,
      email: insertUser.email || null,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getOnlineUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.isOnline);
  }
  
  async updateUserStatus(userId: number, isOnline: boolean, timestamp: Date): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.isOnline = isOnline;
      user.lastActive = timestamp;
      this.users.set(userId, user);
    }
  }
  
  async updateUserLocation(userId: number, latitude: number, longitude: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      // Add to location history
      if (!this.locationHistory.has(userId)) {
        this.locationHistory.set(userId, []);
      }
      
      const history = this.locationHistory.get(userId);
      history!.push({
        latitude,
        longitude,
        timestamp: new Date()
      });
      
      this.locationHistory.set(userId, history!);
    }
  }
  
  async getUserLocationHistory(userId: number): Promise<any[]> {
    return this.locationHistory.get(userId) || [];
  }
  
  async deleteUser(userId: number): Promise<void> {
    this.users.delete(userId);
  }
  
  // ===== Awareness Sessions =====
  async getAllAwarenessSessions(): Promise<AwarenessSession[]> {
    return Array.from(this.awarenessSessions.values());
  }
  
  async getRecentAwarenessSessions(limit: number): Promise<AwarenessSession[]> {
    return Array.from(this.awarenessSessions.values())
      .sort((a, b) => {
        // Handle null values in createdAt
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      })
      .slice(0, limit);
  }
  
  async getAwarenessSession(id: number): Promise<AwarenessSession | undefined> {
    return this.awarenessSessions.get(id);
  }
  
  async createAwarenessSession(session: InsertAwarenessSession): Promise<AwarenessSession> {
    const id = this.sessionIdCounter++;
    const now = new Date();
    const newSession: AwarenessSession = {
      ...session,
      id,
      createdAt: now
    };
    this.awarenessSessions.set(id, newSession);
    return newSession;
  }
  
  // ===== Attendees =====
  async getAttendeesBySessionId(sessionId: number): Promise<Attendee[]> {
    return Array.from(this.attendees.values())
      .filter(attendee => attendee.sessionId === sessionId);
  }
  
  async getAttendeeCountsBySessionIds(sessionIds: number[]): Promise<Record<number, number>> {
    const counts: Record<number, number> = {};
    
    // Initialize counts for all session IDs
    sessionIds.forEach(id => {
      counts[id] = 0;
    });
    
    // Count attendees for each session
    Array.from(this.attendees.values()).forEach(attendee => {
      if (sessionIds.includes(attendee.sessionId)) {
        counts[attendee.sessionId]++;
      }
    });
    
    return counts;
  }
  
  async createAttendee(attendee: InsertAttendee): Promise<Attendee> {
    const id = this.attendeeIdCounter++;
    const now = new Date();
    const newAttendee: Attendee = {
      ...attendee,
      id,
      createdAt: now
    };
    this.attendees.set(id, newAttendee);
    return newAttendee;
  }
  
  // ===== Child Screenings =====
  async getAllChildScreenings(): Promise<ChildScreening[]> {
    return Array.from(this.childScreenings.values());
  }
  
  async getChildScreening(id: number): Promise<ChildScreening | undefined> {
    return this.childScreenings.get(id);
  }
  
  async createChildScreening(screening: InsertChildScreening): Promise<ChildScreening> {
    const id = this.screeningIdCounter++;
    const now = new Date();
    const newScreening: ChildScreening = {
      ...screening,
      id,
      createdAt: now
    };
    this.childScreenings.set(id, newScreening);
    return newScreening;
  }
  
  // ===== Screened Children =====
  async getScreenedChildrenByScreeningId(screeningId: number): Promise<ScreenedChild[]> {
    return Array.from(this.screenedChildren.values())
      .filter(child => child.screeningId === screeningId);
  }
  
  async getChildrenStatsByScreeningIds(screeningIds: number[]): Promise<Record<number, any>> {
    const stats: Record<number, any> = {};
    
    // Initialize stats for all screening IDs
    screeningIds.forEach(id => {
      stats[id] = {
        total: 0,
        normal: 0,
        mam: 0,
        sam: 0
      };
    });
    
    // Calculate stats for each screening
    Array.from(this.screenedChildren.values()).forEach(child => {
      if (screeningIds.includes(child.screeningId)) {
        stats[child.screeningId].total++;
        
        if (child.nutritionStatus === 'Normal') {
          stats[child.screeningId].normal++;
        } else if (child.nutritionStatus === 'MAM') {
          stats[child.screeningId].mam++;
        } else if (child.nutritionStatus === 'SAM') {
          stats[child.screeningId].sam++;
        }
      }
    });
    
    return stats;
  }
  
  async createScreenedChild(child: InsertScreenedChild): Promise<ScreenedChild> {
    const id = this.childIdCounter++;
    const now = new Date();
    const newChild: ScreenedChild = {
      ...child,
      id,
      createdAt: now
    };
    this.screenedChildren.set(id, newChild);
    return newChild;
  }
  
  // ===== Blogs =====
  async getAllBlogs(): Promise<Blog[]> {
    return Array.from(this.blogs.values());
  }
  
  async getBlog(id: number): Promise<Blog | undefined> {
    return this.blogs.get(id);
  }
  
  async createBlog(blog: InsertBlog): Promise<Blog> {
    const id = this.blogIdCounter++;
    const now = new Date();
    const newBlog: Blog = {
      ...blog,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.blogs.set(id, newBlog);
    return newBlog;
  }
  
  async updateBlog(id: number, blog: Partial<InsertBlog>): Promise<Blog | undefined> {
    const existingBlog = this.blogs.get(id);
    if (!existingBlog) return undefined;
    
    const now = new Date();
    const updatedBlog: Blog = {
      ...existingBlog,
      ...blog,
      updatedAt: now
    };
    
    this.blogs.set(id, updatedBlog);
    return updatedBlog;
  }
  
  async deleteBlog(id: number): Promise<void> {
    this.blogs.delete(id);
  }
  
  // ===== Offline Sync =====
  async storePendingSync(userId: number, entityType: string, entityData: any): Promise<void> {
    const id = this.syncIdCounter++;
    this.pendingSyncItems.set(id, {
      id,
      userId,
      entityType,
      entityData,
      synced: false,
      createdAt: new Date(),
      syncedAt: null
    });
  }
  
  async getPendingSyncItems(userId: number): Promise<any[]> {
    return Array.from(this.pendingSyncItems.values())
      .filter(item => item.userId === userId && !item.synced);
  }
  
  async markSyncItemAsSynced(id: number): Promise<void> {
    const item = this.pendingSyncItems.get(id);
    if (item) {
      item.synced = true;
      item.syncedAt = new Date();
      this.pendingSyncItems.set(id, item);
    }
  }
}

import { db } from "./db";
import { eq, desc, sql, and, isNull } from "drizzle-orm";

// Database storage implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }
  
  async getOnlineUsers(): Promise<User[]> {
    return db.select().from(users).where(eq(users.isOnline, true));
  }
  
  async updateUserStatus(userId: number, isOnline: boolean, timestamp: Date): Promise<void> {
    await db
      .update(users)
      .set({ isOnline, lastActive: timestamp })
      .where(eq(users.id, userId));
  }
  
  async updateUserLocation(userId: number, latitude: number, longitude: number): Promise<void> {
    await db
      .insert(userLocations)
      .values({
        userId,
        latitude,
        longitude
      });
  }
  
  async getUserLocationHistory(userId: number): Promise<any[]> {
    return db
      .select()
      .from(userLocations)
      .where(eq(userLocations.userId, userId))
      .orderBy(desc(userLocations.timestamp));
  }
  
  async deleteUser(userId: number): Promise<void> {
    await db
      .delete(users)
      .where(eq(users.id, userId));
  }
  
  // ===== Awareness Sessions =====
  async getAllAwarenessSessions(): Promise<AwarenessSession[]> {
    const sessions = await db
      .select()
      .from(awarenessSessions);
    
    // Process sessions to handle images stored as text
    return sessions.map(session => ({
      ...session,
      images: session.images ? JSON.parse(session.images) : null
    }));
  }
  
  async getRecentAwarenessSessions(limit: number): Promise<AwarenessSession[]> {
    const sessions = await db
      .select()
      .from(awarenessSessions)
      .orderBy(desc(awarenessSessions.createdAt))
      .limit(limit);
    
    // Process sessions to handle images stored as text
    return sessions.map(session => ({
      ...session,
      images: session.images ? JSON.parse(session.images) : null
    }));
  }
  
  async getAwarenessSession(id: number): Promise<AwarenessSession | undefined> {
    const [session] = await db
      .select()
      .from(awarenessSessions)
      .where(eq(awarenessSessions.id, id));
      
    if (!session) return undefined;
    
    return {
      ...session,
      images: session.images ? JSON.parse(session.images) : null
    };
  }
  
  async createAwarenessSession(session: InsertAwarenessSession): Promise<AwarenessSession> {
    // Handle images array by converting to JSON string
    const sessionData = {
      ...session,
      images: session.images ? JSON.stringify(session.images) : null
    };
    
    const [createdSession] = await db
      .insert(awarenessSessions)
      .values(sessionData)
      .returning();
    
    return {
      ...createdSession,
      images: createdSession.images ? JSON.parse(createdSession.images) : null
    };
  }
  
  // ===== Attendees =====
  async getAttendeesBySessionId(sessionId: number): Promise<Attendee[]> {
    const attendeesList = await db
      .select()
      .from(attendees)
      .where(eq(attendees.sessionId, sessionId));
      
    return attendeesList.map(attendee => ({
      ...attendee,
      images: attendee.images ? JSON.parse(attendee.images) : null
    }));
  }
  
  async getAttendeeCountsBySessionIds(sessionIds: number[]): Promise<Record<number, number>> {
    const counts: Record<number, number> = {};
    
    // Initialize counts for all session IDs
    sessionIds.forEach(id => {
      counts[id] = 0;
    });
    
    // Use SQL to count attendees for each session
    const results = await db.execute(sql`
      SELECT session_id, COUNT(*) as count
      FROM attendees
      WHERE session_id IN (${sessionIds.join(',')})
      GROUP BY session_id
    `);
    
    // Update counts with actual values
    results.forEach((row: any) => {
      counts[row.session_id] = parseInt(row.count);
    });
    
    return counts;
  }
  
  async createAttendee(attendee: InsertAttendee): Promise<Attendee> {
    // Handle images array by converting to JSON string
    const attendeeData = {
      ...attendee,
      images: attendee.images ? JSON.stringify(attendee.images) : null
    };
    
    const [createdAttendee] = await db
      .insert(attendees)
      .values(attendeeData)
      .returning();
    
    return {
      ...createdAttendee,
      images: createdAttendee.images ? JSON.parse(createdAttendee.images) : null
    };
  }
  
  // ===== Child Screenings =====
  async getAllChildScreenings(): Promise<ChildScreening[]> {
    const screenings = await db
      .select()
      .from(childScreenings);
    
    return screenings.map(screening => ({
      ...screening,
      images: screening.images ? JSON.parse(screening.images) : null
    }));
  }
  
  async getChildScreening(id: number): Promise<ChildScreening | undefined> {
    const [screening] = await db
      .select()
      .from(childScreenings)
      .where(eq(childScreenings.id, id));
      
    if (!screening) return undefined;
    
    return {
      ...screening,
      images: screening.images ? JSON.parse(screening.images) : null
    };
  }
  
  async createChildScreening(screening: InsertChildScreening): Promise<ChildScreening> {
    // Handle images array by converting to JSON string
    const screeningData = {
      ...screening,
      images: screening.images ? JSON.stringify(screening.images) : null
    };
    
    const [createdScreening] = await db
      .insert(childScreenings)
      .values(screeningData)
      .returning();
    
    return {
      ...createdScreening,
      images: createdScreening.images ? JSON.parse(createdScreening.images) : null
    };
  }
  
  // ===== Screened Children =====
  async getScreenedChildrenByScreeningId(screeningId: number): Promise<ScreenedChild[]> {
    const children = await db
      .select()
      .from(screenedChildren)
      .where(eq(screenedChildren.screeningId, screeningId));
      
    return children.map(child => ({
      ...child,
      images: child.images ? JSON.parse(child.images) : null
    }));
  }
  
  async getChildrenStatsByScreeningIds(screeningIds: number[]): Promise<Record<number, any>> {
    const stats: Record<number, any> = {};
    
    // Initialize stats for all screening IDs
    screeningIds.forEach(id => {
      stats[id] = {
        total: 0,
        normal: 0,
        mam: 0,
        sam: 0
      };
    });
    
    // Use SQL to calculate stats for each screening
    const results = await db.execute(sql`
      SELECT 
        screening_id, 
        COUNT(*) as total,
        SUM(CASE WHEN nutrition_status = 'Normal' THEN 1 ELSE 0 END) as normal,
        SUM(CASE WHEN nutrition_status = 'MAM' THEN 1 ELSE 0 END) as mam,
        SUM(CASE WHEN nutrition_status = 'SAM' THEN 1 ELSE 0 END) as sam
      FROM screened_children
      WHERE screening_id IN (${screeningIds.join(',')})
      GROUP BY screening_id
    `);
    
    // Update stats with actual values
    results.forEach((row: any) => {
      stats[row.screening_id] = {
        total: parseInt(row.total),
        normal: parseInt(row.normal),
        mam: parseInt(row.mam),
        sam: parseInt(row.sam)
      };
    });
    
    return stats;
  }
  
  async createScreenedChild(child: InsertScreenedChild): Promise<ScreenedChild> {
    // Handle images array by converting to JSON string
    const childData = {
      ...child,
      images: child.images ? JSON.stringify(child.images) : null
    };
    
    const [createdChild] = await db
      .insert(screenedChildren)
      .values(childData)
      .returning();
    
    return {
      ...createdChild,
      images: createdChild.images ? JSON.parse(createdChild.images) : null
    };
  }
  
  // ===== Blogs =====
  async getAllBlogs(): Promise<Blog[]> {
    return db.select().from(blogs);
  }
  
  async getBlog(id: number): Promise<Blog | undefined> {
    const [blog] = await db
      .select()
      .from(blogs)
      .where(eq(blogs.id, id));
      
    return blog || undefined;
  }
  
  async createBlog(blog: InsertBlog): Promise<Blog> {
    const [createdBlog] = await db
      .insert(blogs)
      .values(blog)
      .returning();
    
    return createdBlog;
  }
  
  async updateBlog(id: number, blog: Partial<InsertBlog>): Promise<Blog | undefined> {
    const [updatedBlog] = await db
      .update(blogs)
      .set({ 
        ...blog, 
        updatedAt: new Date() 
      })
      .where(eq(blogs.id, id))
      .returning();
    
    return updatedBlog || undefined;
  }
  
  async deleteBlog(id: number): Promise<void> {
    await db
      .delete(blogs)
      .where(eq(blogs.id, id));
  }
  
  // ===== Offline Sync =====
  async storePendingSync(userId: number, entityType: string, entityData: any): Promise<void> {
    await db
      .insert(pendingSyncItems)
      .values({
        userId,
        entityType,
        entityData,
        synced: false
      });
  }
  
  async getPendingSyncItems(userId: number): Promise<any[]> {
    return db
      .select()
      .from(pendingSyncItems)
      .where(
        and(
          eq(pendingSyncItems.userId, userId),
          eq(pendingSyncItems.synced, false)
        )
      );
  }
  
  async markSyncItemAsSynced(id: number): Promise<void> {
    await db
      .update(pendingSyncItems)
      .set({ 
        synced: true, 
        syncedAt: new Date() 
      })
      .where(eq(pendingSyncItems.id, id));
  }
}

// Use Database storage
export const storage = new DatabaseStorage();
