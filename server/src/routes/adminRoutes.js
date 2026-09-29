import express from 'express';
import {
  getReviewQueue,
  verifyIssue,
  rejectIssue,
  requestInfo,
} from '../controllers/adminController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Enforce authentication & Administrator/Super Admin role for all admin operations
router.use(protect);
router.use(authorize('administrator', 'super_admin'));

// GET /api/admin/review-queue -> Triage & review queue
router.get('/review-queue', getReviewQueue);

// POST /api/admin/issues/:id/verify -> Verify & accept issue into in_review
router.post('/issues/:id/verify', verifyIssue);

// POST /api/admin/issues/:id/reject -> Reject issue with mandatory reason
router.post('/issues/:id/reject', rejectIssue);

// POST /api/admin/issues/:id/request-info -> Request clarification from citizen
router.post('/issues/:id/request-info', requestInfo);

export default router;

