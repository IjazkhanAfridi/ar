-- AR Configurator Database Schema
-- Run this script to create the necessary tables

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  password TEXT NOT NULL,
  profile_image_url TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create experiences table
CREATE TABLE IF NOT EXISTS experiences (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  marker_image TEXT NOT NULL,
  mind_file TEXT,
  user_id VARCHAR REFERENCES users(id),
  content_config JSONB NOT NULL,
  shareable_link TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_multiple_targets BOOLEAN NOT NULL DEFAULT false,
  targets_config JSONB,
  view_count SERIAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create content_files table
CREATE TABLE IF NOT EXISTS content_files (
  id SERIAL PRIMARY KEY,
  experience_id TEXT,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  uploaded_at TEXT NOT NULL
);

-- Create models_library table
CREATE TABLE IF NOT EXISTS models_library (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  file_url VARCHAR NOT NULL,
  thumbnail_url VARCHAR,
  file_size VARCHAR,
  format VARCHAR NOT NULL,
  category VARCHAR DEFAULT 'general',
  tags TEXT[],
  is_active BOOLEAN DEFAULT true NOT NULL,
  uploaded_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create images_library table
CREATE TABLE IF NOT EXISTS images_library (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  file_url VARCHAR NOT NULL,
  thumbnail_url VARCHAR,
  file_size VARCHAR,
  format VARCHAR NOT NULL,
  dimensions JSONB,
  category VARCHAR DEFAULT 'general',
  tags TEXT[],
  is_active BOOLEAN DEFAULT true NOT NULL,
  uploaded_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create videos_library table
CREATE TABLE IF NOT EXISTS videos_library (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  file_url VARCHAR NOT NULL,
  thumbnail_url VARCHAR,
  file_size VARCHAR,
  format VARCHAR NOT NULL,
  duration VARCHAR,
  dimensions JSONB,
  category VARCHAR DEFAULT 'general',
  tags TEXT[],
  is_active BOOLEAN DEFAULT true NOT NULL,
  uploaded_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create audio_library table
CREATE TABLE IF NOT EXISTS audio_library (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  file_url VARCHAR NOT NULL,
  file_size VARCHAR,
  format VARCHAR NOT NULL,
  duration VARCHAR,
  category VARCHAR DEFAULT 'general',
  tags TEXT[],
  is_active BOOLEAN DEFAULT true NOT NULL,
  uploaded_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create sessions table for session storage
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

-- Create index on sessions expire column
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions(expire);

-- Insert a default admin user (password: admin123)
INSERT INTO users (id, email, name, password, role) VALUES (
  'admin_' || EXTRACT(EPOCH FROM NOW())::TEXT,
  'admin@example.com',
  'Admin User',
  '$2a$10$K8BQHMz8hXj0/FTJZqPWeuNlWgYtKXDzqF1p4KqGqF0zQqGQqZq3G', -- hashed 'admin123'
  'admin'
) ON CONFLICT (email) DO NOTHING;
