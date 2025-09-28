-- AR Configurator MySQL Database Schema
-- Generated from mysql-schema.js for manual creation
-- Run this script in your MySQL database to create all required tables

USE u311916992_packarcreator;

-- Drop existing tables if they exist (be careful in production!)
-- DROP TABLE IF EXISTS audio_library;
-- DROP TABLE IF EXISTS videos_library;
-- DROP TABLE IF EXISTS images_library;
-- DROP TABLE IF EXISTS models_library;
-- DROP TABLE IF EXISTS content_files;
-- DROP TABLE IF EXISTS experiences;
-- DROP TABLE IF EXISTS users;
-- DROP TABLE IF EXISTS sessions;

-- Session storage table for authentication
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR(255) PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP NOT NULL,
    INDEX IDX_session_expire (expire)
);

-- User storage table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    password TEXT NOT NULL,
    profile_image_url TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- AR Experiences table
CREATE TABLE IF NOT EXISTS experiences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    marker_image TEXT NOT NULL,
    marker_dimensions JSON,
    mind_file TEXT,
    user_id VARCHAR(255),
    content_config JSON NOT NULL,
    shareable_link TEXT NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    is_multiple_targets BOOLEAN NOT NULL DEFAULT FALSE,
    targets_config JSON,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Content files for experiences
CREATE TABLE IF NOT EXISTS content_files (
    id INT PRIMARY KEY AUTO_INCREMENT,
    experience_id VARCHAR(255),
    type VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    filename TEXT NOT NULL,
    uploaded_at TEXT NOT NULL
);

-- 3D Models Library
CREATE TABLE IF NOT EXISTS models_library (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    file_size VARCHAR(50),
    format VARCHAR(20) NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    tags JSON,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    uploaded_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Images Library
CREATE TABLE IF NOT EXISTS images_library (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    file_size VARCHAR(50),
    format VARCHAR(20) NOT NULL,
    dimensions JSON,
    category VARCHAR(100) DEFAULT 'general',
    tags JSON,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    uploaded_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Videos Library
CREATE TABLE IF NOT EXISTS videos_library (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    file_size VARCHAR(50),
    format VARCHAR(20) NOT NULL,
    duration VARCHAR(50),
    dimensions JSON,
    category VARCHAR(100) DEFAULT 'general',
    tags JSON,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    uploaded_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Audio Library
CREATE TABLE IF NOT EXISTS audio_library (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_url VARCHAR(500) NOT NULL,
    file_size VARCHAR(50),
    format VARCHAR(20) NOT NULL,
    duration VARCHAR(50),
    category VARCHAR(100) DEFAULT 'general',
    tags JSON,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    uploaded_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Show created tables
SHOW TABLES;