import Issue from '../models/Issue.js';
import { checkAndEscalateOverdueIssues } from '../services/slaCronService.js';

/**
 * @desc    Trigger manual SLA escalation check
 * @route   POST /api/admin/sla/check-escalations
 * @access  Private (Admin, Super Admin)
 */
export const triggerSlaCheck = async (req, res) => {
  try {
    const result = await checkAndEscalateOverdueIssues();
    res.status(200).json({
      success: true,
      message: `SLA escalation sweep complete. ${result.escalatedCount} issue(s) newly escalated.`,
      data: result,
    });
  } catch (err) {
    console.error('[Trigger SLA Check Error]', err);
    res.status(500).json({
      success: false,
      message: 'Failed to execute SLA escalation check.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

/**
 * @desc    Get all currently breached or escalated issues
 * @route   GET /api/admin/sla/overdue
 * @access  Private (Admin, Super Admin)
 */
export const getOverdueIssues = async (req, res) => {
  try {
    const now = new Date();
    const query = {
      status: { $in: ['assigned', 'in_progress', 'reopened'] },
      $or: [
        { isEscalated: true },
        { slaDeadline: { $ne: null, $lt: now } },
      ],
    };

    const overdueIssues = await Issue.find(query)
      .populate('assignedWorker', 'name email role department')
      .populate('category', 'name icon code')
      .populate('department', 'name code')
      .populate('serviceArea', 'name code')
      .populate('reporter', 'name email')
      .sort({ slaDeadline: 1 });

    res.status(200).json({
      success: true,
      count: overdueIssues.length,
      overdueIssues,
    });
  } catch (err) {
    console.error('[Get Overdue Issues Error]', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve overdue issues.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};
