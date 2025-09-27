import { experienceService } from '../services/experienceService.js';
import { fileService } from '../services/fileService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import path from 'path';
import fs from 'fs';

class ExperienceController {
  /**
   * Create a new AR experience
   */
  createExperience = asyncHandler(async (req, res) => {
    const { title, description, contentConfig, markerImage, markerDimensions } = req.body;
    const userId = req.user.id;

    // Validation
    if (!title || !description || !contentConfig) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and content configuration are required',
      });
    }

    // Handle multiple files (like working version)
    const files = req.files || [];
    const mindFile = files.find((f) => f.fieldname === 'mindFile');

    if (!mindFile) {
      return res.status(400).json({
        success: false,
        message: 'Mind file is required',
      });
    }

    console.log(
      'Mind file found:',
      mindFile.originalname,
      mindFile.size,
      'bytes'
    );

    // Handle marker image - expect base64 data in body (like working version)
    let markerImageUrl = '';
    let originalDimensions = null;

    // Check if marker dimensions were provided by frontend
    if (markerDimensions) {
      try {
        originalDimensions = typeof markerDimensions === 'string' 
          ? JSON.parse(markerDimensions) 
          : markerDimensions;
      } catch (error) {
        console.warn('Could not parse frontend marker dimensions:', error.message);
      }
    }

    if (!markerImage) {
      return res.status(400).json({
        success: false,
        message: 'Marker image is required',
      });
    }

    // Check if it's base64 data (like working version)
    if (markerImage.startsWith('data:image/')) {
      const base64Data = markerImage.split(',')[1];
      const markerImageBuffer = Buffer.from(base64Data, 'base64');

      // Get original image dimensions before processing (if not already provided)
      if (!originalDimensions) {
        try {
          const Sharp = (await import('sharp')).default;
          const metadata = await Sharp(markerImageBuffer).metadata();
          originalDimensions = {
            width: metadata.width,
            height: metadata.height,
            aspectRatio: metadata.width / metadata.height
          };
          console.log('[DEBUG] Extracted marker dimensions from image:', originalDimensions);
        } catch (error) {
          console.warn('Could not extract marker dimensions:', error.message);
        }
      } else {
      }

      // Save marker image buffer to file (preserve original dimensions if possible)
      const savedFile = await fileService.saveFile(
        markerImageBuffer,
        `marker-${Date.now()}.png`,
        {
          processImage: true,
          imageOptions: { 
            width: originalDimensions?.width || 1024, 
            height: originalDimensions?.height || 1024, 
            quality: 90,
            fit: 'contain' // Preserve aspect ratio
          },
        }
      );
      markerImageUrl = savedFile.url;

    } else {
      return res.status(400).json({
        success: false,
        message: 'Valid marker image data is required',
      });
    }

    // Parse content config if it's a string FIRST
    let parsedContentConfig;
    try {
      parsedContentConfig =
        typeof contentConfig === 'string'
          ? JSON.parse(contentConfig)
          : contentConfig;
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid content configuration format',
      });
    }

    // Store marker dimensions in experience data (after parsing contentConfig)
    if (originalDimensions) {
      parsedContentConfig.markerDimensions = originalDimensions;
    }

    const experienceData = {
      title,
      description,
      markerImage: markerImageUrl,
      markerDimensions: parsedContentConfig.markerDimensions,
      contentConfig: parsedContentConfig,
    };

    const experience = await experienceService.createExperience(
      experienceData,
      userId
    );

    if (!experience || !experience.id) {
      console.error('Failed to create experience or missing ID');
      return res.status(500).json({
        success: false,
        message: 'Failed to create experience'
      });
    }

    // Save the mind file immediately after creating the experience (like working version)
    console.log('Saving mind file for experience ID:', experience.id);
    await experienceService.saveMindFile(experience.id, mindFile.buffer);

    // Get the updated experience with the mind file path
    const updatedExperience = await experienceService.getExperienceById(
      experience.id
    );

    if (!updatedExperience) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve updated experience',
      });
    }

    // Generate and save the HTML experience file
    const experienceHtmlPath = await experienceService.generateExperienceHtml(
      updatedExperience.id
    );


    res.status(201).json({
      success: true,
      message: 'Experience created successfully',
      data: {
        experience: updatedExperience,
        experienceUrl: experienceHtmlPath,
      },
    });
  });

  /**
   * Get user's experiences
   */
  getUserExperiences = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const experiences = await experienceService.getUserExperiences(userId);

    res.json({
      success: true,
      data: { experiences },
    });
  });

  /**
   * Get experience by ID
   */
  getExperience = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const experience = await experienceService.getExperienceById(parseInt(id));

    if (!experience) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found',
      });
    }

    // Check if user owns the experience or if it's public
    if (experience.userId !== req.user?.id && !experience.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: { experience },
    });
  });

  /**
   * Get experience by shareable link (public access)
   */
  getExperienceByLink = asyncHandler(async (req, res) => {
    const { link } = req.params;
    const experience = await experienceService.getExperienceByShareableLink(
      link
    );

    if (!experience) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found',
      });
    }

    res.json({
      success: true,
      data: { experience },
    });
  });

  /**
   * Get public experiences
   */
  getPublicExperiences = asyncHandler(async (req, res) => {
    const experiences = await experienceService.getPublicExperiences();

    res.json({
      success: true,
      data: { experiences },
    });
  });

  /**
   * Update experience
   */
  updateExperience = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, description, contentConfig, markerImage } = req.body;

    // Validation
    if (!title || !description || !contentConfig) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and content configuration are required',
      });
    }

    // Verify experience exists and user owns it
    const existingExperience = await experienceService.getExperienceById(
      parseInt(id)
    );
    if (!existingExperience) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found',
      });
    }

    if (existingExperience.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this experience',
      });
    }

    // Handle multiple files
    const files = req.files || [];
    const mindFile = files.find((f) => f.fieldname === 'mindFile');

    // Parse content config
    let parsedContentConfig;
    try {
      parsedContentConfig =
        typeof contentConfig === 'string'
          ? JSON.parse(contentConfig)
          : contentConfig;
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid content configuration format',
      });
    }

    // Prepare update data
    const updateData = {
      title,
      description,
      contentConfig: parsedContentConfig,
    };

    // Handle marker image update if provided and different
    if (markerImage && markerImage !== existingExperience.markerImage) {
      updateData.markerImage = markerImage;
    }

    console.log('Updating experience with data:', {
      id: parseInt(id),
      title: updateData.title,
      description: updateData.description,
      contentConfigKeys: Object.keys(updateData.contentConfig),
      hasMindFile: !!mindFile,
    });

    // Update the experience
    const updatedExperience = await experienceService.updateExperience(
      parseInt(id),
      updateData,
      userId
    );

    // If a new mind file was uploaded, save it
    if (mindFile) {
      await experienceService.saveMindFile(parseInt(id), mindFile.buffer);
    }

    // Get the final updated experience
    const finalExperience = await experienceService.getExperienceById(
      parseInt(id)
    );

    // Regenerate the HTML experience file
    const experienceUrl = await experienceService.generateExperienceHtml(
      parseInt(id)
    );

    console.log('Experience updated successfully');

    res.json({
      success: true,
      message: 'Experience updated successfully',
      data: {
        experience: finalExperience,
        experienceUrl: experienceUrl,
      },
    });
  });

  /**
   * Delete experience
   */
  deleteExperience = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    await experienceService.deleteExperience(parseInt(id), userId);

    res.json({
      success: true,
      message: 'Experience deleted successfully',
    });
  });

  /**
   * Update marker image
   */
  updateMarkerImage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Marker image file is required',
      });
    }

    // Save new marker image
    const savedFile = await fileService.saveFile(
      req.file.buffer,
      req.file.originalname,
      {
        processImage: true,
        imageOptions: { width: 1024, height: 1024, quality: 90 },
      }
    );

    const experience = await experienceService.updateMarkerImage(
      parseInt(id),
      savedFile.url,
      userId
    );

    res.json({
      success: true,
      message: 'Marker image updated successfully',
      data: { experience },
    });
  });

  /**
   * Save content file for experience
   */
  saveContentFile = asyncHandler(async (req, res) => {
    const { experienceId } = req.params;
    const { type } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'File is required',
      });
    }

    // Determine file category
    const fileCategory = fileService.getFileCategory(req.file.originalname);

    // Save file
    const savedFile = await fileService.saveFile(
      req.file.buffer,
      req.file.originalname,
      {
        processImage: fileCategory === 'image',
        imageOptions: { quality: 85 },
      }
    );

    // Create thumbnail for images/videos
    let thumbnail = null;
    if (fileCategory === 'image') {
      thumbnail = await fileService.createThumbnail(
        req.file.buffer,
        req.file.originalname
      );
    }

    // Save to database
    const contentFile = await experienceService.saveContentFile(
      parseInt(experienceId),
      {
        type: type || fileCategory,
        url: savedFile.url,
        filename: savedFile.filename,
        thumbnailUrl: thumbnail?.url,
      }
    );

    res.status(201).json({
      success: true,
      message: 'Content file saved successfully',
      data: { contentFile },
    });
  });

  /**
   * Get content files for experience
   */
  getContentFiles = asyncHandler(async (req, res) => {
    const { experienceId } = req.params;
    const contentFiles = await experienceService.getContentFiles(
      parseInt(experienceId)
    );

    res.json({
      success: true,
      data: { contentFiles },
    });
  });

  /**
   * Upload mind file for experience
   */
  uploadMindFile = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Mind file is required',
      });
    }

    // Verify experience exists and user owns it
    const experience = await experienceService.getExperienceById(parseInt(id));
    if (!experience) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found',
      });
    }

    if (experience.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this experience',
      });
    }

    // Save mind file
    const updatedExperience = await experienceService.saveMindFile(
      parseInt(id),
      req.file.buffer
    );

    // Generate experience HTML
    try {
      const experienceUrl = await experienceService.generateExperienceHtml(
        parseInt(id)
      );
      updatedExperience.experienceUrl = experienceUrl;
    } catch (error) {
      console.error('Error generating experience HTML:', error);
    }

    res.json({
      success: true,
      message: 'Mind file uploaded successfully',
      data: { experience: updatedExperience },
    });
  });

  /**
   * Get mind file for experience
   */
  getMindFile = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const mindFileBuffer = await experienceService.getMindFile(parseInt(id));

    if (!mindFileBuffer) {
      return res.status(404).json({
        success: false,
        message: 'Mind file not found',
      });
    }

    res.set('Content-Type', 'application/octet-stream');
    res.send(mindFileBuffer);
  });

  /**
   * Create multiple image experience
   */
  createMultipleImageExperience = asyncHandler(async (req, res) => {
    const { title, description, targetsConfig } = req.body;
    const userId = req.user.id;

    // Validation
    if (!title || !description || !targetsConfig) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and targets configuration are required',
      });
    }

    // Handle marker image upload (mind file)
    let markerImageUrl = '';
    if (req.file) {
      const savedFile = await fileService.saveFile(
        req.file.buffer,
        req.file.originalname
      );
      markerImageUrl = savedFile.url;
    }

    // Parse targets config if it's a string
    let parsedTargetsConfig;
    try {
      parsedTargetsConfig =
        typeof targetsConfig === 'string'
          ? JSON.parse(targetsConfig)
          : targetsConfig;
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid targets configuration format',
      });
    }

    const experienceData = {
      title,
      description,
      markerImage: markerImageUrl,
      isMultipleTargets: true,
      targetsConfig: parsedTargetsConfig,
      contentConfig: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        sceneObjects: [],
      },
    };

    const experience = await experienceService.createExperience(
      experienceData,
      userId
    );

    // Generate experience HTML
    try {
      const experienceUrl =
        await experienceService.generateMultipleImageExperienceHtml(
          experience.id
        );
      experience.experienceUrl = experienceUrl;
    } catch (error) {
      console.error('Error generating multiple image experience HTML:', error);
    }

    res.status(201).json({
      success: true,
      message: 'Multiple image experience created successfully',
      data: { experience },
    });
  });

  /**
   * Library Management Methods
   */

  // Models
  getModelsLibrary = asyncHandler(async (req, res) => {
    const models = await experienceService.getModelsLibrary();

    res.json({
      success: true,
      data: { models },
    });
  });

  uploadModel = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Model file is required',
      });
    }

    const savedFile = await fileService.saveFile(
      req.file.buffer,
      req.file.originalname
    );

    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    const fileSize = (req.file.size / 1024 / 1024).toFixed(2) + ' MB';

    const modelData = {
      name: name || req.file.originalname,
      description: description || '',
      fileUrl: savedFile.url,
      fileSize,
      format: fileExtension,
      category: 'general',
      uploadedBy: userId,
    };

    const model = await experienceService.saveModel(modelData);

    res.status(201).json({
      success: true,
      message: 'Model uploaded successfully',
      data: { model },
    });
  });

  deleteModel = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await experienceService.deleteModel(parseInt(id));

    res.json({
      success: true,
      message: 'Model deleted successfully',
    });
  });

  // Images
  getImagesLibrary = asyncHandler(async (req, res) => {
    const images = await experienceService.getImagesLibrary();

    res.json({
      success: true,
      data: { images },
    });
  });

  uploadImage = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required',
      });
    }

    const savedFile = await fileService.saveFile(
      req.file.buffer,
      req.file.originalname,
      {
        processImage: true,
        imageOptions: { quality: 90 },
      }
    );

    // Create thumbnail
    const thumbnail = await fileService.createThumbnail(
      req.file.buffer,
      req.file.originalname
    );

    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    const fileSize = (req.file.size / 1024 / 1024).toFixed(2) + ' MB';

    const imageData = {
      name: name || req.file.originalname,
      description: description || '',
      fileUrl: savedFile.url,
      thumbnailUrl: thumbnail?.url,
      fileSize,
      format: fileExtension,
      category: 'general',
      uploadedBy: userId,
    };

    const image = await experienceService.saveImage(imageData);

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: { image },
    });
  });

  deleteImage = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await experienceService.deleteImage(parseInt(id));

    res.json({
      success: true,
      message: 'Image deleted successfully',
    });
  });

  // Videos
  getVideosLibrary = asyncHandler(async (req, res) => {
    const videos = await experienceService.getVideosLibrary();

    res.json({
      success: true,
      data: { videos },
    });
  });

  uploadVideo = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Video file is required',
      });
    }

    const savedFile = await fileService.saveFile(
      req.file.buffer,
      req.file.originalname
    );

    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    const fileSize = (req.file.size / 1024 / 1024).toFixed(2) + ' MB';

    const videoData = {
      name: name || req.file.originalname,
      description: description || '',
      fileUrl: savedFile.url,
      fileSize,
      format: fileExtension,
      category: 'general',
      uploadedBy: userId,
    };

    const video = await experienceService.saveVideo(videoData);

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully',
      data: { video },
    });
  });

  deleteVideo = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await experienceService.deleteVideo(parseInt(id));

    res.json({
      success: true,
      message: 'Video deleted successfully',
    });
  });

  // Audio
  getAudioLibrary = asyncHandler(async (req, res) => {
    const audios = await experienceService.getAudioLibrary();

    res.json({
      success: true,
      data: { audios },
    });
  });

  uploadAudio = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Audio file is required',
      });
    }

    const savedFile = await fileService.saveFile(
      req.file.buffer,
      req.file.originalname
    );

    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    const fileSize = (req.file.size / 1024 / 1024).toFixed(2) + ' MB';

    const audioData = {
      name: name || req.file.originalname,
      description: description || '',
      fileUrl: savedFile.url,
      fileSize,
      format: fileExtension,
      category: 'general',
      uploadedBy: userId,
    };

    const audio = await experienceService.saveAudio(audioData);

    res.status(201).json({
      success: true,
      message: 'Audio uploaded successfully',
      data: { audio },
    });
  });

  deleteAudio = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await experienceService.deleteAudio(parseInt(id));

    res.json({
      success: true,
      message: 'Audio deleted successfully',
    });
  });

  /**
   * Serve experience HTML files
   */
  serveExperienceHtml = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Experience ID is now directly from the route parameter
    const experienceId = parseInt(id);
    const filename = `${id}.html`;

    const experience = await experienceService.getExperienceById(experienceId);
    if (!experience) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found',
      });
    }

    // Try to serve existing HTML file
    const filePath = path.join(process.cwd(), 'experiences', filename);

    if (fs.existsSync(filePath)) {
      res.set('Content-Type', 'text/html');
      return res.sendFile(filePath);
    }

    // If file doesn't exist, generate it
    try {
      const experienceUrl = experience.isMultipleTargets
        ? await experienceService.generateMultipleImageExperienceHtml(
            experienceId
          )
        : await experienceService.generateExperienceHtml(experienceId);

      res.set('Content-Type', 'text/html');
      return res.sendFile(path.join(process.cwd(), 'experiences', filename));
    } catch (error) {
      console.error('Error serving experience HTML:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to serve experience',
      });
    }
  });

  /**
   * Serve marker images
   */
  serveMarkerImage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const experience = await experienceService.getExperienceById(parseInt(id));

    if (!experience || !experience.markerImage) {
      return res.status(404).json({
        success: false,
        message: 'Marker image not found',
      });
    }

    // If marker image is base64 data URL, convert and serve
    if (experience.markerImage.startsWith('data:image/')) {
      const base64Data = experience.markerImage.split(',')[1];
      const imageBuffer = Buffer.from(base64Data, 'base64');

      res.set('Content-Type', 'image/png');
      return res.send(imageBuffer);
    }

    // If it's a file path, serve the file
    const filePath = path.join(
      process.cwd(),
      experience.markerImage.replace(/^\//, '')
    );

    if (fs.existsSync(filePath)) {
      res.set('Content-Type', 'image/png');
      return res.sendFile(filePath);
    }

    return res.status(404).json({
      success: false,
      message: 'Marker image file not found',
    });
  });

  /**
   * Serve mind files
   */
  serveMindFile = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const mindFileBuffer = await experienceService.getMindFile(parseInt(id));

    if (!mindFileBuffer) {
      return res.status(404).json({
        success: false,
        message: 'Mind file not found',
      });
    }

    res.set('Content-Type', 'application/octet-stream');
    res.send(mindFileBuffer);
  });
}

export const experienceController = new ExperienceController();
