import express from 'express';
import { libraryController } from '../controllers/libraryController.js';
import { authenticate } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All library routes require authentication (like in working version)
router.use(authenticate);

// Library GET routes - return arrays directly (like working version)
router.get('/models', libraryController.getModelsLibrary);
router.get('/images', libraryController.getImagesLibrary);
router.get('/videos', libraryController.getVideosLibrary);
router.get('/audios', libraryController.getAudioLibrary);

export default router;
