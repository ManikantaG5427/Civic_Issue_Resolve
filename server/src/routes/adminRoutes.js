import express from 'express';
import {
  getReviewQueue,
  verifyIssue,
  rejectIssue,
  requestInfo,
  getWorkers,
  assignIssue,
  addWorkerToRoster,
  removeWorkerFromRoster,
  submitPhaseProof,
  reviewEvidence,
  closeNoResponse,
} from '../controllers/adminController.js';
import { triggerSlaCheck, getOverdueIssues } from '../controllers/slaController.js';
import { getAdminAnalytics } from '../controllers/analyticsController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Enforce authentication & Administrator/Super Admin role for all admin operations
router.use(protect);
router.use(authorize('administrator', 'super_admin'));

// Municipal Intelligence & Analytics (Queue 20)
// GET /api/admin/analytics -> Aggregate KPI metrics, category breakdowns, and worker leaderboards
router.get('/analytics', getAdminAnalytics);

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

// Multi-Worker Dispatch Management
router.post('/issues/:id/workers', addWorkerToRoster);
router.delete('/issues/:id/workers/:workerId', removeWorkerFromRoster);

// Independent Reviewer Evidence Inspection & Verification (Evidence-Gated Workflow)
router.post('/issues/:id/review-evidence', reviewEvidence);

// Administrative Closure with No-Response
router.post('/issues/:id/close-no-response', closeNoResponse);

// 3-Phase Work Execution Proof
router.post('/issues/:id/phase-proof', submitPhaseProof);

// Super Admin Staff / Officer Role Approvals
router.get('/users/pending-approvals', (req, res, next) => {
  import('../controllers/adminController.js').then((m) => m.getPendingApprovals(req, res, next));
});
router.post('/users/:id/approve-role', (req, res, next) => {
  import('../controllers/adminController.js').then((m) => m.approveUserRole(req, res, next));
});
router.post('/users/:id/reject-role', (req, res, next) => {
  import('../controllers/adminController.js').then((m) => m.rejectUserRole(req, res, next));
});

export default router;

