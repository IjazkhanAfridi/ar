import { experienceService } from '../services/experienceService.js';
import { fileService } from '../services/fileService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import path from 'path';
import fs from 'fs';

class ContentController {
  /**
   * Upload content (models, images, videos, audio) - matches working version
   */
  uploadContent = asyncHandler(async (req, res) => {
    console.log('Content upload request:', {
      body: req.body,
      file: req.file
        ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
          }
        : 'missing',
      headers: req.headers,
    });

    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }

    const { type } = req.body;
    if (!type || !['model', 'image', 'video', 'audio'].includes(type)) {
      return res.status(400).json({ message: 'Invalid content type' });
    }

    try {
      // Save file using the file service
      const savedFile = await fileService.saveFile(
        req.file.buffer,
        req.file.originalname,
        {
          processImage: type === 'image',
          imageOptions: { quality: 90 },
        }
      );

      // Create content file record like in working version
      const contentFile = await experienceService.saveContentFile({
        experienceId: req.body.experienceId || '-1',
        type,
        url: savedFile.url,
        filename: req.file.originalname,
      });

      res.json(contentFile);
    } catch (error) {
      console.error('Error uploading content:', error);
      res.status(400).json({
        message: 'Failed to upload content',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}

export const contentController = new ContentController();
