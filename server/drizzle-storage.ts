import { 
  type User, type InsertUser,
  type AwarenessSession, type InsertAwarenessSession,
  type Attendee, type InsertAttendee,
  type ChildScreening, type InsertChildScreening,
  type ScreenedChild, type InsertScreenedChild,
  type Blog, type InsertBlog,
} from "@shared/schema";
import { 
  users, userLocations, awarenessSessions, attendees, 
  childScreenings, screenedChildren, blogs, pendingSyncItems 
} from "./drizzle-schemas";
import { IStorage } from "./storage";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { log } from "./vite";

export class DrizzleStorage implements IStorage {
  // ===== User Management =====
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user as User;
    } catch (error) {
      console.error('Error getting user by id:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user as User;
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(insertUser.password, 10);
      
      // Insert user
      const [user] = await db.insert(users).values({
        ...insertUser,
        password: hashedPassword,
        isOnline: false,
      });
      
      // Return the created user by fetching it
      const [createdUser] = await db.select().from(users).where(eq(users.id, user.insertId));
      return createdUser as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const result = await db.select().from(users);
      return result as User[];
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  async getOnlineUsers(): Promise<User[]> {
    try {
      const result = await db.select().from(users).where(eq(users.isOnline, true));
      return result as User[];
    } catch (error) {
      console.error('Error getting online users:', error);
      throw error;
    }
  }

  async updateUserStatus(userId: number, isOnline: boolean, timestamp: Date): Promise<void> {
    try {
      await db.update(users)
        .set({ isOnline, lastActive: timestamp })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  async updateUserLocation(userId: number, latitude: number, longitude: number): Promise<void> {
    try {
      await db.insert(userLocations).values({
        userId,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      });
    } catch (error) {
      console.error('Error updating user location:', error);
      throw error;
    }
  }

  async getUserLocationHistory(userId: number): Promise<any[]> {
    try {
      return await db.select({
        latitude: userLocations.latitude,
        longitude: userLocations.longitude,
        timestamp: userLocations.timestamp
      })
      .from(userLocations)
      .where(eq(userLocations.userId, userId))
      .orderBy(desc(userLocations.timestamp));
    } catch (error) {
      console.error('Error getting user location history:', error);
      throw error;
    }
  }

  async deleteUser(userId: number): Promise<void> {
    try {
      await db.delete(users).where(eq(users.id, userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // ===== Awareness Sessions =====
  async getAllAwarenessSessions(): Promise<AwarenessSession[]> {
    try {
      const sessions = await db.select().from(awarenessSessions)
        .orderBy(desc(awarenessSessions.sessionDate));
      
      return sessions.map(session => ({
        ...session,
        images: session.images ? JSON.parse(session.images) : []
      })) as AwarenessSession[];
    } catch (error) {
      console.error('Error getting all awareness sessions:', error);
      throw error;
    }
  }

  async getRecentAwarenessSessions(limit: number): Promise<AwarenessSession[]> {
    try {
      const sessions = await db.select().from(awarenessSessions)
        .orderBy(desc(awarenessSessions.sessionDate))
        .limit(limit);
      
      return sessions.map(session => ({
        ...session,
        images: session.images ? JSON.parse(session.images) : []
      })) as AwarenessSession[];
    } catch (error) {
      console.error('Error getting recent awareness sessions:', error);
      throw error;
    }
  }

  async getAwarenessSession(id: number): Promise<AwarenessSession | undefined> {
    try {
      const [session] = await db.select().from(awarenessSessions).where(eq(awarenessSessions.id, id));
      
      if (!session) return undefined;
      
      return {
        ...session,
        images: session.images ? JSON.parse(session.images) : []
      } as AwarenessSession;
    } catch (error) {
      console.error('Error getting awareness session:', error);
      throw error;
    }
  }

  async createAwarenessSession(insertSession: InsertAwarenessSession): Promise<AwarenessSession> {
    try {
      // Format image array as JSON string
      const imagesStr = insertSession.images ? JSON.stringify(insertSession.images) : JSON.stringify([]);
      
      const [result] = await db.insert(awarenessSessions).values({
        ...insertSession,
        images: imagesStr
      });
      
      // Return the created session by fetching it
      const [session] = await db.select().from(awarenessSessions).where(eq(awarenessSessions.id, result.insertId));
      
      return {
        ...session,
        images: session.images ? JSON.parse(session.images) : []
      } as AwarenessSession;
    } catch (error) {
      console.error('Error creating awareness session:', error);
      throw error;
    }
  }
  
  // ===== Attendees =====
  async getAttendeesBySessionId(sessionId: number): Promise<Attendee[]> {
    try {
      const attendeesList = await db.select().from(attendees)
        .where(eq(attendees.sessionId, sessionId))
        .orderBy(attendees.createdAt);
      
      return attendeesList.map(attendee => ({
        ...attendee,
        images: attendee.images ? JSON.parse(attendee.images) : []
      })) as Attendee[];
    } catch (error) {
      console.error('Error getting attendees by session ID:', error);
      throw error;
    }
  }

  async getAttendeeCountsBySessionIds(sessionIds: number[]): Promise<Record<number, number>> {
    try {
      if (sessionIds.length === 0) {
        return {};
      }
      
      const result: Record<number, number> = {};
      
      // Initialize counts for all session IDs
      sessionIds.forEach(id => {
        result[id] = 0;
      });
      
      // Count attendees for each session
      for (const sessionId of sessionIds) {
        const attendeesList = await db.select({
          count: attendees.id
        }).from(attendees)
          .where(eq(attendees.sessionId, sessionId));
        
        result[sessionId] = attendeesList.length;
      }
      
      return result;
    } catch (error) {
      console.error('Error getting attendee counts:', error);
      throw error;
    }
  }

  async createAttendee(insertAttendee: InsertAttendee): Promise<Attendee> {
    try {
      // Format image array as JSON string
      const imagesStr = insertAttendee.images ? JSON.stringify(insertAttendee.images) : JSON.stringify([]);
      
      const [result] = await db.insert(attendees).values({
        ...insertAttendee,
        images: imagesStr
      });
      
      // Return the created attendee by fetching it
      const [attendee] = await db.select().from(attendees).where(eq(attendees.id, result.insertId));
      
      return {
        ...attendee,
        images: attendee.images ? JSON.parse(attendee.images) : []
      } as Attendee;
    } catch (error) {
      console.error('Error creating attendee:', error);
      throw error;
    }
  }
  
  // ===== Child Screenings =====
  async getAllChildScreenings(): Promise<ChildScreening[]> {
    try {
      const screenings = await db.select().from(childScreenings)
        .orderBy(desc(childScreenings.screeningDate));
      
      return screenings.map(screening => ({
        ...screening,
        images: screening.images ? JSON.parse(screening.images) : []
      })) as ChildScreening[];
    } catch (error) {
      console.error('Error getting all child screenings:', error);
      throw error;
    }
  }

  async getChildScreening(id: number): Promise<ChildScreening | undefined> {
    try {
      const [screening] = await db.select().from(childScreenings).where(eq(childScreenings.id, id));
      
      if (!screening) return undefined;
      
      return {
        ...screening,
        images: screening.images ? JSON.parse(screening.images) : []
      } as ChildScreening;
    } catch (error) {
      console.error('Error getting child screening:', error);
      throw error;
    }
  }

  async createChildScreening(insertScreening: InsertChildScreening): Promise<ChildScreening> {
    try {
      // Format image array as JSON string
      const imagesStr = insertScreening.images ? JSON.stringify(insertScreening.images) : JSON.stringify([]);
      
      const [result] = await db.insert(childScreenings).values({
        ...insertScreening,
        images: imagesStr
      });
      
      // Return the created screening by fetching it
      const [screening] = await db.select().from(childScreenings).where(eq(childScreenings.id, result.insertId));
      
      return {
        ...screening,
        images: screening.images ? JSON.parse(screening.images) : []
      } as ChildScreening;
    } catch (error) {
      console.error('Error creating child screening:', error);
      throw error;
    }
  }
  
  // ===== Screened Children =====
  async getScreenedChildrenByScreeningId(screeningId: number): Promise<ScreenedChild[]> {
    try {
      const childrenList = await db.select().from(screenedChildren)
        .where(eq(screenedChildren.screeningId, screeningId))
        .orderBy(screenedChildren.createdAt);
      
      return childrenList.map(child => ({
        ...child,
        images: child.images ? JSON.parse(child.images) : []
      })) as ScreenedChild[];
    } catch (error) {
      console.error('Error getting screened children by screening ID:', error);
      throw error;
    }
  }

  async getChildrenStatsByScreeningIds(screeningIds: number[]): Promise<Record<number, any>> {
    try {
      if (screeningIds.length === 0) {
        return {};
      }
      
      const result: Record<number, any> = {};
      
      // Initialize stats for all screening IDs
      screeningIds.forEach(id => {
        result[id] = {
          total: 0,
          normal: 0,
          mam: 0,
          sam: 0,
          referred: 0
        };
      });
      
      // Calculate stats for each screening
      for (const screeningId of screeningIds) {
        const children = await db.select().from(screenedChildren)
          .where(eq(screenedChildren.screeningId, screeningId));
        
        if (children.length === 0) continue;
        
        const stats = {
          total: children.length,
          normal: children.filter(c => c.nutritionStatus === 'Normal').length,
          mam: children.filter(c => c.nutritionStatus === 'MAM').length,
          sam: children.filter(c => c.nutritionStatus === 'SAM').length,
          referred: children.filter(c => c.referred === true).length
        };
        
        result[screeningId] = stats;
      }
      
      return result;
    } catch (error) {
      console.error('Error getting children stats:', error);
      throw error;
    }
  }

  async createScreenedChild(insertChild: InsertScreenedChild): Promise<ScreenedChild> {
    try {
      // Format image array as JSON string
      const imagesStr = insertChild.images ? JSON.stringify(insertChild.images) : JSON.stringify([]);
      
      const [result] = await db.insert(screenedChildren).values({
        ...insertChild,
        images: imagesStr
      });
      
      // Return the created child by fetching it
      const [child] = await db.select().from(screenedChildren).where(eq(screenedChildren.id, result.insertId));
      
      return {
        ...child,
        images: child.images ? JSON.parse(child.images) : []
      } as ScreenedChild;
    } catch (error) {
      console.error('Error creating screened child:', error);
      throw error;
    }
  }
  
  // ===== Blogs =====
  async getAllBlogs(): Promise<Blog[]> {
    try {
      const blogsList = await db.select().from(blogs)
        .orderBy(desc(blogs.createdAt));
      
      return blogsList as Blog[];
    } catch (error) {
      console.error('Error getting all blogs:', error);
      throw error;
    }
  }

  async getBlog(id: number): Promise<Blog | undefined> {
    try {
      const [blog] = await db.select().from(blogs).where(eq(blogs.id, id));
      return blog as Blog;
    } catch (error) {
      console.error('Error getting blog:', error);
      throw error;
    }
  }

  async createBlog(insertBlog: InsertBlog): Promise<Blog> {
    try {
      const [result] = await db.insert(blogs).values(insertBlog);
      
      // Return the created blog by fetching it
      const [blog] = await db.select().from(blogs).where(eq(blogs.id, result.insertId));
      return blog as Blog;
    } catch (error) {
      console.error('Error creating blog:', error);
      throw error;
    }
  }

  async updateBlog(id: number, updateData: Partial<InsertBlog>): Promise<Blog | undefined> {
    try {
      await db.update(blogs)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(blogs.id, id));
      
      // Return the updated blog by fetching it
      const [updatedBlog] = await db.select().from(blogs).where(eq(blogs.id, id));
      return updatedBlog as Blog;
    } catch (error) {
      console.error('Error updating blog:', error);
      throw error;
    }
  }

  async deleteBlog(id: number): Promise<void> {
    try {
      await db.delete(blogs).where(eq(blogs.id, id));
    } catch (error) {
      console.error('Error deleting blog:', error);
      throw error;
    }
  }

  // ===== Offline Sync =====
  async storePendingSync(userId: number, entityType: string, entityData: any): Promise<void> {
    try {
      await db.insert(pendingSyncItems).values({
        userId,
        entityType,
        entityData: JSON.stringify(entityData),
        synced: false
      });
    } catch (error) {
      console.error('Error storing pending sync item:', error);
      throw error;
    }
  }

  async getPendingSyncItems(userId: number): Promise<any[]> {
    try {
      return await db.select().from(pendingSyncItems)
        .where(and(
          eq(pendingSyncItems.userId, userId),
          eq(pendingSyncItems.synced, false)
        ))
        .orderBy(pendingSyncItems.createdAt);
    } catch (error) {
      console.error('Error getting pending sync items:', error);
      throw error;
    }
  }

  async markSyncItemAsSynced(id: number): Promise<void> {
    try {
      await db.update(pendingSyncItems)
        .set({
          synced: true,
          syncedAt: new Date()
        })
        .where(eq(pendingSyncItems.id, id));
    } catch (error) {
      console.error('Error marking sync item as synced:', error);
      throw error;
    }
  }
}

// Initialize the Drizzle storage
export const drizzleStorage = new DrizzleStorage();
