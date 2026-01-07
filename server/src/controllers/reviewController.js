import Review from '../models/Review.js';
import Notification from '../models/Notification.js';
import { addReviewPoints } from '../services/leaderboardService.js';
import { catchAsync, AppError } from '../middlewares/errorHandler.js';
import { logDataCorrection } from '../utils/auditLogger.js';

export const getReviews = catchAsync(async (req, res) => {
  const { reviewee, page = 1, limit = 10 } = req.query;

  const query = { status: 'approved' };
  if (reviewee) query.reviewee = reviewee;

  const reviews = await Review.find(query)
    .populate('reviewer', 'name profilePicture')
    .populate('reviewee', 'name profilePicture')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  res.status(200).json({ success: true, data: reviews });
});

export const createReview = catchAsync(async (req, res) => {
  const review = await Review.create({
    ...req.body,
    reviewer: req.user._id
  });

  // Add points to reviewee's leaderboard
  await addReviewPoints(req.body.reviewee);

  res.status(201).json({
    success: true,
    message: 'Review submitted successfully',
    data: review
  });
});

export const updateReview = catchAsync(async (req, res, next) => {
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  res.status(200).json({ success: true, data: review });
});

export const deleteReview = catchAsync(async (req, res, next) => {
  const review = await Review.findByIdAndDelete(req.params.id);

  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  res.status(200).json({ success: true, message: 'Review deleted' });
});

export const getAverageRating = catchAsync(async (req, res) => {
  const rating = await Review.getAverageRating(req.params.userId);

  res.status(200).json({ success: true, data: rating });
});

/**
 * @route   GET /api/reviews/admin/pending
 * @desc    Get all pending/reported reviews for moderation
 * @access  Private (Admin)
 */
export const getPendingReviews = catchAsync(async (req, res) => {
  const { status = 'pending', page = 1, limit = 20 } = req.query;

  const query = {};
  if (status === 'pending') {
    query.status = 'pending';
  } else if (status === 'reported') {
    query.reportCount = { $gte: 1 };
  } else if (status === 'all') {
    query.$or = [{ status: 'pending' }, { reportCount: { $gte: 1 } }];
  }

  const reviews = await Review.find(query)
    .populate('reviewer', 'name email phone')
    .populate('reviewee', 'name email phone')
    .populate('moderatedBy', 'name email')
    .sort({ reportCount: -1, createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Review.countDocuments(query);

  // Get statistics
  const stats = {
    pending: await Review.countDocuments({ status: 'pending' }),
    reported: await Review.countDocuments({ reportCount: { $gte: 1 }, status: 'approved' }),
    highlyReported: await Review.countDocuments({ reportCount: { $gte: 3 } })
  };

  res.status(200).json({
    success: true,
    count: reviews.length,
    totalPages: Math.ceil(count / limit),
    currentPage: parseInt(page),
    stats,
    data: reviews
  });
});

/**
 * @route   PUT /api/reviews/admin/:id/approve
 * @desc    Approve a review
 * @access  Private (Admin)
 */
export const approveReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  const previousStatus = review.status;

  review.status = 'approved';
  review.moderatedBy = req.user._id;
  review.moderatedAt = new Date();
  review.moderationReason = req.body.reason || 'Approved by admin';

  await review.save();

  // Log moderation action
  await logDataCorrection(
    req.user,
    'Review',
    review._id,
    `Status: ${previousStatus} → approved`,
    req.body.reason || 'Approved by admin',
    req
  );

  res.status(200).json({
    success: true,
    message: 'Review approved successfully',
    data: review
  });
});

/**
 * @route   PUT /api/reviews/admin/:id/reject
 * @desc    Reject/hide a review
 * @access  Private (Admin)
 */
export const rejectReview = catchAsync(async (req, res, next) => {
  const { reason } = req.body;

  if (!reason || reason.length < 10) {
    return next(new AppError('Rejection reason is required (min 10 characters)', 400));
  }

  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  const previousStatus = review.status;

  review.status = 'rejected';
  review.moderatedBy = req.user._id;
  review.moderatedAt = new Date();
  review.moderationReason = reason;

  await review.save();

  // Notify the reviewer that their review was rejected
  await Notification.create({
    user: review.reviewer,
    type: 'system',
    title: 'Review Removed',
    message: `Your review has been removed by a moderator. Reason: ${reason}`,
    relatedModel: 'Review',
    relatedId: review._id,
    priority: 'medium'
  });

  // Log moderation action
  await logDataCorrection(
    req.user,
    'Review',
    review._id,
    `Status: ${previousStatus} → rejected`,
    reason,
    req
  );

  res.status(200).json({
    success: true,
    message: 'Review rejected and hidden',
    data: review
  });
});

/**
 * @route   POST /api/reviews/:id/report
 * @desc    Report a review as inappropriate
 * @access  Private
 */
export const reportReview = catchAsync(async (req, res, next) => {
  const { reason } = req.body;

  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  // Prevent reporting own review
  if (review.reviewer.toString() === req.user._id.toString()) {
    return next(new AppError('You cannot report your own review', 400));
  }

  // Increment report count
  await review.report();

  res.status(200).json({
    success: true,
    message: 'Review reported successfully. Our team will review it.',
    data: {
      reviewId: review._id,
      reportCount: review.reportCount,
      autoHidden: review.status === 'pending'
    }
  });
});

/**
 * @route   PUT /api/reviews/admin/:id/clear-reports
 * @desc    Clear all reports on a review (after review)
 * @access  Private (Admin)
 */
export const clearReports = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  const previousReportCount = review.reportCount;

  review.reportCount = 0;
  review.moderatedBy = req.user._id;
  review.moderatedAt = new Date();
  review.moderationReason = req.body.reason || 'Reports cleared after review';

  await review.save();

  // Log action
  await logDataCorrection(
    req.user,
    'Review',
    review._id,
    `Reports cleared: ${previousReportCount} → 0`,
    req.body.reason || 'Reports cleared after review',
    req
  );

  res.status(200).json({
    success: true,
    message: 'Reports cleared successfully',
    data: review
  });
});

/**
 * @route   GET /api/reviews/admin/stats
 * @desc    Get review moderation statistics
 * @access  Private (Admin)
 */
export const getModerationStats = catchAsync(async (req, res) => {
  const stats = await Review.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  const reportStats = await Review.aggregate([
    { $match: { reportCount: { $gte: 1 } } },
    {
      $group: {
        _id: null,
        totalReported: { $sum: 1 },
        totalReports: { $sum: '$reportCount' },
        avgReportsPerReview: { $avg: '$reportCount' }
      }
    }
  ]);

  const recentModerations = await Review.find({ moderatedAt: { $exists: true } })
    .populate('moderatedBy', 'name')
    .sort({ moderatedAt: -1 })
    .limit(10)
    .select('status moderatedBy moderatedAt moderationReason');

  res.status(200).json({
    success: true,
    data: {
      statusBreakdown: stats,
      reportStats: reportStats[0] || { totalReported: 0, totalReports: 0 },
      recentModerations,
      summary: {
        total: await Review.countDocuments(),
        approved: await Review.countDocuments({ status: 'approved' }),
        pending: await Review.countDocuments({ status: 'pending' }),
        rejected: await Review.countDocuments({ status: 'rejected' })
      }
    }
  });
});

export default {
  getReviews,
  createReview,
  updateReview,
  deleteReview,
  getAverageRating,
  getPendingReviews,
  approveReview,
  rejectReview,
  reportReview,
  clearReports,
  getModerationStats
};
