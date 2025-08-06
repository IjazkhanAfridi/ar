import {
  pgTable,
  text,
  serial,
  jsonb,
  varchar,
  timestamp,
  index,
  boolean,
  integer,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Session storage table for authentication
export const sessions = pgTable(
  'sessions',
  {
    sid: varchar('sid').primaryKey(),
    sess: jsonb('sess').notNull(),
    expire: timestamp('expire').notNull(),
  },
  (table) => [index('IDX_session_expire').on(table.expire)]
);

// User storage table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  password: text('password').notNull(),
  profileImageUrl: text('profile_image_url'),
  role: text('role').notNull().default('user'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// AR Experiences table
export const experiences = pgTable('experiences', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  markerImage: text('marker_image').notNull(),
  mindFile: text('mind_file'),
  userId: varchar('user_id').references(() => users.id),
  contentConfig: jsonb('content_config').$type().notNull(),
  shareableLink: text('shareable_link').notNull(),
  isPublic: boolean('is_public').notNull().default(false),
  isMultipleTargets: boolean('is_multiple_targets').notNull().default(false),
  targetsConfig: jsonb('targets_config').$type(),
  viewCount: integer('view_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Content files for experiences
export const contentFiles = pgTable('content_files', {
  id: serial('id').primaryKey(),
  experienceId: text('experience_id'),
  type: text('type').notNull(),
  url: text('url').notNull(),
  filename: text('filename').notNull(),
  uploadedAt: text('uploaded_at').notNull(),
});

// 3D Models Library
export const modelsLibrary = pgTable('models_library', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  description: text('description'),
  fileUrl: varchar('file_url').notNull(),
  thumbnailUrl: varchar('thumbnail_url'),
  fileSize: varchar('file_size'),
  format: varchar('format').notNull(), // glb, gltf, obj, fbx
  category: varchar('category').default('general'),
  tags: text('tags').array(),
  isActive: boolean('is_active').default(true).notNull(),
  uploadedBy: varchar('uploaded_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Images Library
export const imagesLibrary = pgTable('images_library', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  description: text('description'),
  fileUrl: varchar('file_url').notNull(),
  thumbnailUrl: varchar('thumbnail_url'),
  fileSize: varchar('file_size'),
  format: varchar('format').notNull(), // jpg, png, webp, etc.
  dimensions: jsonb('dimensions'), // {width: number, height: number}
  category: varchar('category').default('general'),
  tags: text('tags').array(),
  isActive: boolean('is_active').default(true).notNull(),
  uploadedBy: varchar('uploaded_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Videos Library
export const videosLibrary = pgTable('videos_library', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  description: text('description'),
  fileUrl: varchar('file_url').notNull(),
  thumbnailUrl: varchar('thumbnail_url'),
  fileSize: varchar('file_size'),
  format: varchar('format').notNull(), // mp4, webm, etc.
  duration: varchar('duration'), // Video duration in seconds
  dimensions: jsonb('dimensions'), // {width: number, height: number}
  category: varchar('category').default('general'),
  tags: text('tags').array(),
  isActive: boolean('is_active').default(true).notNull(),
  uploadedBy: varchar('uploaded_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Audio Library
export const audioLibrary = pgTable('audio_library', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  description: text('description'),
  fileUrl: varchar('file_url').notNull(),
  fileSize: varchar('file_size'),
  format: varchar('format').notNull(), // mp3, wav, ogg, etc.
  duration: varchar('duration'), // Audio duration in seconds
  category: varchar('category').default('general'),
  tags: text('tags').array(),
  isActive: boolean('is_active').default(true).notNull(),
  uploadedBy: varchar('uploaded_by').references(() => users.id),
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
