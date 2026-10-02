import Notification from '../models/Notification.js';
import User from '../models/User.js';
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

/**
 * Notify all administrators and super admins on newly created issues
 */
export const notifyAdminsOnNewIssue = async (issue, reporterName = 'A citizen') => {
  try {
    const admins = await User.find({
      role: { $in: ['administrator', 'super_admin'] },
      isActive: true,
    }).select('_id name');

    const notifPromises = admins.map((admin) =>
      sendNotification({
        recipient: admin._id,
        title: `🚨 New Civic Issue: ${issue.issueNumber}`,
        message: `${reporterName} reported "${issue.title}" at ${issue.location?.landmark || issue.location?.address || 'Municipal Zone'}.`,
        type: 'new_issue',
        linkUrl: `/issues/${issue.issueNumber || issue._id}`,
      })
    );

    await Promise.allSettled(notifPromises);
  } catch (err) {
    console.error('[Admin Notification Broadcast Error]', err.message);
  }
};
