import express from 'express';
import {
  getServiceAreas,
  createServiceArea,
  getDepartments,
  createDepartment,
  getCategories,
  createCategory,
  getConfigSummary,
} from '../controllers/configController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Public / Read access to configuration data
router.get('/service-areas', getServiceAreas);
router.get('/departments', getDepartments);
router.get('/categories', getCategories);
router.get('/summary', getConfigSummary);

// Super Admin management endpoints
router.post(
  '/service-areas',
  protect,
  authorize('super_admin'),
  createServiceArea
);

router.post(
  '/departments',
  protect,
  authorize('super_admin'),
  createDepartment
);

router.post(
  '/categories',
  protect,
  authorize('super_admin'),
  createCategory
);

export default router;
