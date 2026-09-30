import Notification from '../models/Notification.js';

/**
 * Dispatch an in-app persistent notification to a user
 */
export const sendNotification = async ({ recipient, title, message, type = 'issue_status', linkUrl = '' }) => {
  try {
    if (!recipient) return null;
    const notif = new Notification({
      recipient,
      title,
      message,
      type,
      linkUrl,
      isRead: false,
    });
    await notif.save();
    return notif;
  } catch (err) {
    console.error('[Notification Dispatch Error]', err.message);
    return null;
  }
};
