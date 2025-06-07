import { 
  users, type User, type InsertUser,
  awarenessSessions, type AwarenessSession, type InsertAwarenessSession,
  attendees, type Attendee, type InsertAttendee,
  childScreenings, type ChildScreening, type InsertChildScreening,
  screenedChildren, type ScreenedChild, type InsertScreenedChild,
  blogs, type Blog, type InsertBlog,
  userLocations, pendingSyncItems
} from "@shared/schema";
import { IStorage } from "./storage";
import { db } from "./db";
import { eq, desc, and, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { log } from "./vite";

export class DrizzleStorage implements IStorage {
  // ===== User Management =====
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error('Error getting user by id:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
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
      }).returning();
      
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await db.select().from(users);
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  async getOnlineUsers(): Promise<User[]> {
    try {
      return await db.select().from(users).where(eq(users.isOnline, true));
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
        latitude,
        longitude,
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
      
      // Add creator names by fetching users
      const sessionsWithCreators: AwarenessSession[] = [];
      for (const session of sessions) {
        const [creator] = await db.select({
          name: users.name
        }).from(users).where(eq(users.id, session.createdBy));
        
        sessionsWithCreators.push({
          ...session,
          creatorName: creator?.name,
          // Convert string images to array
          images: session.images ? JSON.parse(session.images as string) : []
        });
      }
      
      return sessionsWithCreators;
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
      
      // Add creator names by fetching users
      const sessionsWithCreators: AwarenessSession[] = [];
      for (const session of sessions) {
        const [creator] = await db.select({
          name: users.name
        }).from(users).where(eq(users.id, session.createdBy));
        
        sessionsWithCreators.push({
          ...session,
          creatorName: creator?.name,
          // Convert string images to array
          images: session.images ? JSON.parse(session.images as string) : []
        });
      }
      
      return sessionsWithCreators;
    } catch (error) {
      console.error('Error getting recent awareness sessions:', error);
      throw error;
    }
  }

  async getAwarenessSession(id: number): Promise<AwarenessSession | undefined> {
    try {
      const [session] = await db.select().from(awarenessSessions).where(eq(awarenessSessions.id, id));
      
      if (!session) return undefined;
      
      // Get creator name
      const [creator] = await db.select({
        name: users.name
      }).from(users).where(eq(users.id, session.createdBy));
      
      return {
        ...session,
        creatorName: creator?.name,
        // Convert string images to array
        images: session.images ? JSON.parse(session.images as string) : []
      };
    } catch (error) {
      console.error('Error getting awareness session:', error);
      throw error;
    }
  }

  async createAwarenessSession(insertSession: InsertAwarenessSession): Promise<AwarenessSession> {
    try {
      // Format image array as JSON string
      const imagesStr = insertSession.images ? JSON.stringify(insertSession.images) : JSON.stringify([]);
      
      const [session] = await db.insert(awarenessSessions).values({
        ...insertSession,
        images: imagesStr
      }).returning();
      
      // Get creator name
      const [creator] = await db.select({
        name: users.name
      }).from(users).where(eq(users.id, session.createdBy));
      
      return {
        ...session,
        creatorName: creator?.name,
        // Convert string images to array
        images: session.images ? JSON.parse(session.images as string) : []
      };
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
        // Convert string images to array
        images: attendee.images ? JSON.parse(attendee.images as string) : []
      }));
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
      
      const [attendee] = await db.insert(attendees).values({
        ...insertAttendee,
        images: imagesStr
      }).returning();
      
      return {
        ...attendee,
        // Convert string images to array
        images: attendee.images ? JSON.parse(attendee.images as string) : []
      };
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
      
      // Add creator names by fetching users
      const screeningsWithCreators: ChildScreening[] = [];
      for (const screening of screenings) {
        const [creator] = await db.select({
          name: users.name
        }).from(users).where(eq(users.id, screening.createdBy));
        
        screeningsWithCreators.push({
          ...screening,
          creatorName: creator?.name,
          // Convert string images to array
          images: screening.images ? JSON.parse(screening.images as string) : []
        });
      }
      
      return screeningsWithCreators;
    } catch (error) {
      console.error('Error getting all child screenings:', error);
      throw error;
    }
  }

  async getChildScreening(id: number): Promise<ChildScreening | undefined> {
    try {
      const [screening] = await db.select().from(childScreenings).where(eq(childScreenings.id, id));
      
      if (!screening) return undefined;
      
      // Get creator name
      const [creator] = await db.select({
        name: users.name
      }).from(users).where(eq(users.id, screening.createdBy));
      
      return {
        ...screening,
        creatorName: creator?.name,
        // Convert string images to array
        images: screening.images ? JSON.parse(screening.images as string) : []
      };
    } catch (error) {
      console.error('Error getting child screening:', error);
      throw error;
    }
  }

  async createChildScreening(insertScreening: InsertChildScreening): Promise<ChildScreening> {
    try {
      // Format image array as JSON string
      const imagesStr = insertScreening.images ? JSON.stringify(insertScreening.images) : JSON.stringify([]);
      
      const [screening] = await db.insert(childScreenings).values({
        ...insertScreening,
        images: imagesStr
      }).returning();
      
      // Get creator name
      const [creator] = await db.select({
        name: users.name
      }).from(users).where(eq(users.id, screening.createdBy));
      
      return {
        ...screening,
        creatorName: creator?.name,
        // Convert string images to array
        images: screening.images ? JSON.parse(screening.images as string) : []
      };
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
        // Convert string images to array
        images: child.images ? JSON.parse(child.images as string) : []
      }));
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
      
      const [child] = await db.insert(screenedChildren).values({
        ...insertChild,
        images: imagesStr
      }).returning();
      
      return {
        ...child,
        // Convert string images to array
        images: child.images ? JSON.parse(child.images as string) : []
      };
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
      
      // Add author names by fetching users
      const blogsWithAuthors: Blog[] = [];
      for (const blog of blogsList) {
        const [author] = await db.select({
          name: users.name
        }).from(users).where(eq(users.id, blog.authorId));
        
        blogsWithAuthors.push({
          ...blog,
          authorName: author?.name
        });
      }
      
      return blogsWithAuthors;
    } catch (error) {
      console.error('Error getting all blogs:', error);
      throw error;
    }
  }

  async getBlog(id: number): Promise<Blog | undefined> {
    try {
      const [blog] = await db.select().from(blogs).where(eq(blogs.id, id));
      
      if (!blog) return undefined;
      
      // Get author name
      const [author] = await db.select({
        name: users.name
      }).from(users).where(eq(users.id, blog.authorId));
      
      return {
        ...blog,
        authorName: author?.name
      };
    } catch (error) {
      console.error('Error getting blog:', error);
      throw error;
    }
  }

  async createBlog(insertBlog: InsertBlog): Promise<Blog> {
    try {
      const [blog] = await db.insert(blogs).values(insertBlog).returning();
      
      // Get author name
      const [author] = await db.select({
        name: users.name
      }).from(users).where(eq(users.id, blog.authorId));
      
      return {
        ...blog,
        authorName: author?.name
      };
    } catch (error) {
      console.error('Error creating blog:', error);
      throw error;
    }
  }

  async updateBlog(id: number, updateData: Partial<InsertBlog>): Promise<Blog | undefined> {
    try {
      const [updatedBlog] = await db.update(blogs)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(blogs.id, id))
        .returning();
      
      if (!updatedBlog) return undefined;
      
      // Get author name
      const [author] = await db.select({
        name: users.name
      }).from(users).where(eq(users.id, updatedBlog.authorId));
      
      return {
        ...updatedBlog,
        authorName: author?.name
      };
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
        entityData,
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