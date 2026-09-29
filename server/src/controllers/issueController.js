import Issue from '../models/Issue.js';
import IssueCategory from '../models/IssueCategory.js';
import ServiceArea from '../models/ServiceArea.js';
import { generateIssueNumber } from '../utils/issueNumberGenerator.js';
import { successResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';

/**
 * Create a new civic issue report
 * POST /api/issues
 */
export const createIssue = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category: categoryId,
      serviceArea: serviceAreaId,
      landmark,
      address,
      coordinates,
      evidence,
    } = req.body;

    // 1. Validate Category
    const category = await IssueCategory.findById(categoryId);
    if (!category || !category.isActive) {
      return next(new AppError('The selected civic category does not exist or is inactive', 400));
    }

    // 2. Resolve Service Area (fallback to default pilot area if unassigned)
    let serviceArea = null;
    if (serviceAreaId) {
      serviceArea = await ServiceArea.findById(serviceAreaId);
    }
    if (!serviceArea) {
      serviceArea = await ServiceArea.findOne({ code: 'HYD-KPK' });
    }
    if (!serviceArea) {
      serviceArea = await ServiceArea.findOne({ isActive: true });
    }

    if (!serviceArea) {
      return next(new AppError('No active service area configured for civic reporting', 500));
    }

    // 3. Generate Unique Human-Readable Issue Number
    const issueNumber = await generateIssueNumber();

    // 4. Determine Location Coordinates [Lng, Lat]
    const issueCoordinates =
      coordinates && Array.isArray(coordinates) && coordinates.length === 2
        ? coordinates
        : serviceArea.centerLocation?.coordinates || [78.3967, 17.4849];

    // 5. Build Initial Timeline and Audit Logs
    const initialTimeline = [
      {
        status: 'submitted',
        action: 'Issue Reported',
        performedBy: req.user._id,
        note: `Reported by citizen ${req.user.name} under ${category.name}`,
        visibility: 'public',
        timestamp: new Date(),
      },
    ];

    const initialAudit = [
      {
        action: 'ISSUE_CREATED',
        performedBy: req.user._id,
        newState: {
          issueNumber,
          status: 'submitted',
          priority: category.defaultPriority,
          categoryId: category._id,
          serviceAreaId: serviceArea._id,
        },
        ipAddress: req.ip || req.connection?.remoteAddress,
        timestamp: new Date(),
      },
    ];

    // 6. Create Issue Record with Evidence
    const newIssue = new Issue({
      issueNumber,
      title: title.trim(),
      description: description.trim(),
      category: category._id,
      serviceArea: serviceArea._id,
      department: category.defaultDepartment || null,
      reporter: req.user._id,
      status: 'submitted',
      priority: category.defaultPriority || 'medium',
      location: {
        address: address ? address.trim() : `${serviceArea.name}, ${serviceArea.city}`,
        landmark: landmark.trim(),
        type: 'Point',
        coordinates: issueCoordinates,
      },
      evidence: Array.isArray(evidence) ? evidence : [],
      timeline: initialTimeline,
      auditLogs: initialAudit,
    });

    await newIssue.save();

    // 7. Populate references for rich response
    const populatedIssue = await Issue.findById(newIssue._id)
      .populate('category', 'name code icon defaultPriority estimatedSlaHours')
      .populate('serviceArea', 'name code city state')
      .populate('department', 'name code contactEmail defaultSlaHours')
      .populate('reporter', 'name email phone');

    console.info(
      `[Civic Report Created] Issue ${issueNumber} submitted by ${req.user.email} in ${serviceArea.name}`
    );

    return successResponse(
      res,
      'Civic issue reported successfully',
      populatedIssue,
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all issues reported by the authenticated citizen with pagination & filters
 * GET /api/issues/my-reports
 */
export const getMyReports = async (req, res, next) => {
  try {
    const { status, category, search, page = 1, limit = 10 } = req.query;

    const query = { reporter: req.user._id };

    // Filter by status if provided
    if (status && status !== 'all') {
      query.status = status;
    }

    // Filter by category if provided
    if (category && category !== 'all') {
      query.category = category;
    }

    // Search by issue number or title
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { issueNumber: searchRegex }, { 'location.landmark': searchRegex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, issues] = await Promise.all([
      Issue.countDocuments(query),
      Issue.find(query)
        .populate('category', 'name code icon defaultPriority estimatedSlaHours')
        .populate('serviceArea', 'name code city state')
        .populate('department', 'name code defaultSlaHours')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    // Sanitize timeline visibility for citizen view
    const sanitizedIssues = issues.map((issue) => {
      const issueObj = issue.toObject();
      if (issueObj.timeline) {
        issueObj.timeline = issueObj.timeline.filter((t) => t.visibility === 'public');
      }
      return issueObj;
    });

    return successResponse(res, 'My reported issues retrieved successfully', {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      issues: sanitizedIssues,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get issue details by ID or Issue Number
 * GET /api/issues/:id
 */
export const getIssueById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = id.startsWith('CIVIC-') ? { issueNumber: id } : { _id: id };

    const issue = await Issue.findOne(query)
      .populate('category', 'name code icon defaultPriority estimatedSlaHours')
      .populate('serviceArea', 'name code city state centerLocation')
      .populate('department', 'name code contactEmail defaultSlaHours')
      .populate('reporter', 'name email phone')
      .populate('assignedWorker', 'name email phone department')
      .populate('timeline.performedBy', 'name role');

    if (!issue) {
      return next(new AppError('Civic issue not found', 404));
    }

    // Role-based privacy: Citizens can only inspect their own reports
    if (
      req.user.role === 'citizen' &&
      issue.reporter._id.toString() !== req.user._id.toString()
    ) {
      return next(
        new AppError('Access forbidden: You do not have permission to view another citizen\'s private issue report', 403)
      );
    }

    const issueObj = issue.toObject();

    // Hide internal administrative notes from citizens
    if (req.user.role === 'citizen' && issueObj.timeline) {
      issueObj.timeline = issueObj.timeline.filter((t) => t.visibility === 'public');
    }

    return successResponse(res, 'Civic issue details retrieved', issueObj, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Citizen provides requested clarification / info
 * POST /api/issues/:id/provide-info
 */
export const provideRequestedInfo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { responseNote } = req.body;

    if (!responseNote || responseNote.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'A clarification note of at least 5 characters is required',
      });
    }

    const query = id.startsWith('CIVIC-') ? { issueNumber: id } : { _id: id };
    const issue = await Issue.findOne(query);

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Civic issue not found' });
    }

    // Only reporter or admin can provide info
    if (
      req.user.role === 'citizen' &&
      issue.reporter.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to respond to this issue',
      });
    }

    const previousStatus = issue.status;
    issue.status = 'in_review';

    issue.timeline.push({
      status: 'in_review',
      action: 'Citizen Provided Requested Information',
      performedBy: req.user._id,
      note: responseNote.trim(),
      visibility: 'public',
      timestamp: new Date(),
    });

    issue.auditLogs.push({
      action: 'INFO_PROVIDED',
      performedBy: req.user._id,
      previousState: { status: previousStatus },
      newState: { status: 'in_review', responseNote: responseNote.trim() },
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

    return successResponse(res, 'Clarification information submitted successfully', populated, 200);
  } catch (error) {
    next(error);
  }
};
