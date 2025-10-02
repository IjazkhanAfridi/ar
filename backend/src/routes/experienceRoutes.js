import express from 'express';
import { experienceController } from '../controllers/experienceController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { uploadSingle, uploadAny } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes
router.get('/public', experienceController.getPublicExperiences);
router.get('/share/:link', experienceController.getExperienceByLink);

// Marker serving routes
router.get('/markers/:id.png', experienceController.serveMarkerImage);
router.get('/markers/:id.mind', experienceController.serveMindFile);

// Protected routes
router.use(authenticate); // All routes below require authentication

// Basic experience CRUD
router.post(
  '/',
  uploadLimiter,
  uploadAny, // Use uploadAny to accept multiple files (mindFile + markerImage)
  experienceController.createExperience
);

router.get('/', experienceController.getUserExperiences);
router.get('/:id', experienceController.getExperience);
router.put('/:id', uploadLimiter, uploadAny, experienceController.updateExperience);
router.delete('/:id', experienceController.deleteExperience);

// Marker image management
router.put(
  '/:id/marker',
  uploadLimiter,
  uploadSingle('markerImage'),
  experienceController.updateMarkerImage
);

// Mind file management
router.post(
  '/:id/mind',
  uploadLimiter,
  uploadSingle('mindFile'),
  experienceController.uploadMindFile
);
router.get('/:id/mind', experienceController.getMindFile);

// Multiple image experiences
router.post(
  '/multiple-image',
  uploadLimiter,
  uploadAny, // Use uploadAny for multiple image experiences too
  experienceController.createMultipleImageExperience
);

router.put(
  '/multiple-image/:id',
  uploadLimiter,
  uploadAny,
  experienceController.updateMultipleImageExperience
);

// Content file routes
router.post(
  '/:experienceId/content',
  uploadLimiter,
  uploadSingle('file'),
  experienceController.saveContentFile
);

router.get('/:experienceId/content', experienceController.getContentFiles);

// Experience HTML serving - must be last to avoid conflicts with other routes
router.get('/:id.html', experienceController.serveExperienceHtml);

export default router;
