import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import { config } from './config/config.js';
import { logger } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import apiRoutes from './routes/index.js';
import { connection } from './config/mysql-database.js';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Disable CSP for file uploads
  })
);

// CORS configuration
app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  })
);

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser(config.COOKIE_SECRET));

// Request logging
app.use(logger.requestLogger());

// Rate limiting for API routes
// app.use('/api', apiLimiter);

// Static file serving for uploads and experiences
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use(
  '/experiences',
  express.static(path.join(process.cwd(), 'experiences'))
);

// API routes
app.use('/api', apiRoutes);

// Serve frontend static files from build
const frontendDistPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDistPath));

// Handle SPA routing - send all non-API requests to frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Global error handler (moved after static file serving)
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
const server = app.listen(config.PORT, config.HOST, () => {
  logger.info(`Server running on ${config.HOST}:${config.PORT}`, 'server');
  logger.info(`Environment: ${config.NODE_ENV}`, 'server');
  logger.info(`CORS Origin: ${config.CORS_ORIGIN}`, 'server');
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`, 'server');

  try {
    // Close HTTP server
    await new Promise((resolve) => {
      server.close(() => {
        logger.info('HTTP server closed', 'server');
        resolve();
      });
    });

    // Close database connection
    logger.info('Closing database connection...', 'server');
    await connection.end();
    logger.info('Database connection closed', 'server');
    
  } catch (error) {
    logger.error('Error during shutdown:', 'server', error);
  }

  process.exit(0);
};

// Commented out force shutdown for debugging
// const forceShutdown = setTimeout(() => {
//   logger.error(
//     'Could not close connections in time, forcefully shutting down',
//     'server'
//   );
//   process.exit(1);
// }, 10000);

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', 'server', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', 'server', { promise, reason });
  process.exit(1);
});

export default app;
