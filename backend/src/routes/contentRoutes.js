import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Content upload endpoint
router.post('/', upload.single('file'), async (req, res) => {
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

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }

    const { type } = req.body;
    if (!type || !['model', 'image', 'video', 'audio'].includes(type)) {
      return res.status(400).json({ message: 'Invalid content type' });
    }

    const filename = `${Date.now()}-${req.file.originalname}`;
    const filePath = path.join(uploadsDir, filename);
    await fs.promises.writeFile(filePath, req.file.buffer);

    const contentFile = {
      id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      experienceId: req.body.experienceId || '-1',
      type,
      url: `/uploads/${filename}`,
      filename: req.file.originalname,
      createdAt: new Date(),
    };

    res.json(contentFile);
  } catch (error) {
    console.error('Error uploading content:', error);
    res.status(400).json({
      message: 'Failed to upload content',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
