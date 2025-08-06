import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { generateUniqueFilename } from '../middleware/upload.js';

class FileService {
  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadsDirectory();
  }

  /**
   * Ensure uploads directory exists
   */
  async ensureUploadsDirectory() {
    try {
      await fs.access(this.uploadsDir);
    } catch {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Save file to disk
   */
  async saveFile(buffer, originalFilename, options = {}) {
    const filename = generateUniqueFilename(originalFilename);
    const filepath = path.join(this.uploadsDir, filename);
    
    let processedBuffer = buffer;

    // Process image if it's an image file
    if (options.processImage && this.isImageFile(originalFilename)) {
      processedBuffer = await this.processImage(buffer, options.imageOptions);
    }

    await fs.writeFile(filepath, processedBuffer);
    
    return {
      filename,
      filepath,
      url: `/uploads/${filename}`,
      size: processedBuffer.length,
    };
  }

  /**
   * Process image (resize, optimize)
   */
  async processImage(buffer, options = {}) {
    const {
      width = null,
      height = null,
      quality = 80,
      format = null,
    } = options;

    let processor = sharp(buffer);

    // Resize if dimensions provided
    if (width || height) {
      processor = processor.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Convert format if specified
    if (format) {
      processor = processor.toFormat(format, { quality });
    } else {
      // Optimize with quality setting
      processor = processor.jpeg({ quality }).png({ quality: Math.round(quality * 0.9) });
    }

    return await processor.toBuffer();
  }

  /**
   * Create thumbnail for image/video
   */
  async createThumbnail(buffer, originalFilename, options = {}) {
    const {
      width = 300,
      height = 300,
      quality = 70,
    } = options;

    if (!this.isImageFile(originalFilename)) {
      return null;
    }

    const thumbnailBuffer = await sharp(buffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality })
      .toBuffer();

    const thumbnailFilename = `thumb_${generateUniqueFilename(originalFilename)}`;
    const thumbnailPath = path.join(this.uploadsDir, thumbnailFilename);
    
    await fs.writeFile(thumbnailPath, thumbnailBuffer);

    return {
      filename: thumbnailFilename,
      url: `/uploads/${thumbnailFilename}`,
      size: thumbnailBuffer.length,
    };
  }

  /**
   * Delete file from disk
   */
  async deleteFile(fileUrl) {
    try {
      // Extract filename from URL
      const filename = path.basename(fileUrl);
      const filepath = path.join(this.uploadsDir, filename);
      
      await fs.unlink(filepath);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(fileUrl) {
    try {
      const filename = path.basename(fileUrl);
      const filepath = path.join(this.uploadsDir, filename);
      const stats = await fs.stat(filepath);
      
      return {
        exists: true,
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime,
      };
    } catch (error) {
      return { exists: false };
    }
  }

  /**
   * Check if file is an image
   */
  isImageFile(filename) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const ext = path.extname(filename).toLowerCase();
    return imageExtensions.includes(ext);
  }

  /**
   * Check if file is a video
   */
  isVideoFile(filename) {
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    const ext = path.extname(filename).toLowerCase();
    return videoExtensions.includes(ext);
  }

  /**
   * Check if file is an audio
   */
  isAudioFile(filename) {
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.aac', '.flac'];
    const ext = path.extname(filename).toLowerCase();
    return audioExtensions.includes(ext);
  }

  /**
   * Check if file is a 3D model
   */
  isModelFile(filename) {
    const modelExtensions = ['.glb', '.gltf', '.obj', '.fbx', '.dae'];
    const ext = path.extname(filename).toLowerCase();
    return modelExtensions.includes(ext);
  }

  /**
   * Get file type category
   */
  getFileCategory(filename) {
    if (this.isImageFile(filename)) return 'image';
    if (this.isVideoFile(filename)) return 'video';
    if (this.isAudioFile(filename)) return 'audio';
    if (this.isModelFile(filename)) return 'model';
    return 'other';
  }

  /**
   * Format file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const fileService = new FileService();
