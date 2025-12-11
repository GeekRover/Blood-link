import DonorProfile from '../models/DonorProfile.js';
import { findCompatibleDonors } from '../services/matchingService.js';
import { checkDonationEligibility } from '../services/frequencyChecker.js';
import { catchAsync, AppError } from '../middlewares/errorHandler.js';

/**
 * @route   GET /api/donors/search
 * @desc    Search for compatible donors
 * @access  Private
 */
export const searchDonors = catchAsync(async (req, res, next) => {
  const { bloodType, latitude, longitude, radius, urgency, limit } = req.query;

  if (!bloodType || !latitude || !longitude) {
    return next(new AppError('Blood type and location coordinates are required', 400));
  }

  const location = {
    type: 'Point',
    coordinates: [parseFloat(longitude), parseFloat(latitude)]
  };

  const donors = await findCompatibleDonors({
    bloodType,
    location,
    radius: radius ? parseInt(radius) : undefined,
    urgency: urgency || 'normal',
    limit: limit ? parseInt(limit) : 50
  });

  res.status(200).json({
    success: true,
    count: donors.length,
    data: donors
  });
});

/**
 * @route   GET /api/donors/:id
 * @desc    Get donor profile by ID
 * @access  Private
 */
export const getDonorById = catchAsync(async (req, res, next) => {
  const donor = await DonorProfile.findById(req.params.id)
    .select('-password -verificationDocuments');

  if (!donor) {
    return next(new AppError('Donor not found', 404));
  }

  res.status(200).json({
    success: true,
    data: donor
  });
});

/**
 * @route   GET /api/donors/:id/eligibility
 * @desc    Check donor eligibility
 * @access  Private
 */
export const checkEligibility = catchAsync(async (req, res, next) => {
  const eligibility = await checkDonationEligibility(req.params.id);

  res.status(200).json({
    success: true,
    data: eligibility
  });
});

/**
 * @route   PUT /api/donors/:id/availability
 * @desc    Update donor availability
 * @access  Private (Donor only)
 */
export const updateAvailability = catchAsync(async (req, res, next) => {
  const { isAvailable } = req.body;

  const donor = await DonorProfile.findByIdAndUpdate(
    req.params.id,
    { isAvailable },
    { new: true }
  );

  if (!donor) {
    return next(new AppError('Donor not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Availability updated successfully',
    data: donor
  });
});

/**
 * @route   GET /api/donors/stats
 * @desc    Get donor statistics
 * @access  Private
 */
export const getDonorStats = catchAsync(async (req, res, next) => {
  const stats = {
    totalDonors: await DonorProfile.countDocuments(),
    availableDonors: await DonorProfile.countDocuments({ isAvailable: true }),
    verifiedDonors: await DonorProfile.countDocuments({ verificationStatus: 'verified' }),
    byBloodType: {}
  };

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  for (const type of bloodTypes) {
    stats.byBloodType[type] = await DonorProfile.countDocuments({
      bloodType: type,
      isAvailable: true
    });
  }

  res.status(200).json({
    success: true,
    data: stats
  });
});

export default {
  searchDonors,
  getDonorById,
  checkEligibility,
  updateAvailability,
  getDonorStats
};
