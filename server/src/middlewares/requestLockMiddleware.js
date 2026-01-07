import BloodRequest from '../models/BloodRequest.js';
import { AppError } from './errorHandler.js';

/**
 * Middleware to check if a blood request can be accepted by the current donor
 * Enforces the locking mechanism to prevent multiple simultaneous acceptances
 */
export const validateRequestLock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const donorId = req.user._id;

    // Find the blood request
    const request = await BloodRequest.findById(id);

    if (!request) {
      return next(new AppError('Blood request not found', 404));
    }

    // Check if request is still pending
    if (request.status !== 'pending') {
      return next(new AppError(`This request is already ${request.status}`, 400));
    }

    // Check if donor can accept this request
    if (!request.canBeAcceptedBy(donorId)) {
      const timeRemaining = Math.ceil((request.lockExpiresAt - new Date()) / 60000);
      return next(
        new AppError(
          `This request is currently locked by another donor. Please try again in ${timeRemaining} minutes.`,
          423 // 423 Locked status code
        )
      );
    }

    // If lock is expired, clear it
    if (request.isLocked && request.isLockExpired()) {
      request.unlockRequest();
      await request.save();
    }

    // Attach request to req object for use in controller
    req.bloodRequest = request;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to automatically lock a request when a donor views it
 * This gives the donor time to review and decide
 */
export const autoLockOnView = async (req, res, next) => {
  try {
    const { id } = req.params;
    const donorId = req.user._id;

    // Only auto-lock for donors
    if (req.user.role !== 'donor') {
      return next();
    }

    const request = await BloodRequest.findById(id);

    if (!request || request.status !== 'pending') {
      return next();
    }

    // If not locked or lock expired, lock it for this donor
    if (!request.isLocked || request.isLockExpired()) {
      request.lockRequest(donorId, 15); // 15 minute lock
      await request.save();
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to unlock a request when donor declines
 */
export const unlockOnDecline = async (req, res, next) => {
  try {
    const { id } = req.params;
    const donorId = req.user._id;

    const request = await BloodRequest.findById(id);

    if (!request) {
      return next(new AppError('Blood request not found', 404));
    }

    // Only unlock if this donor has the lock
    if (request.isLocked && request.lockedBy && request.lockedBy.toString() === donorId.toString()) {
      request.unlockRequest();
      await request.save();
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default {
  validateRequestLock,
  autoLockOnView,
  unlockOnDecline
};
