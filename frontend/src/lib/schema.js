import { z } from 'zod';

// Basic experience schema for frontend validation
export const insertExperienceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  markerImage: z.string().min(1, 'Marker image is required'),
  userId: z.string().optional(),
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
});

// Content file schema
export const insertContentFileSchema = z.object({
  experienceId: z.string(),
  type: z.string(),
  url: z.string(),
  filename: z.string(),
});

// Update experience schema
export const updateExperienceSchema = insertExperienceSchema.partial().extend({
  id: z.number(),
});

// Multiple image experience schema
export const insertMultipleImageExperienceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  markerImage: z.string().min(1, 'Marker image is required'),
  isMultipleTargets: z.boolean().default(true),
  targetsConfig: z.array(z.object({
    id: z.string(),
    name: z.string(),
    imageUrl: z.string(),
    imageData: z.any(),
    sceneObjects: z.array(z.object({
      id: z.string(),
      type: z.enum(['model', 'image', 'video', 'audio', 'text']),
      url: z.string().optional(),
      content: z.string().optional(),
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
      color: z.string().optional(),
      size: z.number().optional(),
    })),
  })),
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
    sceneObjects: z.array(z.any()),
  }),
});

// JavaScript type placeholders (for JSDoc comments)
/**
 * @typedef {Object} InsertMultipleImageExperience
 * @property {string} title
 * @property {string} [description]
 * @property {string} markerImage
 * @property {boolean} [isMultipleTargets]
 * @property {Array} targetsConfig
 * @property {Object} contentConfig
 */

/**
 * @typedef {Object} UpdateExperience
 * @property {number} id
 */

/**
 * @typedef {Object} Experience
 * @property {number} id
 * @property {string} title
 * @property {string} description
 * @property {string} markerImage
 * @property {string} [mindFile]
 * @property {string} [userId]
 * @property {Object} contentConfig
 * @property {string} shareableLink
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

/**
 * @typedef {Object} ContentFile
 * @property {number} id
 * @property {string} experienceId
 * @property {string} type
 * @property {string} url
 * @property {string} filename
 * @property {string} uploadedAt
 */

/**
 * @typedef {Object} InsertContentFile
 * @property {string} experienceId
 * @property {string} type
 * @property {string} url
 * @property {string} filename
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} [name]
 * @property {string} [firstName]
 * @property {string} [lastName]
 * @property {string} password
 * @property {string} [profileImageUrl]
 * @property {string} role
 * @property {boolean} isActive
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} InsertExperience
 * @property {string} title
 * @property {string} description
 * @property {string} markerImage
 * @property {string} [userId]
 * @property {Object} contentConfig
 */

// Export placeholder objects for JavaScript compatibility
export const InsertMultipleImageExperience = {};
export const UpdateExperience = {};
export const Experience = {};
export const ContentFile = {};
export const InsertContentFile = {};
export const User = {};
export const UpsertUser = {};
export const InsertExperience = {};
export const Model3D = {};
export const InsertModel3D = {};
export const ImageLibraryItem = {};
export const InsertImageLibraryItem = {};
export const VideoLibraryItem = {};
export const InsertVideoLibraryItem = {};
export const AudioLibraryItem = {};
export const InsertAudioLibraryItem = {};
