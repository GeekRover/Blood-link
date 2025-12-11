import Review from '../models/Review.js';
import { addReviewPoints } from '../services/leaderboardService.js';
import { catchAsync, AppError } from '../middlewares/errorHandler.js';

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

export default { getReviews, createReview, updateReview, deleteReview, getAverageRating };
