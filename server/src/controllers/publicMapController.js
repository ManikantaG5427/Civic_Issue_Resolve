import mongoose from 'mongoose';
import Issue from '../models/Issue.js';
import ServiceArea from '../models/ServiceArea.js';
import IssueCategory from '../models/IssueCategory.js';

/**
 * @desc    Get all public verified civic issues for map visualization (reporter anonymized)
 * @route   GET /api/issues/public-map
 * @access  Public
 */
export const getPublicMapIssues = async (req, res) => {
  try {
    const { serviceArea, category, status = 'all' } = req.query;

    const query = {
      status: { $nin: ['rejected'] },
    };

    // Filter by Service Area
    if (serviceArea && serviceArea !== 'all') {
      if (mongoose.Types.ObjectId.isValid(serviceArea)) {
        query.serviceArea = serviceArea;
      }
    }

    // Filter by Category
    if (category && category !== 'all') {
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category = category;
      }
    }

    // Filter by Status Preset
    if (status === 'active') {
      query.status = { $in: ['submitted', 'in_review', 'assigned', 'in_progress', 'reopened'] };
    } else if (status === 'resolved') {
      query.status = { $in: ['resolved_verification_pending', 'closed'] };
    } else if (status !== 'all') {
      query.status = status;
    }

    const issues = await Issue.find(query)
      .populate('category', 'name icon code defaultPriority')
      .populate('serviceArea', 'name code city state centerLocation')
      .populate('department', 'name code')
      .select(
        'issueNumber title description category status priority location evidence upvotes feedback createdAt updatedAt'
      )
      .sort({ createdAt: -1 })
      .limit(200);

    // Anonymize reporter data for public privacy
    const publicMarkers = issues.map((issue) => {
      const issueObj = issue.toObject();
      return {
        _id: issueObj._id,
        issueNumber: issueObj.issueNumber,
        title: issueObj.title,
        description: issueObj.description ? issueObj.description.slice(0, 140) : '',
        category: issueObj.category,
        serviceArea: issueObj.serviceArea,
        department: issueObj.department,
        status: issueObj.status,
        priority: issueObj.priority,
        location: {
          address: issueObj.location?.address || 'Kukatpally, Hyderabad',
          landmark: issueObj.location?.landmark || '',
          coordinates: issueObj.location?.coordinates || [78.3967, 17.4849],
        },
        evidence: (issueObj.evidence || []).map((e) => ({
          url: e.url,
          stage: e.stage,
        })),
        upvoteCount: issueObj.upvotes?.length || 0,
        feedback: issueObj.feedback?.rating ? { rating: issueObj.feedback.rating } : null,
        createdAt: issueObj.createdAt,
        updatedAt: issueObj.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      count: publicMarkers.length,
      issues: publicMarkers,
    });
  } catch (err) {
    console.error('[Public Map Issues Error]', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve public map issues.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};
