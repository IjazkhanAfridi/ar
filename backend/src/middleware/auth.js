import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import { userService } from '../services/userService.js';

/**
 * Generate JWT token for user
 */
export function generateToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

/**
 * Authentication middleware
 */
export async function authenticate(req, res, next) {
  try {
    // Get token from header or cookie
    let token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token && req.cookies?.auth_token) {
      token = req.cookies.auth_token;
    }

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Access token required' 
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from database
    const user = await userService.getUserById(decoded.sub);
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false,
        message: 'Account is deactivated' 
      });
    }

    // Add user to request object
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      claims: decoded,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      success: false,
      message: 'Invalid token' 
    });
  }
}

/**
 * Authorization middleware for admin only
 */
export async function requireAdmin(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Admin access required' 
      });
    }

    next();
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
}

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export async function optionalAuth(req, res, next) {
  try {
    let token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token && req.cookies?.auth_token) {
      token = req.cookies.auth_token;
    }

    if (token) {
      try {
        const decoded = verifyToken(token);
        const user = await userService.getUserById(decoded.sub);
        
        if (user && user.isActive) {
          req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            claims: decoded,
          };
        }
      } catch (error) {
        // Ignore token errors for optional auth
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next(); // Continue even if error
  }
}
