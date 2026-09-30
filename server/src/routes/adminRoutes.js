import express from 'express';
import {
  getReviewQueue,
  verifyIssue,
  rejectIssue,
  requestInfo,
  getWorkers,
  assignIssue,
} from '../controllers/adminController.js';
import { triggerSlaCheck, getOverdueIssues } from '../controllers/slaController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Enforce authentication & Administrator/Super Admin role for all admin operations
router.use(protect);
router.use(authorize('administrator', 'super_admin'));

// GET /api/admin/review-queue -> Triage & review queue
router.get('/review-queue', getReviewQueue);

// GET /api/admin/workers -> Available field workers for dispatch
router.get('/workers', getWorkers);

// SLA Automated Background Engine (Queue 19)
// POST /api/admin/sla/check-escalations -> Trigger manual SLA escalation sweep
router.post('/sla/check-escalations', triggerSlaCheck);

// GET /api/admin/sla/overdue -> Retrieve list of all currently overdue / escalated issues
router.get('/sla/overdue', getOverdueIssues);

// POST /api/admin/issues/:id/verify -> Verify & accept issue into in_review
router.post('/issues/:id/verify', verifyIssue);

// POST /api/admin/issues/:id/reject -> Reject issue with mandatory reason
router.post('/issues/:id/reject', rejectIssue);

// POST /api/admin/issues/:id/request-info -> Request clarification from citizen
router.post('/issues/:id/request-info', requestInfo);

// POST /api/admin/issues/:id/assign -> Assign issue to department, worker, and SLA
router.post('/issues/:id/assign', assignIssue);

export default router;

