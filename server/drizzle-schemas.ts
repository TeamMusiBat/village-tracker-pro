
import { mysqlTable, int, varchar, boolean, timestamp, text, decimal } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  email: varchar('email', { length: 255 }),
  isOnline: boolean('is_online').default(false),
  lastActive: timestamp('last_active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

export const userLocations = mysqlTable('user_locations', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull().references(() => users.id),
  latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
  longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
  timestamp: timestamp('timestamp').defaultNow()
});

export const awarenessSessions = mysqlTable('awareness_sessions', {
  id: int('id').primaryKey().autoincrement(),
  villageName: varchar('village_name', { length: 255 }).notNull(),
  ucName: varchar('uc_name', { length: 255 }).notNull(),
  sessionDate: timestamp('session_date').notNull(),
  conductedBy: varchar('conducted_by', { length: 255 }).notNull(),
  designation: varchar('designation', { length: 255 }),
  userId: int('user_id').references(() => users.id),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  images: text('images'),
  createdBy: int('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow()
});

export const attendees = mysqlTable('attendees', {
  id: int('id').primaryKey().autoincrement(),
  sessionId: int('session_id').notNull().references(() => awarenessSessions.id),
  name: varchar('name', { length: 255 }).notNull(),
  fatherOrHusbandName: varchar('father_or_husband_name', { length: 255 }).notNull(),
  ageYears: int('age_years'),
  dateOfBirth: varchar('date_of_birth', { length: 50 }),
  gender: varchar('gender', { length: 10 }).notNull().default('Male'),
  childrenUnderFive: int('children_under_five'),
  contactNumber: varchar('contact_number', { length: 20 }),
  remarks: text('remarks'),
  vaccinationStatus: varchar('vaccination_status', { length: 255 }),
  vaccineDue: boolean('vaccine_due').default(false),
  vaccineCardImage: varchar('vaccine_card_image', { length: 500 }),
  belongsToSameAddress: boolean('belongs_to_same_address').default(false),
  images: text('images'),
  createdAt: timestamp('created_at').defaultNow()
});

export const childScreenings = mysqlTable('child_screenings', {
  id: int('id').primaryKey().autoincrement(),
  villageName: varchar('village_name', { length: 255 }).notNull(),
  ucName: varchar('uc_name', { length: 255 }).notNull(),
  screeningDate: timestamp('screening_date').notNull(),
  conductedBy: varchar('conducted_by', { length: 255 }).notNull(),
  designation: varchar('designation', { length: 255 }),
  userId: int('user_id').references(() => users.id),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  images: text('images'),
  createdBy: int('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow()
});

export const screenedChildren = mysqlTable('screened_children', {
  id: int('id').primaryKey().autoincrement(),
  screeningId: int('screening_id').notNull().references(() => childScreenings.id),
  childName: varchar('child_name', { length: 255 }).notNull(),
  fatherName: varchar('father_name', { length: 255 }).notNull(),
  age: int('age').notNull(),
  gender: varchar('gender', { length: 10 }).notNull().default('Male'),
  weight: decimal('weight', { precision: 5, scale: 2 }).notNull(),
  height: decimal('height', { precision: 5, scale: 2 }).notNull(),
  muac: decimal('muac', { precision: 5, scale: 2 }),
  nutritionStatus: varchar('nutrition_status', { length: 50 }).notNull(),
  referred: boolean('referred').default(false),
  remarks: text('remarks'),
  images: text('images'),
  createdAt: timestamp('created_at').defaultNow()
});

export const blogs = mysqlTable('blogs', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  authorId: int('author_id').notNull().references(() => users.id),
  author: varchar('author', { length: 255 }),
  imageUrl: varchar('image_url', { length: 500 }),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

export const pendingSyncItems = mysqlTable('pending_sync_items', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull().references(() => users.id),
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  entityData: text('entity_data').notNull(),
  synced: boolean('synced').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  syncedAt: timestamp('synced_at')
});
