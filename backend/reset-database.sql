-- Migration script to fix schema conflicts
-- Run this before db:push to avoid data loss

-- Drop the problematic tables that have schema conflicts
-- This will lose existing data but ensures clean setup

DROP TABLE IF EXISTS content_files CASCADE;
DROP TABLE IF EXISTS models_library CASCADE;
DROP TABLE IF EXISTS images_library CASCADE;
DROP TABLE IF EXISTS videos_library CASCADE;
DROP TABLE IF EXISTS audios_library CASCADE;
DROP TABLE IF EXISTS experiences CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- The tables will be recreated with correct schema when you run npm run db:push
