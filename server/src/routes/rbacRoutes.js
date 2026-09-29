import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { successResponse } from '../utils/apiResponse.js';

const router = express.Router();

// Route restricted to citizens and super_admin
router.get(
  '/citizen-access',
  protect,
  authorize('citizen', 'super_admin'),
  (req, res) => {
    return successResponse(res, 'Access granted to Citizen area', {
      userRole: req.user.role,
      area: 'Citizen Portal',
    });
  }
);

// Route restricted to field workers and super_admin
router.get(
  '/worker-access',
  protect,
  authorize('field_worker', 'super_admin'),
  (req, res) => {
    return successResponse(res, 'Access granted to Field Worker area', {
      userRole: req.user.role,
      area: 'Field Operations',
    });
  }
);

// Route restricted to administrators and super_admin
router.get(
  '/admin-access',
  protect,
  authorize('administrator', 'super_admin'),
  (req, res) => {
    return successResponse(res, 'Access granted to Administrator area', {
      userRole: req.user.role,
      area: 'Admin Review Management',
    });
  }
);

// Route strictly restricted to super_admin
router.get(
  '/super-admin-access',
  protect,
  authorize('super_admin'),
  (req, res) => {
    return successResponse(res, 'Access granted to Super Admin console', {
      userRole: req.user.role,
      area: 'System Configuration',
    });
  }
);

export default router;
