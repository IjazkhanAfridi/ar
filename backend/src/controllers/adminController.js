import { userService } from '../services/userService.js';
import { experienceService } from '../services/experienceService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

class AdminController {
  /**
   * Get all users
   */
  getAllUsers = asyncHandler(async (req, res) => {
    const users = await userService.getAllUsers();

    res.json({
      success: true,
      data: { users },
    });
  });

  /**
   * Update user status (activate/deactivate)
   */
  updateUserStatus = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value',
      });
    }

    const user = await userService.updateUserStatus(userId, isActive);

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user },
    });
  });

  /**
   * Delete user
   */
  deleteUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    await userService.deleteUser(userId);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  });

  /**
   * Get all experiences
   */
  getAllExperiences = asyncHandler(async (req, res) => {
    const experiences = await experienceService.getAllExperiences();

    res.json({
      success: true,
      data: { experiences },
    });
  });

  /**
   * Delete any experience
   */
  deleteExperience = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await experienceService.deleteExperience(parseInt(id), req.user.id, true);

    res.json({
      success: true,
      message: 'Experience deleted successfully',
    });
  });

  /**
   * Get dashboard statistics
   */
  getDashboardStats = asyncHandler(async (req, res) => {
    const [users, experiences] = await Promise.all([
      userService.getAllUsers(),
      experienceService.getAllExperiences(),
    ]);

    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(user => user.isActive).length,
      inactiveUsers: users.filter(user => !user.isActive).length,
      totalExperiences: experiences.length,
      publicExperiences: experiences.filter(exp => exp.isPublic).length,
      privateExperiences: experiences.filter(exp => !exp.isPublic).length,
      totalViews: experiences.reduce((sum, exp) => sum + (exp.viewCount || 0), 0),
    };

    // Recent activities (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUsers = users.filter(user => 
      new Date(user.createdAt) >= thirtyDaysAgo
    ).length;

    const recentExperiences = experiences.filter(exp => 
      new Date(exp.createdAt) >= thirtyDaysAgo
    ).length;

    stats.recentUsers = recentUsers;
    stats.recentExperiences = recentExperiences;

    res.json({
      success: true,
      data: { stats },
    });
  });

  /**
   * Update user role
   */
  updateUserRole = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "user" or "admin"',
      });
    }

    // Prevent admin from demoting themselves
    if (userId === req.user.id && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role',
      });
    }

    const user = await userService.updateUser(userId, { role });

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: { user },
    });
  });
}

export const adminController = new AdminController();
