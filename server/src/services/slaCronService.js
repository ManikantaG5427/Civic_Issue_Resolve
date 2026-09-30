import cron from 'node-cron';
import Issue from '../models/Issue.js';
import User from '../models/User.js';
import { sendNotification } from './notificationService.js';
import { emitIssueEvent } from '../socket.js';

let cronTask = null;

/**
 * Sweeps the database for issues that have breached their SLA resolution target
 * and automatically marks them as escalated with full audit & notifications.
 */
export const checkAndEscalateOverdueIssues = async () => {
  try {
    const now = new Date();

    const overdueIssues = await Issue.find({
      status: { $in: ['assigned', 'in_progress', 'reopened'] },
      slaDeadline: { $ne: null, $lt: now },
      isEscalated: { $ne: true },
    })
      .populate('assignedWorker', 'name email role')
      .populate('reporter', 'name email')
      .populate('department', 'name code');

    if (overdueIssues.length === 0) {
      return {
        escalatedCount: 0,
        escalatedIssues: [],
        timestamp: now,
      };
    }

    console.info(
      `[SLA Background Engine] Found ${overdueIssues.length} overdue civic issue(s). Initiating auto-escalation...`
    );

    // Find system administrator account for performedBy attribute
    const systemAdmin = await User.findOne({ role: 'super_admin' }).select('_id');
    const performedById = systemAdmin ? systemAdmin._id : overdueIssues[0].reporter?._id;

    const escalatedList = [];

    for (const issue of overdueIssues) {
      issue.isEscalated = true;

      // Add timeline record
      issue.timeline.push({
        status: issue.status,
        action: 'SLA Breached & Auto-Escalated',
        performedBy: performedById,
        note: `Target resolution SLA deadline (${new Date(
          issue.slaDeadline
        ).toLocaleString()}) was breached without completion. Ticket flagged as urgent priority and auto-escalated to municipal supervisors.`,
        visibility: 'public',
        timestamp: now,
      });

      // Add audit log
      issue.auditLogs.push({
        action: 'SLA_BREACH_AUTO_ESCALATED',
        performedBy: performedById,
        previousState: { isEscalated: false },
        newState: { isEscalated: true, slaDeadline: issue.slaDeadline, breachedAt: now },
        timestamp: now,
      });

      await issue.save();
      escalatedList.push(issue);

      // 1. Notify assigned worker urgently
      if (issue.assignedWorker && issue.assignedWorker._id) {
        await sendNotification({
          recipient: issue.assignedWorker._id,
          title: `⚠️ SLA BREACH: ${issue.issueNumber}`,
          message: `Your assigned task "${issue.title}" has passed its SLA target deadline and has been auto-escalated to supervisor oversight.`,
          type: 'sla_escalated',
          linkUrl: `/issues/${issue.issueNumber}`,
        });
      }

      // 2. Notify municipal administrators
      const admins = await User.find({
        role: { $in: ['administrator', 'super_admin'] },
        isActive: true,
      }).select('_id');

      for (const admin of admins) {
        await sendNotification({
          recipient: admin._id,
          title: `🚨 SLA Escalation Alert: ${issue.issueNumber}`,
          message: `Civic issue "${issue.title}" has breached its SLA target. Immediate supervisory intervention is recommended.`,
          type: 'sla_escalated',
          linkUrl: `/issues/${issue.issueNumber}`,
        });
      }

      // 3. Emit real-time Socket.IO event to update open dashboards
      emitIssueEvent('issue_updated', issue);
    }

    console.info(
      `[SLA Background Engine] Successfully processed and escalated ${escalatedList.length} issue(s).`
    );

    return {
      escalatedCount: escalatedList.length,
      escalatedIssues: escalatedList.map((i) => ({
        _id: i._id,
        issueNumber: i.issueNumber,
        title: i.title,
        status: i.status,
        slaDeadline: i.slaDeadline,
      })),
      timestamp: now,
    };
  } catch (err) {
    console.error('[SLA Background Engine Error]', err.message);
    throw err;
  }
};

/**
 * Initialize automated SLA check cron schedule (Runs every 5 minutes)
 */
export const initSlaCron = () => {
  if (process.env.NODE_ENV === 'test') {
    return; // Don't run background intervals during unit test runs
  }

  // Run every 5 minutes: '*/5 * * * *'
  cronTask = cron.schedule('*/5 * * * *', async () => {
    try {
      await checkAndEscalateOverdueIssues();
    } catch (err) {
      console.error('[SLA Cron Run Error]', err);
    }
  });

  console.info('[SLA Engine] Automated SLA Background Monitor initialized (Schedule: */5 * * * *)');
  return cronTask;
};

/**
 * Stop running cron schedule (e.g. for graceful shutdown)
 */
export const stopSlaCron = () => {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
  }
};
