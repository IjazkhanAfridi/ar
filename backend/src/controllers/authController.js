import { userService } from '../services/userService.js';
import { generateToken } from '../middleware/auth.js';
import { config } from '../config/config.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const getAuthCookieOptions = (req) => {
  const forwardedProto = req.headers['x-forwarded-proto']?.split(',')[0]?.trim();
  const autoSecure =
    config.NODE_ENV === 'production' && (req.secure || forwardedProto === 'https');
  const secureFlag =
    config.COOKIE_SECURE !== undefined ? config.COOKIE_SECURE : autoSecure;

  const options = {
    httpOnly: true,
    secure: Boolean(secureFlag),
    sameSite: config.COOKIE_SAME_SITE,
    maxAge: config.COOKIE_MAX_AGE,
  };

  if (options.sameSite === 'none') {
    options.secure = true;
  }

  if (config.COOKIE_DOMAIN) {
    options.domain = config.COOKIE_DOMAIN;
  }

  return options;
};

const setAuthCookie = (res, req, token) => {
  const options = getAuthCookieOptions(req);
  res.cookie('auth_token', token, options);
};

const clearAuthCookie = (res, req) => {
  const { maxAge, ...options } = getAuthCookieOptions(req);
  res.clearCookie('auth_token', options);
};

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
  setAuthCookie(res, req, token);

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
  setAuthCookie(res, req, token);

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
    clearAuthCookie(res, req);

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
      data: { user },
    });
  });
}

export const authController = new AuthController();
