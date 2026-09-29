import express from 'express';
import { uploadEvidence } from '../controllers/uploadController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { uploadEvidenceMiddleware } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// Upload evidence images (max 3 per batch)
router.post(
  '/evidence',
  protect,
  uploadEvidenceMiddleware.array('images', 3),
  uploadEvidence
);

export default router;
