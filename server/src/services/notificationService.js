import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { emitLiveNotification } from '../socket.js';
import { sendSuperAdminAlertEmail } from './emailService.js';

/**
 * Dispatch an in-app persistent notification to a user
 */
export const sendNotification = async ({ recipient, title, message, type = 'system', linkUrl = '' }) => {
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
 * Notify Super Administrator(s) across the platform via in-app notification bar, live socket, and email alert
 */
export const notifySuperAdmin = async ({
  eventType = 'system',
  title = 'CivicResolve System Activity',
  message = '',
  linkUrl = '',
  actor = null,
  metadata = {},
  req = null,
}) => {
  try {
    const actorName = actor?.name || 'Anonymous / Guest';
    const actorEmail = actor?.email || '';
    const actorRole = actor?.role || 'visitor';

    // Extract client IP & user agent if request object provided
    let ip = 'N/A';
    let userAgent = 'N/A';
    if (req) {
      ip = req.headers?.['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || 'N/A';
      userAgent = req.headers?.['user-agent'] || 'Web App Client';
    }

    // 1. Fetch active Super Admin accounts from database
    const superAdmins = await User.find({
      role: 'super_admin',
      isActive: true,
    }).select('_id name email');

    // 2. Deliver in-app notification & live socket event to all super admins
    for (const sa of superAdmins) {
      await sendNotification({
        recipient: sa._id,
        title,
        message,
        type: eventType,
        linkUrl,
      });
    }

    // 3. Dispatch direct email alert to Super Admin email (non-blocking)
    sendSuperAdminAlertEmail({
      eventType,
      title,
      message,
      actorName,
      actorEmail,
      actorRole,
      details: {
        'Client IP': ip,
        'Device / Browser': typeof userAgent === 'string' ? userAgent.substring(0, 120) : 'Web App',
        ...metadata,
      },
      linkUrl: linkUrl
        ? `${process.env.CLIENT_URL || 'https://civicissueresolve-client.vercel.app'}${linkUrl.startsWith('/') ? linkUrl : `/${linkUrl}`}`
        : '',
      timestamp: new Date(),
    }).catch((err) => {
      console.warn('[Super Admin Email Alert Dispatch Notice]', err.message);
    });
  } catch (err) {
    console.error('[Super Admin Notification Service Error]', err.message);
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
        title: `New Civic Issue: ${issue.issueNumber}`,
        message: `${reporterName} reported "${issue.title}" at ${issue.location?.landmark || issue.location?.address || 'Municipal Zone'}.`,
        type: 'issue_created',
        linkUrl: `/issues/${issue.issueNumber || issue._id}`,
      })
    );

    await Promise.allSettled(notifPromises);
  } catch (err) {
    console.error('[Admin Notification Broadcast Error]', err.message);
  }
};

