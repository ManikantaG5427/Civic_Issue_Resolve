import mongoose from 'mongoose';
import Issue from '../models/Issue.js';
import { emitIssueEvent } from '../socket.js';

/**
 * @desc    Find active civic issues within geospatial proximity radius
 * @route   GET /api/issues/nearby-duplicates
 * @access  Private
 */
export const getNearbyDuplicates = async (req, res) => {
  try {
    const { latitude, longitude, category, maxDistanceMeters = 150 } = req.query;

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const distanceMeters = Math.min(1000, Math.max(10, parseInt(maxDistanceMeters, 10) || 150));

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Valid latitude (-90 to 90) and longitude (-180 to 180) coordinates are required.',
      });
    }

    const query = {
      status: { $nin: ['closed', 'rejected', 'withdrawn'] },
      'location.coordinates': {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: distanceMeters,
        },
      },
    };

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const recurrenceQuery = {
      status: 'closed',
      updatedAt: { $gte: ninetyDaysAgo },
      'location.coordinates': {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: Math.max(distanceMeters, 200),
        },
      },
    };

    if (category && mongoose.Types.ObjectId.isValid(category)) {
      query.category = category;
      recurrenceQuery.category = category;
    }

    const [nearbyIssues, pastClosedIssues] = await Promise.all([
      Issue.find(query)
        .populate('category', 'name icon code')
        .populate('serviceArea', 'name code')
        .select('issueNumber title description category status priority location evidence upvotes followers createdAt')
        .limit(10),
      Issue.find(recurrenceQuery)
        .populate('category', 'name icon code')
        .populate('serviceArea', 'name code')
        .select('issueNumber title category status closureBasis verificationStatus location feedback updatedAt createdAt')
        .limit(5),
    ]);

    const calculateDistance = (targetLat, targetLng) => {
      const R = 6371e3;
      const phi1 = (lat * Math.PI) / 180;
      const phi2 = (targetLat * Math.PI) / 180;
      const deltaPhi = ((targetLat - lat) * Math.PI) / 180;
      const deltaLambda = ((targetLng - lng) * Math.PI) / 180;
      const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return Math.round(R * c);
    };

    // Calculate approximate distance in meters for each issue
    const duplicatesWithDistance = nearbyIssues.map((issue) => {
      const issueObj = issue.toObject();
      const [issueLng, issueLat] = issue.location?.coordinates || [lng, lat];
      const distance = calculateDistance(issueLat, issueLng);

      return {
        ...issueObj,
        distanceMeters: distance,
        upvoteCount: issueObj.upvotes?.length || 0,
        followerCount: issueObj.followers?.length || 0,
        hasUpvoted: req.user?._id ? issueObj.upvotes?.some((u) => u.toString() === req.user._id.toString()) : false,
        hasFollowed: req.user?._id ? issueObj.followers?.some((f) => f.toString() === req.user._id.toString()) : false,
      };
    });

    const recurrenceAlerts = pastClosedIssues.map((pastIssue) => {
      const issueObj = pastIssue.toObject();
      const [issueLng, issueLat] = pastIssue.location?.coordinates || [lng, lat];
      const distance = calculateDistance(issueLat, issueLng);
      const daysAgo = Math.round((new Date() - new Date(pastIssue.updatedAt)) / (1000 * 60 * 60 * 24));

      return {
        ...issueObj,
        distanceMeters: distance,
        daysSinceClosure: daysAgo,
        explanation: `A previous ${pastIssue.category?.name || 'civic'} issue (${pastIssue.issueNumber}) was closed ${daysAgo} days ago within ${distance}m under "${pastIssue.closureBasis?.replace(/_/g, ' ') || 'Resolved'}". This report may be a recurring infrastructure defect.`,
      };
    });

    res.status(200).json({
      success: true,
      count: duplicatesWithDistance.length,
      radiusMeters: distanceMeters,
      duplicates: duplicatesWithDistance,
      recurrenceAlerts,
    });
  } catch (err) {
    console.error('[Nearby Duplicates Error]', err);
    res.status(500).json({
      success: false,
      message: 'Failed to search nearby duplicate issues.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

/**
 * @desc    Toggle upvote / civic support for an issue
 * @route   POST /api/issues/:id/upvote
 * @access  Private
 */
export const toggleUpvote = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { issueNumber: id.toUpperCase() };

    const issue = await Issue.findOne(query);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: `Civic issue "${id}" not found.`,
      });
    }

    const userIdStr = req.user._id.toString();
    const upvoteIndex = issue.upvotes.findIndex((u) => u.toString() === userIdStr);
    let hasUpvoted = false;

    if (upvoteIndex > -1) {
      // Remove upvote
      issue.upvotes.splice(upvoteIndex, 1);
      hasUpvoted = false;
    } else {
      // Add upvote
      issue.upvotes.push(req.user._id);
      hasUpvoted = true;

      // Auto-follow when upvoting
      if (!issue.followers.some((f) => f.toString() === userIdStr)) {
        issue.followers.push(req.user._id);
      }
    }

    await issue.save();

    // Broadcast update
    emitIssueEvent('issue_updated', issue);

    res.status(200).json({
      success: true,
      message: hasUpvoted ? 'Upvoted civic report' : 'Removed upvote from civic report',
      hasUpvoted,
      upvoteCount: issue.upvotes.length,
      followerCount: issue.followers.length,
    });
  } catch (err) {
    console.error('[Toggle Upvote Error]', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update upvote status.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

/**
 * @desc    Toggle follow notifications for an issue
 * @route   POST /api/issues/:id/follow
 * @access  Private
 */
export const toggleFollow = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { issueNumber: id.toUpperCase() };

    const issue = await Issue.findOne(query);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: `Civic issue "${id}" not found.`,
      });
    }

    const userIdStr = req.user._id.toString();
    const followerIndex = issue.followers.findIndex((f) => f.toString() === userIdStr);
    let hasFollowed = false;

    if (followerIndex > -1) {
      issue.followers.splice(followerIndex, 1);
      hasFollowed = false;
    } else {
      issue.followers.push(req.user._id);
      hasFollowed = true;
    }

    await issue.save();

    res.status(200).json({
      success: true,
      message: hasFollowed ? 'Now following this civic report' : 'Unfollowed civic report',
      hasFollowed,
      followerCount: issue.followers.length,
    });
  } catch (err) {
    console.error('[Toggle Follow Error]', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update follow status.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};
