-- ====================================================================
-- AR Configurator - MySQL Database Setup Script
-- ====================================================================
-- This script creates the database and user for AR Configurator
-- Run this on your MySQL server (Hostinger or local)

-- Create database
CREATE DATABASE IF NOT EXISTS ar_project CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (optional - if you want a dedicated user)
-- CREATE USER 'ar_user'@'localhost' IDENTIFIED BY 'your_strong_password';
-- GRANT ALL PRIVILEGES ON ar_project.* TO 'ar_user'@'localhost';
-- FLUSH PRIVILEGES;

-- Use the database
USE ar_project;

-- Note: Tables will be created automatically by Drizzle ORM
-- when you run: npm run db:push

-- Verify database creation
SHOW TABLES;

-- Show database info
SELECT 
    SCHEMA_NAME as 'Database Name',
    DEFAULT_CHARACTER_SET_NAME as 'Character Set',
    DEFAULT_COLLATION_NAME as 'Collation'
FROM information_schema.SCHEMATA 
WHERE SCHEMA_NAME = 'ar_project';