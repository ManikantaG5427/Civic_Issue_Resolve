import express from 'express';
import { createIssue, getIssueById } from '../controllers/issueController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validateCreateIssue } from '../middlewares/issueValidation.js';

const router = express.Router();

// All issue management actions require authentication
router.use(protect);

// POST /api/issues -> Create a new civic issue report
router.post('/', validateCreateIssue, createIssue);

// GET /api/issues/:id -> Get issue by ID or CIVIC-YYYY-XXXXXX number
router.get('/:id', getIssueById);

export default router;
