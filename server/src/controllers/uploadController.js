import { successResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { storeEvidenceFile } from '../services/storageService.js';

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

    const stage = req.body.stage || 'initial';
    const uploadedEvidence = await Promise.all(
      files.map((file) => storeEvidenceFile(file, stage))
    );

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
