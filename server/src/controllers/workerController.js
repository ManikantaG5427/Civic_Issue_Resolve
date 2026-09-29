import Issue from '../models/Issue.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * Get field worker assigned tasks with metrics, SLA status, and filters
 * GET /api/worker/tasks
 */
export const getAssignedTasks = async (req, res, next) => {
  try {
    const {
      status = 'active',
      priority,
      search,
      sortBy = 'slaDeadline',
      sortOrder = 'asc',
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    // Scope to authenticated field worker (unless super_admin passes a specific query)
    if (req.user.role === 'field_worker') {
      query.assignedWorker = req.user._id;
    } else if (req.query.workerId) {
      query.assignedWorker = req.query.workerId;
    }

    // Status filtering
    if (status === 'active') {
      query.status = { $in: ['assigned', 'in_progress'] };
    } else if (status && status !== 'all') {
      if (status.includes(',')) {
        query.status = { $in: status.split(',').map((s) => s.trim()) };
      } else {
        query.status = status;
      }
    }

    // Priority filtering
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // Search keyword
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { issueNumber: searchRegex },
        { title: searchRegex },
        { 'location.landmark': searchRegex },
        { 'location.address': searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    const direction = sortOrder === 'desc' ? -1 : 1;
    sortOptions[sortBy] = direction;

    const now = new Date();
    const workerScope = req.user.role === 'field_worker' ? { assignedWorker: req.user._id } : {};

    // Parallel execution for metrics and list
    const [
      total,
      tasks,
      assignedCount,
      inProgressCount,
      resolvedCount,
      urgentCount,
      overdueCount,
    ] = await Promise.all([
      Issue.countDocuments(query),
      Issue.find(query)
        .populate('category', 'name code icon defaultPriority estimatedSlaHours')
        .populate('serviceArea', 'name code city state centerLocation')
        .populate('department', 'name code defaultSlaHours')
        .populate('reporter', 'name email phone')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Issue.countDocuments({ ...workerScope, status: 'assigned' }),
      Issue.countDocuments({ ...workerScope, status: 'in_progress' }),
      Issue.countDocuments({ ...workerScope, status: 'resolved_verification_pending' }),
      Issue.countDocuments({
        ...workerScope,
        priority: { $in: ['urgent', 'critical'] },
        status: { $in: ['assigned', 'in_progress'] },
      }),
      Issue.countDocuments({
        ...workerScope,
        status: { $in: ['assigned', 'in_progress'] },
        slaDeadline: { $lt: now },
      }),
    ]);

    return successResponse(res, 'Field worker assigned tasks retrieved successfully', {
      metrics: {
        assigned: assignedCount,
        inProgress: inProgressCount,
        resolvedVerificationPending: resolvedCount,
        urgent: urgentCount,
        overdue: overdueCount,
      },
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
      tasks,
    });
  } catch (error) {
    next(error);
  }
};
