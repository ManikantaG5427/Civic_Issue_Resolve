import Issue from '../models/Issue.js';
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
