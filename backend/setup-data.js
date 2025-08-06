import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Client } = pkg;
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { users } from './src/models/schema.js';
import dotenv from 'dotenv';

dotenv.config();

// Database connection
const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:ijaz@localhost:5432/ar-project';

async function setupDefaultData() {
  const client = new Client({ connectionString });
  const db = drizzle(client);

  try {
    console.log('🗄️  Connecting to database...');
    await client.connect();

    // Check if admin user already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where((users) => users.email === 'admin@example.com')
      .limit(1);

    if (existingAdmin.length === 0) {
      console.log('👤 Creating default admin user...');

      // Hash the default password
      const hashedPassword = await bcrypt.hash('admin123', 10);

      // Create admin user
      await db.insert(users).values({
        id: nanoid(),
        email: 'admin@example.com',
        name: 'Admin User',
        firstName: 'Admin',
        lastName: 'User',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log('✅ Default admin user created!');
      console.log('Email: admin@example.com');
      console.log('Password: admin123');
      console.log('⚠️  Remember to change this password after first login!');
    } else {
      console.log('👤 Admin user already exists, skipping...');
    }

    console.log('🎉 Database setup complete!');
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
  } finally {
    await client.end();
  }
}

setupDefaultData();
