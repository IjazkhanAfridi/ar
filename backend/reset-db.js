import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:ijaz@localhost:5432/ar-project';

async function resetDatabase() {
  const client = new Client({ connectionString });

  try {
    console.log('🗄️  Connecting to database...');
    await client.connect();

    // Read the reset SQL script
    const resetScript = fs.readFileSync(
      path.join(__dirname, 'reset-database.sql'),
      'utf8'
    );

    console.log('🧹 Dropping existing tables...');
    await client.query(resetScript);

    console.log('✅ Database reset complete!');
    console.log('Now run: npm run db:push');
  } catch (error) {
    console.error('❌ Error resetting database:', error.message);
  } finally {
    await client.end();
  }
}

resetDatabase();
