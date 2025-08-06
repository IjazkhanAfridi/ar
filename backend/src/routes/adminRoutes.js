import express from 'express';
import { adminController } from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// User management
router.get('/users', adminController.getAllUsers);
router.put('/users/:userId/status', adminController.updateUserStatus);
router.put('/users/:userId/role', adminController.updateUserRole);
router.delete('/users/:userId', adminController.deleteUser);

// Experience management
router.get('/experiences', adminController.getAllExperiences);
router.delete('/experiences/:id', adminController.deleteExperience);

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);

export default router;
