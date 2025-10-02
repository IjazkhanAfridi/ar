import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  HOST: process.env.HOST || '0.0.0.0',

  // Database
  DATABASE_URL: process.env.DATABASE_URL,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Upload limits
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB
  MAX_FIELD_SIZE: parseInt(process.env.MAX_FIELD_SIZE) || 10 * 1024 * 1024, // 10MB per field
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,

  // Cookie settings
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'your-cookie-secret',
  COOKIE_MAX_AGE: parseInt(process.env.COOKIE_MAX_AGE) || 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL'];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
