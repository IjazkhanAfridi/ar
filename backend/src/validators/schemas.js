import { z } from 'zod';

/**
 * User validation schemas
 */
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

/**
 * Experience validation schemas
 */
export const createExperienceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  contentConfig: z.object({
    position: z.object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    }),
    rotation: z.object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    }),
    scale: z.object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    }),
    sceneObjects: z.array(z.object({
      id: z.string(),
      position: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
      }),
      rotation: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
      }),
      scale: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
      }),
      content: z.object({
        type: z.enum(['image', 'video', 'model', 'light', 'audio']),
        url: z.string().optional(),
        intensity: z.number().optional(),
        color: z.string().optional(),
      }),
    })),
  }),
  isPublic: z.boolean().optional(),
});

export const updateExperienceSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  contentConfig: z.object({
    position: z.object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    }),
    rotation: z.object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    }),
    scale: z.object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    }),
    sceneObjects: z.array(z.object({
      id: z.string(),
      position: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
      }),
      rotation: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
      }),
      scale: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
      }),
      content: z.object({
        type: z.enum(['image', 'video', 'model', 'light', 'audio']),
        url: z.string().optional(),
        intensity: z.number().optional(),
        color: z.string().optional(),
      }),
    })),
  }).optional(),
  isPublic: z.boolean().optional(),
});

/**
 * Admin validation schemas
 */
export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['user', 'admin']),
});

/**
 * Validation middleware factory
 */
export function validateBody(schema) {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}

/**
 * Validation middleware for query parameters
 */
export function validateQuery(schema) {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.query);
      req.query = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Query validation failed',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}

/**
 * Validation middleware for URL parameters
 */
export function validateParams(schema) {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.params);
      req.params = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Parameter validation failed',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}
