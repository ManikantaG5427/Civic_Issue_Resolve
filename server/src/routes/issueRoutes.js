import express from 'express';
import {
  createIssue,
  getIssueById,
  getMyReports,
  provideRequestedInfo,
  confirmResolution,
  reopenIssue,
} from '../controllers/issueController.js';
import { addComment, getComments } from '../controllers/commentController.js';
import {
  getNearbyDuplicates,
  toggleUpvote,
  toggleFollow,
} from '../controllers/duplicateController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validateCreateIssue } from '../middlewares/issueValidation.js';

const router = express.Router();

// All issue management actions require authentication
router.use(protect);

// Geospatial Duplicate Detection (Queue 18)
// GET /api/issues/nearby-duplicates -> Find active issues within proximity radius
router.get('/nearby-duplicates', getNearbyDuplicates);

// GET /api/issues/my-reports -> List authenticated citizen's submitted reports
router.get('/my-reports', getMyReports);

// POST /api/issues -> Create a new civic issue report
router.post('/', validateCreateIssue, createIssue);

// Social Support & Follow Subsystem (Queue 18)
// POST /api/issues/:id/upvote -> Upvote or withdraw support
router.post('/:id/upvote', toggleUpvote);

// POST /api/issues/:id/follow -> Follow / unfollow notifications
router.post('/:id/follow', toggleFollow);

// Comments Subsystem (Queue 17)
// POST /api/issues/:id/comments -> Add public comment or staff internal note
router.post('/:id/comments', addComment);

// GET /api/issues/:id/comments -> Retrieve sanitized comments list
router.get('/:id/comments', getComments);

// POST /api/issues/:id/provide-info -> Citizen provides clarification/requested info
router.post('/:id/provide-info', provideRequestedInfo);

// POST /api/issues/:id/confirm-resolution -> Citizen confirms resolution, rates, and closes
router.post('/:id/confirm-resolution', confirmResolution);

// POST /api/issues/:id/reopen -> Citizen or admin reopens issue
router.post('/:id/reopen', reopenIssue);

// GET /api/issues/:id -> Get issue by ID or CIVIC-YYYY-XXXXXX number
router.get('/:id', getIssueById);

export default router;

