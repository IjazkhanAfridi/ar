#!/usr/bin/env node

/**
 * Manual Database Setup Script
 * Creates all required tables using raw SQL
 * Use this as alternative to db:push when Drizzle Kit has issues
 */

import { connection as pool } from './src/config/mysql-database.js';

const createTablesSQL = `
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
`;

async function createTables() {
  console.log('🔧 Creating database tables manually...\n');
  
  try {
    // Split SQL into individual statements
    const statements = createTablesSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        await pool.execute(statement);
      }
    }
    
    // Show created tables
    console.log('\n📋 Verifying created tables:');
    const [tables] = await pool.execute('SHOW TABLES');
    console.log('Tables created:');
    tables.forEach(table => {
      console.log('  ✅', Object.values(table)[0]);
    });
    
    console.log('\n✅ Database tables created successfully!');
    console.log('\n🚀 Your AR Configurator database is ready!');
    console.log('   Next step: npm start');
    
  } catch (error) {
    console.error('\n❌ Error creating tables:');
    console.error('   Error:', error.message);
    
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('\n✅ Tables already exist - database is ready!');
    } else {
      console.error('\n🔧 Troubleshooting:');
      console.error('   1. Check DATABASE_URL in .env file');
      console.error('   2. Ensure MySQL server is accessible');
      console.error('   3. Verify database permissions');
      process.exit(1);
    }
  }
  
  await pool.end();
  process.exit(0);
}

// Run the setup
createTables();