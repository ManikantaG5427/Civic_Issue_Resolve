import express from 'express';
import { getReviewQueue } from '../controllers/adminController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Enforce authentication & Administrator/Super Admin role for all admin operations
router.use(protect);
router.use(authorize('administrator', 'super_admin'));

// GET /api/admin/review-queue -> Triage & review queue
router.get('/review-queue', getReviewQueue);

export default router;
