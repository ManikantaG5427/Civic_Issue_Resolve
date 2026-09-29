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
      evidence: Array.isArray(req.body.evidence) ? req.body.evidence : [],
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

    // Role-based privacy: Citizens can view their own reports or public sanitized versions
    if (
      req.user.role === 'citizen' &&
      issue.reporter._id.toString() !== req.user._id.toString()
    ) {
      return next(
        new AppError('Access forbidden: You do not have permission to view another citizen\'s private issue report', 403)
      );
    }

    return successResponse(res, 'Civic issue details retrieved', issue, 200);
  } catch (error) {
    next(error);
  }
};
