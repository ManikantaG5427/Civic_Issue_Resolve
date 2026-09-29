import express from 'express';
import {
  createIssue,
  getIssueById,
  getMyReports,
  provideRequestedInfo,
} from '../controllers/issueController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validateCreateIssue } from '../middlewares/issueValidation.js';

const router = express.Router();

// All issue management actions require authentication
router.use(protect);

// GET /api/issues/my-reports -> List authenticated citizen's submitted reports
router.get('/my-reports', getMyReports);

// POST /api/issues -> Create a new civic issue report
router.post('/', validateCreateIssue, createIssue);

// POST /api/issues/:id/provide-info -> Citizen provides clarification/requested info
router.post('/:id/provide-info', provideRequestedInfo);

// GET /api/issues/:id -> Get issue by ID or CIVIC-YYYY-XXXXXX number
router.get('/:id', getIssueById);

export default router;
