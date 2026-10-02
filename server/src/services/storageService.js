import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Cloudinary if environment variables are present
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Upload evidence image (supports Cloudinary cloud CDN with automatic local disk fallback)
 */
export const storeEvidenceFile = async (file, stage = 'initial') => {
  // 1. Cloudinary Cloud Storage Option
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && file.path) {
    try {
      const uploadResult = await cloudinary.uploader.upload(file.path, {
        folder: 'civicresolve/evidence',
        tags: [stage, 'civic_defect_evidence'],
        resource_type: 'image',
      });

      // Remove temporary local file after cloud upload
      try {
        fs.unlinkSync(file.path);
      } catch {}

      return {
        url: uploadResult.secure_url,
        filename: uploadResult.public_id,
        originalName: file.originalname,
        fileSize: uploadResult.bytes || file.size,
        mimeType: file.mimetype,
        storageType: 'cloud_cloudinary',
        stage,
        uploadedAt: new Date(),
      };
    } catch (cloudErr) {
      console.warn('[Storage] Cloudinary upload failed, using local disk fallback:', cloudErr.message);
    }
  }

  // 2. High-Performance Local Disk Storage
  return {
    url: `/uploads/evidence/${file.filename}`,
    filename: file.filename,
    originalName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
    storageType: 'local_disk',
    stage,
    uploadedAt: new Date(),
  };
};
