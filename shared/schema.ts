
import { z } from 'zod';

// User Schema
export const insertUserSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['developer', 'master', 'fmt', 'sm']),
  email: z.string().email().nullable()
});

export const userSchema = insertUserSchema.extend({
  id: z.number(),
  isOnline: z.boolean().nullable(),
  lastActive: z.date().nullable(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable()
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof userSchema> & {
  fullName: string; // Add computed property for components
  lastLocation?: {
    latitude: number;
    longitude: number;
  };
};

// Database table schemas for Drizzle
export const users = {
  id: z.number(),
  username: z.string(),
  password: z.string(),
  name: z.string(),
  role: z.enum(['developer', 'master', 'fmt', 'sm']),
  email: z.string().nullable(),
  isOnline: z.boolean().nullable(),
  lastActive: z.date().nullable(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable()
};

export const userLocations = {
  id: z.number(),
  userId: z.number(),
  latitude: z.number(),
  longitude: z.number(),
  timestamp: z.date()
};

export const pendingSyncItems = {
  id: z.number(),
  userId: z.number(),
  entityType: z.string(),
  entityData: z.any(),
  synced: z.boolean(),
  createdAt: z.date(),
  syncedAt: z.date().nullable()
};

// Awareness Session Schema
export const insertAwarenessSessionSchema = z.object({
  villageName: z.string().min(1, 'Village name is required'),
  ucName: z.string().min(1, 'UC name is required'),
  sessionDate: z.date().default(() => new Date()),
  conductedBy: z.string().min(1, 'Conducted by is required'),
  designation: z.string().optional(),
  userId: z.number().optional(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  images: z.array(z.string()).default([]),
  createdBy: z.number()
});

export const awarenessSessionSchema = insertAwarenessSessionSchema.extend({
  id: z.number(),
  createdAt: z.date().nullable()
});

export type InsertAwarenessSession = z.infer<typeof insertAwarenessSessionSchema>;
export type AwarenessSession = z.infer<typeof awarenessSessionSchema> & {
  creatorName?: string;
};

export const awarenessSessions = {
  id: z.number(),
  villageName: z.string(),
  ucName: z.string(),
  sessionDate: z.date(),
  conductedBy: z.string(),
  designation: z.string().optional(),
  userId: z.number().optional(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  images: z.string().nullable(),
  createdBy: z.number(),
  createdAt: z.date().nullable()
};

// Attendee Schema
export const insertAttendeeSchema = z.object({
  sessionId: z.number(),
  name: z.string().min(1, 'Name is required'),
  fatherOrHusbandName: z.string().min(1, 'Father/Husband name is required'),
  ageYears: z.number().nullable(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['Male', 'Female']).default('Male'),
  childrenUnderFive: z.number().int().min(0).nullable(),
  contactNumber: z.string().optional(),
  remarks: z.string().optional(),
  vaccinationStatus: z.string().optional(),
  vaccineDue: z.boolean().default(false),
  vaccineCardImage: z.string().optional(),
  belongsToSameAddress: z.boolean().default(false),
  images: z.array(z.string()).default([])
});

export const attendeeSchema = insertAttendeeSchema.extend({
  id: z.number(),
  createdAt: z.date().nullable()
});

export type InsertAttendee = z.infer<typeof insertAttendeeSchema>;
export type Attendee = z.infer<typeof attendeeSchema>;

export const attendees = {
  id: z.number(),
  sessionId: z.number(),
  name: z.string(),
  fatherOrHusbandName: z.string(),
  ageYears: z.number().nullable(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['Male', 'Female']),
  childrenUnderFive: z.number().nullable(),
  contactNumber: z.string().optional(),
  remarks: z.string().optional(),
  vaccinationStatus: z.string().optional(),
  vaccineDue: z.boolean(),
  vaccineCardImage: z.string().optional(),
  belongsToSameAddress: z.boolean(),
  images: z.string().nullable(),
  createdAt: z.date().nullable()
};

// Child Screening Schema
export const insertChildScreeningSchema = z.object({
  villageName: z.string().min(1, 'Village name is required'),
  ucName: z.string().min(1, 'UC name is required'),
  screeningDate: z.date().default(() => new Date()),
  conductedBy: z.string().min(1, 'Conducted by is required'),
  designation: z.string().optional(),
  userId: z.number().optional(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  images: z.array(z.string()).default([]),
  createdBy: z.number()
});

export const childScreeningSchema = insertChildScreeningSchema.extend({
  id: z.number(),
  createdAt: z.date().nullable()
});

export type InsertChildScreening = z.infer<typeof insertChildScreeningSchema>;
export type ChildScreening = z.infer<typeof childScreeningSchema> & {
  creatorName?: string;
};

export const childScreenings = {
  id: z.number(),
  villageName: z.string(),
  ucName: z.string(),
  screeningDate: z.date(),
  conductedBy: z.string(),
  designation: z.string().optional(),
  userId: z.number().optional(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  images: z.string().nullable(),
  createdBy: z.number(),
  createdAt: z.date().nullable()
};

// Screened Child Schema
export const insertScreenedChildSchema = z.object({
  screeningId: z.number(),
  childName: z.string().min(1, 'Child name is required'),
  fatherName: z.string().min(1, 'Father name is required'),
  age: z.number().min(0, 'Age must be positive'),
  gender: z.enum(['Male', 'Female']).default('Male'),
  weight: z.number().min(0, 'Weight must be positive'),
  height: z.number().min(0, 'Height must be positive'),
  muac: z.number().min(0, 'MUAC must be positive').nullable(),
  nutritionStatus: z.enum(['Normal', 'MAM', 'SAM']),
  referred: z.boolean().default(false),
  remarks: z.string().optional(),
  images: z.array(z.string()).default([])
});

export const screenedChildSchema = insertScreenedChildSchema.extend({
  id: z.number(),
  createdAt: z.date().nullable()
});

export type InsertScreenedChild = z.infer<typeof insertScreenedChildSchema>;
export type ScreenedChild = z.infer<typeof screenedChildSchema>;

export const screenedChildren = {
  id: z.number(),
  screeningId: z.number(),
  childName: z.string(),
  fatherName: z.string(),
  age: z.number(),
  gender: z.enum(['Male', 'Female']),
  weight: z.number(),
  height: z.number(),
  muac: z.number().nullable(),
  nutritionStatus: z.enum(['Normal', 'MAM', 'SAM']),
  referred: z.boolean(),
  remarks: z.string().optional(),
  images: z.string().nullable(),
  createdAt: z.date().nullable()
};

// Blog Schema
export const insertBlogSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  authorId: z.number(),
  author: z.string().optional(),
  imageUrl: z.string().optional(),
  publishedAt: z.date().nullable()
});

export const blogSchema = insertBlogSchema.extend({
  id: z.number(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable()
});

export type InsertBlog = z.infer<typeof insertBlogSchema>;
export type Blog = z.infer<typeof blogSchema> & {
  authorName?: string;
};

export const blogs = {
  id: z.number(),
  title: z.string(),
  content: z.string(),
  authorId: z.number(),
  author: z.string().optional(),
  imageUrl: z.string().optional(),
  publishedAt: z.date().nullable(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable()
};
