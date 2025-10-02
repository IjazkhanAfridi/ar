import { db } from '../config/mysql-database.js';
import {
  experiences,
  contentFiles,
  modelsLibrary,
  imagesLibrary,
  videosLibrary,
  audioLibrary,
} from '../models/mysql-schema.js';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { fileService } from './fileService.js';
import {
  saveExperienceHtml,
  saveMultipleImageExperienceHtml,
} from '../utils/experienceGenerator.js';
import fs from 'fs';
import path from 'path';
import {
  ensureSceneConfig,
  sanitizeTargets,
} from '../utils/experienceNormalizer.js';

class ExperienceService {
  /**
   * Create a new AR experience
   */
  async createExperience(experienceData, userId) {
    const shareableLink = `exp_${nanoid(12)}`;

    const newExperience = {
      ...experienceData,
      userId,
      shareableLink,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const result = await db.insert(experiences).values(newExperience);
      console.log('Insert result:', result);
      
      const insertId = result[0]?.insertId || result.insertId;
      if (!insertId) {
        throw new Error('Failed to get insertId from database');
      }
      
      // Fetch the created experience using the auto-generated ID
      const [experience] = await db
        .select()
        .from(experiences)
        .where(eq(experiences.id, insertId));

      console.log('Created experience:', experience);
      
      if (!experience) {
        throw new Error('Failed to fetch created experience');
      }

      return experience;
    } catch (error) {
      console.error('Error in createExperience:', error);
      throw error;
    }
  }

  /**
   * Get experience by ID
   */
  async getExperienceById(id) {
    const [experience] = await db
      .select()
      .from(experiences)
      .where(eq(experiences.id, id))
      .limit(1);

    return experience;
  }

  /**
   * Get experience by shareable link
   */
  async getExperienceByShareableLink(link) {
    const [experience] = await db
      .select()
      .from(experiences)
      .where(eq(experiences.shareableLink, link))
      .limit(1);

    if (experience) {
      // Increment view count
      await this.incrementViewCount(experience.id);
    }

    return experience;
  }

  /**
   * Get user's experiences
   */
  async getUserExperiences(userId) {
    const userExperiences = await db
      .select()
      .from(experiences)
      .where(eq(experiences.userId, userId))
      .orderBy(desc(experiences.createdAt));

    return userExperiences;
  }

  /**
   * Get all public experiences
   */
  async getPublicExperiences() {
    const publicExperiences = await db
      .select()
      .from(experiences)
      .where(eq(experiences.isPublic, true))
      .orderBy(desc(experiences.createdAt));

    return publicExperiences;
  }

  /**
   * Get all experiences (admin only)
   */
  async getAllExperiences() {
    const allExperiences = await db
      .select()
      .from(experiences)
      .orderBy(desc(experiences.createdAt));

    return allExperiences;
  }

  /**
   * Update experience
   */
  async updateExperience(id, updateData, userId) {
    // Verify ownership
    const experience = await this.getExperienceById(id);
    if (!experience) {
      throw new Error('Experience not found');
    }

    if (experience.userId !== userId) {
      throw new Error('Not authorized to update this experience');
    }

    const updateFields = {
      ...updateData,
      updatedAt: new Date(),
    };

    await db
      .update(experiences)
      .set(updateFields)
      .where(eq(experiences.id, id));

    // Fetch the updated experience
    const [updatedExperience] = await db
      .select()
      .from(experiences)
      .where(eq(experiences.id, id));

    return updatedExperience;
  }

  /**
   * Delete experience
   */
  async deleteExperience(id, userId, isAdmin = false) {
    const experience = await this.getExperienceById(id);
    if (!experience) {
      throw new Error('Experience not found');
    }

    // Check authorization
    if (!isAdmin && experience.userId !== userId) {
      throw new Error('Not authorized to delete this experience');
    }

    // Delete associated files first
    await this.deleteExperienceFiles(id);

    // Delete experience
    await db
      .delete(experiences)
      .where(eq(experiences.id, id));

    return { message: 'Experience deleted successfully' };
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id) {
    await db
      .update(experiences)
      .set({
        viewCount: experiences.viewCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(experiences.id, id));
  }

  /**
   * Save content file for experience
   */
  async saveContentFile(experienceId, fileData) {
    const contentFile = {
      experienceId: experienceId.toString(),
      type: fileData.type,
      url: fileData.url,
      filename: fileData.filename,
      uploadedAt: new Date().toISOString(),
    };

    const result = await db
      .insert(contentFiles)
      .values(contentFile);

    const insertId = result[0]?.insertId || result.insertId;
    if (!insertId) {
      throw new Error('Failed to get insertId from contentFiles insert');
    }

    // Fetch the created file using the auto-generated ID
    const [savedFile] = await db
      .select()
      .from(contentFiles)
      .where(eq(contentFiles.id, insertId));

    return savedFile;
  }

  /**
   * Get content files for experience
   */
  async getContentFiles(experienceId) {
    const files = await db
      .select()
      .from(contentFiles)
      .where(eq(contentFiles.experienceId, experienceId.toString()));

    return files;
  }

  /**
   * Delete experience files
   */
  async deleteExperienceFiles(experienceId) {
    // Get all content files
    const files = await this.getContentFiles(experienceId);

    // Delete physical files
    for (const file of files) {
      try {
        await fileService.deleteFile(file.url);
      } catch (error) {
        console.error(`Failed to delete file ${file.url}:`, error);
      }
    }

    // Delete database records
    await db
      .delete(contentFiles)
      .where(eq(contentFiles.experienceId, experienceId.toString()));
  }

  /**
   * Update marker image
   */
  async updateMarkerImage(experienceId, markerImagePath, userId) {
    const experience = await this.getExperienceById(experienceId);
    if (!experience) {
      throw new Error('Experience not found');
    }

    if (experience.userId !== userId) {
      throw new Error('Not authorized to update this experience');
    }

    // Delete old marker image if exists
    if (experience.markerImage) {
      try {
        await fileService.deleteFile(experience.markerImage);
      } catch (error) {
        console.error('Failed to delete old marker image:', error);
      }
    }

    // Update with new marker image
    await db
      .update(experiences)
      .set({
        markerImage: markerImagePath,
        updatedAt: new Date(),
      })
      .where(eq(experiences.id, experienceId));

    // Fetch the updated experience
    const [updatedExperience] = await db
      .select()
      .from(experiences)
      .where(eq(experiences.id, experienceId));

    return updatedExperience;
  }

  /**
   * Save mind file for experience
   */
  async saveMindFile(experienceId, mindFileBuffer) {
    try {
      // Create mind-files directory if it doesn't exist
      const mindFilesDir = path.join(process.cwd(), 'uploads', 'mind-files');
      if (!fs.existsSync(mindFilesDir)) {
        fs.mkdirSync(mindFilesDir, { recursive: true });
      }

      // Save mind file
      const filename = `experience_${experienceId}.mind`;
      const filePath = path.join(mindFilesDir, filename);

      fs.writeFileSync(filePath, mindFileBuffer);

      const mindFileUrl = `/uploads/mind-files/${filename}`;

      // Update experience with mind file path
      await db
        .update(experiences)
        .set({
          mindFile: mindFileUrl,
          updatedAt: new Date(),
        })
        .where(eq(experiences.id, experienceId));

      // Fetch the updated experience
      const [updatedExperience] = await db
        .select()
        .from(experiences)
        .where(eq(experiences.id, experienceId));

      return updatedExperience;
    } catch (error) {
      console.error('Error saving mind file:', error);
      throw error;
    }
  }

  /**
   * Get mind file for experience
   */
  async getMindFile(experienceId) {
    try {
      const experience = await this.getExperienceById(experienceId);
      if (!experience || !experience.mindFile) {
        return null;
      }

      const filePath = path.join(
        process.cwd(),
        experience.mindFile.replace(/^\//, '')
      );

      if (!fs.existsSync(filePath)) {
        console.error('Mind file not found:', filePath);
        return null;
      }

      return fs.readFileSync(filePath);
    } catch (error) {
      console.error('Error reading mind file:', error);
      return null;
    }
  }

  /**
   * Generate and save experience HTML
   */
  async generateExperienceHtml(experienceId) {
    const experience = await this.getExperienceById(experienceId);
    if (!experience) {
      throw new Error('Experience not found');
    }

    try {
      // Parse JSON strings if they exist
      const processedExperience = {
        ...experience,
        contentConfig: ensureSceneConfig(
          typeof experience.contentConfig === 'string'
            ? JSON.parse(experience.contentConfig)
            : experience.contentConfig
        ),
        markerDimensions:
          typeof experience.markerDimensions === 'string'
            ? JSON.parse(experience.markerDimensions)
            : experience.markerDimensions,
        targetsConfig: experience.targetsConfig
          ? sanitizeTargets(
              typeof experience.targetsConfig === 'string'
                ? JSON.parse(experience.targetsConfig)
                : experience.targetsConfig
            )
          : [],
      };

      const experienceUrl = saveExperienceHtml(processedExperience);
      return experienceUrl;
    } catch (error) {
      console.error('Error generating experience HTML:', error);
      throw error;
    }
  }

  /**
   * Generate and save multiple image experience HTML
   */
  async generateMultipleImageExperienceHtml(experienceId) {
    const experience = await this.getExperienceById(experienceId);
    if (!experience) {
      throw new Error('Experience not found');
    }

    try {
      // Parse JSON strings if they exist
      const processedExperience = {
        ...experience,
        contentConfig: ensureSceneConfig(
          typeof experience.contentConfig === 'string'
            ? JSON.parse(experience.contentConfig)
            : experience.contentConfig
        ),
        markerDimensions:
          typeof experience.markerDimensions === 'string'
            ? JSON.parse(experience.markerDimensions)
            : experience.markerDimensions,
        targetsConfig: sanitizeTargets(
          typeof experience.targetsConfig === 'string'
            ? JSON.parse(experience.targetsConfig)
            : experience.targetsConfig
        ),
      };

      const experienceUrl = saveMultipleImageExperienceHtml(processedExperience);
      return experienceUrl;
    } catch (error) {
      console.error('Error generating multiple image experience HTML:', error);
      throw error;
    }
  }

  /**
   * Library Management Methods
   */

  // Models Library
  async saveModel(modelData) {
    const result = await db
      .insert(modelsLibrary)
      .values({
        ...modelData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    const insertId = result[0]?.insertId || result.insertId;
    if (!insertId) {
      throw new Error('Failed to get insertId from modelsLibrary insert');
    }

    // Fetch the created model using the auto-generated ID
    const [model] = await db
      .select()
      .from(modelsLibrary)
      .where(eq(modelsLibrary.id, insertId));

    return model;
  }

  async getModelsLibrary() {
    const models = await db
      .select()
      .from(modelsLibrary)
      .where(eq(modelsLibrary.isActive, true))
      .orderBy(desc(modelsLibrary.createdAt));

    return models;
  }

  async deleteModel(id) {
    // Get model data before deletion for file cleanup
    const [modelToDelete] = await db
      .select()
      .from(modelsLibrary)
      .where(eq(modelsLibrary.id, id));

    await db
      .delete(modelsLibrary)
      .where(eq(modelsLibrary.id, id));

    if (modelToDelete && modelToDelete.fileUrl) {
      try {
        await fileService.deleteFile(modelToDelete.fileUrl);
      } catch (error) {
        console.error('Failed to delete model file:', error);
      }
    }

    return modelToDelete;
  }

  // Images Library
  async saveImage(imageData) {
    const result = await db
      .insert(imagesLibrary)
      .values({
        ...imageData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    const insertId = result[0]?.insertId || result.insertId;
    if (!insertId) {
      throw new Error('Failed to get insertId from imagesLibrary insert');
    }

    // Fetch the created image using the auto-generated ID
    const [image] = await db
      .select()
      .from(imagesLibrary)
      .where(eq(imagesLibrary.id, insertId));

    return image;
  }

  async getImagesLibrary() {
    const images = await db
      .select()
      .from(imagesLibrary)
      .where(eq(imagesLibrary.isActive, true))
      .orderBy(desc(imagesLibrary.createdAt));

    return images;
  }

  async deleteImage(id) {
    // Get image data before deletion for file cleanup
    const [imageToDelete] = await db
      .select()
      .from(imagesLibrary)
      .where(eq(imagesLibrary.id, id));

    await db
      .delete(imagesLibrary)
      .where(eq(imagesLibrary.id, id));

    if (imageToDelete && imageToDelete.fileUrl) {
      try {
        await fileService.deleteFile(imageToDelete.fileUrl);
      } catch (error) {
        console.error('Failed to delete image file:', error);
      }
    }

    return imageToDelete;
  }

  // Videos Library
  async saveVideo(videoData) {
    const result = await db
      .insert(videosLibrary)
      .values({
        ...videoData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    const insertId = result[0]?.insertId || result.insertId;
    if (!insertId) {
      throw new Error('Failed to get insertId from videosLibrary insert');
    }

    // Fetch the created video using the auto-generated ID
    const [video] = await db
      .select()
      .from(videosLibrary)
      .where(eq(videosLibrary.id, insertId));

    return video;
  }

  async getVideosLibrary() {
    const videos = await db
      .select()
      .from(videosLibrary)
      .where(eq(videosLibrary.isActive, true))
      .orderBy(desc(videosLibrary.createdAt));

    return videos;
  }

  async deleteVideo(id) {
    // Get video data before deletion for file cleanup
    const [videoToDelete] = await db
      .select()
      .from(videosLibrary)
      .where(eq(videosLibrary.id, id));

    await db
      .delete(videosLibrary)
      .where(eq(videosLibrary.id, id));

    if (videoToDelete && videoToDelete.fileUrl) {
      try {
        await fileService.deleteFile(videoToDelete.fileUrl);
      } catch (error) {
        console.error('Failed to delete video file:', error);
      }
    }

    return videoToDelete;
  }

  // Audios Library
  async saveAudio(audioData) {
    const result = await db
      .insert(audioLibrary)
      .values({
        ...audioData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    const insertId = result[0]?.insertId || result.insertId;
    if (!insertId) {
      throw new Error('Failed to get insertId from audioLibrary insert');
    }

    // Fetch the created audio using the auto-generated ID
    const [audio] = await db
      .select()
      .from(audioLibrary)
      .where(eq(audioLibrary.id, insertId));

    return audio;
  }

  async getAudioLibrary() {
    const audios = await db
      .select()
      .from(audioLibrary)
      .where(eq(audioLibrary.isActive, true))
      .orderBy(desc(audioLibrary.createdAt));

    return audios;
  }

  async deleteAudio(id) {
    // Get audio data before deletion for file cleanup
    const [audioToDelete] = await db
      .select()
      .from(audioLibrary)
      .where(eq(audioLibrary.id, id));

    await db
      .delete(audioLibrary)
      .where(eq(audioLibrary.id, id));

    if (audioToDelete && audioToDelete.fileUrl) {
      try {
        await fileService.deleteFile(audioToDelete.fileUrl);
      } catch (error) {
        console.error('Failed to delete audio file:', error);
      }
    }

    return audioToDelete;
  }
}

export const experienceService = new ExperienceService();
