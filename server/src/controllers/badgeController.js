import Badge from '../models/Badge.js';
import UserBadge from '../models/UserBadge.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { catchAsync, AppError } from '../middlewares/errorHandler.js';
import { logDataCorrection } from '../utils/auditLogger.js';

/**
 * @route   GET /api/badges
 * @desc    Get all badges with filtering
 * @access  Public
 */
export const getBadges = catchAsync(async (req, res) => {
  const { category, isActive, page = 1, limit = 20 } = req.query;

  const query = {};
  if (category) query.category = category;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const badges = await Badge.find(query)
    .populate('createdBy', 'name email')
    .sort({ priority: -1, createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Badge.countDocuments(query);

  res.status(200).json({
    success: true,
    count: badges.length,
    totalPages: Math.ceil(count / limit),
    currentPage: parseInt(page),
    data: badges
  });
});

/**
 * @route   GET /api/badges/:id
 * @desc    Get single badge by ID
 * @access  Public
 */
export const getBadge = catchAsync(async (req, res, next) => {
  const badge = await Badge.findById(req.params.id)
    .populate('createdBy', 'name email');

  if (!badge) {
    return next(new AppError('Badge not found', 404));
  }

  res.status(200).json({
    success: true,
    data: badge
  });
});

/**
 * @route   POST /api/badges
 * @desc    Create a new badge
 * @access  Private (Admin)
 */
export const createBadge = catchAsync(async (req, res, next) => {
  const badgeData = {
    ...req.body,
    createdBy: req.user._id
  };

  const badge = await Badge.create(badgeData);

  // Log badge creation
  await logDataCorrection(
    req.user,
    'Badge',
    badge._id,
    `Created new badge: ${badge.name}`,
    `Badge created with category: ${badge.category}`,
    req
  );

  res.status(201).json({
    success: true,
    message: 'Badge created successfully',
    data: badge
  });
});

/**
 * @route   PUT /api/badges/:id
 * @desc    Update badge
 * @access  Private (Admin)
 */
export const updateBadge = catchAsync(async (req, res, next) => {
  let badge = await Badge.findById(req.params.id);

  if (!badge) {
    return next(new AppError('Badge not found', 404));
  }

  const oldData = {
    name: badge.name,
    description: badge.description,
    category: badge.category,
    isActive: badge.isActive
  };

  badge = await Badge.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  // Log badge update
  await logDataCorrection(
    req.user,
    'Badge',
    badge._id,
    `Updated badge: ${badge.name}`,
    `Changed from: ${JSON.stringify(oldData)} to: ${JSON.stringify({
      name: badge.name,
      description: badge.description,
      category: badge.category,
      isActive: badge.isActive
    })}`,
    req
  );

  res.status(200).json({
    success: true,
    message: 'Badge updated successfully',
    data: badge
  });
});

/**
 * @route   DELETE /api/badges/:id
 * @desc    Delete badge (soft delete - set inactive)
 * @access  Private (Admin)
 */
export const deleteBadge = catchAsync(async (req, res, next) => {
  const badge = await Badge.findById(req.params.id);

  if (!badge) {
    return next(new AppError('Badge not found', 404));
  }

  // Soft delete - set inactive
  badge.isActive = false;
  await badge.save();

  // Log badge deletion
  await logDataCorrection(
    req.user,
    'Badge',
    badge._id,
    `Deactivated badge: ${badge.name}`,
    'Badge set to inactive',
    req
  );

  res.status(200).json({
    success: true,
    message: 'Badge deactivated successfully'
  });
});

/**
 * @route   POST /api/badges/assign
 * @desc    Assign badge to user
 * @access  Private (Admin)
 */
export const assignBadge = catchAsync(async (req, res, next) => {
  const { userId, badgeId, reason } = req.body;

  if (!userId || !badgeId) {
    return next(new AppError('User ID and Badge ID are required', 400));
  }

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Check if badge exists
  const badge = await Badge.findById(badgeId);
  if (!badge) {
    return next(new AppError('Badge not found', 404));
  }

  if (!badge.isActive) {
    return next(new AppError('Cannot assign inactive badge', 400));
  }

  // Check if user already has this badge
  const existingAssignment = await UserBadge.findOne({
    user: userId,
    badge: badgeId,
    isActive: true
  });

  if (existingAssignment) {
    return next(new AppError('User already has this badge', 400));
  }

  // Create badge assignment
  const userBadge = await UserBadge.create({
    user: userId,
    badge: badgeId,
    assignedBy: req.user._id,
    reason: reason || `Assigned by admin ${req.user.name}`
  });

  // Increment badge assignment count
  await badge.incrementAssignment();

  // Populate the assignment
  await userBadge.populate('badge');
  await userBadge.populate('user', 'name email');
  await userBadge.populate('assignedBy', 'name email');

  // Send notification to user
  await Notification.create({
    user: userId,
    type: 'badge_earned',
    title: 'New Badge Earned!',
    message: `Congratulations! You've been awarded the "${badge.name}" badge. ${reason || ''}`,
    relatedModel: 'Badge',
    relatedId: badgeId,
    priority: 'medium'
  });

  // Log badge assignment
  await logDataCorrection(
    req.user,
    'UserBadge',
    userBadge._id,
    `Assigned badge "${badge.name}" to user ${user.name}`,
    reason || 'Badge assigned by admin',
    req
  );

  res.status(201).json({
    success: true,
    message: `Badge "${badge.name}" assigned to ${user.name} successfully`,
    data: userBadge
  });
});

/**
 * @route   POST /api/badges/revoke
 * @desc    Revoke badge from user
 * @access  Private (Admin)
 */
export const revokeBadge = catchAsync(async (req, res, next) => {
  const { userId, badgeId, reason } = req.body;

  if (!userId || !badgeId) {
    return next(new AppError('User ID and Badge ID are required', 400));
  }

  if (!reason || reason.length < 10) {
    return next(new AppError('Revocation reason is required (min 10 characters)', 400));
  }

  // Find active badge assignment
  const userBadge = await UserBadge.findOne({
    user: userId,
    badge: badgeId,
    isActive: true
  }).populate('badge').populate('user', 'name email');

  if (!userBadge) {
    return next(new AppError('Badge assignment not found', 404));
  }

  // Revoke badge
  await userBadge.revoke(req.user._id, reason);

  // Decrement badge assignment count
  const badge = await Badge.findById(badgeId);
  if (badge) {
    await badge.decrementAssignment();
  }

  // Send notification to user
  await Notification.create({
    user: userId,
    type: 'badge_revoked',
    title: 'Badge Revoked',
    message: `Your "${userBadge.badge.name}" badge has been revoked. Reason: ${reason}`,
    relatedModel: 'Badge',
    relatedId: badgeId,
    priority: 'medium'
  });

  // Log badge revocation
  await logDataCorrection(
    req.user,
    'UserBadge',
    userBadge._id,
    `Revoked badge "${userBadge.badge.name}" from user ${userBadge.user.name}`,
    reason,
    req
  );

  res.status(200).json({
    success: true,
    message: `Badge "${userBadge.badge.name}" revoked from ${userBadge.user.name}`,
    data: userBadge
  });
});

/**
 * @route   GET /api/badges/user/:userId
 * @desc    Get all badges for a specific user
 * @access  Public
 */
export const getUserBadges = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { includeRevoked = false } = req.query;

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  let query = { user: userId };
  if (!includeRevoked) {
    query.isActive = true;
  }

  const badges = await UserBadge.find(query)
    .populate('badge')
    .populate('assignedBy', 'name email')
    .populate('revokedBy', 'name email')
    .sort({ displayOrder: -1, assignedAt: -1 });

  res.status(200).json({
    success: true,
    count: badges.length,
    data: badges
  });
});

/**
 * @route   GET /api/badges/assignment-history/:userId
 * @desc    Get badge assignment history for a user
 * @access  Private (Admin)
 */
export const getBadgeHistory = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const history = await UserBadge.getUserBadgeHistory(userId);

  res.status(200).json({
    success: true,
    count: history.length,
    data: history
  });
});

/**
 * @route   GET /api/badges/stats
 * @desc    Get badge statistics
 * @access  Private (Admin)
 */
export const getBadgeStats = catchAsync(async (req, res) => {
  const totalBadges = await Badge.countDocuments();
  const activeBadges = await Badge.countDocuments({ isActive: true });
  const totalAssignments = await UserBadge.countDocuments({ isActive: true });
  const totalRevoked = await UserBadge.countDocuments({ isActive: false });

  // Category breakdown
  const categoryStats = await Badge.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalAssignments: { $sum: '$assignmentCount' }
      }
    }
  ]);

  // Most popular badges
  const popularBadges = await Badge.find({ isActive: true })
    .sort({ assignmentCount: -1 })
    .limit(10)
    .select('name assignmentCount icon category');

  // Recent assignments
  const recentAssignments = await UserBadge.find({ isActive: true })
    .populate('badge', 'name icon')
    .populate('user', 'name email')
    .populate('assignedBy', 'name')
    .sort({ assignedAt: -1 })
    .limit(10);

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalBadges,
        activeBadges,
        totalAssignments,
        totalRevoked
      },
      categoryStats,
      popularBadges,
      recentAssignments
    }
  });
});

export default {
  getBadges,
  getBadge,
  createBadge,
  updateBadge,
  deleteBadge,
  assignBadge,
  revokeBadge,
  getUserBadges,
  getBadgeHistory,
  getBadgeStats
};
