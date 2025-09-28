#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests MySQL connection and basic operations
 */

import { db } from './src/config/mysql-database.js';
import { users } from './src/models/mysql-schema.js';

async function testDatabaseConnection() {
  console.log('🔍 Testing MySQL database connection...\n');
  
  try {
    // Test basic connection
    console.log('1. Testing basic connection...');
    const result = await db.execute('SELECT 1 as test');
    console.log('   ✅ Basic connection successful');
    
    // Test schema access
    console.log('2. Testing schema access...');
    try {
      const userCount = await db.select().from(users).limit(1);
      console.log('   ✅ Schema access successful');
    } catch (error) {
      if (error.message.includes('Table') && error.message.includes('doesn\'t exist')) {
        console.log('   ⚠️  Tables not created yet - run: npm run db:push');
      } else {
        throw error;
      }
    }
    
    console.log('\n✅ Database connection test completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. If tables don\'t exist, run: npm run db:push');
    console.log('   2. Start the server: npm start');
    
  } catch (error) {
    console.error('\n❌ Database connection failed:');
    console.error('   Error:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check DATABASE_URL in .env file');
    console.error('   2. Ensure MySQL server is running');
    console.error('   3. Verify database credentials');
    console.error('   4. Check if database exists');
    
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the test
testDatabaseConnection();