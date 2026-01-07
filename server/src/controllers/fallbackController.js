import { catchAsync, AppError } from '../middlewares/errorHandler.js';
import {
  detectUnmatchedRequests,
  suggestRadiusExpansion,
  notifyUnavailableDonors,
  suggestNearbyFacilities,
  notifyAdminCritical,
  processFallback,
  runFallbackSystem
} from '../services/fallbackService.js';
import BloodRequest from '../models/BloodRequest.js';

/**
 * @route   GET /api/fallback/unmatched
 * @desc    Get all unmatched blood requests
 * @access  Private (Admin)
 */
export const getUnmatchedRequests = catchAsync(async (req, res) => {
  const { hours = 6 } = req.query;

  const unmatchedRequests = await detectUnmatchedRequests(parseInt(hours));

  res.status(200).json({
    success: true,
    count: unmatchedRequests.length,
    data: unmatchedRequests
  });
});

/**
 * @route   POST /api/fallback/expand-radius/:requestId
 * @desc    Expand search radius for a blood request
 * @access  Private (Recipient/Admin)
 */
export const expandRadius = catchAsync(async (req, res, next) => {
  const { requestId } = req.params;
  const { newRadius = 100 } = req.body;

  // Verify user owns the request or is admin
  const request = await BloodRequest.findById(requestId);

  if (!request) {
    return next(new AppError('Blood request not found', 404));
  }

  if (req.user.role !== 'admin' && request.recipient.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized to modify this request', 403));
  }

  const updatedRequest = await suggestRadiusExpansion(requestId, newRadius);

  res.status(200).json({
    success: true,
    message: `Search radius expanded to ${newRadius}km`,
    data: updatedRequest
  });
});

/**
 * @route   POST /api/fallback/notify-unavailable/:requestId
 * @desc    Notify unavailable donors about a critical request
 * @access  Private (Admin)
 */
export const notifyUnavailable = catchAsync(async (req, res, next) => {
  const { requestId } = req.params;

  const result = await notifyUnavailableDonors(requestId);

  res.status(200).json({
    success: true,
    message: `Notified ${result.notified} unavailable donors`,
    data: result
  });
});

/**
 * @route   POST /api/fallback/suggest-facilities/:requestId
 * @desc    Suggest nearby blood banks and hospitals
 * @access  Private (Recipient/Admin)
 */
export const suggestFacilities = catchAsync(async (req, res, next) => {
  const { requestId } = req.params;

  // Verify user owns the request or is admin
  const request = await BloodRequest.findById(requestId);

  if (!request) {
    return next(new AppError('Blood request not found', 404));
  }

  if (req.user.role !== 'admin' && request.recipient.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized to access this request', 403));
  }

  const updatedRequest = await suggestNearbyFacilities(requestId);

  res.status(200).json({
    success: true,
    message: `Found ${updatedRequest.nearbyFacilities.length} nearby facilities`,
    data: {
      requestId: updatedRequest._id,
      facilities: updatedRequest.nearbyFacilities
    }
  });
});

/**
 * @route   POST /api/fallback/notify-admin/:requestId
 * @desc    Notify admins about a critical unmatched request
 * @access  Private (Recipient/Admin)
 */
export const notifyAdmin = catchAsync(async (req, res, next) => {
  const { requestId } = req.params;

  const result = await notifyAdminCritical(requestId);

  res.status(200).json({
    success: true,
    message: `Notified ${result.notified} administrators`,
    data: result
  });
});

/**
 * @route   POST /api/fallback/process/:requestId
 * @desc    Process fallback for a single blood request
 * @access  Private (Admin)
 */
export const processSingleFallback = catchAsync(async (req, res, next) => {
  const { requestId } = req.params;

  const result = await processFallback(requestId);

  res.status(200).json({
    success: true,
    message: 'Fallback processing completed',
    data: result
  });
});

/**
 * @route   POST /api/fallback/run-system
 * @desc    Run fallback system for all unmatched requests
 * @access  Private (Admin)
 */
export const runSystem = catchAsync(async (req, res) => {
  const { hours = 6 } = req.body;

  const results = await runFallbackSystem(parseInt(hours));

  res.status(200).json({
    success: true,
    message: `Processed ${results.totalProcessed} unmatched requests`,
    data: results
  });
});

/**
 * @route   PUT /api/fallback/consent-expansion/:requestId
 * @desc    Give consent for radius expansion
 * @access  Private (Recipient)
 */
export const giveExpansionConsent = catchAsync(async (req, res, next) => {
  const { requestId } = req.params;
  const { consent } = req.body;

  const request = await BloodRequest.findById(requestId);

  if (!request) {
    return next(new AppError('Blood request not found', 404));
  }

  // Verify user owns the request
  if (request.recipient.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized to modify this request', 403));
  }

  request.radiusExpansionConsent = consent === true;
  await request.save();

  // If consent given, automatically expand radius
  if (consent === true && !request.radiusExpanded) {
    await suggestRadiusExpansion(requestId);
  }

  res.status(200).json({
    success: true,
    message: consent ? 'Consent given. Radius will be expanded.' : 'Consent withdrawn',
    data: request
  });
});

export default {
  getUnmatchedRequests,
  expandRadius,
  notifyUnavailable,
  suggestFacilities,
  notifyAdmin,
  processSingleFallback,
  runSystem,
  giveExpansionConsent
};
