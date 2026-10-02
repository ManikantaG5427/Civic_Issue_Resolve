import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { AppError } from '../utils/appError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure evidence upload directory exists
const evidenceDir = path.join(__dirname, '../../uploads/evidence');
if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true });
}

// Disk Storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, evidenceDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `evidence-${uniqueSuffix}${ext}`);
  },
});

// File filter accepting only verified image MIME types
const fileFilter = (_req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Invalid file type. Only JPG, JPEG, PNG, and WEBP images are supported.',
        400
      ),
      false
    );
  }
};

const maxFileSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || '25', 10);

export const uploadEvidenceMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSizeMB * 1024 * 1024, // 5 MB
    files: 3, // Maximum 3 images per report
  },
});
