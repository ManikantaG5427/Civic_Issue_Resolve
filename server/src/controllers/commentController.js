import mongoose from 'mongoose';
import Issue from '../models/Issue.js';
import { sendNotification } from '../services/notificationService.js';
import { emitIssueEvent } from '../socket.js';

/**
 * @desc    Add a comment or internal note to an issue
 * @route   POST /api/issues/:id/comments
 * @access  Private (Citizen reporter, assigned worker, admin, super_admin)
 */
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, isInternal = false, attachments = [] } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Comment content must be at least 2 characters long.',
      });
    }

    if (content.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Comment content cannot exceed 2000 characters.',
      });
    }

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { issueNumber: id.toUpperCase() };

    const issue = await Issue.findOne(query)
      .populate('reporter', 'name email role')
      .populate('assignedWorker', 'name email role')
      .populate('category', 'name')
      .populate('serviceArea', 'name code')
      .populate('department', 'name code');

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: `Civic issue "${id}" not found.`,
      });
    }

    const isStaff = ['field_worker', 'administrator', 'super_admin'].includes(req.user.role);
    const isReporter =
      issue.reporter &&
      (issue.reporter._id.toString() === req.user._id.toString() ||
        issue.reporter.toString() === req.user._id.toString());

    // Authorization check
    if (!isStaff && !isReporter) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to comment on this civic issue.',
      });
    }

    // Citizens can never post internal notes
    const effectiveIsInternal = isStaff ? Boolean(isInternal) : false;

    const newComment = {
      author: req.user._id,
      authorName: req.user.name,
      authorRole: req.user.role,
      content: content.trim(),
      isInternal: effectiveIsInternal,
      attachments: Array.isArray(attachments) ? attachments : [],
      createdAt: new Date(),
    };

    issue.comments.push(newComment);

    // Add entry to timeline
    issue.timeline.push({
      status: issue.status,
      action: effectiveIsInternal ? 'Internal municipal note added' : 'Public comment posted',
      performedBy: req.user._id,
      note: effectiveIsInternal
        ? `[Internal Note] ${req.user.name} (${req.user.role})`
        : `[Comment] ${req.user.name}: "${content.trim().slice(0, 80)}${content.length > 80 ? '...' : ''}"`,
      visibility: effectiveIsInternal ? 'internal' : 'public',
      timestamp: new Date(),
    });

    await issue.save();

    // Trigger real-time notifications
    if (effectiveIsInternal) {
      // Internal note: notify assigned worker or admins
      if (issue.assignedWorker && issue.assignedWorker._id.toString() !== req.user._id.toString()) {
        await sendNotification({
          recipient: issue.assignedWorker._id,
          title: `Internal Note on ${issue.issueNumber}`,
          message: `${req.user.name} added an internal note: "${content.trim().slice(0, 100)}"`,
          type: 'issue_status',
          linkUrl: `/issues/${issue.issueNumber}`,
        });
      }
    } else {
      // Public comment: notify citizen if staff commented, or notify worker/admin if citizen commented
      if (isStaff && issue.reporter && issue.reporter._id.toString() !== req.user._id.toString()) {
        await sendNotification({
          recipient: issue.reporter._id,
          title: `New Update on ${issue.issueNumber}`,
          message: `${req.user.name} (${req.user.role.replace('_', ' ')}) commented: "${content.trim().slice(0, 100)}"`,
          type: 'issue_status',
          linkUrl: `/issues/${issue.issueNumber}`,
        });
      } else if (!isStaff && issue.assignedWorker) {
        await sendNotification({
          recipient: issue.assignedWorker._id,
          title: `Citizen Comment on ${issue.issueNumber}`,
          message: `Citizen ${req.user.name} commented: "${content.trim().slice(0, 100)}"`,
          type: 'issue_status',
          linkUrl: `/issues/${issue.issueNumber}`,
        });
      }
    }

    // Broadcast live update over Socket.IO
    emitIssueEvent('issue_updated', issue);

    // Sanitize comments for response
    const sanitizedComments = isStaff
      ? issue.comments
      : issue.comments.filter((c) => !c.isInternal);

    res.status(201).json({
      success: true,
      message: effectiveIsInternal
        ? 'Internal municipal note recorded successfully.'
        : 'Comment posted successfully.',
      comment: newComment,
      comments: sanitizedComments,
    });
  } catch (err) {
    console.error('[Add Comment Error]', err);
    res.status(500).json({
      success: false,
      message: 'Failed to record comment.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

/**
 * @desc    Get all comments for an issue (sanitized by role)
 * @route   GET /api/issues/:id/comments
 * @access  Private
 */
export const getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { issueNumber: id.toUpperCase() };

    const issue = await Issue.findOne(query)
      .select('comments reporter assignedWorker issueNumber')
      .populate('comments.author', 'name role avatar');

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: `Civic issue "${id}" not found.`,
      });
    }

    const isStaff = ['field_worker', 'administrator', 'super_admin'].includes(req.user.role);
    const reporterId = issue.reporter?._id
      ? issue.reporter._id.toString()
      : issue.reporter?.toString();
    const isReporter = reporterId === req.user._id.toString();

    if (!isStaff && !isReporter) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view comments for this civic issue.',
      });
    }

    const comments = isStaff
      ? issue.comments
      : issue.comments.filter((c) => !c.isInternal);

    res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (err) {
    console.error('[Get Comments Error]', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve comments.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};
