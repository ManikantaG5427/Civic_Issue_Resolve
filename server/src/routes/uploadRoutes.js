import express from 'express';
import { uploadEvidence } from '../controllers/uploadController.js';
import { optionalProtect } from '../middlewares/authMiddleware.js';
import { uploadEvidenceMiddleware } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// Upload evidence images (max 3 per batch - supports guest and logged in reporting)
router.post(
  '/evidence',
  optionalProtect,
  uploadEvidenceMiddleware.array('images', 3),
  uploadEvidence
);

export default router;
