import Notification from '../models/Notification.js';
import { emitLiveNotification } from '../socket.js';

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

    // Emit live real-time notification via Socket.IO
    emitLiveNotification(recipient, notif);

    return notif;
  } catch (err) {
    console.error('[Notification Dispatch Error]', err.message);
    return null;
  }
};
