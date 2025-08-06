import express from 'express';
import authRoutes from './authRoutes.js';
import experienceRoutes from './experienceRoutes.js';
import adminRoutes from './adminRoutes.js';
import libraryRoutes from './libraryRoutes.js';
import contentRoutes from './contentRoutes.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'AR Configurator API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/experiences', experienceRoutes);
router.use('/library', libraryRoutes); // Library routes at /api/library/* (like working version)
router.use('/content', contentRoutes); // Content upload at /api/content (like working version)
router.use('/admin', adminRoutes);

export default router;
