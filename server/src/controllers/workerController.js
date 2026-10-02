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

    // Scope to authenticated field worker (unless super_admin passes a specific query)
    const workerFilter = req.user.role === 'field_worker'
      ? { $or: [{ assignedWorker: req.user._id }, { 'assignedWorkers.worker': req.user._id }] }
      : req.query.workerId
      ? { $or: [{ assignedWorker: req.query.workerId }, { 'assignedWorkers.worker': req.query.workerId }] }
      : {};

    const conditions = [];
    if (Object.keys(workerFilter).length > 0) {
      conditions.push(workerFilter);
    }

    // Status filtering
    if (status === 'active') {
      conditions.push({ status: { $in: ['assigned', 'in_progress'] } });
    } else if (status && status !== 'all') {
      if (status.includes(',')) {
        conditions.push({ status: { $in: status.split(',').map((s) => s.trim()) } });
      } else {
        conditions.push({ status });
      }
    }

    // Priority filtering
    if (priority && priority !== 'all') {
      conditions.push({ priority });
    }

    // Search keyword
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      conditions.push({
        $or: [
          { issueNumber: searchRegex },
          { title: searchRegex },
          { 'location.landmark': searchRegex },
          { 'location.address': searchRegex },
        ],
      });
    }

    const query = conditions.length > 0 ? { $and: conditions } : {};

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    const direction = sortOrder === 'desc' ? -1 : 1;
    sortOptions[sortBy] = direction;

    const now = new Date();
    const workerScope = workerFilter;

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

/**
 * Worker starts work on assigned civic issue
 * POST /api/worker/issues/:id/start-work
 */
export const startWork = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { issueNumber: id.toUpperCase() };
    const issue = await Issue.findOne(query);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Civic issue report not found',
      });
    }

    const isWorkerAssigned =
      issue.assignedWorker?.toString() === req.user._id.toString() ||
      (Array.isArray(issue.assignedWorkers) &&
        issue.assignedWorkers.some(
          (w) => (w.worker?._id || w.worker)?.toString() === req.user._id.toString()
        ));

    // RBAC: Verify worker assignment (Super Admin / Admin bypass)
    if (req.user.role === 'field_worker' && !isWorkerAssigned) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not assigned to work on this issue',
      });
    }

    // Validate valid state transition
    const allowableStatuses = ['assigned', 'reopened', 'in_progress'];
    if (!allowableStatuses.includes(issue.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot start work on issue with current status: '${issue.status}'`,
      });
    }

    const previousStatus = issue.status;
    issue.status = 'in_progress';

    const timelineNote = note?.trim() || 'Field worker arrived on site and initiated repair operations.';

    issue.timeline.push({
      status: 'in_progress',
      action: 'Work Started',
      performedBy: req.user._id,
      note: timelineNote,
      visibility: 'public',
      timestamp: new Date(),
    });

    issue.auditLogs.push({
      action: 'WORK_STARTED',
      performedBy: req.user._id,
      previousState: { status: previousStatus },
      newState: { status: 'in_progress', note: timelineNote },
      ipAddress: req.ip,
      timestamp: new Date(),
    });

    await issue.save();

    const populatedIssue = await Issue.findById(issue._id)
      .populate('category', 'name code icon')
      .populate('serviceArea', 'name code')
      .populate('department', 'name code')
      .populate('assignedWorker', 'name email phone department')
      .populate('reporter', 'name email phone')
      .populate('timeline.performedBy', 'name role department');

    return successResponse(res, 'Work started successfully and issue updated to In Progress', {
      issue: populatedIssue,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Worker records progress note, materials, and optional stage photos
 * POST /api/worker/issues/:id/progress-update
 */
export const addProgressUpdate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note, materialsUsed, stagePhotos, isInternal = false } = req.body;

    if (!note || note.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Progress update note must be at least 5 characters long',
      });
    }

    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { issueNumber: id.toUpperCase() };
    const issue = await Issue.findOne(query);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Civic issue report not found',
      });
    }

    const isWorkerAssigned =
      issue.assignedWorker?.toString() === req.user._id.toString() ||
      (Array.isArray(issue.assignedWorkers) &&
        issue.assignedWorkers.some(
          (w) => (w.worker?._id || w.worker)?.toString() === req.user._id.toString()
        ));

    // RBAC: Verify worker assignment (Super Admin / Admin bypass)
    if (req.user.role === 'field_worker' && !isWorkerAssigned) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not assigned to work on this issue',
      });
    }

    // Allow progress updates on assigned, in_progress, or reopened
    if (!['assigned', 'in_progress', 'reopened'].includes(issue.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot add progress update to issue with status: '${issue.status}'`,
      });
    }

    // Auto-advance to in_progress if still assigned
    if (issue.status === 'assigned') {
      issue.status = 'in_progress';
    }

    // Add stage photos to evidence if provided
    if (Array.isArray(stagePhotos) && stagePhotos.length > 0) {
      stagePhotos.forEach((photo) => {
        if (typeof photo === 'string') {
          issue.evidence.push({
            url: photo,
            stage: 'progress',
            uploadedAt: new Date(),
          });
        } else if (photo && photo.url) {
          issue.evidence.push({
            url: photo.url,
            filename: photo.filename || '',
            fileSize: photo.fileSize || null,
            mimeType: photo.mimeType || 'image/jpeg',
            stage: 'progress',
            uploadedAt: new Date(),
          });
        }
      });
    }

    let fullNote = note.trim();
    if (materialsUsed && materialsUsed.trim()) {
      fullNote += `\n[Materials & Equipment: ${materialsUsed.trim()}]`;
    }

    issue.timeline.push({
      status: issue.status,
      action: 'Progress Update',
      performedBy: req.user._id,
      note: fullNote,
      visibility: isInternal ? 'internal' : 'public',
      timestamp: new Date(),
    });

    issue.auditLogs.push({
      action: 'PROGRESS_UPDATE',
      performedBy: req.user._id,
      previousState: { status: issue.status },
      newState: {
        status: issue.status,
        note: fullNote,
        photosAdded: Array.isArray(stagePhotos) ? stagePhotos.length : 0,
        isInternal,
      },
      ipAddress: req.ip,
      timestamp: new Date(),
    });

    await issue.save();

    const populatedIssue = await Issue.findById(issue._id)
      .populate('category', 'name code icon')
      .populate('serviceArea', 'name code')
      .populate('department', 'name code')
      .populate('assignedWorker', 'name email phone department')
      .populate('reporter', 'name email phone')
      .populate('timeline.performedBy', 'name role department');

    return successResponse(res, 'Progress update recorded successfully', {
      issue: populatedIssue,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Worker submits resolution proof (mandatory after photos + summary)
 * POST /api/worker/issues/:id/resolve
 */
export const resolveTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolutionSummary, resolutionPhotos, materialsUsed, repairCost } = req.body;

    if (!resolutionSummary || resolutionSummary.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Resolution summary must be at least 10 characters long explaining the completed repair work',
      });
    }

    if (!Array.isArray(resolutionPhotos) || resolutionPhotos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one resolution proof photograph is required to verify completed work',
      });
    }

    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { issueNumber: id.toUpperCase() };
    const issue = await Issue.findOne(query);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Civic issue report not found',
      });
    }

    const isWorkerAssigned =
      issue.assignedWorker?.toString() === req.user._id.toString() ||
      (Array.isArray(issue.assignedWorkers) &&
        issue.assignedWorkers.some(
          (w) => (w.worker?._id || w.worker)?.toString() === req.user._id.toString()
        ));

    // RBAC: Verify worker assignment (Super Admin / Admin bypass)
    if (req.user.role === 'field_worker' && !isWorkerAssigned) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not assigned to work on this issue',
      });
    }

    const allowableStatuses = ['in_progress', 'assigned', 'reopened'];
    if (!allowableStatuses.includes(issue.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot resolve issue with status: '${issue.status}'`,
      });
    }

    const previousStatus = issue.status;
    issue.status = 'resolved_verification_pending';

    // Attach resolution proof photos
    resolutionPhotos.forEach((photo) => {
      if (typeof photo === 'string') {
        issue.evidence.push({
          url: photo,
          stage: 'resolution',
          uploadedAt: new Date(),
        });
      } else if (photo && photo.url) {
        issue.evidence.push({
          url: photo.url,
          filename: photo.filename || '',
          fileSize: photo.fileSize || null,
          mimeType: photo.mimeType || 'image/jpeg',
          stage: 'resolution',
          uploadedAt: new Date(),
        });
      }
    });

    let fullNote = `Resolution Summary: ${resolutionSummary.trim()}`;
    if (materialsUsed && materialsUsed.trim()) {
      fullNote += `\n[Materials / Equipment: ${materialsUsed.trim()}]`;
    }
    if (repairCost !== undefined && repairCost !== null && repairCost !== '') {
      fullNote += `\n[Municipal Repair Cost: ₹${Number(repairCost).toLocaleString('en-IN')}]`;
    }

    issue.timeline.push({
      status: 'resolved_verification_pending',
      action: 'Resolved by Field Personnel',
      performedBy: req.user._id,
      note: fullNote,
      visibility: 'public',
      timestamp: new Date(),
    });

    issue.auditLogs.push({
      action: 'WORK_RESOLVED',
      performedBy: req.user._id,
      previousState: { status: previousStatus },
      newState: {
        status: 'resolved_verification_pending',
        summary: resolutionSummary.trim(),
        photosCount: resolutionPhotos.length,
        repairCost: repairCost || null,
      },
      ipAddress: req.ip,
      timestamp: new Date(),
    });

    await issue.save();

    const populatedIssue = await Issue.findById(issue._id)
      .populate('category', 'name code icon')
      .populate('serviceArea', 'name code')
      .populate('department', 'name code')
      .populate('assignedWorker', 'name email phone department')
      .populate('reporter', 'name email phone')
      .populate('timeline.performedBy', 'name role department');

    return successResponse(res, 'Task resolved with photo proof and submitted for citizen verification', {
      issue: populatedIssue,
    });
  } catch (error) {
    next(error);
  }
};


