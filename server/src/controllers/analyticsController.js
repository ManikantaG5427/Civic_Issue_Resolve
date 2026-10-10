import mongoose from 'mongoose';
import Issue from '../models/Issue.js';
import Department from '../models/Department.js';
import User from '../models/User.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * @desc    Get comprehensive municipal analytics & operational intelligence metrics
 * @route   GET /api/admin/analytics
 * @access  Private (Administrator, Super Admin)
 */
export const getAdminAnalytics = async (req, res) => {
  try {
    const { serviceArea, timeRange = '30d' } = req.query;

    const filter = {};

    // 1. Service Area Filter
    if (serviceArea && serviceArea !== 'all') {
      if (mongoose.Types.ObjectId.isValid(serviceArea)) {
        filter.serviceArea = serviceArea;
      }
    }

    // 2. Time Range Filter
    const now = new Date();
    if (timeRange === '7d') {
      filter.createdAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
    } else if (timeRange === '30d') {
      filter.createdAt = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
    } else if (timeRange === '90d') {
      filter.createdAt = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
    }

    // 3. Aggregate Total Issues by Status
    const statusCountsAgg = await Issue.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusCounts = {
      submitted: 0,
      in_review: 0,
      under_review: 0,
      info_requested: 0,
      verified: 0,
      assigned: 0,
      in_progress: 0,
      work_completed: 0,
      resolved_verification_pending: 0,
      rework_required: 0,
      closed: 0,
      rejected: 0,
      reopened: 0,
      withdrawn: 0,
    };

    let totalReported = 0;
    statusCountsAgg.forEach((item) => {
      if (statusCounts[item._id] !== undefined) {
        statusCounts[item._id] = item.count;
      }
      totalReported += item.count;
    });

    const totalResolved =
      (statusCounts.work_completed || 0) +
      (statusCounts.resolved_verification_pending || 0) +
      (statusCounts.closed || 0);
    const resolutionRate = totalReported > 0 ? Math.round((totalResolved / totalReported) * 100) : 0;

    // 4. Verification & Closure Integrity Metrics
    const closureBasisAgg = await Issue.aggregate([
      { $match: filter },
      { $group: { _id: '$closureBasis', count: { $sum: 1 } } },
    ]);

    const closureBasis = {
      citizen_confirmed: 0,
      reviewer_verified_no_response: 0,
      administrative_closure: 0,
      administrative_duplicate: 0,
      withdrawn: 0,
      not_closed: 0,
    };

    closureBasisAgg.forEach((item) => {
      if (item._id && closureBasis[item._id] !== undefined) {
        closureBasis[item._id] = item.count;
      }
    });

    const totalClosed = (statusCounts.closed || 0);
    const citizenConfirmedCount = closureBasis.citizen_confirmed;
    const noResponseClosureCount = closureBasis.reviewer_verified_no_response;
    const citizenConfirmationRate =
      totalClosed > 0 ? Math.round((citizenConfirmedCount / totalClosed) * 100) : 0;
    const noResponseClosureRate =
      totalClosed > 0 ? Math.round((noResponseClosureCount / totalClosed) * 100) : 0;

    // Independent reviewer inspection metrics
    const verificationStatusAgg = await Issue.aggregate([
      { $match: filter },
      { $group: { _id: '$verificationStatus', count: { $sum: 1 } } },
    ]);

    const verificationCounts = {
      not_submitted: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      more_evidence_required: 0,
      site_check_required: 0,
    };

    verificationStatusAgg.forEach((item) => {
      if (item._id && verificationCounts[item._id] !== undefined) {
        verificationCounts[item._id] = item.count;
      }
    });

    const totalReviewed =
      verificationCounts.approved +
      verificationCounts.rejected +
      verificationCounts.more_evidence_required +
      verificationCounts.site_check_required;
    const independentVerificationPassRate =
      totalReviewed > 0 ? Math.round((verificationCounts.approved / totalReviewed) * 100) : 100;

    // Citizen Dispute & Rework metrics
    const disputedCount = await Issue.countDocuments({
      ...filter,
      $or: [
        { citizenResponseStatus: 'disputed' },
        { status: 'reopened' },
        { status: 'rework_required' },
      ],
    });
    const citizenDisputeRate =
      totalResolved > 0 ? Math.round((disputedCount / totalResolved) * 100) : 0;

    // Recurrence count
    const recurrenceCount = await Issue.countDocuments({
      ...filter,
      $or: [
        { duplicateType: 'recurrence' },
        { isPotentialRecurrence: true },
        { 'tags': 'recurrence' },
      ],
    });

    // 5. SLA & Escalation Metrics
    const escalatedCount = await Issue.countDocuments({
      ...filter,
      isEscalated: true,
    });

    // Calculate Average Resolution Time (in hours) and SLA Compliance for closed/resolved issues
    const resolvedIssues = await Issue.find({
      ...filter,
      status: { $in: ['work_completed', 'resolved_verification_pending', 'closed'] },
    }).select('createdAt updatedAt slaDeadline assignedAt isEscalated feedback resolutionProof');

    let totalResolutionHours = 0;
    let slaCompliantCount = 0;
    let totalRatings = 0;
    let sumRatings = 0;
    let withProofCount = 0;

    resolvedIssues.forEach((issue) => {
      const startTime = issue.assignedAt || issue.createdAt;
      const endTime = issue.updatedAt;
      const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      totalResolutionHours += Math.max(0, hours);

      if (issue.slaDeadline && issue.updatedAt <= issue.slaDeadline) {
        slaCompliantCount++;
      } else if (!issue.isEscalated) {
        slaCompliantCount++;
      }

      if (issue.feedback?.rating) {
        sumRatings += issue.feedback.rating;
        totalRatings++;
      }

      if (issue.resolutionProof?.afterPhotos && issue.resolutionProof.afterPhotos.length > 0) {
        withProofCount++;
      }
    });

    const evidenceCompletenessRate =
      resolvedIssues.length > 0 ? Math.round((withProofCount / resolvedIssues.length) * 100) : 0;
    const avgResolutionTimeHours =
      resolvedIssues.length > 0 ? (totalResolutionHours / resolvedIssues.length).toFixed(1) : '0.0';
    const slaComplianceRate =
      resolvedIssues.length > 0 ? Math.round((slaCompliantCount / resolvedIssues.length) * 100) : 100;
    const avgCitizenRating = totalRatings > 0 ? (sumRatings / totalRatings).toFixed(1) : '5.0';

    // 6. Category Breakdown Aggregation
    const categoryAgg = await Issue.aggregate([
      { $match: filter },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      {
        $lookup: {
          from: 'issuecategories',
          localField: '_id',
          foreignField: '_id',
          as: 'cat',
        },
      },
      { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          categoryId: '$_id',
          name: { $ifNull: ['$cat.name', 'General Civic Issue'] },
          code: '$cat.code',
          icon: '$cat.icon',
          count: 1,
        },
      },
    ]);

    const categoriesBreakdown = categoryAgg.map((c) => ({
      ...c,
      percentage: totalReported > 0 ? Math.round((c.count / totalReported) * 100) : 0,
    }));

    // 7. Department Performance Breakdown
    const departments = await Department.find({ isActive: true }).select('name code');
    const departmentPerformance = await Promise.all(
      departments.map(async (dept) => {
        const deptFilter = { ...filter, department: dept._id };
        const assigned = await Issue.countDocuments(deptFilter);
        const resolved = await Issue.countDocuments({
          ...deptFilter,
          status: { $in: ['work_completed', 'resolved_verification_pending', 'closed'] },
        });
        const escalated = await Issue.countDocuments({
          ...deptFilter,
          isEscalated: true,
        });

        return {
          _id: dept._id,
          name: dept.name,
          code: dept.code,
          totalAssigned: assigned,
          totalResolved: resolved,
          escalatedCount: escalated,
          completionRate: assigned > 0 ? Math.round((resolved / assigned) * 100) : 100,
        };
      })
    );

    // 8. Field Worker Leaderboard
    const workers = await User.find({ role: 'field_worker', isActive: true }).select('name email');
    const workerLeaderboard = await Promise.all(
      workers.map(async (worker) => {
        const workerTasks = await Issue.find({
          ...filter,
          $or: [
            { assignedWorker: worker._id },
            { 'assignedWorkers.worker': worker._id },
          ],
        }).select('status feedback');

        const assigned = workerTasks.length;
        const completed = workerTasks.filter((t) =>
          ['work_completed', 'resolved_verification_pending', 'closed'].includes(t.status)
        ).length;

        let ratingSum = 0;
        let ratingCount = 0;
        workerTasks.forEach((t) => {
          if (t.feedback?.rating) {
            ratingSum += t.feedback.rating;
            ratingCount++;
          }
        });

        return {
          _id: worker._id,
          name: worker.name,
          email: worker.email,
          totalAssigned: assigned,
          totalCompleted: completed,
          rating: ratingCount > 0 ? (ratingSum / ratingCount).toFixed(1) : '5.0',
          completionRate: assigned > 0 ? Math.round((completed / assigned) * 100) : 0,
        };
      })
    );

    workerLeaderboard.sort((a, b) => b.totalCompleted - a.totalCompleted);

    const payload = {
      timeRange,
      kpis: {
        totalReported,
        totalResolved,
        pendingTriage:
          (statusCounts.submitted || 0) +
          (statusCounts.in_review || 0) +
          (statusCounts.under_review || 0) +
          (statusCounts.info_requested || 0) +
          (statusCounts.reopened || 0),
        inProgress:
          (statusCounts.in_progress || 0) +
          (statusCounts.assigned || 0) +
          (statusCounts.verified || 0) +
          (statusCounts.rework_required || 0),
        evidenceReviewPending:
          (statusCounts.work_completed || 0) +
          (verificationCounts.pending || 0),
        resolutionRate,
        evidenceCompletenessRate,
        independentVerificationPassRate,
        citizenConfirmationRate,
        noResponseClosureRate,
        citizenDisputeRate,
        recurrenceCount,
        avgResolutionTimeHours: parseFloat(avgResolutionTimeHours),
        slaComplianceRate,
        escalatedCount,
        citizenSatisfactionScore: parseFloat(avgCitizenRating),
      },
      statusDistribution: statusCounts,
      closureBasisBreakdown: closureBasis,
      verificationDistribution: verificationCounts,
      categoriesBreakdown,
      departmentPerformance,
      workerLeaderboard: workerLeaderboard.slice(0, 10),
    };

    return successResponse(res, 'Municipal analytics retrieved successfully', payload);
  } catch (err) {
    console.error('[Admin Analytics Error]', err);
    res.status(500).json({
      success: false,
      message: 'Failed to generate municipal analytics report.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};
