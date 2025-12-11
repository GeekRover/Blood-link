import DonationHistory from '../models/DonationHistory.js';
import DigitalDonationCard from '../models/DigitalDonationCard.js';
import DonorProfile from '../models/DonorProfile.js';
import BloodRequest from '../models/BloodRequest.js';
import { generateDonationQR, verifyDonationQR } from '../services/qrService.js';
import { calculateDonationPoints, updateLeaderboardEntry } from '../services/leaderboardService.js';
import { checkDonationEligibility } from '../services/frequencyChecker.js';
import { catchAsync, AppError } from '../middlewares/errorHandler.js';

/**
 * @route   POST /api/donations
 * @desc    Record new donation
 * @access  Private (Donor/Admin)
 */
export const recordDonation = catchAsync(async (req, res, next) => {
  const {
    donor,
    recipient,
    bloodRequest,
    donationDate,
    bloodType,
    unitsProvided,
    donationCenter,
    healthCheckBefore,
    notes
  } = req.body;

  const donorId = donor || req.user._id;

  // Check eligibility
  const eligibility = await checkDonationEligibility(donorId);

  if (!eligibility.eligible) {
    return next(new AppError(eligibility.reason, 400));
  }

  // Create donation history
  const donation = await DonationHistory.create({
    donor: donorId,
    recipient,
    bloodRequest,
    donationDate: donationDate || new Date(),
    bloodType,
    unitsProvided: unitsProvided || 1,
    donationCenter,
    healthCheckBefore,
    notes,
    verificationStatus: 'pending'
  });

  // Update donor profile
  const donorProfile = await DonorProfile.findById(donorId);
  donorProfile.lastDonationDate = donation.donationDate;
  donorProfile.totalDonations += 1;
  donorProfile.updateBadge();
  await donorProfile.save();

  // Update blood request if provided
  if (bloodRequest) {
    const request = await BloodRequest.findById(bloodRequest);
    if (request) {
      request.fulfilledBy.push({
        donor: donorId,
        donationDate: donation.donationDate,
        unitsContributed: unitsProvided || 1
      });
      request.totalUnitsFulfilled += unitsProvided || 1;
      request.checkFulfillment();
      await request.save();
    }
  }

  // Calculate and update leaderboard points
  const points = calculateDonationPoints(donation, bloodRequest);
  donation.pointsEarned = points;
  await donation.save();

  await updateLeaderboardEntry(donorId, points);

  res.status(201).json({
    success: true,
    message: 'Donation recorded successfully',
    data: donation,
    pointsEarned: points
  });
});

/**
 * @route   GET /api/donations/history
 * @desc    Get donation history
 * @access  Private
 */
export const getDonationHistory = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;

  const query = {};

  // If donor, show their donations only
  if (req.user.role === 'donor') {
    query.donor = req.user._id;
  }
  // If recipient, show donations related to them
  else if (req.user.role === 'recipient') {
    query.recipient = req.user._id;
  }

  const donations = await DonationHistory.find(query)
    .populate('donor', 'name phone bloodType')
    .populate('recipient', 'name phone')
    .populate('bloodRequest', 'patientName hospital')
    .sort({ donationDate: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const totalCount = await DonationHistory.countDocuments(query);

  res.status(200).json({
    success: true,
    count: donations.length,
    totalCount: totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
    data: donations
  });
});

/**
 * @route   GET /api/donations/:id
 * @desc    Get single donation
 * @access  Private
 */
export const getDonationById = catchAsync(async (req, res, next) => {
  const donation = await DonationHistory.findById(req.params.id)
    .populate('donor', 'name phone bloodType address')
    .populate('recipient', 'name phone')
    .populate('bloodRequest')
    .populate('digitalCard');

  if (!donation) {
    return next(new AppError('Donation not found', 404));
  }

  res.status(200).json({
    success: true,
    data: donation
  });
});

/**
 * @route   POST /api/donations/:id/verify
 * @desc    Verify donation (Admin only)
 * @access  Private (Admin)
 */
export const verifyDonation = catchAsync(async (req, res, next) => {
  const donation = await DonationHistory.findById(req.params.id);

  if (!donation) {
    return next(new AppError('Donation not found', 404));
  }

  donation.verificationStatus = 'verified';
  donation.verifiedBy = req.user._id;
  donation.verifiedAt = new Date();
  await donation.save();

  // Generate digital donation card
  const cardNumber = await DigitalDonationCard.generateCardNumber();

  const qrData = await generateDonationQR({
    cardNumber,
    donorId: donation.donor,
    donationId: donation._id,
    bloodType: donation.bloodType,
    donationDate: donation.donationDate
  });

  const validUntil = new Date();
  validUntil.setFullYear(validUntil.getFullYear() + 1); // Valid for 1 year

  const digitalCard = await DigitalDonationCard.create({
    donationHistory: donation._id,
    donor: donation.donor,
    cardNumber,
    qrCode: qrData.qrCode,
    qrCodeData: qrData.qrData,
    validUntil
  });

  donation.digitalCard = digitalCard._id;
  await donation.save();

  res.status(200).json({
    success: true,
    message: 'Donation verified successfully',
    data: {
      donation,
      digitalCard
    }
  });
});

/**
 * @route   GET /api/donations/card/:id
 * @desc    Get digital donation card
 * @access  Private
 */
export const getDigitalCard = catchAsync(async (req, res, next) => {
  const card = await DigitalDonationCard.findById(req.params.id)
    .populate('donor', 'name bloodType')
    .populate('donationHistory');

  if (!card) {
    return next(new AppError('Digital card not found', 404));
  }

  res.status(200).json({
    success: true,
    data: card
  });
});

/**
 * @route   POST /api/donations/verify-qr
 * @desc    Verify QR code
 * @access  Public
 */
export const verifyQRCode = catchAsync(async (req, res, next) => {
  const { qrData } = req.body;

  if (!qrData) {
    return next(new AppError('QR data is required', 400));
  }

  const verification = verifyDonationQR(qrData);

  if (!verification.valid) {
    return res.status(400).json({
      success: false,
      message: verification.error
    });
  }

  // Find the digital card
  const card = await DigitalDonationCard.findOne({
    qrCodeData: qrData
  })
    .populate('donor', 'name bloodType')
    .populate('donationHistory');

  if (!card) {
    return res.status(404).json({
      success: false,
      message: 'Digital card not found'
    });
  }

  if (!card.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Card is not valid or has been revoked'
    });
  }

  // Increment verification count
  await card.verify();

  res.status(200).json({
    success: true,
    message: 'QR code verified successfully',
    data: {
      card,
      verification: verification.data
    }
  });
});

/**
 * @route   GET /api/donations/validate-count
 * @desc    Validate and sync donation count for logged-in donor
 * @access  Private (Donor only)
 */
export const validateDonationCount = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'donor') {
    return next(new AppError('Only donors can validate donation counts', 403));
  }

  const donorId = req.user._id;

  // Count actual donations in DonationHistory
  const actualCount = await DonationHistory.countDocuments({
    donor: donorId
  });

  // Get donor profile
  const donorProfile = await DonorProfile.findById(donorId);

  const profileCount = donorProfile.totalDonations;
  const isConsistent = actualCount === profileCount;

  // Auto-fix if inconsistent
  if (!isConsistent) {
    donorProfile.totalDonations = actualCount;
    donorProfile.updateBadge();
    await donorProfile.save();
  }

  res.status(200).json({
    success: true,
    data: {
      actualDonations: actualCount,
      profileDonations: profileCount,
      wasInconsistent: !isConsistent,
      fixed: !isConsistent,
      message: isConsistent
        ? 'Donation count is consistent'
        : `Fixed inconsistency: ${profileCount} -> ${actualCount}`
    }
  });
});

export default {
  recordDonation,
  getDonationHistory,
  getDonationById,
  verifyDonation,
  getDigitalCard,
  verifyQRCode,
  validateDonationCount
};
