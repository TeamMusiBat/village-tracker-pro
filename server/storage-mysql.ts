import { type User, type InsertUser, type AwarenessSession, type InsertAwarenessSession, type Attendee, type InsertAttendee, type ChildScreening, type InsertChildScreening, type ScreenedChild, type InsertScreenedChild, type Blog, type InsertBlog } from "@shared/schema";
import bcrypt from 'bcryptjs';
import { query } from './database';
import { ResultSetHeader } from 'mysql2';
import { log } from './vite';

// Interface defining all storage operations
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

// MySQL storage implementation
export class MySQLStorage implements IStorage {
  // User Management
  async getUser(id: number): Promise<User | undefined> {
    try {
      const users = await query(
        'SELECT id, username, password, role, name, email, is_online, created_at, updated_at FROM users WHERE id = ?',
        [id]
      ) as any[];
      
      return users.length > 0 ? this.mapUserFromDatabase(users[0]) : undefined;
    } catch (error) {
      console.error('Error getting user by id:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const users = await query(
        'SELECT id, username, password, role, name, email, is_online, created_at, updated_at FROM users WHERE username = ?',
        [username]
      ) as any[];
      
      return users.length > 0 ? this.mapUserFromDatabase(users[0]) : undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      // Insert user
      const result = await query(
        'INSERT INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)',
        [user.username, hashedPassword, user.role, user.name, user.email]
      ) as ResultSetHeader;
      
      const userId = result.insertId;
      
      // Return created user
      return {
        id: userId,
        username: user.username,
        password: hashedPassword, // Note: In real applications, don't return the hashed password
        role: user.role,
        name: user.name,
        email: user.email,
        isOnline: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const users = await query(
        'SELECT id, username, password, role, name, email, is_online, created_at, updated_at FROM users'
      ) as any[];
      
      return users.map(user => this.mapUserFromDatabase(user));
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  async getOnlineUsers(): Promise<User[]> {
    try {
      const users = await query(
        'SELECT id, username, password, role, name, email, is_online, created_at, updated_at FROM users WHERE is_online = TRUE'
      ) as any[];
      
      return users.map(user => this.mapUserFromDatabase(user));
    } catch (error) {
      console.error('Error getting online users:', error);
      throw error;
    }
  }

  async updateUserStatus(userId: number, isOnline: boolean, timestamp: Date): Promise<void> {
    try {
      await query(
        'UPDATE users SET is_online = ?, last_active = ? WHERE id = ?',
        [isOnline, timestamp, userId]
      );
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  async updateUserLocation(userId: number, latitude: number, longitude: number): Promise<void> {
    try {
      await query(
        'INSERT INTO user_locations (user_id, latitude, longitude) VALUES (?, ?, ?)',
        [userId, latitude, longitude]
      );
    } catch (error) {
      console.error('Error updating user location:', error);
      throw error;
    }
  }

  async getUserLocationHistory(userId: number): Promise<any[]> {
    try {
      const locations = await query(
        'SELECT latitude, longitude, timestamp FROM user_locations WHERE user_id = ? ORDER BY timestamp DESC',
        [userId]
      ) as any[];
      
      return locations;
    } catch (error) {
      console.error('Error getting user location history:', error);
      throw error;
    }
  }

  async deleteUser(userId: number): Promise<void> {
    try {
      await query('DELETE FROM users WHERE id = ?', [userId]);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Awareness Sessions
  async getAllAwarenessSessions(): Promise<AwarenessSession[]> {
    try {
      const sessions = await query(`
        SELECT a.*, u.name as creator_name
        FROM awareness_sessions a
        JOIN users u ON a.created_by = u.id
        ORDER BY a.session_date DESC
      `) as any[];
      
      return sessions.map(session => this.mapSessionFromDatabase(session));
    } catch (error) {
      console.error('Error getting all awareness sessions:', error);
      throw error;
    }
  }

  async getRecentAwarenessSessions(limit: number): Promise<AwarenessSession[]> {
    try {
      const sessions = await query(`
        SELECT a.*, u.name as creator_name
        FROM awareness_sessions a
        JOIN users u ON a.created_by = u.id
        ORDER BY a.session_date DESC
        LIMIT ?
      `, [limit]) as any[];
      
      return sessions.map(session => this.mapSessionFromDatabase(session));
    } catch (error) {
      console.error('Error getting recent awareness sessions:', error);
      throw error;
    }
  }

  async getAwarenessSession(id: number): Promise<AwarenessSession | undefined> {
    try {
      const sessions = await query(`
        SELECT a.*, u.name as creator_name
        FROM awareness_sessions a
        JOIN users u ON a.created_by = u.id
        WHERE a.id = ?
      `, [id]) as any[];
      
      return sessions.length > 0 ? this.mapSessionFromDatabase(sessions[0]) : undefined;
    } catch (error) {
      console.error('Error getting awareness session:', error);
      throw error;
    }
  }

  async createAwarenessSession(session: InsertAwarenessSession): Promise<AwarenessSession> {
    try {
      const result = await query(`
        INSERT INTO awareness_sessions (
          title, location, session_date, session_number, target_group, 
          created_by, latitude, longitude, images
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        session.title, 
        session.location, 
        session.sessionDate, 
        session.sessionNumber, 
        session.targetGroup,
        session.createdBy, 
        session.latitude, 
        session.longitude, 
        JSON.stringify(session.images || [])
      ]) as ResultSetHeader;
      
      const sessionId = result.insertId;
      
      // Get created session
      const createdSession = await this.getAwarenessSession(sessionId);
      if (!createdSession) {
        throw new Error('Failed to retrieve created session');
      }
      
      return createdSession;
    } catch (error) {
      console.error('Error creating awareness session:', error);
      throw error;
    }
  }

  // Attendees
  async getAttendeesBySessionId(sessionId: number): Promise<Attendee[]> {
    try {
      const attendees = await query(`
        SELECT * FROM attendees
        WHERE session_id = ?
        ORDER BY created_at
      `, [sessionId]) as any[];
      
      return attendees.map(attendee => this.mapAttendeeFromDatabase(attendee));
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
      
      const placeholders = sessionIds.map(() => '?').join(',');
      const counts = await query(`
        SELECT session_id, COUNT(*) as count
        FROM attendees
        WHERE session_id IN (${placeholders})
        GROUP BY session_id
      `, sessionIds) as any[];
      
      const result: Record<number, number> = {};
      counts.forEach(row => {
        result[row.session_id] = row.count;
      });
      
      return result;
    } catch (error) {
      console.error('Error getting attendee counts:', error);
      throw error;
    }
  }

  async createAttendee(attendee: InsertAttendee): Promise<Attendee> {
    try {
      const result = await query(`
        INSERT INTO attendees (
          session_id, name, father_or_husband_name, gender, age_years, 
          date_of_birth, children_under_five, vaccination_status,
          vaccine_due, vaccine_card_image, contact_number, remarks, images
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        attendee.sessionId,
        attendee.name,
        attendee.fatherOrHusbandName,
        attendee.gender || 'Male',
        attendee.ageYears,
        attendee.dateOfBirth,
        attendee.childrenUnderFive,
        attendee.vaccinationStatus,
        attendee.vaccineDue,
        attendee.vaccineCardImage,
        attendee.contactNumber || '',
        attendee.remarks || '',
        JSON.stringify(attendee.images || [])
      ]) as ResultSetHeader;
      
      const attendeeId = result.insertId;
      
      // Return created attendee
      return {
        id: attendeeId,
        sessionId: attendee.sessionId,
        name: attendee.name,
        fatherOrHusbandName: attendee.fatherOrHusbandName,
        gender: attendee.gender || 'Male',
        ageYears: attendee.ageYears,
        dateOfBirth: attendee.dateOfBirth,
        childrenUnderFive: attendee.childrenUnderFive,
        vaccinationStatus: attendee.vaccinationStatus,
        vaccineDue: attendee.vaccineDue,
        vaccineCardImage: attendee.vaccineCardImage,
        contactNumber: attendee.contactNumber || '',
        remarks: attendee.remarks || '',
        images: attendee.images || [],
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error creating attendee:', error);
      throw error;
    }
  }

  // Child Screenings
  async getAllChildScreenings(): Promise<ChildScreening[]> {
    try {
      const screenings = await query(`
        SELECT c.*, u.name as creator_name
        FROM child_screenings c
        JOIN users u ON c.created_by = u.id
        ORDER BY c.screening_date DESC
      `) as any[];
      
      return screenings.map(screening => this.mapScreeningFromDatabase(screening));
    } catch (error) {
      console.error('Error getting all child screenings:', error);
      throw error;
    }
  }

  async getChildScreening(id: number): Promise<ChildScreening | undefined> {
    try {
      const screenings = await query(`
        SELECT c.*, u.name as creator_name
        FROM child_screenings c
        JOIN users u ON c.created_by = u.id
        WHERE c.id = ?
      `, [id]) as any[];
      
      return screenings.length > 0 ? this.mapScreeningFromDatabase(screenings[0]) : undefined;
    } catch (error) {
      console.error('Error getting child screening:', error);
      throw error;
    }
  }

  async createChildScreening(screening: InsertChildScreening): Promise<ChildScreening> {
    try {
      const result = await query(`
        INSERT INTO child_screenings (
          title, location, screening_date, created_by, latitude, longitude, images
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        screening.title,
        screening.location,
        screening.screeningDate,
        screening.createdBy,
        screening.latitude,
        screening.longitude,
        JSON.stringify(screening.images || [])
      ]) as ResultSetHeader;
      
      const screeningId = result.insertId;
      
      // Get created screening
      const createdScreening = await this.getChildScreening(screeningId);
      if (!createdScreening) {
        throw new Error('Failed to retrieve created screening');
      }
      
      return createdScreening;
    } catch (error) {
      console.error('Error creating child screening:', error);
      throw error;
    }
  }

  // Screened Children
  async getScreenedChildrenByScreeningId(screeningId: number): Promise<ScreenedChild[]> {
    try {
      const children = await query(`
        SELECT * FROM screened_children
        WHERE screening_id = ?
        ORDER BY created_at
      `, [screeningId]) as any[];
      
      return children.map(child => this.mapScreenedChildFromDatabase(child));
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
      
      const placeholders = screeningIds.map(() => '?').join(',');
      const stats = await query(`
        SELECT 
          screening_id,
          COUNT(*) as total,
          SUM(CASE WHEN nutrition_status = 'Normal' THEN 1 ELSE 0 END) as normal,
          SUM(CASE WHEN nutrition_status = 'MAM' THEN 1 ELSE 0 END) as mam,
          SUM(CASE WHEN nutrition_status = 'SAM' THEN 1 ELSE 0 END) as sam,
          SUM(CASE WHEN referred = TRUE THEN 1 ELSE 0 END) as referred
        FROM screened_children
        WHERE screening_id IN (${placeholders})
        GROUP BY screening_id
      `, screeningIds) as any[];
      
      const result: Record<number, any> = {};
      stats.forEach(row => {
        result[row.screening_id] = {
          total: row.total,
          normal: row.normal,
          mam: row.mam,
          sam: row.sam,
          referred: row.referred
        };
      });
      
      return result;
    } catch (error) {
      console.error('Error getting children stats:', error);
      throw error;
    }
  }

  async createScreenedChild(child: InsertScreenedChild): Promise<ScreenedChild> {
    try {
      const result = await query(`
        INSERT INTO screened_children (
          screening_id, child_name, father_name, gender, date_of_birth,
          age_months, height, weight, muac, nutrition_status, referred, images
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        child.screeningId,
        child.childName,
        child.fatherName,
        child.gender,
        child.dateOfBirth,
        child.ageMonths,
        child.height,
        child.weight,
        child.muac,
        child.nutritionStatus,
        child.referred,
        JSON.stringify(child.images || [])
      ]) as ResultSetHeader;
      
      const childId = result.insertId;
      
      // Return created child
      return {
        id: childId,
        screeningId: child.screeningId,
        childName: child.childName,
        fatherName: child.fatherName,
        gender: child.gender,
        dateOfBirth: child.dateOfBirth,
        ageMonths: child.ageMonths,
        height: child.height,
        weight: child.weight,
        muac: child.muac,
        nutritionStatus: child.nutritionStatus,
        referred: child.referred,
        images: child.images || [],
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error creating screened child:', error);
      throw error;
    }
  }

  // Blogs
  async getAllBlogs(): Promise<Blog[]> {
    try {
      const blogs = await query(`
        SELECT b.*, u.name as author_name
        FROM blogs b
        JOIN users u ON b.author_id = u.id
        ORDER BY b.created_at DESC
      `) as any[];
      
      return blogs.map(blog => this.mapBlogFromDatabase(blog));
    } catch (error) {
      console.error('Error getting all blogs:', error);
      throw error;
    }
  }

  async getBlog(id: number): Promise<Blog | undefined> {
    try {
      const blogs = await query(`
        SELECT b.*, u.name as author_name
        FROM blogs b
        JOIN users u ON b.author_id = u.id
        WHERE b.id = ?
      `, [id]) as any[];
      
      return blogs.length > 0 ? this.mapBlogFromDatabase(blogs[0]) : undefined;
    } catch (error) {
      console.error('Error getting blog:', error);
      throw error;
    }
  }

  async createBlog(blog: InsertBlog): Promise<Blog> {
    try {
      const result = await query(`
        INSERT INTO blogs (title, content, author_id, image_url, published)
        VALUES (?, ?, ?, ?, ?)
      `, [
        blog.title,
        blog.content,
        blog.authorId,
        blog.imageUrl,
        blog.published
      ]) as ResultSetHeader;
      
      const blogId = result.insertId;
      
      // Get created blog
      const createdBlog = await this.getBlog(blogId);
      if (!createdBlog) {
        throw new Error('Failed to retrieve created blog');
      }
      
      return createdBlog;
    } catch (error) {
      console.error('Error creating blog:', error);
      throw error;
    }
  }

  async updateBlog(id: number, blog: Partial<InsertBlog>): Promise<Blog | undefined> {
    try {
      const currentBlog = await this.getBlog(id);
      if (!currentBlog) {
        return undefined;
      }
      
      const updates: { field: string, value: any }[] = [];
      
      if (blog.title !== undefined) updates.push({ field: 'title', value: blog.title });
      if (blog.content !== undefined) updates.push({ field: 'content', value: blog.content });
      if (blog.imageUrl !== undefined) updates.push({ field: 'image_url', value: blog.imageUrl });
      if (blog.published !== undefined) updates.push({ field: 'published', value: blog.published });
      
      if (updates.length === 0) {
        return currentBlog;
      }
      
      const setClause = updates.map(update => `${update.field} = ?`).join(', ');
      const values = updates.map(update => update.value);
      
      await query(`UPDATE blogs SET ${setClause} WHERE id = ?`, [...values, id]);
      
      return this.getBlog(id);
    } catch (error) {
      console.error('Error updating blog:', error);
      throw error;
    }
  }

  async deleteBlog(id: number): Promise<void> {
    try {
      await query('DELETE FROM blogs WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting blog:', error);
      throw error;
    }
  }

  // Offline Sync
  async storePendingSync(userId: number, entityType: string, entityData: any): Promise<void> {
    try {
      await query(`
        INSERT INTO pending_sync_items (user_id, entity_type, entity_data)
        VALUES (?, ?, ?)
      `, [userId, entityType, JSON.stringify(entityData)]);
    } catch (error) {
      console.error('Error storing pending sync item:', error);
      throw error;
    }
  }

  async getPendingSyncItems(userId: number): Promise<any[]> {
    try {
      const items = await query(`
        SELECT id, entity_type, entity_data, created_at
        FROM pending_sync_items
        WHERE user_id = ? AND synced = FALSE
        ORDER BY created_at
      `, [userId]) as any[];
      
      return items.map(item => ({
        id: item.id,
        entityType: item.entity_type,
        entityData: JSON.parse(item.entity_data),
        createdAt: item.created_at
      }));
    } catch (error) {
      console.error('Error getting pending sync items:', error);
      throw error;
    }
  }

  async markSyncItemAsSynced(id: number): Promise<void> {
    try {
      await query(`
        UPDATE pending_sync_items
        SET synced = TRUE, synced_at = NOW()
        WHERE id = ?
      `, [id]);
    } catch (error) {
      console.error('Error marking sync item as synced:', error);
      throw error;
    }
  }

  // Helper methods to map database records to application objects
  private mapUserFromDatabase(dbUser: any): User {
    return {
      id: dbUser.id,
      username: dbUser.username,
      password: dbUser.password,
      role: dbUser.role,
      name: dbUser.name,
      email: dbUser.email,
      isOnline: dbUser.is_online === 1,
      createdAt: new Date(dbUser.created_at),
      updatedAt: new Date(dbUser.updated_at)
    };
  }

  private mapSessionFromDatabase(dbSession: any): AwarenessSession {
    return {
      id: dbSession.id,
      title: dbSession.title,
      location: dbSession.location,
      sessionDate: dbSession.session_date,
      sessionNumber: dbSession.session_number,
      targetGroup: dbSession.target_group,
      createdBy: dbSession.created_by,
      creatorName: dbSession.creator_name,
      latitude: dbSession.latitude,
      longitude: dbSession.longitude,
      images: dbSession.images ? JSON.parse(dbSession.images) : [],
      createdAt: new Date(dbSession.created_at)
    };
  }

  private mapAttendeeFromDatabase(dbAttendee: any): Attendee {
    return {
      id: dbAttendee.id,
      sessionId: dbAttendee.session_id,
      name: dbAttendee.name,
      fatherOrHusbandName: dbAttendee.father_or_husband_name,
      gender: dbAttendee.gender,
      ageYears: dbAttendee.age_years,
      dateOfBirth: dbAttendee.date_of_birth,
      childrenUnderFive: dbAttendee.children_under_five,
      vaccinationStatus: dbAttendee.vaccination_status,
      vaccineDue: dbAttendee.vaccine_due === 1,
      vaccineCardImage: dbAttendee.vaccine_card_image,
      contactNumber: dbAttendee.contact_number,
      remarks: dbAttendee.remarks,
      images: dbAttendee.images ? JSON.parse(dbAttendee.images) : [],
      createdAt: new Date(dbAttendee.created_at)
    };
  }

  private mapScreeningFromDatabase(dbScreening: any): ChildScreening {
    return {
      id: dbScreening.id,
      title: dbScreening.title,
      location: dbScreening.location,
      screeningDate: dbScreening.screening_date,
      createdBy: dbScreening.created_by,
      creatorName: dbScreening.creator_name,
      latitude: dbScreening.latitude,
      longitude: dbScreening.longitude,
      images: dbScreening.images ? JSON.parse(dbScreening.images) : [],
      createdAt: new Date(dbScreening.created_at)
    };
  }

  private mapScreenedChildFromDatabase(dbChild: any): ScreenedChild {
    return {
      id: dbChild.id,
      screeningId: dbChild.screening_id,
      childName: dbChild.child_name,
      fatherName: dbChild.father_name,
      gender: dbChild.gender,
      dateOfBirth: dbChild.date_of_birth,
      ageMonths: dbChild.age_months,
      height: dbChild.height,
      weight: dbChild.weight,
      muac: dbChild.muac,
      nutritionStatus: dbChild.nutrition_status,
      referred: dbChild.referred === 1,
      images: dbChild.images ? JSON.parse(dbChild.images) : [],
      createdAt: new Date(dbChild.created_at)
    };
  }

  private mapBlogFromDatabase(dbBlog: any): Blog {
    return {
      id: dbBlog.id,
      title: dbBlog.title,
      content: dbBlog.content,
      authorId: dbBlog.author_id,
      authorName: dbBlog.author_name,
      imageUrl: dbBlog.image_url,
      published: dbBlog.published === 1,
      createdAt: new Date(dbBlog.created_at),
      updatedAt: new Date(dbBlog.updated_at)
    };
  }
}

export const storage = new MySQLStorage();