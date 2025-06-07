import { mysqlTable, int, varchar, text, boolean, datetime, decimal, json, mysqlEnum } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Management
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  role: mysqlEnum("role", ['developer', 'master', 'fmt', 'sm']).notNull(),
  email: varchar("email", { length: 100 }),
  isOnline: boolean("is_online").default(false),
  lastActive: datetime("last_active"),
  createdAt: datetime("created_at").default(new Date()),
  updatedAt: datetime("updated_at").default(new Date())
});

export const insertUserSchema = createInsertSchema(users, {
  role: z.enum(["developer", "master", "fmt", "sm"])
}).omit({
  id: true,
  isOnline: true,
  lastActive: true,
  createdAt: true,
  updatedAt: true
});

// User Locations
export const userLocations = mysqlTable("user_locations", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  timestamp: datetime("timestamp").default(new Date())
});

// Awareness Sessions
export const awarenessSessions = mysqlTable("awareness_sessions", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  sessionDate: datetime("session_date").notNull(),
  sessionNumber: varchar("session_number", { length: 50 }),
  targetGroup: varchar("target_group", { length: 100 }),
  createdBy: int("created_by").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  images: text("images"),
  createdAt: datetime("created_at").default(new Date())
});

export const insertAwarenessSessionSchema = createInsertSchema(awarenessSessions).omit({
  id: true,
  createdAt: true
});

// Attendees for Awareness Sessions
export const attendees = mysqlTable("attendees", {
  id: int("id").primaryKey().autoincrement(),
  sessionId: int("session_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  fatherOrHusbandName: varchar("father_or_husband_name", { length: 100 }).notNull(),
  gender: mysqlEnum("gender", ["Male", "Female"]),
  ageYears: int("age_years"),
  dateOfBirth: datetime("date_of_birth"),
  childrenUnderFive: int("children_under_five"),
  vaccinationStatus: varchar("vaccination_status", { length: 50 }),
  vaccineDue: boolean("vaccine_due"),
  vaccineCardImage: text("vaccine_card_image"),
  contactNumber: varchar("contact_number", { length: 20 }),
  remarks: text("remarks"),
  images: text("images"),
  createdAt: datetime("created_at").default(new Date())
});

export const insertAttendeeSchema = createInsertSchema(attendees, {
  gender: z.enum(["Male", "Female"]).optional()
}).omit({
  id: true,
  createdAt: true
});

// Child Screening
export const childScreenings = mysqlTable("child_screenings", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  screeningDate: datetime("screening_date").notNull(),
  createdBy: int("created_by").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  images: text("images"),
  createdAt: datetime("created_at").default(new Date())
});

export const insertChildScreeningSchema = createInsertSchema(childScreenings).omit({
  id: true,
  createdAt: true
});

// Screened Children
export const screenedChildren = mysqlTable("screened_children", {
  id: int("id").primaryKey().autoincrement(),
  screeningId: int("screening_id").notNull(),
  childName: varchar("child_name", { length: 100 }).notNull(),
  fatherName: varchar("father_name", { length: 100 }).notNull(),
  gender: mysqlEnum("gender", ["Male", "Female"]).notNull(),
  dateOfBirth: datetime("date_of_birth"),
  ageMonths: int("age_months"),
  height: decimal("height", { precision: 5, scale: 2 }),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  muac: decimal("muac", { precision: 5, scale: 2 }),
  nutritionStatus: mysqlEnum("nutrition_status", ["Normal", "MAM", "SAM"]).notNull(),
  referred: boolean("referred").default(false),
  images: text("images"),
  createdAt: datetime("created_at").default(new Date())
});

export const insertScreenedChildSchema = createInsertSchema(screenedChildren, {
  gender: z.enum(["Male", "Female"]),
  nutritionStatus: z.enum(["Normal", "MAM", "SAM"])
}).omit({
  id: true,
  createdAt: true
});

// Blogs
export const blogs = mysqlTable("blogs", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  authorId: int("author_id").notNull(),
  imageUrl: text("image_url"),
  published: boolean("published").default(true),
  createdAt: datetime("created_at").default(new Date()),
  updatedAt: datetime("updated_at").default(new Date())
});

export const insertBlogSchema = createInsertSchema(blogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Pending Sync Items
export const pendingSyncItems = mysqlTable("pending_sync_items", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityData: json("entity_data").notNull(),
  synced: boolean("synced").default(false),
  createdAt: datetime("created_at").default(new Date()),
  syncedAt: datetime("synced_at")
});

// Type Definitions
export interface User {
  id: number;
  username: string;
  password: string;
  name: string;
  role: "developer" | "master" | "fmt" | "sm";
  email: string | null;
  isOnline: boolean | null;
  lastActive: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface AwarenessSession {
  id: number;
  title: string;
  location: string;
  sessionDate: Date;
  sessionNumber: string | null;
  targetGroup: string | null;
  createdBy: number;
  creatorName?: string; // Joined field - not stored in database
  latitude: number | null;
  longitude: number | null;
  images: string[] | null;
  createdAt: Date | null;
}

export interface Attendee {
  id: number;
  sessionId: number;
  name: string;
  fatherOrHusbandName: string;
  gender: "Male" | "Female" | null;
  ageYears: number | null;
  dateOfBirth: Date | null;
  childrenUnderFive: number | null;
  vaccinationStatus: string | null;
  vaccineDue: boolean | null;
  vaccineCardImage: string | null;
  contactNumber: string | null;
  remarks: string | null;
  images: string[] | null;
  createdAt: Date | null;
}

export interface ChildScreening {
  id: number;
  title: string;
  location: string;
  screeningDate: Date;
  createdBy: number;
  creatorName?: string; // Joined field - not stored in database
  latitude: number | null;
  longitude: number | null;
  images: string[] | null;
  createdAt: Date | null;
}

export interface ScreenedChild {
  id: number;
  screeningId: number;
  childName: string;
  fatherName: string;
  gender: "Male" | "Female";
  dateOfBirth: Date | null;
  ageMonths: number | null;
  height: number | null;
  weight: number | null;
  muac: number | null;
  nutritionStatus: "Normal" | "MAM" | "SAM";
  referred: boolean | null;
  images: string[] | null;
  createdAt: Date | null;
}

export interface Blog {
  id: number;
  title: string;
  content: string;
  authorId: number;
  authorName?: string; // Joined field - not stored in database
  imageUrl: string | null;
  published: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

// Export Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertAwarenessSession = z.infer<typeof insertAwarenessSessionSchema>;
export type InsertAttendee = z.infer<typeof insertAttendeeSchema>;
export type InsertChildScreening = z.infer<typeof insertChildScreeningSchema>;
export type InsertScreenedChild = z.infer<typeof insertScreenedChildSchema>;
export type InsertBlog = z.infer<typeof insertBlogSchema>;
