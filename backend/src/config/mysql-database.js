import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from '../models/mysql-schema.js';
import { config } from './config.js';

if (!config.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
}

// Create connection pool for better stability and performance
const pool = mysql.createPool({
  uri: config.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  idleTimeout: 300000
});

export { pool as connection };
export const db = drizzle(pool, { schema, mode: 'default' });

// Test connection on startup
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ MySQL connection pool established');
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
  }
}

// Test connection
testConnection();

// Graceful connection closure
process.on('SIGINT', async () => {
  console.log('Closing MySQL connection pool...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Closing MySQL connection pool...');
  await pool.end();
  process.exit(0);
});