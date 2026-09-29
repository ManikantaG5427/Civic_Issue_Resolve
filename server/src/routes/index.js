import express from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import rbacRoutes from './rbacRoutes.js';

const router = express.Router();

// Mount foundational health check
router.use('/health', healthRoutes);

// Mount authentication routes
router.use('/auth', authRoutes);

// Mount role-based permission verification routes
router.use('/rbac', rbacRoutes);

export default router;
