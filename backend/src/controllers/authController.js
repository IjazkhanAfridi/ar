import { userService } from '../services/userService.js';
import { generateToken } from '../middleware/auth.js';
import { config } from '../config/config.js';
import { asyncHandler } from '../middleware/errorHandler.js';

class AuthController {
  /**
   * Register a new user
   */
  register = asyncHandler(async (req, res) => {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Create user
    const user = await userService.createUser({ email, password, name });

    // Generate token
    const token = generateToken(user);

    // Set cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: config.COOKIE_MAX_AGE,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token,
      },
    });
  });

  /**
   * Login user
   */
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Get user by email
    const user = await userService.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    // Verify password
    const isValidPassword = await userService.verifyPassword(
      password,
      user.password
    );
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;

    // Generate token
    const token = generateToken(userWithoutPassword);

    // Set cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: config.COOKIE_MAX_AGE,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  });

  /**
   * Logout user
   */
  logout = asyncHandler(async (req, res) => {
    res.clearCookie('auth_token');

    res.json({
      success: true,
      message: 'Logout successful',
    });
  });

  /**
   * Get current user profile
   */
  getProfile = asyncHandler(async (req, res) => {
    const user = await userService.getUserProfile(req.user.id);

    res.json({
      success: true,
      data: { user },
    });
  });

  /**
   * Update user profile
   */
  updateProfile = asyncHandler(async (req, res) => {
    const { name, email } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const updatedUser = await userService.updateUser(req.user.id, updateData);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser },
    });
  });

  /**
   * Change password
   */
  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    // Get current user
    const user = await userService.getUserById(req.user.id);

    // Verify current password
    const isValidPassword = await userService.verifyPassword(
      currentPassword,
      user.password
    );
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Update password
    await userService.updateUser(req.user.id, { password: newPassword });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  });

  /**
   * Verify token - check if user is authenticated
   */
  verifyToken = asyncHandler(async (req, res) => {
    const user = await userService.getUserProfile(req.user.id);

    res.json({
      success: true,
      data: {
        user,
        isAuthenticated: true,
      },
    });
  });

  /**
   * Verify token (for frontend to check if user is authenticated)
   */
  verifyToken = asyncHandler(async (req, res) => {
    // If we reach here, the auth middleware has already verified the token
    const user = await userService.getUserProfile(req.user.id);

    res.json({
      success: true,
      data: { user },
    });
  });
}

export const authController = new AuthController();
