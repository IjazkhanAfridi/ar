import { defineConfig } from "drizzle-kit";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export default defineConfig({
  out: "./migrations",
  schema: "./src/models/mysql-schema.js",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});