import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { 
  User, InsertUser, AwarenessSession, InsertAwarenessSession,
  Attendee, InsertAttendee, ChildScreening, InsertChildScreening,
  ScreenedChild, InsertScreenedChild, Blog, InsertBlog
} from '@shared/schema';
import { IStorage } from './storage';

// JSON file paths
const DATA_DIR = path.join(process.cwd(), 'json-data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'awareness-sessions.json');
const ATTENDEES_FILE = path.join(DATA_DIR, 'attendees.json');
const SCREENINGS_FILE = path.join(DATA_DIR, 'child-screenings.json');
const CHILDREN_FILE = path.join(DATA_DIR, 'screened-children.json');
const BLOGS_FILE = path.join(DATA_DIR, 'blogs.json');
const LOCATIONS_FILE = path.join(DATA_DIR, 'user-locations.json');
const SYNC_FILE = path.join(DATA_DIR, 'pending-sync.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper functions
function readJsonFile<T>(filePath: string, defaultValue: T[] = []): T[] {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    return defaultValue as T[];
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return defaultValue as T[];
  }
}

function writeJsonFile<T>(filePath: string, data: T[]): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
  }
}

function getNextId<T extends { id: number }>(items: T[]): number {
  return items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;
}

export class JsonStorage implements IStorage {
  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    const users = readJsonFile<User>(USERS_FILE);
    
    // Create default admin if no users exist
    if (users.length === 0) {
      const defaultUsers: User[] = [
        {
          id: 1,
          username: 'admin',
          password: bcrypt.hashSync('admin123', 10),
          name: 'Administrator',
          fullName: 'Administrator',
          role: 'developer',
          email: 'admin@track4health.com',
          isOnline: false,
          lastActive: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          username: 'user',
          password: bcrypt.hashSync('user123', 10),
          name: 'Field Worker',
          fullName: 'Field Worker',
          role: 'fmt',
          email: 'user@track4health.com',
          isOnline: false,
          lastActive: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      writeJsonFile(USERS_FILE, defaultUsers);
    }
  }

  // User Management
  async getUser(id: number): Promise<User | undefined> {
    const users = readJsonFile<User>(USERS_FILE);
    const user = users.find(user => user.id === id);
    if (user && !user.fullName) {
      user.fullName = user.name; // Ensure fullName exists
    }
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = readJsonFile<User>(USERS_FILE);
    const user = users.find(user => user.username === username);
    if (user && !user.fullName) {
      user.fullName = user.name; // Ensure fullName exists
    }
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const users = readJsonFile<User>(USERS_FILE);
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    
    const newUser: User = {
      ...insertUser,
      id: getNextId(users),
      password: hashedPassword,
      fullName: insertUser.name,
      isOnline: false,
      lastActive: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    users.push(newUser);
    writeJsonFile(USERS_FILE, users);
    return newUser;
  }

  async getAllUsers(): Promise<User[]> {
    const users = readJsonFile<User>(USERS_FILE);
    return users.map(user => ({
      ...user,
      fullName: user.fullName || user.name
    }));
  }

  async getOnlineUsers(): Promise<User[]> {
    const users = readJsonFile<User>(USERS_FILE);
    return users.filter(user => user.isOnline);
  }

  async updateUserStatus(userId: number, isOnline: boolean, timestamp: Date): Promise<void> {
    const users = readJsonFile<User>(USERS_FILE);
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex !== -1) {
      users[userIndex].isOnline = isOnline;
      users[userIndex].lastActive = timestamp;
      writeJsonFile(USERS_FILE, users);
    }
  }

  async updateUserLocation(userId: number, latitude: number, longitude: number): Promise<void> {
    const locations = readJsonFile<any>(LOCATIONS_FILE);
    locations.push({
      id: getNextId(locations),
      userId,
      latitude,
      longitude,
      timestamp: new Date()
    });
    writeJsonFile(LOCATIONS_FILE, locations);
  }

  async getUserLocationHistory(userId: number): Promise<any[]> {
    const locations = readJsonFile<any>(LOCATIONS_FILE);
    return locations.filter(loc => loc.userId === userId);
  }

  async deleteUser(userId: number): Promise<void> {
    const users = readJsonFile<User>(USERS_FILE);
    const filteredUsers = users.filter(user => user.id !== userId);
    writeJsonFile(USERS_FILE, filteredUsers);
  }

  // Awareness Sessions
  async getAllAwarenessSessions(): Promise<AwarenessSession[]> {
    const sessions = readJsonFile<AwarenessSession>(SESSIONS_FILE);
    return sessions.map(session => ({
      ...session,
      sessionDate: new Date(session.sessionDate),
      createdAt: session.createdAt ? new Date(session.createdAt) : null
    }));
  }

  async getRecentAwarenessSessions(limit: number): Promise<AwarenessSession[]> {
    const sessions = await this.getAllAwarenessSessions();
    return sessions.slice(0, limit);
  }

  async getAwarenessSession(id: number): Promise<AwarenessSession | undefined> {
    const sessions = await this.getAllAwarenessSessions();
    return sessions.find(session => session.id === id);
  }

  async createAwarenessSession(insertSession: InsertAwarenessSession): Promise<AwarenessSession> {
    const sessions = readJsonFile<AwarenessSession>(SESSIONS_FILE);
    const newSession: AwarenessSession = {
      ...insertSession,
      id: getNextId(sessions),
      createdAt: new Date()
    };

    sessions.push(newSession);
    writeJsonFile(SESSIONS_FILE, sessions);
    return newSession;
  }

  // Attendees
  async getAttendeesBySessionId(sessionId: number): Promise<Attendee[]> {
    const attendees = readJsonFile<Attendee>(ATTENDEES_FILE);
    return attendees.filter(attendee => attendee.sessionId === sessionId);
  }

  async getAttendeeCountsBySessionIds(sessionIds: number[]): Promise<Record<number, number>> {
    const attendees = readJsonFile<Attendee>(ATTENDEES_FILE);
    const counts: Record<number, number> = {};
    
    sessionIds.forEach(id => {
      counts[id] = attendees.filter(attendee => attendee.sessionId === id).length;
    });
    
    return counts;
  }

  async createAttendee(insertAttendee: InsertAttendee): Promise<Attendee> {
    const attendees = readJsonFile<Attendee>(ATTENDEES_FILE);
    const newAttendee: Attendee = {
      ...insertAttendee,
      id: getNextId(attendees),
      createdAt: new Date()
    };

    attendees.push(newAttendee);
    writeJsonFile(ATTENDEES_FILE, attendees);
    return newAttendee;
  }

  // Child Screenings
  async getAllChildScreenings(): Promise<ChildScreening[]> {
    const screenings = readJsonFile<ChildScreening>(SCREENINGS_FILE);
    return screenings.map(screening => ({
      ...screening,
      screeningDate: new Date(screening.screeningDate),
      createdAt: screening.createdAt ? new Date(screening.createdAt) : null
    }));
  }

  async getChildScreening(id: number): Promise<ChildScreening | undefined> {
    const screenings = await this.getAllChildScreenings();
    return screenings.find(screening => screening.id === id);
  }

  async createChildScreening(insertScreening: InsertChildScreening): Promise<ChildScreening> {
    const screenings = readJsonFile<ChildScreening>(SCREENINGS_FILE);
    const newScreening: ChildScreening = {
      ...insertScreening,
      id: getNextId(screenings),
      createdAt: new Date()
    };

    screenings.push(newScreening);
    writeJsonFile(SCREENINGS_FILE, screenings);
    return newScreening;
  }

  // Screened Children
  async getScreenedChildrenByScreeningId(screeningId: number): Promise<ScreenedChild[]> {
    const children = readJsonFile<ScreenedChild>(CHILDREN_FILE);
    return children.filter(child => child.screeningId === screeningId);
  }

  async getChildrenStatsByScreeningIds(screeningIds: number[]): Promise<Record<number, any>> {
    const children = readJsonFile<ScreenedChild>(CHILDREN_FILE);
    const stats: Record<number, any> = {};
    
    screeningIds.forEach(id => {
      const screeningChildren = children.filter(child => child.screeningId === id);
      stats[id] = {
        total: screeningChildren.length,
        normal: screeningChildren.filter(child => child.nutritionStatus === 'Normal').length,
        mam: screeningChildren.filter(child => child.nutritionStatus === 'MAM').length,
        sam: screeningChildren.filter(child => child.nutritionStatus === 'SAM').length,
        referred: screeningChildren.filter(child => child.referred === true).length
      };
    });
    
    return stats;
  }

  async createScreenedChild(insertChild: InsertScreenedChild): Promise<ScreenedChild> {
    const children = readJsonFile<ScreenedChild>(CHILDREN_FILE);
    const newChild: ScreenedChild = {
      ...insertChild,
      id: getNextId(children),
      createdAt: new Date()
    };

    children.push(newChild);
    writeJsonFile(CHILDREN_FILE, children);
    return newChild;
  }

  // Blogs
  async getAllBlogs(): Promise<Blog[]> {
    const blogs = readJsonFile<Blog>(BLOGS_FILE);
    return blogs.map(blog => ({
      ...blog,
      createdAt: blog.createdAt ? new Date(blog.createdAt) : null,
      updatedAt: blog.updatedAt ? new Date(blog.updatedAt) : null
    }));
  }

  async getBlog(id: number): Promise<Blog | undefined> {
    const blogs = await this.getAllBlogs();
    return blogs.find(blog => blog.id === id);
  }

  async createBlog(insertBlog: InsertBlog): Promise<Blog> {
    const blogs = readJsonFile<Blog>(BLOGS_FILE);
    const newBlog: Blog = {
      ...insertBlog,
      id: getNextId(blogs),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    blogs.push(newBlog);
    writeJsonFile(BLOGS_FILE, blogs);
    return newBlog;
  }

  async updateBlog(id: number, updateData: Partial<InsertBlog>): Promise<Blog | undefined> {
    const blogs = readJsonFile<Blog>(BLOGS_FILE);
    const blogIndex = blogs.findIndex(blog => blog.id === id);
    
    if (blogIndex !== -1) {
      blogs[blogIndex] = {
        ...blogs[blogIndex],
        ...updateData,
        updatedAt: new Date()
      };
      writeJsonFile(BLOGS_FILE, blogs);
      return blogs[blogIndex];
    }
    
    return undefined;
  }

  async deleteBlog(id: number): Promise<void> {
    const blogs = readJsonFile<Blog>(BLOGS_FILE);
    const filteredBlogs = blogs.filter(blog => blog.id !== id);
    writeJsonFile(BLOGS_FILE, filteredBlogs);
  }

  // Offline Sync
  async storePendingSync(userId: number, entityType: string, entityData: any): Promise<void> {
    const syncItems = readJsonFile<any>(SYNC_FILE);
    syncItems.push({
      id: getNextId(syncItems),
      userId,
      entityType,
      entityData,
      synced: false,
      createdAt: new Date(),
      syncedAt: null
    });
    writeJsonFile(SYNC_FILE, syncItems);
  }

  async getPendingSyncItems(userId: number): Promise<any[]> {
    const syncItems = readJsonFile<any>(SYNC_FILE);
    return syncItems.filter(item => item.userId === userId && !item.synced);
  }

  async markSyncItemAsSynced(id: number): Promise<void> {
    const syncItems = readJsonFile<any>(SYNC_FILE);
    const itemIndex = syncItems.findIndex(item => item.id === id);
    
    if (itemIndex !== -1) {
      syncItems[itemIndex].synced = true;
      syncItems[itemIndex].syncedAt = new Date();
      writeJsonFile(SYNC_FILE, syncItems);
    }
  }
}
