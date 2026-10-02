import express from 'express';
import mongoose from 'mongoose';
import {
  createIssue,
  getIssueById,
  getMyReports,
  provideRequestedInfo,
  confirmResolution,
  reopenIssue,
  withdrawIssue,
  deleteIssue,
} from '../controllers/issueController.js';
import { addComment, getComments } from '../controllers/commentController.js';
import {
  getNearbyDuplicates,
  toggleUpvote,
  toggleFollow,
} from '../controllers/duplicateController.js';
import { getPublicMapIssues } from '../controllers/publicMapController.js';
import { protect, optionalProtect } from '../middlewares/authMiddleware.js';
import { validateCreateIssue } from '../middlewares/issueValidation.js';

const router = express.Router();

// 1. Static Public Routes (MUST come before dynamic `/:id` param route)
// GET /api/issues/public-map -> Retrieve anonymized geo-tagged issues
router.get('/public-map', getPublicMapIssues);

// 2. Static Authenticated Routes (MUST come before dynamic `/:id` param route)
// GET /api/issues/my-reports -> List authenticated citizen's submitted reports
router.get('/my-reports', protect, getMyReports);

// GET /api/issues/nearby-duplicates -> Find active issues within proximity radius
router.get('/nearby-duplicates', optionalProtect, getNearbyDuplicates);

// POST /api/issues -> Create a new civic issue report (accessible by both guest and authenticated citizens)
router.post('/', optionalProtect, validateCreateIssue, createIssue);

// 3. Dynamic Issue-Specific Param Routes (Publicly trackable or authenticated actions)
// GET /api/issues/:id -> Get issue by ID or CIVIC-YYYY-XXXXXX number
router.get('/:id', optionalProtect, getIssueById);

// DELETE /api/issues/:id -> Delete newly submitted/withdrawn issue
router.delete('/:id', protect, deleteIssue);

// GET /api/issues/:id/comments -> Public comments reading
router.get('/:id/comments', optionalProtect, getComments);

// Mutating issue actions requiring authentication
router.post('/:id/upvote', protect, toggleUpvote);
router.post('/:id/follow', protect, toggleFollow);
router.post('/:id/comments', protect, addComment);
router.post('/:id/provide-info', protect, provideRequestedInfo);
router.post('/:id/confirm-resolution', protect, confirmResolution);
router.post('/:id/reopen', protect, reopenIssue);
router.post('/:id/withdraw', protect, withdrawIssue);

export default router;
