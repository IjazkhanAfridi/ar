import {
  mysqlTable,
  text,
  int,
  json,
  varchar,
  timestamp,
  index,
  boolean,
} from 'drizzle-orm/mysql-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Session storage table for authentication
export const sessions = mysqlTable(
  'sessions',
  {
    sid: varchar('sid', { length: 255 }).primaryKey(),
    sess: json('sess').notNull(),
    expire: timestamp('expire').notNull(),
  },
  (table) => [index('IDX_session_expire').on(table.expire)]
);

// User storage table
export const users = mysqlTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  password: text('password').notNull(),
  profileImageUrl: text('profile_image_url'),
  role: varchar('role', { length: 50 }).notNull().default('user'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// AR Experiences table
export const experiences = mysqlTable('experiences', {
  id: int('id').primaryKey().autoincrement(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  markerImage: text('marker_image').notNull(),
  markerDimensions: json('marker_dimensions'), // Store marker image dimensions
  mindFile: text('mind_file'),
  userId: varchar('user_id', { length: 255 }),
  contentConfig: json('content_config').notNull(),
  shareableLink: text('shareable_link').notNull(),
  isPublic: boolean('is_public').notNull().default(false),
  isMultipleTargets: boolean('is_multiple_targets').notNull().default(false),
  targetsConfig: json('targets_config'),
  viewCount: int('view_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Content files for experiences
export const contentFiles = mysqlTable('content_files', {
  id: int('id').primaryKey().autoincrement(),
  experienceId: varchar('experience_id', { length: 255 }),
  type: varchar('type', { length: 100 }).notNull(),
  url: text('url').notNull(),
  filename: text('filename').notNull(),
  uploadedAt: text('uploaded_at').notNull(),
});

// 3D Models Library
export const modelsLibrary = mysqlTable('models_library', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  fileUrl: varchar('file_url', { length: 500 }).notNull(),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  fileSize: varchar('file_size', { length: 50 }),
  format: varchar('format', { length: 20 }).notNull(), // glb, gltf, obj, fbx
  category: varchar('category', { length: 100 }).default('general'),
  tags: json('tags'), // Changed from array to json for MySQL compatibility
  isActive: boolean('is_active').default(true).notNull(),
  uploadedBy: varchar('uploaded_by', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Images Library
export const imagesLibrary = mysqlTable('images_library', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  fileUrl: varchar('file_url', { length: 500 }).notNull(),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  fileSize: varchar('file_size', { length: 50 }),
  format: varchar('format', { length: 20 }).notNull(), // jpg, png, webp, etc.
  dimensions: json('dimensions'), // {width: number, height: number}
  category: varchar('category', { length: 100 }).default('general'),
  tags: json('tags'), // Changed from array to json for MySQL compatibility
  isActive: boolean('is_active').default(true).notNull(),
  uploadedBy: varchar('uploaded_by', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Videos Library
export const videosLibrary = mysqlTable('videos_library', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  fileUrl: varchar('file_url', { length: 500 }).notNull(),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  fileSize: varchar('file_size', { length: 50 }),
  format: varchar('format', { length: 20 }).notNull(), // mp4, webm, etc.
  duration: varchar('duration', { length: 50 }), // Video duration in seconds
  dimensions: json('dimensions'), // {width: number, height: number}
  category: varchar('category', { length: 100 }).default('general'),
  tags: json('tags'), // Changed from array to json for MySQL compatibility
  isActive: boolean('is_active').default(true).notNull(),
  uploadedBy: varchar('uploaded_by', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Audio Library
export const audioLibrary = mysqlTable('audio_library', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  fileUrl: varchar('file_url', { length: 500 }).notNull(),
  fileSize: varchar('file_size', { length: 50 }),
  format: varchar('format', { length: 20 }).notNull(), // mp3, wav, ogg, etc.
  duration: varchar('duration', { length: 50 }), // Audio duration in seconds
  category: varchar('category', { length: 100 }).default('general'),
  tags: json('tags'), // Changed from array to json for MySQL compatibility
  isActive: boolean('is_active').default(true).notNull(),
  uploadedBy: varchar('uploaded_by', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExperienceSchema = createInsertSchema(experiences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentFileSchema = createInsertSchema(contentFiles).omit({
  id: true,
  uploadedAt: true,
});

export const insertModel3DSchema = createInsertSchema(modelsLibrary).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertImageLibrarySchema = createInsertSchema(imagesLibrary).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVideoLibrarySchema = createInsertSchema(videosLibrary).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAudioLibrarySchema = createInsertSchema(audioLibrary).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});