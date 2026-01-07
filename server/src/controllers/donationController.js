import DonationHistory from '../models/DonationHistory.js';
import DigitalDonationCard from '../models/DigitalDonationCard.js';
import DonorProfile from '../models/DonorProfile.js';
import BloodRequest from '../models/BloodRequest.js';
import { generateDonationQR, verifyDonationQR } from '../services/qrService.js';
import { calculateDonationPoints, updateLeaderboardEntry } from '../services/leaderboardService.js';
import { checkDonationEligibility } from '../services/frequencyChecker.js';
import { catchAsync, AppError } from '../middlewares/errorHandler.js';
import { logDonationVerification, logDataCorrection } from '../utils/auditLogger.js';

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

  // Update donor profile (don't increment totalDonations yet - only on verification)
  const donorProfile = await DonorProfile.findById(donorId);
  donorProfile.lastDonationDate = donation.donationDate;
  // totalDonations will be incremented when donation is verified
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
    .populate('digitalCard')
    .populate('donationCenter', 'name')
    .sort({ donationDate: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const totalCount = await DonationHistory.countDocuments(query);

  // Also count verified donations separately
  const verifiedQuery = { ...query, verificationStatus: 'verified' };
  const verifiedCount = await DonationHistory.countDocuments(verifiedQuery);

  res.status(200).json({
    success: true,
    count: donations.length,
    totalCount: totalCount,
    verifiedCount: verifiedCount, // Add verified count for accurate display
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

  // Increment donor's total verified donations
  const donorProfile = await DonorProfile.findById(donation.donor);
  if (donorProfile) {
    donorProfile.totalDonations += 1;
    donorProfile.updateBadge();
    await donorProfile.save();
  }

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

  // Log audit trail
  await logDonationVerification(req.user, donation, 'verify', req.body.reason, req);

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
 * @route   POST /api/donations/:id/reject
 * @desc    Reject a donation (admin only)
 * @access  Private/Admin
 */
export const rejectDonation = catchAsync(async (req, res, next) => {
  const { reason } = req.body;

  if (!reason || reason.length < 10) {
    return next(new AppError('Rejection reason is required (minimum 10 characters)', 400));
  }

  const donation = await DonationHistory.findById(req.params.id);

  if (!donation) {
    return next(new AppError('Donation not found', 404));
  }

  if (donation.verificationStatus === 'verified') {
    return next(new AppError('Cannot reject an already verified donation', 400));
  }

  donation.verificationStatus = 'rejected';
  donation.verifiedBy = req.user._id;
  donation.verifiedAt = new Date();
  donation.rejectionReason = reason;
  await donation.save();

  // Log audit trail
  await logDonationVerification(req.user, donation, 'reject', reason, req);

  res.status(200).json({
    success: true,
    message: 'Donation rejected',
    data: donation
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

  // Count actual VERIFIED donations in DonationHistory
  const actualCount = await DonationHistory.countDocuments({
    donor: donorId,
    verificationStatus: 'verified'
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
      verifiedDonations: actualCount,
      profileDonations: profileCount,
      wasInconsistent: !isConsistent,
      fixed: !isConsistent,
      message: isConsistent
        ? 'Donation count is consistent'
        : `Fixed inconsistency: ${profileCount} -> ${actualCount}`
    }
  });
});

/**
 * @route   PUT /api/donations/:id
 * @desc    Update donation (with immutability checks)
 * @access  Private (Donor/Admin)
 */
export const updateDonation = catchAsync(async (req, res, next) => {
  const donation = await DonationHistory.findById(req.params.id);

  if (!donation) {
    return next(new AppError('Donation not found', 404));
  }

  // Check ownership (donor can update their own, admin can update any)
  if (req.user.role === 'donor' && donation.donor.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized to update this donation', 403));
  }

  // Get the updates from request body
  const updates = req.body;

  // Validate updates against immutability rules
  const validation = DonationHistory.validateUpdate(donation, updates, false);

  if (!validation.allowed) {
    return res.status(400).json({
      success: false,
      message: 'Update blocked due to immutability rules',
      errors: validation.errors,
      isLocked: donation.isLocked,
      lockedReason: donation.lockedReason,
      lockedAt: donation.lockedAt,
      hint: donation.isLocked
        ? 'This donation is locked after verification. Use admin override endpoint to modify.'
        : 'Some fields are always immutable and cannot be changed.'
    });
  }

  // Fields that can be updated (non-immutable)
  const allowedUpdates = ['notes', 'complications', 'followUpRequired', 'followUpDate', 'healthCheckAfter'];

  // Apply allowed updates and record edit history
  for (const [field, value] of Object.entries(updates)) {
    if (allowedUpdates.includes(field) || (!donation.isLocked && field !== 'donor' && field !== 'donationDate' && field !== 'bloodType')) {
      const oldValue = donation[field];
      if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
        donation.recordEdit(req.user._id, field, oldValue, value, req.body.editReason || 'Update');
        donation[field] = value;
      }
    }
  }

  await donation.save();

  res.status(200).json({
    success: true,
    message: 'Donation updated successfully',
    data: donation,
    warnings: validation.warnings
  });
});

/**
 * @route   PUT /api/donations/:id/admin-override
 * @desc    Admin override to update locked donation
 * @access  Private (Admin only)
 */
export const adminOverrideDonation = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new AppError('Only admins can use override functionality', 403));
  }

  const { updates, overrideReason } = req.body;

  if (!overrideReason || overrideReason.length < 10) {
    return next(new AppError('Override reason is required and must be at least 10 characters', 400));
  }

  if (!updates || Object.keys(updates).length === 0) {
    return next(new AppError('No updates provided', 400));
  }

  const donation = await DonationHistory.findById(req.params.id);

  if (!donation) {
    return next(new AppError('Donation not found', 404));
  }

  // Validate updates (with admin override flag)
  const validation = DonationHistory.validateUpdate(donation, updates, true);

  // Even admins cannot change always-immutable fields
  if (!validation.allowed) {
    return res.status(400).json({
      success: false,
      message: 'Update blocked - some fields are always immutable',
      errors: validation.errors,
      hint: 'Fields like donor, donationDate, and bloodType can never be changed, even by admins.'
    });
  }

  // Record admin override
  const changesDescription = Object.entries(updates)
    .map(([field, value]) => `${field}: ${JSON.stringify(donation[field])} → ${JSON.stringify(value)}`)
    .join('; ');

  donation.recordAdminOverride(
    req.user._id,
    overrideReason,
    changesDescription,
    req.ip || req.connection?.remoteAddress
  );

  // Apply updates and record edit history
  for (const [field, value] of Object.entries(updates)) {
    const oldValue = donation[field];
    if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
      donation.recordEdit(req.user._id, field, oldValue, value, overrideReason, true);
      donation[field] = value;
    }
  }

  await donation.save();

  // Log to audit trail
  await logDataCorrection(
    req.user,
    'DonationHistory',
    donation._id,
    changesDescription,
    overrideReason,
    req
  );

  res.status(200).json({
    success: true,
    message: 'Donation updated via admin override',
    data: donation,
    warnings: validation.warnings,
    override: {
      admin: req.user._id,
      reason: overrideReason,
      changes: changesDescription
    }
  });
});

/**
 * @route   GET /api/donations/:id/immutability-status
 * @desc    Get immutability status and edit history for a donation
 * @access  Private
 */
export const getImmutabilityStatus = catchAsync(async (req, res, next) => {
  const donation = await DonationHistory.findById(req.params.id)
    .populate('editHistory.editedBy', 'name email role')
    .populate('adminOverrides.admin', 'name email');

  if (!donation) {
    return next(new AppError('Donation not found', 404));
  }

  const rules = DonationHistory.getImmutabilityRules();

  res.status(200).json({
    success: true,
    data: {
      donationId: donation._id,
      isLocked: donation.isLocked,
      isEditable: !donation.isLocked,
      lockedAt: donation.lockedAt,
      lockedReason: donation.lockedReason,
      verificationStatus: donation.verificationStatus,
      rules,
      editHistory: donation.editHistory,
      adminOverrides: donation.adminOverrides,
      editCount: donation.editHistory.length,
      overrideCount: donation.adminOverrides.length
    }
  });
});

/**
 * @route   PUT /api/donations/:id/lock
 * @desc    Manually lock a donation (Admin only)
 * @access  Private (Admin)
 */
export const lockDonation = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new AppError('Only admins can lock donations', 403));
  }

  const { reason } = req.body;

  if (!reason) {
    return next(new AppError('Lock reason is required', 400));
  }

  const donation = await DonationHistory.findById(req.params.id);

  if (!donation) {
    return next(new AppError('Donation not found', 404));
  }

  if (donation.isLocked) {
    return res.status(400).json({
      success: false,
      message: 'Donation is already locked',
      lockedAt: donation.lockedAt,
      lockedReason: donation.lockedReason
    });
  }

  const lockReason = reason === 'compliance_review' ? 'compliance_review' : 'admin_locked';
  donation.lockDonation(lockReason);
  await donation.save();

  res.status(200).json({
    success: true,
    message: 'Donation locked successfully',
    data: {
      donationId: donation._id,
      isLocked: donation.isLocked,
      lockedAt: donation.lockedAt,
      lockedReason: donation.lockedReason
    }
  });
});

/**
 * @route   PUT /api/donations/:id/unlock
 * @desc    Unlock a donation (Admin only - use with caution)
 * @access  Private (Admin)
 */
export const unlockDonation = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new AppError('Only admins can unlock donations', 403));
  }

  const { reason } = req.body;

  if (!reason || reason.length < 20) {
    return next(new AppError('Unlock reason is required and must be at least 20 characters', 400));
  }

  const donation = await DonationHistory.findById(req.params.id);

  if (!donation) {
    return next(new AppError('Donation not found', 404));
  }

  if (!donation.isLocked) {
    return res.status(400).json({
      success: false,
      message: 'Donation is not locked'
    });
  }

  // Record the unlock as an admin override
  donation.recordAdminOverride(
    req.user._id,
    reason,
    `Unlocked donation (was locked since ${donation.lockedAt} for reason: ${donation.lockedReason})`,
    req.ip || req.connection?.remoteAddress
  );

  donation.unlockDonation();
  await donation.save();

  // Log to audit trail
  await logDataCorrection(
    req.user,
    'DonationHistory',
    donation._id,
    'Donation unlocked',
    reason,
    req
  );

  res.status(200).json({
    success: true,
    message: 'Donation unlocked successfully',
    warning: 'This donation can now be edited. Re-lock after making necessary changes.',
    data: {
      donationId: donation._id,
      isLocked: donation.isLocked
    }
  });
});

/**
 * @route   POST /api/donations/card/:id/regenerate
 * @desc    Regenerate QR code for digital card
 * @access  Private (Donor/Admin)
 */
export const regenerateQRCode = catchAsync(async (req, res, next) => {
  const { reason } = req.body;

  if (!reason || reason.length < 10) {
    return next(new AppError('Reason for regeneration is required (minimum 10 characters)', 400));
  }

  const card = await DigitalDonationCard.findById(req.params.id)
    .populate('donor', 'name')
    .populate('donationHistory');

  if (!card) {
    return next(new AppError('Digital card not found', 404));
  }

  // Check ownership (donor can regenerate their own, admin can regenerate any)
  if (req.user.role === 'donor' && card.donor._id.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized to regenerate this card', 403));
  }

  // Generate new QR code
  const qrData = await generateDonationQR({
    cardNumber: card.cardNumber,
    donorId: card.donor._id,
    donationId: card.donationHistory._id,
    bloodType: card.donationHistory.bloodType,
    donationDate: card.donationHistory.donationDate
  });

  // Update card with new QR code
  card.qrCode = qrData.qrCode;
  card.qrCodeData = qrData.qrData;
  card.verificationCount = 0; // Reset verification count
  card.lastVerifiedAt = null;

  await card.save();

  res.status(200).json({
    success: true,
    message: 'QR code regenerated successfully',
    reason,
    data: card
  });
});

/**
 * @route   GET /api/donations/cards/my-cards
 * @desc    Get all digital donation cards for current donor
 * @access  Private (Donor)
 */
export const getMyDigitalCards = catchAsync(async (req, res, next) => {
  const cards = await DigitalDonationCard.find({
    donor: req.user._id
  })
    .populate('donationHistory')
    .sort({ issuedDate: -1 });

  const activeCards = cards.filter(card => card.isValid);
  const revokedCards = cards.filter(card => !card.isValid);

  res.status(200).json({
    success: true,
    count: cards.length,
    data: {
      all: cards,
      active: activeCards,
      revoked: revokedCards,
      stats: {
        total: cards.length,
        active: activeCards.length,
        revoked: revokedCards.length
      }
    }
  });
});

/**
 * @route   POST /api/donations/card/:id/revoke
 * @desc    Revoke digital donation card
 * @access  Private (Admin)
 */
export const revokeDigitalCard = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new AppError('Only admins can revoke digital cards', 403));
  }

  const { reason } = req.body;

  if (!reason || reason.length < 10) {
    return next(new AppError('Revocation reason is required (minimum 10 characters)', 400));
  }

  const card = await DigitalDonationCard.findById(req.params.id)
    .populate('donor', 'name email')
    .populate('donationHistory');

  if (!card) {
    return next(new AppError('Digital card not found', 404));
  }

  if (card.isRevoked) {
    return res.status(400).json({
      success: false,
      message: 'Card is already revoked',
      revokedAt: card.revokedAt,
      revokeReason: card.revokeReason
    });
  }

  // Revoke the card
  await card.revoke(req.user._id, reason);

  res.status(200).json({
    success: true,
    message: 'Digital card revoked successfully',
    data: {
      cardId: card._id,
      cardNumber: card.cardNumber,
      revokedAt: card.revokedAt,
      revokedBy: req.user._id,
      reason: card.revokeReason
    }
  });
});

/**
 * @route   GET /api/donations/cards/donor/:donorId
 * @desc    Get all digital cards for a specific donor (Admin only)
 * @access  Private (Admin)
 */
export const getDonorCards = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new AppError('Only admins can view other donors cards', 403));
  }

  const cards = await DigitalDonationCard.find({
    donor: req.params.donorId
  })
    .populate('donor', 'name email bloodType')
    .populate('donationHistory')
    .sort({ issuedDate: -1 });

  if (!cards || cards.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'No digital cards found for this donor'
    });
  }

  const activeCards = cards.filter(card => card.isValid);
  const revokedCards = cards.filter(card => !card.isValid);

  res.status(200).json({
    success: true,
    count: cards.length,
    data: {
      donor: cards[0].donor,
      all: cards,
      active: activeCards,
      revoked: revokedCards,
      stats: {
        total: cards.length,
        active: activeCards.length,
        revoked: revokedCards.length,
        totalVerifications: cards.reduce((sum, card) => sum + card.verificationCount, 0)
      }
    }
  });
});

/**
 * @route   POST /api/donations/admin/sync-all-counts
 * @desc    Sync donation counts for all donors (Admin only)
 * @access  Private (Admin)
 */
export const syncAllDonationCounts = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new AppError('Only admins can sync all donation counts', 403));
  }

  // Get all donors
  const donors = await DonorProfile.find({});

  let fixed = 0;
  let unchanged = 0;
  const results = [];

  for (const donor of donors) {
    // Count actual verified donations
    const actualCount = await DonationHistory.countDocuments({
      donor: donor._id,
      verificationStatus: 'verified'
    });

    const oldCount = donor.totalDonations;

    if (actualCount !== oldCount) {
      donor.totalDonations = actualCount;
      donor.updateBadge();
      await donor.save();
      fixed++;
      results.push({
        donorId: donor._id,
        name: donor.name,
        oldCount,
        newCount: actualCount,
        fixed: true
      });
    } else {
      unchanged++;
    }
  }

  res.status(200).json({
    success: true,
    message: `Synced ${fixed} donors, ${unchanged} were already correct`,
    data: {
      totalDonors: donors.length,
      fixed,
      unchanged,
      details: results
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
  validateDonationCount,
  syncAllDonationCounts,
  updateDonation,
  adminOverrideDonation,
  getImmutabilityStatus,
  lockDonation,
  unlockDonation,
  regenerateQRCode,
  getMyDigitalCards,
  revokeDigitalCard,
  getDonorCards,
  rejectDonation
};
