import mongoose from 'mongoose';
import Issue from '../models/Issue.js';
import IssueCategory from '../models/IssueCategory.js';
import ServiceArea from '../models/ServiceArea.js';
import Department from '../models/Department.js';
import { generateIssueNumber } from '../utils/issueNumberGenerator.js';
import { successResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { notifyAdminsOnNewIssue, notifySuperAdmin } from '../services/notificationService.js';
import { emitIssueEvent } from '../socket.js';

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
      village,
      mandal,
      district,
      city,
      state,
      country,
      pincode,
    } = req.body;

    // 1. Validate Category
    const category = await IssueCategory.findById(categoryId);
    if (!category || !category.isActive) {
      return next(new AppError('The selected civic category does not exist or is inactive', 400));
    }

    // 2. Resolve or Dynamically Create Service Area Zone for ANY Village / Mandal / District / State in India
    let serviceArea = null;
    if (serviceAreaId && mongoose.Types.ObjectId.isValid(serviceAreaId)) {
      serviceArea = await ServiceArea.findById(serviceAreaId);
    }

    const villageName = village || '';
    const mandalName = mandal || '';
    const districtName = district || '';
    const cityName = city || district || (address ? address.split(',').slice(-3, -2)[0]?.trim() : '') || 'Local Jurisdiction';
    const stateName = state || (address ? address.split(',').slice(-2, -1)[0]?.trim() : '') || 'Andhra Pradesh';
    const countryName = country || 'India';
    const pinCodeValue = pincode || '';

    // Search by pincode or mandal/district/city
    if (!serviceArea) {
      const matchConditions = [];
      if (pinCodeValue) {
        matchConditions.push({ pincodes: pinCodeValue });
      }
      if (mandalName) {
        matchConditions.push({ mandal: new RegExp(`^${mandalName}$`, 'i') });
      }
      if (districtName) {
        matchConditions.push({ district: new RegExp(`^${districtName}$`, 'i') });
      }
      if (cityName && cityName !== 'Local Jurisdiction') {
        matchConditions.push({ city: new RegExp(`^${cityName}$`, 'i') });
        matchConditions.push({ name: new RegExp(`^${cityName}`, 'i') });
      }

      if (matchConditions.length > 0) {
        serviceArea = await ServiceArea.findOne({
          $or: matchConditions,
          isActive: true,
        });
      }

      // If no service area exists yet for this Mandal/District, create one automatically
      if (!serviceArea && (mandalName || districtName || cityName !== 'Local Jurisdiction')) {
        const zoneIdentifier = mandalName || districtName || cityName;
        const safeCode = `SA-${zoneIdentifier.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X')}-${Math.floor(100 + Math.random() * 900)}`;
        const zoneTitle = mandalName
          ? `${mandalName} Mandal Zone (${districtName || stateName})`
          : districtName
          ? `${districtName} District Zone`
          : `${cityName} Municipal Zone`;

        serviceArea = await ServiceArea.create({
          name: zoneTitle,
          code: safeCode,
          village: villageName,
          mandal: mandalName,
          district: districtName,
          city: cityName,
          state: stateName,
          country: countryName,
          pincodes: pinCodeValue ? [pinCodeValue] : ['000000'],
          centerLocation: {
            type: 'Point',
            coordinates: coordinates && coordinates.length === 2 ? coordinates : [78.9629, 20.5937],
          },
          description: `Administrative civic jurisdiction zone for ${zoneIdentifier}, ${stateName}.`,
          isActive: true,
        });
      }
    }

    // Fallback: match nearest existing service area
    if (!serviceArea && coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
      try {
        serviceArea = await ServiceArea.findOne({
          centerLocation: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: coordinates,
              },
            },
          },
          isActive: true,
        });
      } catch {
        // Fallback
      }
    }

    if (!serviceArea) {
      serviceArea = await ServiceArea.findOne({ isActive: true });
    }

    if (!serviceArea) {
      serviceArea = await ServiceArea.create({
        name: 'National Civic Zone',
        code: 'IND-NAT',
        city: 'All India',
        state: 'India',
        pincodes: ['000000'],
        centerLocation: { type: 'Point', coordinates: [78.9629, 20.5937] },
        description: 'Pan-India civic issue resolution jurisdiction.',
        isActive: true,
      });
    }

    // 3. Generate Unique Human-Readable Issue Number
    const issueNumber = await generateIssueNumber();

    // 4. Determine Location Coordinates [Lng, Lat]
    const issueCoordinates =
      coordinates && Array.isArray(coordinates) && coordinates.length === 2
        ? coordinates
        : serviceArea.centerLocation?.coordinates || [78.9629, 20.5937];

    // 5. Build Initial Timeline and Audit Logs
    const reporterName = req.user?.name || req.body.guestName || 'Citizen';
    const initialTimeline = [
      {
        status: 'submitted',
        action: 'Issue Reported',
        performedBy: req.user?._id || null,
        note: `Reported by ${reporterName} under ${category.name}`,
        visibility: 'public',
        timestamp: new Date(),
      },
    ];

    const initialAudit = [
      {
        action: 'ISSUE_CREATED',
        performedBy: req.user?._id || null,
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

    // Automatically extract department from category; if missing, resolve via category keyword classification
    let assignedDepartmentId = category.defaultDepartment || null;
    if (!assignedDepartmentId) {
      const catKeywords = `${category.name} ${category.code || ''} ${title || ''}`.toLowerCase();
      let fallbackDept = null;
      if (catKeywords.includes('road') || catKeywords.includes('pothole') || catKeywords.includes('bridge') || catKeywords.includes('asphalt')) {
        fallbackDept = await Department.findOne({ code: 'DPW-RDS', isActive: true });
      } else if (catKeywords.includes('street') || catKeywords.includes('light') || catKeywords.includes('lamp') || catKeywords.includes('elec') || catKeywords.includes('wire')) {
        fallbackDept = await Department.findOne({ code: 'ELE-LGT', isActive: true });
      } else if (catKeywords.includes('garb') || catKeywords.includes('waste') || catKeywords.includes('sanit') || catKeywords.includes('trash') || catKeywords.includes('bin')) {
        fallbackDept = await Department.findOne({ code: 'SAN-WST', isActive: true });
      } else if (catKeywords.includes('water') || catKeywords.includes('leak') || catKeywords.includes('drain') || catKeywords.includes('pipe') || catKeywords.includes('sewag')) {
        fallbackDept = await Department.findOne({ code: 'WTR-DRN', isActive: true });
      } else if (catKeywords.includes('park') || catKeywords.includes('tree') || catKeywords.includes('garden')) {
        fallbackDept = await Department.findOne({ code: 'PRK-FAC', isActive: true });
      } else if (catKeywords.includes('safe') || catKeywords.includes('hazard') || catKeywords.includes('encroach')) {
        fallbackDept = await Department.findOne({ code: 'SAF-INF', isActive: true });
      }

      if (!fallbackDept) {
        fallbackDept = await Department.findOne({ isActive: true });
      }

      if (fallbackDept) {
        assignedDepartmentId = fallbackDept._id;
      }
    }

    // 6. Create Issue Record with Evidence & Administrative Location Breakdown
    const newIssue = new Issue({
      issueNumber,
      title: title.trim(),
      description: description.trim(),
      category: category._id,
      serviceArea: serviceArea._id,
      department: assignedDepartmentId,
      reporter: req.user?._id || null,
      guestReporter: {
        name: req.body.guestName?.trim() || (req.user ? req.user.name : 'Citizen'),
        phone: req.body.guestPhone?.trim() || (req.user ? req.user.phone || '' : ''),
        email: req.body.guestEmail?.trim() || (req.user ? req.user.email || '' : ''),
      },
      status: 'submitted',
      priority: category.defaultPriority || 'medium',
      location: {
        address: address ? address.trim() : `${serviceArea.name}, ${serviceArea.city}`,
        landmark: landmark.trim(),
        village: villageName,
        mandal: mandalName,
        district: districtName,
        city: cityName,
        state: stateName,
        country: countryName,
        pincode: pinCodeValue,
        type: 'Point',
        coordinates: issueCoordinates,
      },
      evidence: Array.isArray(evidence) ? evidence : [],
      isGpsVerified: req.body.isGpsVerified || (Array.isArray(evidence) && evidence.some((e) => e.geoTag?.isCameraGpsVerified)) || false,
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

    // 8. Real-time updates for All Admin and SuperAdmin Roles
    notifyAdminsOnNewIssue(newIssue, reporterName);
    notifySuperAdmin({
      eventType: 'issue_created',
      title: `Civic Issue Reported: ${newIssue.issueNumber}`,
      message: `${reporterName} reported "${newIssue.title}" under ${category.name} at ${newIssue.location?.landmark || newIssue.location?.address || 'Municipal Zone'}.`,
      actor: req.user || { name: reporterName, role: 'citizen' },
      metadata: {
        'Issue ID': newIssue.issueNumber,
        'Civic Category': category.name,
        'Jurisdiction Zone': serviceArea.name,
        'Priority': category.defaultPriority || 'medium',
        'Location': newIssue.location?.address || newIssue.location?.landmark || 'Municipal Zone',
      },
      linkUrl: `/issues/${newIssue.issueNumber}`,
      req,
    });
    emitIssueEvent('issue:created', populatedIssue);

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

    if (status && status !== 'all') {
      query.status = status;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

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

    let query;
    if (id.startsWith('CIVIC-')) {
      query = { issueNumber: id };
    } else if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      return next(new AppError('Civic issue not found', 404));
    }

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

    const isReporter =
      req.user &&
      issue.reporter &&
      issue.reporter._id &&
      issue.reporter._id.toString() === req.user._id.toString();

    const isPrivilegedStaff =
      req.user &&
      (req.user.role === 'administrator' ||
        req.user.role === 'super_admin' ||
        (req.user.role === 'field_worker' &&
          issue.assignedWorker &&
          issue.assignedWorker._id &&
          issue.assignedWorker._id.toString() === req.user._id.toString()));

    const issueObj = issue.toObject();

    // Sanitize sensitive personal contact info for public view
    if (!isReporter && !isPrivilegedStaff) {
      if (issueObj.reporter) {
        issueObj.reporter = {
          _id: issueObj.reporter._id,
          name: issueObj.reporter.name || 'Citizen',
        };
      }
      if (issueObj.timeline) {
        issueObj.timeline = issueObj.timeline.filter((t) => t.visibility === 'public');
      }
      if (issueObj.comments) {
        issueObj.comments = issueObj.comments.filter((c) => !c.isInternal);
      }
    } else if (req.user?.role === 'citizen') {
      if (issueObj.timeline) {
        issueObj.timeline = issueObj.timeline.filter((t) => t.visibility === 'public');
      }
      if (issueObj.comments) {
        issueObj.comments = issueObj.comments.filter((c) => !c.isInternal);
      }
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

/**
 * Citizen confirms resolution, rates the service, and closes ticket
 * POST /api/issues/:id/confirm-resolution
 */
export const confirmResolution = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, feedback, comment } = req.body;
    const feedbackComment = (comment || feedback || '').trim();

    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        success: false,
        message: 'A valid service rating between 1 and 5 stars is required',
      });
    }

    const query = id.startsWith('CIVIC-') ? { issueNumber: id } : { _id: id };
    const issue = await Issue.findOne(query);

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Civic issue not found' });
    }

    if (
      req.user.role === 'citizen' &&
      issue.reporter &&
      issue.reporter.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only confirm closure of your own reported issues',
      });
    }

    if (issue.status !== 'resolved_verification_pending' && issue.status !== 'closed' && issue.status !== 'work_completed') {
      return res.status(400).json({
        success: false,
        message: `Cannot submit resolution feedback on issue with status: '${issue.status}'`,
      });
    }

    const previousStatus = issue.status;
    issue.status = 'closed';
    issue.citizenResponseStatus = 'confirmed';
    issue.closureBasis = 'citizen_confirmed';
    issue.feedback = {
      rating: ratingNum,
      comment: feedbackComment,
      submittedAt: new Date(),
    };

    const ratingStars = '★'.repeat(ratingNum) + '☆'.repeat(5 - ratingNum);
    const feedbackNote = `Citizen verified & confirmed resolution (${ratingStars} ${ratingNum}/5).${
      feedbackComment ? ` Feedback: "${feedbackComment}"` : ''
    }`;

    issue.timeline.push({
      status: 'closed',
      action: 'Citizen Confirmed Resolution & Closed',
      performedBy: req.user._id,
      note: feedbackNote,
      visibility: 'public',
      timestamp: new Date(),
    });

    issue.auditLogs.push({
      action: 'RESOLUTION_CONFIRMED_BY_CITIZEN',
      performedBy: req.user._id,
      previousState: { status: previousStatus, closureBasis: issue.closureBasis },
      newState: { status: 'closed', citizenResponseStatus: 'confirmed', closureBasis: 'citizen_confirmed', rating: ratingNum, comment: feedbackComment },
      ipAddress: req.ip || req.connection?.remoteAddress,
      timestamp: new Date(),
    });

    await issue.save();

    const populated = await Issue.findById(issue._id)
      .populate('category', 'name code icon')
      .populate('serviceArea', 'name code city state')
      .populate('department', 'name code')
      .populate('reporter', 'name email phone')
      .populate('assignedWorker', 'name email phone department')
      .populate('verificationReview.reviewer', 'name role department')
      .populate('timeline.performedBy', 'name role');

    notifySuperAdmin({
      eventType: 'issue_resolved',
      title: `Citizen Confirmed Resolution: ${issue.issueNumber}`,
      message: `${req.user.name} verified and confirmed resolution for "${issue.title}" with a rating of ${ratingNum}/5 stars.`,
      actor: req.user,
      metadata: {
        'Issue ID': issue.issueNumber,
        'Citizen Rating': `${ratingNum} / 5 Stars`,
        'Citizen Feedback': feedbackComment || 'No additional notes',
        'Closure Basis': 'Citizen Confirmed',
      },
      linkUrl: `/issues/${issue.issueNumber}`,
      req,
    });

    return successResponse(res, 'Civic issue resolution verified and closed successfully', populated, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Citizen or Admin disputes / reopens issue
 * POST /api/issues/:id/reopen
 */
export const reopenIssue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reopenReason, disputeReason, reopenPhotos } = req.body;
    const finalReason = (reopenReason || disputeReason || '').trim();

    if (!finalReason || finalReason.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'A mandatory explanation of at least 10 characters is required to dispute or reopen an issue',
      });
    }

    const query = id.startsWith('CIVIC-') ? { issueNumber: id } : { _id: id };
    const issue = await Issue.findOne(query);

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Civic issue not found' });
    }

    if (
      req.user.role === 'citizen' &&
      issue.reporter &&
      issue.reporter.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only reopen your own reported issues',
      });
    }

    const allowableStatuses = ['resolved_verification_pending', 'work_completed', 'closed'];
    if (!allowableStatuses.includes(issue.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reopen issue with status: '${issue.status}'`,
      });
    }

    const previousStatus = issue.status;
    issue.status = 'reopened';
    issue.citizenResponseStatus = 'disputed';
    issue.closureBasis = 'not_closed';

    const disputePhotoObjects = [];
    if (Array.isArray(reopenPhotos) && reopenPhotos.length > 0) {
      reopenPhotos.forEach((photo) => {
        if (typeof photo === 'string') {
          issue.evidence.push({
            url: photo,
            stage: 'reopen',
            uploadedAt: new Date(),
          });
          disputePhotoObjects.push({ url: photo, uploadedAt: new Date() });
        } else if (photo && photo.url) {
          issue.evidence.push({
            url: photo.url,
            filename: photo.filename || '',
            fileSize: photo.fileSize || null,
            mimeType: photo.mimeType || 'image/jpeg',
            stage: 'reopen',
            uploadedAt: new Date(),
          });
          disputePhotoObjects.push({ url: photo.url, filename: photo.filename || '', uploadedAt: new Date() });
        }
      });
    }

    issue.citizenDispute = {
      reason: disputeReason || 'UNRESOLVED_CIVIC_DEFECT',
      comments: finalReason,
      disputedAt: new Date(),
      disputedBy: req.user._id,
      photos: disputePhotoObjects,
    };

    issue.timeline.push({
      status: 'reopened',
      action: 'Resolution Disputed & Reopened by Citizen',
      performedBy: req.user._id,
      note: `Citizen dispute: "${finalReason}"`,
      visibility: 'public',
      timestamp: new Date(),
    });

    issue.auditLogs.push({
      action: 'ISSUE_DISPUTED_REOPENED',
      performedBy: req.user._id,
      previousState: { status: previousStatus, citizenResponseStatus: issue.citizenResponseStatus },
      newState: { status: 'reopened', citizenResponseStatus: 'disputed', closureBasis: 'not_closed', reason: finalReason },
      ipAddress: req.ip || req.connection?.remoteAddress,
      timestamp: new Date(),
    });

    await issue.save();

    const populated = await Issue.findById(issue._id)
      .populate('category', 'name code icon')
      .populate('serviceArea', 'name code city state')
      .populate('department', 'name code')
      .populate('reporter', 'name email phone')
      .populate('assignedWorker', 'name email phone department')
      .populate('verificationReview.reviewer', 'name role department')
      .populate('timeline.performedBy', 'name role');

    notifySuperAdmin({
      eventType: 'security_alert',
      title: `Citizen Disputed Resolution: ${issue.issueNumber}`,
      message: `${req.user.name} disputed resolution for "${issue.title}". Reason: ${finalReason}`,
      actor: req.user,
      metadata: {
        'Issue ID': issue.issueNumber,
        'Dispute Reason': finalReason,
        'Status': 'Reopened for Municipal Rework',
      },
      linkUrl: `/issues/${issue.issueNumber}`,
      req,
    });

    return successResponse(res, 'Issue disputed and reopened for municipal corrective action', populated, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Citizen or Admin withdraws / cancels an issue
 * POST /api/issues/:id/withdraw
 */
export const withdrawIssue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const query = id.startsWith('CIVIC-') ? { issueNumber: id } : { _id: id };
    const issue = await Issue.findOne(query);

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Civic issue not found' });
    }

    const isReporter =
      req.user &&
      issue.reporter &&
      issue.reporter.toString() === req.user._id.toString();
    const isAdmin =
      req.user &&
      (req.user.role === 'administrator' || req.user.role === 'super_admin');

    if (!isReporter && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only withdraw your own reported issues',
      });
    }

    if (['closed', 'rejected', 'withdrawn'].includes(issue.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot withdraw issue that is already '${issue.status}'`,
      });
    }

    const previousStatus = issue.status;
    issue.status = 'withdrawn';

    const withdrawalNote = reason?.trim()
      ? `Issue withdrawn by citizen: "${reason.trim()}"`
      : 'Issue withdrawn by citizen';

    issue.timeline.push({
      status: 'withdrawn',
      action: 'Issue Withdrawn by Citizen',
      performedBy: req.user._id,
      note: withdrawalNote,
      visibility: 'public',
      timestamp: new Date(),
    });

    issue.auditLogs.push({
      action: 'ISSUE_WITHDRAWN',
      performedBy: req.user._id,
      previousState: { status: previousStatus },
      newState: { status: 'withdrawn', reason: reason?.trim() || '' },
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

    return successResponse(res, 'Civic issue withdrawn successfully', populated, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Permanently delete an untriaged or withdrawn issue
 * DELETE /api/issues/:id
 */
export const deleteIssue = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = id.startsWith('CIVIC-') ? { issueNumber: id } : { _id: id };
    const issue = await Issue.findOne(query);

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Civic issue not found' });
    }

    const isReporter =
      req.user &&
      issue.reporter &&
      issue.reporter.toString() === req.user._id.toString();
    const isSuperAdmin = req.user && req.user.role === 'super_admin';

    if (!isReporter && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only delete your own reported issues',
      });
    }

    await Issue.deleteOne({ _id: issue._id });

    return successResponse(res, 'Civic issue report permanently removed', { id: issue._id, issueNumber: issue.issueNumber }, 200);
  } catch (error) {
    next(error);
  }
};
