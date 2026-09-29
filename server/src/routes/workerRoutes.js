import express from 'express';
import { getAssignedTasks } from '../controllers/workerController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Enforce authentication & Field Worker / Super Admin role
router.use(protect);
router.use(authorize('field_worker', 'super_admin'));

// GET /api/worker/tasks -> Personal assigned task queue
router.get('/tasks', getAssignedTasks);

export default router;
