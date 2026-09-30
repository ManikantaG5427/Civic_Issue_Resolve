import Notification from '../models/Notification.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * Get current authenticated user's persistent notifications
 * GET /api/notifications
 */
export const getUserNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const query = { recipient: req.user._id };
    if (unreadOnly === 'true' || unreadOnly === true) {
      query.isRead = false;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [total, unreadCount, notifications] = await Promise.all([
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    ]);

    return successResponse(res, 'Notifications retrieved successfully', {
      unreadCount,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a single notification as read
 * PATCH /api/notifications/:id/read
 */
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or access denied',
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    return successResponse(res, 'Notification marked as read', {
      notification,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read for the user
 * PATCH /api/notifications/read-all
 */
export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const now = new Date();
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: now } }
    );

    return successResponse(res, 'All notifications marked as read', {
      unreadCount: 0,
    });
  } catch (error) {
    next(error);
  }
};
