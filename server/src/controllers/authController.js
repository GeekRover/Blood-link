import User from '../models/User.js';
import DonorProfile from '../models/DonorProfile.js';
import RecipientProfile from '../models/RecipientProfile.js';
import Administrator from '../models/Administrator.js';
import generateToken from '../utils/generateToken.js';
import { catchAsync, AppError } from '../middlewares/errorHandler.js';

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
export const register = catchAsync(async (req, res, next) => {
  const {
    email,
    password,
    role,
    name,
    phone,
    dateOfBirth,
    gender,
    bloodType,
    address,
    location,
    // Role-specific fields
    emergencyContact,
    availabilityRadius,
    department,
    employeeId,
    permissions,
    // Consent fields
    medicalDataConsent,
    consentVersion
  } = req.body;

  // CRITICAL: Validate medical data consent
  if (!medicalDataConsent || medicalDataConsent !== true) {
    return next(new AppError('You must accept the medical data consent to register', 400));
  }

  // Check if user already exists
  const userExists = await User.findOne({ $or: [{ email }, { phone }] });

  if (userExists) {
    return next(new AppError('User already exists with this email or phone', 400));
  }

  // Create user based on role
  let user;

  // Prepare consent data
  const consentData = {
    medicalDataConsent: true,
    consentDate: new Date(),
    consentVersion: consentVersion || '1.0',
    consentIpAddress: req.ip || req.connection?.remoteAddress
  };

  if (role === 'donor') {
    user = await DonorProfile.create({
      email,
      password,
      role,
      name,
      phone,
      dateOfBirth,
      gender,
      bloodType,
      address,
      location,
      availabilityRadius: availabilityRadius || 50,
      ...consentData
    });
  } else if (role === 'recipient') {
    if (!emergencyContact) {
      return next(new AppError('Emergency contact is required for recipients', 400));
    }

    user = await RecipientProfile.create({
      email,
      password,
      role,
      name,
      phone,
      dateOfBirth,
      gender,
      bloodType,
      address,
      location,
      emergencyContact,
      ...consentData
    });
  } else if (role === 'admin') {
    if (!department || !employeeId) {
      return next(new AppError('Department and Employee ID required for admins', 400));
    }

    user = await Administrator.create({
      email,
      password,
      role,
      name,
      phone,
      dateOfBirth,
      gender,
      bloodType,
      address,
      location,
      department,
      employeeId,
      permissions: permissions || ['view_analytics'],
      ...consentData
    });
  } else {
    return next(new AppError('Invalid role specified', 400));
  }

  // Generate token
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      token
    }
  });
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Find user and include password
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new AppError('Invalid credentials', 401));
  }

  // Check password
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new AppError('Invalid credentials', 401));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new AppError('Account is deactivated', 403));
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = generateToken(user._id);

  // Remove password from response
  user.password = undefined;

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user,
      token
    }
  });
});

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
export const getProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
export const updateProfile = catchAsync(async (req, res, next) => {
  const allowedFields = [
    'name',
    'phone',
    'address',
    'location',
    'profilePicture',
    'availabilityRadius',
    'isAvailable',
    'preferences',
    'emergencyContact',
    'medicalHistory',
    'medicalCondition'
  ];

  // Filter allowed fields
  const updates = {};
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: user
  });
});

/**
 * @route   PUT /api/auth/password
 * @desc    Update password
 * @access  Private
 */
export const updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError('Please provide current and new password', 400));
  }

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  const isMatch = await user.matchPassword(currentPassword);

  if (!isMatch) {
    return next(new AppError('Current password is incorrect', 401));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Generate new token
  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
    data: {
      token
    }
  });
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
export const logout = catchAsync(async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * @route   POST /api/auth/upload-hospital-id
 * @desc    Upload hospital ID document for verification
 * @access  Private
 */
export const uploadHospitalID = catchAsync(async (req, res, next) => {
  // Check if file was uploaded
  if (!req.file) {
    return next(new AppError('Please upload a hospital ID document', 400));
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Add document to verificationDocuments array
  const documentData = {
    documentType: 'Hospital ID',
    documentUrl: `/uploads/documents/${req.file.filename}`,
    uploadedAt: new Date()
  };

  user.verificationDocuments.push(documentData);

  // Update verification status to pending if it was rejected
  if (user.verificationStatus === 'rejected') {
    user.verificationStatus = 'pending';
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Hospital ID uploaded successfully. Pending admin verification.',
    data: {
      document: documentData,
      verificationStatus: user.verificationStatus
    }
  });
});

/**
 * @route   GET /api/auth/hospital-id-status
 * @desc    Check if user has uploaded hospital ID
 * @access  Private
 */
export const getHospitalIDStatus = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);

  const hasHospitalID = user.verificationDocuments && user.verificationDocuments.length > 0;
  const hospitalIDDoc = user.verificationDocuments.find(doc => doc.documentType === 'Hospital ID');

  res.status(200).json({
    success: true,
    data: {
      hasHospitalID,
      hospitalIDDocument: hospitalIDDoc || null,
      verificationStatus: user.verificationStatus,
      requiresUpload: !hasHospitalID
    }
  });
});

export default {
  register,
  login,
  getProfile,
  updateProfile,
  updatePassword,
  logout,
  uploadHospitalID,
  getHospitalIDStatus
};
