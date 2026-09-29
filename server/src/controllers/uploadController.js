import { successResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';

/**
 * Handle civic issue evidence photo uploads (single or multiple, max 3)
 * POST /api/uploads/evidence
 */
export const uploadEvidence = async (req, res, next) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);

    if (!files || files.length === 0) {
      return next(new AppError('No image files provided for upload', 400));
    }

    const uploadedEvidence = files.map((file) => ({
      url: `/uploads/evidence/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      stage: req.body.stage || 'initial',
      uploadedAt: new Date(),
    }));

    return successResponse(
      res,
      `${uploadedEvidence.length} image(s) uploaded successfully`,
      uploadedEvidence,
      201
    );
  } catch (error) {
    next(error);
  }
};
