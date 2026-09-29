import express from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';

const router = express.Router();

// Mount foundational health check
router.use('/health', healthRoutes);

// Mount authentication routes
router.use('/auth', authRoutes);

export default router;
