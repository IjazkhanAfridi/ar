import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../models/schema.js';
import { config } from './config.js';

const { Pool } = pg;

if (!config.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
}

export const pool = new Pool({ 
  connectionString: config.DATABASE_URL,
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

export const db = drizzle({ client: pool, schema });

// Note: Signal handlers moved to server.js to avoid conflicts
