import User from '../models/User.js';
import BloodRequest from '../models/BloodRequest.js';
import DonationHistory from '../models/DonationHistory.js';
import Notification from '../models/Notification.js';
import { generateDailyAnalytics, getDashboardStats } from '../services/analyticsService.js';
import { catchAsync, AppError } from '../middlewares/errorHandler.js';
import { logUserVerification, logUserManagement } from '../utils/auditLogger.js';
import { NOTIFICATION_TYPES } from '../config/constants.js';

export const getDashboard = catchAsync(async (req, res) => {
  const stats = await getDashboardStats();

  res.status(200).json({
    success: true,
    data: stats
  });
});

export const getAllUsers = catchAsync(async (req, res) => {
  const { role, verificationStatus, page = 1, limit = 20 } = req.query;

  const query = {};
  if (role) query.role = role;
  if (verificationStatus) query.verificationStatus = verificationStatus;

  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    count: users.length,
    totalPages: Math.ceil(count / limit),
    data: users
  });
});

export const verifyUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  user.verificationStatus = 'verified';
  await user.save();

  // Log audit trail
  await logUserVerification(req.user, user, 'verify', req.body.reason, req);

  res.status(200).json({
    success: true,
    message: 'User verified successfully',
    data: user
  });
});

export const rejectUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  user.verificationStatus = 'rejected';
  await user.save();

  // Log audit trail
  await logUserVerification(req.user, user, 'reject', req.body.reason, req);

  res.status(200).json({
    success: true,
    message: 'User verification rejected',
    data: user
  });
});

export const requestResubmission = catchAsync(async (req, res, next) => {
  const { reason, message } = req.body;
  const user = await User.findById(req.params.userId);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Only allow resubmission requests for rejected or pending users
  if (user.verificationStatus === 'verified') {
    return next(new AppError('Cannot request resubmission for already verified users', 400));
  }

  // Update verification status to pending to allow resubmission
  user.verificationStatus = 'pending';
  await user.save();

  // Create notification for the user
  await Notification.createNotification(
    user._id,
    NOTIFICATION_TYPES.VERIFICATION_RESUBMISSION_REQUESTED,
    'Document Resubmission Requested',
    message || `The admin has requested you to resubmit your verification documents. ${reason ? `Reason: ${reason}` : ''}`,
    {
      adminId: req.user._id,
      adminName: req.user.name,
      reason: reason || 'No reason provided',
      requestedAt: new Date()
    }
  );

  // Log audit trail
  await logUserVerification(req.user, user, 'request_resubmission', reason, req);

  res.status(200).json({
    success: true,
    message: 'Resubmission request sent to user',
    data: {
      user,
      notification: {
        type: NOTIFICATION_TYPES.VERIFICATION_RESUBMISSION_REQUESTED,
        sentAt: new Date()
      }
    }
  });
});

export const revokeVerification = catchAsync(async (req, res, next) => {
  const { reason } = req.body;

  if (!reason || reason.length < 10) {
    return next(new AppError('Revocation reason is required (minimum 10 characters)', 400));
  }

  const user = await User.findById(req.params.userId);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Only allow revocation for verified users
  if (user.verificationStatus !== 'verified') {
    return next(new AppError('Only verified users can have their verification revoked', 400));
  }

  const previousStatus = user.verificationStatus;

  // Revoke verification - set status back to pending for re-verification
  user.verificationStatus = 'pending';
  await user.save();

  // Create notification for the user
  await Notification.createNotification(
    user._id,
    NOTIFICATION_TYPES.VERIFICATION_REVOKED,
    'Verification Status Revoked',
    `Your verification status has been revoked by an administrator. Reason: ${reason}. Please resubmit your verification documents for review.`,
    {
      adminId: req.user._id,
      adminName: req.user.name,
      reason: reason,
      revokedAt: new Date(),
      previousStatus: previousStatus
    }
  );

  // Log audit trail
  await logUserVerification(req.user, user, 'revoke_verification', reason, req);

  res.status(200).json({
    success: true,
    message: 'User verification revoked successfully',
    data: {
      user,
      previousStatus,
      currentStatus: user.verificationStatus,
      reason,
      notification: {
        type: NOTIFICATION_TYPES.VERIFICATION_REVOKED,
        sentAt: new Date()
      }
    }
  });
});

export const deactivateUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  user.isActive = false;
  await user.save();

  // Log audit trail
  await logUserManagement(req.user, user, 'deactivate', req.body.reason, req);

  res.status(200).json({
    success: true,
    message: 'User deactivated',
    data: user
  });
});

export const activateUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  user.isActive = true;
  await user.save();

  // Log audit trail
  await logUserManagement(req.user, user, 'activate', req.body.reason, req);

  res.status(200).json({
    success: true,
    message: 'User activated',
    data: user
  });
});

export const getPendingVerifications = catchAsync(async (req, res) => {
  const users = await User.find({ verificationStatus: 'pending' })
    .select('-password')
    .sort({ createdAt: -1 });

  const donations = await DonationHistory.find({ verificationStatus: 'pending' })
    .populate('donor', 'name phone')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: {
      users,
      donations
    }
  });
});

export const getAnalytics = catchAsync(async (req, res) => {
  const { date } = req.query;

  const analytics = date
    ? await generateDailyAnalytics(new Date(date))
    : await getDashboardStats();

  res.status(200).json({
    success: true,
    data: analytics
  });
});

export const deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Log audit trail before deletion
  await logUserManagement(req.user, user, 'delete', req.body.reason, req);

  await User.findByIdAndDelete(req.params.userId);

  res.status(200).json({
    success: true,
    message: 'User deleted permanently'
  });
});

export default {
  getDashboard,
  getAllUsers,
  verifyUser,
  rejectUser,
  requestResubmission,
  revokeVerification,
  deactivateUser,
  activateUser,
  getPendingVerifications,
  getAnalytics,
  deleteUser
};
