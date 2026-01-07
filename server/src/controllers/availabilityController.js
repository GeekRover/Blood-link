import DonorProfile from '../models/DonorProfile.js';
import { catchAsync, AppError } from '../middlewares/errorHandler.js';

/**
 * Get donor's availability schedule
 * GET /api/availability
 */
export const getAvailabilitySchedule = catchAsync(async (req, res, next) => {
  const donor = await DonorProfile.findById(req.user._id);

  if (!donor) {
    return next(new AppError('Donor profile not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      enabled: donor.availabilitySchedule?.enabled || false,
      weeklySlots: donor.availabilitySchedule?.weeklySlots || [],
      customAvailability: donor.availabilitySchedule?.customAvailability || [],
      timezone: donor.availabilitySchedule?.timezone || 'Asia/Dhaka',
      isAvailable: donor.isAvailable
    }
  });
});

/**
 * Enable/disable scheduled availability
 * PUT /api/availability/toggle
 */
export const toggleScheduledAvailability = catchAsync(async (req, res, next) => {
  const { enabled } = req.body;

  if (typeof enabled !== 'boolean') {
    return next(new AppError('Enabled field must be a boolean', 400));
  }

  const donor = await DonorProfile.findById(req.user._id);

  if (!donor) {
    return next(new AppError('Donor profile not found', 404));
  }

  if (!donor.availabilitySchedule) {
    donor.availabilitySchedule = {};
  }

  donor.availabilitySchedule.enabled = enabled;
  await donor.save();

  res.status(200).json({
    success: true,
    message: `Scheduled availability ${enabled ? 'enabled' : 'disabled'}`,
    data: {
      enabled: donor.availabilitySchedule.enabled
    }
  });
});

/**
 * Add weekly availability slot
 * POST /api/availability/weekly
 */
export const addWeeklySlot = catchAsync(async (req, res, next) => {
  const { dayOfWeek, startTime, endTime } = req.body;

  // Validation
  if (dayOfWeek === undefined || !startTime || !endTime) {
    return next(new AppError('dayOfWeek, startTime, and endTime are required', 400));
  }

  if (dayOfWeek < 0 || dayOfWeek > 6) {
    return next(new AppError('dayOfWeek must be between 0 (Sunday) and 6 (Saturday)', 400));
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    return next(new AppError('Times must be in HH:MM format (24-hour)', 400));
  }

  const donor = await DonorProfile.findById(req.user._id);

  if (!donor) {
    return next(new AppError('Donor profile not found', 404));
  }

  if (!donor.availabilitySchedule) {
    donor.availabilitySchedule = { weeklySlots: [] };
  }

  if (!donor.availabilitySchedule.weeklySlots) {
    donor.availabilitySchedule.weeklySlots = [];
  }

  // Add new slot
  donor.availabilitySchedule.weeklySlots.push({
    dayOfWeek,
    startTime,
    endTime,
    isActive: true
  });

  await donor.save();

  res.status(201).json({
    success: true,
    message: 'Weekly availability slot added',
    data: {
      weeklySlots: donor.availabilitySchedule.weeklySlots
    }
  });
});

/**
 * Update weekly availability slot
 * PUT /api/availability/weekly/:slotId
 */
export const updateWeeklySlot = catchAsync(async (req, res, next) => {
  const { slotId } = req.params;
  const { dayOfWeek, startTime, endTime, isActive } = req.body;

  const donor = await DonorProfile.findById(req.user._id);

  if (!donor) {
    return next(new AppError('Donor profile not found', 404));
  }

  const slot = donor.availabilitySchedule?.weeklySlots?.id(slotId);

  if (!slot) {
    return next(new AppError('Weekly slot not found', 404));
  }

  // Update fields if provided
  if (dayOfWeek !== undefined) {
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return next(new AppError('dayOfWeek must be between 0 and 6', 400));
    }
    slot.dayOfWeek = dayOfWeek;
  }

  if (startTime) {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime)) {
      return next(new AppError('startTime must be in HH:MM format', 400));
    }
    slot.startTime = startTime;
  }

  if (endTime) {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(endTime)) {
      return next(new AppError('endTime must be in HH:MM format', 400));
    }
    slot.endTime = endTime;
  }

  if (typeof isActive === 'boolean') {
    slot.isActive = isActive;
  }

  await donor.save();

  res.status(200).json({
    success: true,
    message: 'Weekly slot updated',
    data: {
      weeklySlots: donor.availabilitySchedule.weeklySlots
    }
  });
});

/**
 * Delete weekly availability slot
 * DELETE /api/availability/weekly/:slotId
 */
export const deleteWeeklySlot = catchAsync(async (req, res, next) => {
  const { slotId } = req.params;

  const donor = await DonorProfile.findById(req.user._id);

  if (!donor) {
    return next(new AppError('Donor profile not found', 404));
  }

  const slot = donor.availabilitySchedule?.weeklySlots?.id(slotId);

  if (!slot) {
    return next(new AppError('Weekly slot not found', 404));
  }

  // Remove the slot using Mongoose pull
  donor.availabilitySchedule.weeklySlots.pull(slotId);
  await donor.save();

  res.status(200).json({
    success: true,
    message: 'Weekly slot deleted',
    data: {
      weeklySlots: donor.availabilitySchedule.weeklySlots
    }
  });
});

/**
 * Add custom availability (date-specific override)
 * POST /api/availability/custom
 */
export const addCustomAvailability = catchAsync(async (req, res, next) => {
  const { startDate, endDate, startTime, endTime, isAvailable, reason } = req.body;

  // Validation
  if (!startDate || !endDate) {
    return next(new AppError('startDate and endDate are required', 400));
  }

  if (typeof isAvailable !== 'boolean') {
    return next(new AppError('isAvailable must be a boolean', 400));
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return next(new AppError('Invalid date format', 400));
  }

  if (end < start) {
    return next(new AppError('endDate must be after startDate', 400));
  }

  // Validate time format if provided
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (startTime && !timeRegex.test(startTime)) {
    return next(new AppError('startTime must be in HH:MM format', 400));
  }
  if (endTime && !timeRegex.test(endTime)) {
    return next(new AppError('endTime must be in HH:MM format', 400));
  }

  const donor = await DonorProfile.findById(req.user._id);

  if (!donor) {
    return next(new AppError('Donor profile not found', 404));
  }

  if (!donor.availabilitySchedule) {
    donor.availabilitySchedule = { customAvailability: [] };
  }

  if (!donor.availabilitySchedule.customAvailability) {
    donor.availabilitySchedule.customAvailability = [];
  }

  // Add custom availability
  donor.availabilitySchedule.customAvailability.push({
    startDate: start,
    endDate: end,
    startTime: startTime || undefined,
    endTime: endTime || undefined,
    isAvailable,
    reason: reason || undefined
  });

  await donor.save();

  res.status(201).json({
    success: true,
    message: 'Custom availability added',
    data: {
      customAvailability: donor.availabilitySchedule.customAvailability
    }
  });
});

/**
 * Update custom availability
 * PUT /api/availability/custom/:customId
 */
export const updateCustomAvailability = catchAsync(async (req, res, next) => {
  const { customId } = req.params;
  const { startDate, endDate, startTime, endTime, isAvailable, reason } = req.body;

  const donor = await DonorProfile.findById(req.user._id);

  if (!donor) {
    return next(new AppError('Donor profile not found', 404));
  }

  const custom = donor.availabilitySchedule?.customAvailability?.id(customId);

  if (!custom) {
    return next(new AppError('Custom availability not found', 404));
  }

  // Update fields if provided
  if (startDate) {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      return next(new AppError('Invalid startDate format', 400));
    }
    custom.startDate = start;
  }

  if (endDate) {
    const end = new Date(endDate);
    if (isNaN(end.getTime())) {
      return next(new AppError('Invalid endDate format', 400));
    }
    custom.endDate = end;
  }

  // Validate end is after start
  if (custom.endDate < custom.startDate) {
    return next(new AppError('endDate must be after startDate', 400));
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (startTime !== undefined) {
    if (startTime && !timeRegex.test(startTime)) {
      return next(new AppError('startTime must be in HH:MM format', 400));
    }
    custom.startTime = startTime || undefined;
  }

  if (endTime !== undefined) {
    if (endTime && !timeRegex.test(endTime)) {
      return next(new AppError('endTime must be in HH:MM format', 400));
    }
    custom.endTime = endTime || undefined;
  }

  if (typeof isAvailable === 'boolean') {
    custom.isAvailable = isAvailable;
  }

  if (reason !== undefined) {
    custom.reason = reason || undefined;
  }

  await donor.save();

  res.status(200).json({
    success: true,
    message: 'Custom availability updated',
    data: {
      customAvailability: donor.availabilitySchedule.customAvailability
    }
  });
});

/**
 * Delete custom availability
 * DELETE /api/availability/custom/:customId
 */
export const deleteCustomAvailability = catchAsync(async (req, res, next) => {
  const { customId } = req.params;

  const donor = await DonorProfile.findById(req.user._id);

  if (!donor) {
    return next(new AppError('Donor profile not found', 404));
  }

  const custom = donor.availabilitySchedule?.customAvailability?.id(customId);

  if (!custom) {
    return next(new AppError('Custom availability not found', 404));
  }

  // Remove the custom availability
  donor.availabilitySchedule.customAvailability.pull(customId);
  await donor.save();

  res.status(200).json({
    success: true,
    message: 'Custom availability deleted',
    data: {
      customAvailability: donor.availabilitySchedule.customAvailability
    }
  });
});

/**
 * Check availability at specific time
 * POST /api/availability/check
 */
export const checkAvailability = catchAsync(async (req, res, next) => {
  const { dateTime, donorId } = req.body;

  // If donorId provided, check that donor, otherwise check current user
  const targetDonorId = donorId || req.user._id;

  const donor = await DonorProfile.findById(targetDonorId);

  if (!donor) {
    return next(new AppError('Donor not found', 404));
  }

  const checkTime = dateTime ? new Date(dateTime) : new Date();

  if (isNaN(checkTime.getTime())) {
    return next(new AppError('Invalid dateTime format', 400));
  }

  const isAvailable = donor.isAvailableAt(checkTime);

  res.status(200).json({
    success: true,
    data: {
      donorId: donor._id,
      donorName: donor.name,
      checkTime: checkTime.toISOString(),
      isAvailable,
      scheduledAvailabilityEnabled: donor.availabilitySchedule?.enabled || false
    }
  });
});

/**
 * Get donor's availability for a specific donor (public - for matching)
 * GET /api/availability/donor/:donorId
 */
export const getDonorAvailability = catchAsync(async (req, res, next) => {
  const { donorId } = req.params;

  const donor = await DonorProfile.findById(donorId).select(
    'name availabilitySchedule isAvailable'
  );

  if (!donor) {
    return next(new AppError('Donor not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      donorId: donor._id,
      donorName: donor.name,
      enabled: donor.availabilitySchedule?.enabled || false,
      weeklySlots: donor.availabilitySchedule?.weeklySlots || [],
      customAvailability: donor.availabilitySchedule?.customAvailability || [],
      timezone: donor.availabilitySchedule?.timezone || 'Asia/Dhaka',
      isAvailable: donor.isAvailable,
      isCurrentlyAvailable: donor.isAvailableAt(new Date())
    }
  });
});
