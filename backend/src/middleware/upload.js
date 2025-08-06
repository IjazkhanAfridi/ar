import multer from 'multer';
import path from 'path';
import { nanoid } from 'nanoid';
import { config } from '../config/config.js';

// Storage configuration
const storage = multer.memoryStorage();

// File filter function
function fileFilter(req, file, cb) {
  // Define allowed file types
  const allowedTypes = {
    image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    video: ['video/mp4', 'video/webm', 'video/quicktime'],
    model: ['model/gltf-binary', 'application/octet-stream'], // for .glb files
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  };

  const allAllowedTypes = Object.values(allowedTypes).flat();

  if (allAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
}

// Base multer configuration
const baseUpload = multer({
  storage,
  limits: {
    fileSize: config.MAX_FILE_SIZE,
  },
  fileFilter,
});

// Single file upload middleware
export const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    const upload = baseUpload.single(fieldName);

    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: `File too large. Maximum size is ${
              config.MAX_FILE_SIZE / (1024 * 1024)
            }MB`,
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      next();
    });
  };
};

// Multiple files upload middleware
export const uploadMultiple = (fieldName, maxCount = 10) => {
  return (req, res, next) => {
    const upload = baseUpload.array(fieldName, maxCount);

    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: `File too large. Maximum size is ${
              config.MAX_FILE_SIZE / (1024 * 1024)
            }MB`,
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: `Too many files. Maximum is ${maxCount}`,
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      next();
    });
  };
};

// Mixed fields upload middleware
export const uploadFields = (fields) => {
  return (req, res, next) => {
    const upload = baseUpload.fields(fields);

    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: `File too large. Maximum size is ${
              config.MAX_FILE_SIZE / (1024 * 1024)
            }MB`,
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      next();
    });
  };
};

// Utility function to generate unique filename
export function generateUniqueFilename(originalName) {
  const timestamp = Date.now();
  const randomId = nanoid(8);
  const ext = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, ext);

  return `${timestamp}-${randomId}-${nameWithoutExt}${ext}`;
}

// Export multiple file upload middleware (for experience creation)
export const uploadAny = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.MAX_FILE_SIZE },
}).any();
