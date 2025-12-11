import User from '../models/User.js';
import BloodRequest from '../models/BloodRequest.js';
import DonationHistory from '../models/DonationHistory.js';
import { generateDailyAnalytics, getDashboardStats } from '../services/analyticsService.js';
import { catchAsync, AppError } from '../middlewares/errorHandler.js';

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

  res.status(200).json({
    success: true,
    message: 'User verification rejected',
    data: user
  });
});

export const deactivateUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  user.isActive = false;
  await user.save();

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
  const user = await User.findByIdAndDelete(req.params.userId);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

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
  deactivateUser,
  activateUser,
  getPendingVerifications,
  getAnalytics,
  deleteUser
};
