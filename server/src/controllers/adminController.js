import Issue from '../models/Issue.js';
import User from '../models/User.js';
import { successResponse } from '../utils/apiResponse.js';
import { emitIssueEvent } from '../socket.js';
import { sendNotification, notifySuperAdmin } from '../services/notificationService.js';

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
    } else if (req.user.role === 'administrator' && req.user.serviceArea && serviceArea !== 'all' && req.query.serviceArea === undefined) {
      // Scoped automatically to the administrator's assigned operational zone unless explicitly requested as all
      query.serviceArea = req.user.serviceArea;
    }

    // 2. Status Filtering
    if (status === 'triage') {
      // Actionable administrative triage queue
      query.status = { $in: ['submitted', 'in_review', 'under_review', 'info_requested', 'reopened'] };
    } else if (status === 'active') {
      query.status = { $in: ['assigned', 'in_progress', 'verified'] };
    } else if (status === 'resolved') {
      query.status = { $in: ['resolved_verification_pending', 'closed'] };
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
        status: { $in: ['submitted', 'in_review', 'under_review', 'reopened', 'info_requested'] },
      }),
      Issue.countDocuments({
        ...baseMetricsQuery,
        priority: 'urgent',
        status: { $nin: ['closed', 'rejected', 'withdrawn'] },
      }),
      Issue.countDocuments({
        ...baseMetricsQuery,
        priority: 'high',
        status: { $nin: ['closed', 'rejected', 'withdrawn'] },
      }),
      Issue.countDocuments({
        ...baseMetricsQuery,
        status: { $in: ['assigned', 'in_progress', 'verified'] },
      }),
      Issue.countDocuments({
        ...baseMetricsQuery,
        status: { $in: ['resolved_verification_pending', 'closed'] },
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

    notifySuperAdmin({
      eventType: 'admin_action',
      title: `Issue Verified: ${issue.issueNumber}`,
      message: `Administrator ${req.user.name} verified and accepted "${issue.title}".`,
      actor: req.user,
      metadata: {
        'Issue ID': issue.issueNumber,
        'Admin Name': req.user.name,
      },
      linkUrl: `/issues/${issue.issueNumber}`,
      req,
    });

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

    notifySuperAdmin({
      eventType: 'assignment',
      title: `Issue Dispatched & Assigned: ${issue.issueNumber}`,
      message: `Issue "${issue.title}" assigned to ${workerName} with ${issue.priority} priority (SLA: ${hoursNum} hrs).`,
      actor: req.user,
      metadata: {
        'Issue ID': issue.issueNumber,
        'Assigned Worker': workerName,
        'Priority Level': issue.priority,
        'SLA Deadline': slaDeadline.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
      },
      linkUrl: `/issues/${issue.issueNumber}`,
      req,
    });

    return successResponse(res, 'Civic issue assigned successfully', populated, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Add an additional field worker to the issue work team roster
 * POST /api/admin/issues/:id/workers
 */
export const addWorkerToRoster = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { workerId, role = 'Field Specialist', note = '' } = req.body;

    if (!workerId) {
      return res.status(400).json({ success: false, message: 'Worker ID is required' });
    }

    const worker = await User.findOne({ _id: workerId, role: 'field_worker', isActive: true });
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Active field worker not found' });
    }

    const query = id.startsWith('CIVIC-') ? { issueNumber: id } : { _id: id };
    const issue = await Issue.findOne(query);

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Civic issue not found' });
    }

    // Check if worker already on roster
    const alreadyAssigned = issue.assignedWorkers.some(
      (w) => w.worker.toString() === workerId.toString()
    );

    if (alreadyAssigned) {
      return res.status(400).json({ success: false, message: 'Worker is already assigned to this issue' });
    }

    // Add to multi-worker roster
    issue.assignedWorkers.push({
      worker: worker._id,
      role: role.trim(),
      note: note.trim(),
      assignedBy: req.user._id,
      assignedAt: new Date(),
    });

    // If primary assignedWorker not set, set as primary
    if (!issue.assignedWorker) {
      issue.assignedWorker = worker._id;
      issue.assignedAt = new Date();
    }

    if (issue.status === 'submitted' || issue.status === 'in_review' || issue.status === 'verified') {
      issue.status = 'assigned';
    }

    issue.timeline.push({
      status: issue.status,
      action: 'Worker Added to Team',
      performedBy: req.user._id,
      note: `Added ${worker.name} (${role}) to the dispatch roster. ${note}`.trim(),
      visibility: 'public',
      timestamp: new Date(),
    });

    issue.auditLogs.push({
      action: 'WORKER_ROSTER_ADDED',
      performedBy: req.user._id,
      newState: { workerId: worker._id, workerName: worker.name, role, note },
      ipAddress: req.ip,
      timestamp: new Date(),
    });

    await issue.save();

    // Send in-app notification to the worker
    sendNotification({
      recipient: worker._id,
      title: `📋 Assigned to Issue: ${issue.issueNumber}`,
      message: `You were assigned as ${role} for "${issue.title}".`,
      type: 'issue_assigned',
      linkUrl: `/issues/${issue.issueNumber || issue._id}`,
    });

    const populated = await Issue.findById(issue._id)
      .populate('category', 'name code icon')
      .populate('serviceArea', 'name code city state')
      .populate('department', 'name code')
      .populate('reporter', 'name email phone')
      .populate('assignedWorker', 'name email phone department')
      .populate('assignedWorkers.worker', 'name email phone department role')
      .populate('timeline.performedBy', 'name role');

    emitIssueEvent('issue:updated', populated);

    return successResponse(res, 'Worker assigned to issue roster successfully', populated, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a field worker from the issue work team roster
 * DELETE /api/admin/issues/:id/workers/:workerId
 */
export const removeWorkerFromRoster = async (req, res, next) => {
  try {
    const { id, workerId } = req.params;

    const query = id.startsWith('CIVIC-') ? { issueNumber: id } : { _id: id };
    const issue = await Issue.findOne(query);

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Civic issue not found' });
    }

    const workerIndex = issue.assignedWorkers.findIndex(
      (w) => w.worker.toString() === workerId.toString()
    );

    if (workerIndex === -1 && issue.assignedWorker?.toString() !== workerId.toString()) {
      return res.status(404).json({ success: false, message: 'Worker is not assigned to this issue' });
    }

    const workerObj = await User.findById(workerId);
    const workerName = workerObj ? workerObj.name : 'Field Worker';

    if (workerIndex !== -1) {
      issue.assignedWorkers.splice(workerIndex, 1);
    }

    // If removing primary assignedWorker, assign next worker or set null
    if (issue.assignedWorker?.toString() === workerId.toString()) {
      issue.assignedWorker = issue.assignedWorkers.length > 0 ? issue.assignedWorkers[0].worker : null;
    }

    issue.timeline.push({
      status: issue.status,
      action: 'Worker Removed from Team',
      performedBy: req.user._id,
      note: `Removed ${workerName} from dispatch team.`,
      visibility: 'public',
      timestamp: new Date(),
    });

    issue.auditLogs.push({
      action: 'WORKER_ROSTER_REMOVED',
      performedBy: req.user._id,
      newState: { workerId, workerName },
      ipAddress: req.ip,
      timestamp: new Date(),
    });

    await issue.save();

    const populated = await Issue.findById(issue._id)
      .populate('category', 'name code icon')
      .populate('serviceArea', 'name code city state')
      .populate('department', 'name code')
      .populate('reporter', 'name email phone')
      .populate('assignedWorker', 'name email phone department')
      .populate('assignedWorkers.worker', 'name email phone department role')
      .populate('timeline.performedBy', 'name role');

    emitIssueEvent('issue:updated', populated);

    return successResponse(res, 'Worker removed from issue roster successfully', populated, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Submit 3-Phase Work Execution Proof (Starting, During, Completion Phase) with Geo-Tagged Evidence
 * POST /api/admin/issues/:id/phase-proof
 */
export const submitPhaseProof = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { phase, images, note = '', geoTag = null } = req.body;

    if (!['starting', 'during', 'completion'].includes(phase)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phase. Must be one of: starting, during, completion',
      });
    }

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: `At least one verified geo-tagged photograph is required for the ${phase} phase`,
      });
    }

    const query = id.startsWith('CIVIC-') ? { issueNumber: id } : { _id: id };
    const issue = await Issue.findOne(query);

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Civic issue not found' });
    }

    if (!issue.executionPhases) {
      issue.executionPhases = { startingPhase: {}, duringPhase: {}, completionPhase: {} };
    }

    const formattedImages = images.map((img) => ({
      url: typeof img === 'string' ? img : img.url,
      filename: img.filename || '',
      geoTag: img.geoTag || geoTag || null,
      uploadedAt: new Date(),
    }));

    // Add to global evidence with phase stage
    formattedImages.forEach((img) => {
      issue.evidence.push({
        url: img.url,
        filename: img.filename,
        geoTag: img.geoTag,
        stage: phase,
        uploadedAt: new Date(),
      });
    });

    const now = new Date();
    let actionLabel = '';

    if (phase === 'starting') {
      issue.executionPhases.startingPhase = {
        images: formattedImages,
        note: note.trim(),
        startedAt: now,
        updatedBy: req.user._id,
      };
      if (issue.status === 'assigned') issue.status = 'in_progress';
      actionLabel = 'Phase 1: Starting Work (Site Arrival)';
    } else if (phase === 'during') {
      issue.executionPhases.duringPhase = {
        images: formattedImages,
        note: note.trim(),
        inProgressAt: now,
        updatedBy: req.user._id,
      };
      issue.status = 'in_progress';
      actionLabel = 'Phase 2: During Execution (Work in Progress)';
    } else if (phase === 'completion') {
      issue.executionPhases.completionPhase = {
        images: formattedImages,
        note: note.trim(),
        completedAt: now,
        updatedBy: req.user._id,
      };
      issue.status = 'resolved_verification_pending';
      actionLabel = 'Phase 3: Work Completed (Verification Pending)';
    }

    issue.timeline.push({
      status: issue.status,
      action: actionLabel,
      performedBy: req.user._id,
      note: note.trim() || `${actionLabel} submitted with ${formattedImages.length} geo-tagged photos.`,
      visibility: 'public',
      timestamp: now,
    });

    issue.auditLogs.push({
      action: `PHASE_PROOF_${phase.toUpperCase()}`,
      performedBy: req.user._id,
      newState: { phase, photoCount: formattedImages.length, status: issue.status, note },
      ipAddress: req.ip,
      timestamp: now,
    });

    await issue.save();

    const populated = await Issue.findById(issue._id)
      .populate('category', 'name code icon')
      .populate('serviceArea', 'name code city state')
      .populate('department', 'name code')
      .populate('reporter', 'name email phone')
      .populate('assignedWorker', 'name email phone department')
      .populate('assignedWorkers.worker', 'name email phone department role')
      .populate('timeline.performedBy', 'name role');

    emitIssueEvent('issue:updated', populated);

    return successResponse(res, `${actionLabel} recorded successfully`, populated, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Get users awaiting role approval (Government Officers & Field Workers)
 * GET /api/admin/users/pending-approvals
 */
export const getPendingApprovals = async (req, res, next) => {
  try {
    const pendingUsers = await User.find({
      approvalStatus: 'pending',
    })
      .select('name email phone role requestedRole approvalStatus serviceArea department createdAt')
      .populate('serviceArea', 'name code city state')
      .populate('department', 'name code')
      .sort({ createdAt: -1 });

    return successResponse(res, 'Pending staff approvals retrieved', pendingUsers, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Super Admin: Approve user role with Service Area (Village/Zone) & Department assignment
 * POST /api/admin/users/:id/approve-role
 */
export const approveUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, serviceArea, department } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const assignedRole = role || user.requestedRole || 'administrator';
    user.role = assignedRole;
    user.approvalStatus = 'approved';
    if (serviceArea) user.serviceArea = serviceArea;
    if (department) user.department = department;

    await user.save({ validateBeforeSave: false });

    // Send in-app notification to the approved user
    sendNotification({
      recipient: user._id,
      title: `Staff Role Approved`,
      message: `Your application for ${user.role.replace('_', ' ').toUpperCase()} has been approved by the Super Admin. You now have full operational access.`,
      type: 'role_approved',
      linkUrl: '/dashboard',
    });

    // Alert Super Admin
    notifySuperAdmin({
      eventType: 'role_approved',
      title: `Staff Role Approved: ${user.name}`,
      message: `Super Admin approved ${user.name} (${user.email}) for the ${user.role.replace('_', ' ')} role.`,
      actor: req.user,
      metadata: {
        'Approved User': user.name,
        'User Email': user.email,
        'Assigned Role': user.role.replace('_', ' '),
        'Department Assigned': department || 'General Administration',
      },
      linkUrl: '/dashboard',
      req,
    });

    console.info(`[Role Approved] Super Admin approved ${user.email} as ${user.role}`);

    return successResponse(res, `User approved as ${user.role} successfully`, user, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Super Admin: Reject role request
 * POST /api/admin/users/:id/reject-role
 */
export const rejectUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.role = 'citizen';
    user.approvalStatus = 'rejected';
    await user.save({ validateBeforeSave: false });

    // Send in-app notification to the user
    sendNotification({
      recipient: user._id,
      title: `Staff Role Application Update`,
      message: `Your application for ${user.requestedRole || 'staff'} was not approved at this time. Your account retains standard Citizen privileges.`,
      type: 'role_rejected',
      linkUrl: '/dashboard',
    });

    // Alert Super Admin
    notifySuperAdmin({
      eventType: 'role_rejected',
      title: `Staff Role Request Rejected: ${user.name}`,
      message: `Application for ${user.name} (${user.email}) was rejected. Account remains citizen.`,
      actor: req.user,
      metadata: {
        'Applicant': user.name,
        'Applicant Email': user.email,
        'Requested Role': user.requestedRole || 'N/A',
      },
      linkUrl: '/dashboard',
      req,
    });

    return successResponse(res, 'Role request rejected. User retained citizen access.', user, 200);
  } catch (error) {
    next(error);
  }
};
