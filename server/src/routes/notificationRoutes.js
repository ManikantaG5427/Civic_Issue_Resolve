import express from 'express';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../controllers/notificationController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

// GET /api/notifications -> List user notifications with unread count
router.get('/', getUserNotifications);

// PATCH /api/notifications/read-all -> Mark all as read
router.patch('/read-all', markAllNotificationsAsRead);

// PATCH /api/notifications/:id/read -> Mark specific notification as read
router.patch('/:id/read', markNotificationAsRead);

export default router;
