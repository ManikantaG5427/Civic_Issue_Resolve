import Issue from '../models/Issue.js';
import User from '../models/User.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * Get administrator review queue with triage metrics, filters, and pagination
 * GET /api/admin/review-queue
 */
export const getReviewQueue = async (req, res, next) => {
  try {
    const {
      status = 'triage',
      priority,
      department,
      serviceArea,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    // 1. Service Area Scoping
    if (serviceArea && serviceArea !== 'all') {
      query.serviceArea = serviceArea;
    } else if (req.user.role === 'administrator' && req.user.serviceArea) {
      // Scoped automatically to the administrator's assigned operational zone
      query.serviceArea = req.user.serviceArea;
    }

    // 2. Status Filtering
    if (status === 'triage') {
      // Actionable administrative triage queue
      query.status = { $in: ['submitted', 'in_review', 'info_requested', 'reopened'] };
    } else if (status && status !== 'all') {
      if (status.includes(',')) {
        query.status = { $in: status.split(',').map((s) => s.trim()) };
      } else {
        query.status = status;
      }
    }

    // 3. Priority Filtering
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // 4. Department Filtering
    if (department && department !== 'all') {
      query.department = department;
    }

    // 5. Search Keyword
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { issueNumber: searchRegex },
        { title: searchRegex },
        { 'location.landmark': searchRegex },
        { 'location.address': searchRegex },
      ];
    }

    // 6. Pagination & Sorting Setup
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    const direction = sortOrder === 'asc' ? 1 : -1;
    sortOptions[sortBy] = direction;

    // Base scope for counting aggregate triage metrics
    const baseMetricsQuery = {};
    if (query.serviceArea) {
      baseMetricsQuery.serviceArea = query.serviceArea;
    }

    // 7. Execute Queries in Parallel
    const [
      total,
      issues,
      pendingTriageCount,
      urgentCount,
      highCount,
      inProgressCount,
      resolvedCount,
    ] = await Promise.all([
      Issue.countDocuments(query),
      Issue.find(query)
        .populate('category', 'name code icon defaultPriority estimatedSlaHours')
        .populate('serviceArea', 'name code city state centerLocation')
        .populate('department', 'name code defaultSlaHours')
        .populate('reporter', 'name email phone')
        .populate('assignedWorker', 'name email phone department')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Issue.countDocuments({
        ...baseMetricsQuery,
        status: { $in: ['submitted', 'in_review', 'reopened', 'info_requested'] },
      }),
      Issue.countDocuments({
        ...baseMetricsQuery,
        priority: 'urgent',
        status: { $nin: ['closed', 'rejected'] },
      }),
      Issue.countDocuments({
        ...baseMetricsQuery,
        priority: 'high',
        status: { $nin: ['closed', 'rejected'] },
      }),
      Issue.countDocuments({
        ...baseMetricsQuery,
        status: 'in_progress',
      }),
      Issue.countDocuments({
        ...baseMetricsQuery,
        status: 'resolved_verification_pending',
      }),
    ]);

    return successResponse(res, 'Administrator review queue retrieved successfully', {
      metrics: {
        pendingTriage: pendingTriageCount,
        urgent: urgentCount,
        high: highCount,
        inProgress: inProgressCount,
        resolvedVerificationPending: resolvedCount,
      },
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
      issues,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify and accept a submitted issue
 * POST /api/admin/issues/:id/verify
 */
export const verifyIssue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note, visibility = 'public' } = req.body;

    const query = id.startsWith('CIVIC-') ? { issueNumber: id } : { _id: id };
    const issue = await Issue.findOne(query);

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Civic issue not found' });
    }

    if (['closed', 'rejected'].includes(issue.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot verify an issue that is already ${issue.status}`,
      });
    }

    const previousStatus = issue.status;
    issue.status = 'in_review';

    issue.timeline.push({
      status: 'in_review',
      action: 'Issue Verified & Accepted',
      performedBy: req.user._id,
      note: note ? note.trim() : 'Issue details verified by administrator. Accepted for department routing.',
      visibility: visibility === 'internal' ? 'internal' : 'public',
      timestamp: new Date(),
    });

    issue.auditLogs.push({
      action: 'ISSUE_VERIFIED',
      performedBy: req.user._id,
      previousState: { status: previousStatus },
      newState: { status: 'in_review', note },
      ipAddress: req.ip || req.connection?.remoteAddress,
      timestamp: new Date(),
    });

    await issue.save();

    const populated = await Issue.findById(issue._id)
      .populate('category', 'name code icon defaultPriority estimatedSlaHours')
      .populate('serviceArea', 'name code city state')
      .populate('department', 'name code defaultSlaHours')
      .populate('reporter', 'name email phone')
      .populate('assignedWorker', 'name email phone department')
      .populate('timeline.performedBy', 'name role');

    return successResponse(res, 'Issue verified and accepted successfully', populated, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Reject an issue with a mandatory reason
 * POST /api/admin/issues/:id/reject
 */
export const rejectIssue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, category = 'jurisdiction' } = req.body;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'A mandatory rejection reason of at least 10 characters is required',
      });
    }

    const query = id.startsWith('CIVIC-') ? { issueNumber: id } : { _id: id };
    const issue = await Issue.findOne(query);

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Civic issue not found' });
    }

    if (issue.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reject a closed and verified issue',
      });
    }

    const previousStatus = issue.status;
    issue.status = 'rejected';

    issue.timeline.push({
      status: 'rejected',
      action: 'Issue Rejected',
      performedBy: req.user._id,
      note: `Rejection (${category}): ${reason.trim()}`,
      visibility: 'public',
      timestamp: new Date(),
    });

    issue.auditLogs.push({
      action: 'ISSUE_REJECTED',
      performedBy: req.user._id,
      previousState: { status: previousStatus },
      newState: { status: 'rejected', reason: reason.trim(), category },
      ipAddress: req.ip || req.connection?.remoteAddress,
      timestamp: new Date(),
    });

    await issue.save();

    const populated = await Issue.findById(issue._id)
      .populate('category', 'name code icon defaultPriority estimatedSlaHours')
      .populate('serviceArea', 'name code city state')
      .populate('department', 'name code defaultSlaHours')
      .populate('reporter', 'name email phone')
      .populate('assignedWorker', 'name email phone department')
      .populate('timeline.performedBy', 'name role');

    return successResponse(res, 'Civic issue rejected', populated, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Request clarification / additional evidence from reporting citizen
 * POST /api/admin/issues/:id/request-info
 */
export const requestInfo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || message.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'A clarification message of at least 10 characters is required',
      });
    }

    const query = id.startsWith('CIVIC-') ? { issueNumber: id } : { _id: id };
    const issue = await Issue.findOne(query);

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Civic issue not found' });
    }

    if (['closed', 'rejected'].includes(issue.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot request information on a ${issue.status} issue`,
      });
    }

    const previousStatus = issue.status;
    issue.status = 'info_requested';

    issue.timeline.push({
      status: 'info_requested',
      action: 'Clarification Requested',
      performedBy: req.user._id,
      note: message.trim(),
      visibility: 'public',
      timestamp: new Date(),
    });

    issue.auditLogs.push({
      action: 'INFO_REQUESTED',
      performedBy: req.user._id,
      previousState: { status: previousStatus },
      newState: { status: 'info_requested', message: message.trim() },
      ipAddress: req.ip || req.connection?.remoteAddress,
      timestamp: new Date(),
    });

    await issue.save();

    const populated = await Issue.findById(issue._id)
      .populate('category', 'name code icon defaultPriority estimatedSlaHours')
      .populate('serviceArea', 'name code city state')
      .populate('department', 'name code defaultSlaHours')
      .populate('reporter', 'name email phone')
      .populate('assignedWorker', 'name email phone department')
      .populate('timeline.performedBy', 'name role');

    return successResponse(res, 'Information requested from citizen', populated, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Get available field workers for assignment
 * GET /api/admin/workers
 */
export const getWorkers = async (req, res, next) => {
  try {
    const { department, serviceArea } = req.query;

    const query = { role: 'field_worker', isActive: true };

    if (department && department !== 'all') {
      query.department = department;
    }

    if (serviceArea && serviceArea !== 'all') {
      query.serviceArea = serviceArea;
    }

    const workers = await User.find(query)
      .select('name email phone role department serviceArea')
      .populate('department', 'name code')
      .populate('serviceArea', 'name code');

    // Compute active workload for each worker
    const workersWithWorkload = await Promise.all(
      workers.map(async (worker) => {
        const activeTasks = await Issue.countDocuments({
          assignedWorker: worker._id,
          status: { $in: ['assigned', 'in_progress'] },
        });
        const workerObj = worker.toObject();
        workerObj.activeTasksCount = activeTasks;
        return workerObj;
      })
    );

    return successResponse(
      res,
      'Field workers retrieved successfully',
      workersWithWorkload,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Assign issue to department and field worker with priority and SLA
 * POST /api/admin/issues/:id/assign
 */
export const assignIssue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { departmentId, workerId, priority, slaHours = 48, assignmentNote } = req.body;

    const query = id.startsWith('CIVIC-') ? { issueNumber: id } : { _id: id };
    const issue = await Issue.findOne(query);

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Civic issue not found' });
    }

    if (['closed', 'rejected'].includes(issue.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign an issue that is already ${issue.status}`,
      });
    }

    // Validate assigned worker if provided
    let assignedWorker = null;
    if (workerId) {
      assignedWorker = await User.findOne({ _id: workerId, role: 'field_worker', isActive: true });
      if (!assignedWorker) {
        return res.status(400).json({
          success: false,
          message: 'The selected user is not an active field worker',
        });
      }
    }

    const previousState = {
      status: issue.status,
      assignedWorker: issue.assignedWorker,
      department: issue.department,
      priority: issue.priority,
    };

    // Calculate SLA deadline
    const hoursNum = Math.max(1, parseInt(slaHours, 10) || 48);
    const slaDeadline = new Date(Date.now() + hoursNum * 3600 * 1000);

    // Update Issue fields
    if (departmentId) issue.department = departmentId;
    if (assignedWorker) {
      issue.assignedWorker = assignedWorker._id;
      issue.assignedAt = new Date();
    }
    if (priority && ['low', 'medium', 'high', 'urgent', 'critical'].includes(priority)) {
      issue.priority = priority;
    }
    issue.slaDeadline = slaDeadline;
    issue.status = 'assigned';

    const workerName = assignedWorker ? assignedWorker.name : 'Field Team';
    const noteText = assignmentNote
      ? assignmentNote.trim()
      : `Dispatched to ${workerName} with ${issue.priority} priority (SLA: ${hoursNum} hours).`;

    issue.timeline.push({
      status: 'assigned',
      action: 'Issue Assigned & Dispatched',
      performedBy: req.user._id,
      note: noteText,
      visibility: 'public',
      timestamp: new Date(),
    });

    issue.auditLogs.push({
      action: 'ISSUE_ASSIGNED',
      performedBy: req.user._id,
      previousState,
      newState: {
        status: 'assigned',
        assignedWorker: issue.assignedWorker,
        department: issue.department,
        priority: issue.priority,
        slaDeadline,
        slaHours: hoursNum,
      },
      ipAddress: req.ip || req.connection?.remoteAddress,
      timestamp: new Date(),
    });

    await issue.save();

    const populated = await Issue.findById(issue._id)
      .populate('category', 'name code icon defaultPriority estimatedSlaHours')
      .populate('serviceArea', 'name code city state')
      .populate('department', 'name code defaultSlaHours')
      .populate('reporter', 'name email phone')
      .populate('assignedWorker', 'name email phone department')
      .populate('timeline.performedBy', 'name role');

    return successResponse(res, 'Civic issue assigned successfully', populated, 200);
  } catch (error) {
    next(error);
  }
};
