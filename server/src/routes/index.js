import express from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import rbacRoutes from './rbacRoutes.js';
import configRoutes from './configRoutes.js';
import issueRoutes from './issueRoutes.js';
import uploadRoutes from './uploadRoutes.js';
import adminRoutes from './adminRoutes.js';
import workerRoutes from './workerRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import {
  getServiceAreas,
  getDepartments,
  getCategories,
} from '../controllers/configController.js';

const router = express.Router();

// Mount foundational health check
router.use('/health', healthRoutes);

// Mount authentication routes
router.use('/auth', authRoutes);

// Mount role-based permission verification routes
router.use('/rbac', rbacRoutes);

// Mount civic issue management routes
router.use('/issues', issueRoutes);

// Mount in-app persistent notifications
router.use('/notifications', notificationRoutes);

// Mount media and evidence upload routes
router.use('/uploads', uploadRoutes);

// Mount administrator operations routes
router.use('/admin', adminRoutes);

// Mount field worker operations routes
router.use('/worker', workerRoutes);

// Mount system configuration routes
router.use('/config', configRoutes);
router.get('/service-areas', getServiceAreas);
router.get('/departments', getDepartments);
router.get('/categories', getCategories);

export default router;
