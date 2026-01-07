import SystemConfig from '../models/SystemConfig.js';
import { catchAsync, AppError } from '../middlewares/errorHandler.js';
import { logDataCorrection } from '../utils/auditLogger.js';

/**
 * @route   GET /api/config
 * @desc    Get system configuration
 * @access  Private (Admin)
 */
export const getConfig = catchAsync(async (req, res) => {
  const config = await SystemConfig.getConfig();

  res.status(200).json({
    success: true,
    data: config
  });
});

/**
 * @route   PUT /api/config
 * @desc    Update system configuration
 * @access  Private (Admin)
 */
export const updateConfig = catchAsync(async (req, res, next) => {
  const { reason, ...updates } = req.body;

  if (!reason || reason.length < 10) {
    return next(new AppError('Update reason is required (minimum 10 characters)', 400));
  }

  const oldConfig = await SystemConfig.getConfig();
  const oldValues = oldConfig.toObject();

  const config = await SystemConfig.updateConfig(updates, req.user._id, reason);

  // Log configuration change
  await logDataCorrection(
    req.user,
    'SystemConfig',
    config._id,
    'System configuration updated',
    `${reason} | Changes: ${JSON.stringify(updates)}`,
    req
  );

  res.status(200).json({
    success: true,
    message: 'System configuration updated successfully',
    data: config
  });
});

/**
 * @route   PUT /api/config/donation-settings
 * @desc    Update donation-related settings
 * @access  Private (Admin)
 */
export const updateDonationSettings = catchAsync(async (req, res, next) => {
  const { reason, ...settings } = req.body;

  if (!reason || reason.length < 10) {
    return next(new AppError('Update reason is required (minimum 10 characters)', 400));
  }

  const config = await SystemConfig.getConfig();

  // Validate settings
  if (settings.cooldownDays !== undefined) {
    if (settings.cooldownDays < 30 || settings.cooldownDays > 365) {
      return next(new AppError('Cooldown days must be between 30 and 365', 400));
    }
    config.donationSettings.cooldownDays = settings.cooldownDays;
  }

  if (settings.minAge !== undefined) {
    if (settings.minAge < 16 || settings.minAge > 25) {
      return next(new AppError('Minimum age must be between 16 and 25', 400));
    }
    config.donationSettings.minAge = settings.minAge;
  }

  if (settings.maxAge !== undefined) {
    if (settings.maxAge < 50 || settings.maxAge > 80) {
      return next(new AppError('Maximum age must be between 50 and 80', 400));
    }
    config.donationSettings.maxAge = settings.maxAge;
  }

  // Add to change history
  config.changeHistory.push({
    updatedBy: req.user._id,
    updatedAt: new Date(),
    changes: new Map(Object.entries({ donationSettings: settings })),
    reason
  });

  config.lastUpdatedBy = req.user._id;
  await config.save();

  // Log change
  await logDataCorrection(
    req.user,
    'SystemConfig',
    config._id,
    'Donation settings updated',
    `${reason} | Settings: ${JSON.stringify(settings)}`,
    req
  );

  res.status(200).json({
    success: true,
    message: 'Donation settings updated successfully',
    data: config.donationSettings
  });
});

/**
 * @route   PUT /api/config/matching-settings
 * @desc    Update matching and search radius settings
 * @access  Private (Admin)
 */
export const updateMatchingSettings = catchAsync(async (req, res, next) => {
  const { reason, ...settings } = req.body;

  if (!reason || reason.length < 10) {
    return next(new AppError('Update reason is required (minimum 10 characters)', 400));
  }

  const config = await SystemConfig.getConfig();

  // Validate and update settings
  if (settings.defaultSearchRadiusKm !== undefined) {
    if (settings.defaultSearchRadiusKm < 10 || settings.defaultSearchRadiusKm > 500) {
      return next(new AppError('Default search radius must be between 10 and 500 km', 400));
    }
    config.matchingSettings.defaultSearchRadiusKm = settings.defaultSearchRadiusKm;
  }

  if (settings.maxSearchRadiusKm !== undefined) {
    if (settings.maxSearchRadiusKm < 50 || settings.maxSearchRadiusKm > 1000) {
      return next(new AppError('Max search radius must be between 50 and 1000 km', 400));
    }
    config.matchingSettings.maxSearchRadiusKm = settings.maxSearchRadiusKm;
  }

  if (settings.expandedRadiusKm !== undefined) {
    if (settings.expandedRadiusKm < 50 || settings.expandedRadiusKm > 500) {
      return next(new AppError('Expanded radius must be between 50 and 500 km', 400));
    }
    config.matchingSettings.expandedRadiusKm = settings.expandedRadiusKm;
  }

  // Add to change history
  config.changeHistory.push({
    updatedBy: req.user._id,
    updatedAt: new Date(),
    changes: new Map(Object.entries({ matchingSettings: settings })),
    reason
  });

  config.lastUpdatedBy = req.user._id;
  await config.save();

  // Log change
  await logDataCorrection(
    req.user,
    'SystemConfig',
    config._id,
    'Matching settings updated',
    `${reason} | Settings: ${JSON.stringify(settings)}`,
    req
  );

  res.status(200).json({
    success: true,
    message: 'Matching settings updated successfully',
    data: config.matchingSettings
  });
});

/**
 * @route   PUT /api/config/fallback-settings
 * @desc    Update fallback system settings
 * @access  Private (Admin)
 */
export const updateFallbackSettings = catchAsync(async (req, res, next) => {
  const { reason, ...settings } = req.body;

  if (!reason || reason.length < 10) {
    return next(new AppError('Update reason is required (minimum 10 characters)', 400));
  }

  const config = await SystemConfig.getConfig();

  // Validate and update settings
  if (settings.unmatchedThresholdHours !== undefined) {
    if (settings.unmatchedThresholdHours < 1 || settings.unmatchedThresholdHours > 72) {
      return next(new AppError('Unmatched threshold must be between 1 and 72 hours', 400));
    }
    config.fallbackSettings.unmatchedThresholdHours = settings.unmatchedThresholdHours;
  }

  if (settings.autoRunEnabled !== undefined) {
    config.fallbackSettings.autoRunEnabled = settings.autoRunEnabled;
  }

  if (settings.autoRunIntervalHours !== undefined) {
    if (settings.autoRunIntervalHours < 1 || settings.autoRunIntervalHours > 48) {
      return next(new AppError('Auto-run interval must be between 1 and 48 hours', 400));
    }
    config.fallbackSettings.autoRunIntervalHours = settings.autoRunIntervalHours;
  }

  if (settings.notifyAdminsForCritical !== undefined) {
    config.fallbackSettings.notifyAdminsForCritical = settings.notifyAdminsForCritical;
  }

  // Add to change history
  config.changeHistory.push({
    updatedBy: req.user._id,
    updatedAt: new Date(),
    changes: new Map(Object.entries({ fallbackSettings: settings })),
    reason
  });

  config.lastUpdatedBy = req.user._id;
  await config.save();

  // Log change
  await logDataCorrection(
    req.user,
    'SystemConfig',
    config._id,
    'Fallback settings updated',
    `${reason} | Settings: ${JSON.stringify(settings)}`,
    req
  );

  res.status(200).json({
    success: true,
    message: 'Fallback settings updated successfully',
    data: config.fallbackSettings
  });
});

/**
 * @route   PUT /api/config/points-settings
 * @desc    Update leaderboard points settings
 * @access  Private (Admin)
 */
export const updatePointsSettings = catchAsync(async (req, res, next) => {
  const { reason, ...settings } = req.body;

  if (!reason || reason.length < 10) {
    return next(new AppError('Update reason is required (minimum 10 characters)', 400));
  }

  const config = await SystemConfig.getConfig();

  // Validate and update settings
  const validSettings = ['perDonation', 'urgentBonus', 'criticalBonus', 'reviewBonus', 'firstDonationBonus'];

  Object.keys(settings).forEach(key => {
    if (validSettings.includes(key)) {
      config.pointsSettings[key] = settings[key];
    }
  });

  // Add to change history
  config.changeHistory.push({
    updatedBy: req.user._id,
    updatedAt: new Date(),
    changes: new Map(Object.entries({ pointsSettings: settings })),
    reason
  });

  config.lastUpdatedBy = req.user._id;
  await config.save();

  // Log change
  await logDataCorrection(
    req.user,
    'SystemConfig',
    config._id,
    'Points settings updated',
    `${reason} | Settings: ${JSON.stringify(settings)}`,
    req
  );

  res.status(200).json({
    success: true,
    message: 'Points settings updated successfully',
    data: config.pointsSettings
  });
});

/**
 * @route   PUT /api/config/maintenance-mode
 * @desc    Toggle maintenance mode
 * @access  Private (Admin)
 */
export const toggleMaintenanceMode = catchAsync(async (req, res, next) => {
  const { enabled, message, allowAdminAccess, reason } = req.body;

  if (!reason || reason.length < 10) {
    return next(new AppError('Reason is required (minimum 10 characters)', 400));
  }

  const config = await SystemConfig.getConfig();

  config.maintenanceMode.enabled = enabled !== undefined ? enabled : !config.maintenanceMode.enabled;

  if (message) {
    config.maintenanceMode.message = message;
  }

  if (allowAdminAccess !== undefined) {
    config.maintenanceMode.allowAdminAccess = allowAdminAccess;
  }

  // Add to change history
  config.changeHistory.push({
    updatedBy: req.user._id,
    updatedAt: new Date(),
    changes: new Map(Object.entries({
      maintenanceMode: {
        enabled: config.maintenanceMode.enabled,
        message: config.maintenanceMode.message
      }
    })),
    reason
  });

  config.lastUpdatedBy = req.user._id;
  await config.save();

  // Log change
  await logDataCorrection(
    req.user,
    'SystemConfig',
    config._id,
    `Maintenance mode ${config.maintenanceMode.enabled ? 'enabled' : 'disabled'}`,
    reason,
    req
  );

  res.status(200).json({
    success: true,
    message: `Maintenance mode ${config.maintenanceMode.enabled ? 'enabled' : 'disabled'}`,
    data: config.maintenanceMode
  });
});

/**
 * @route   GET /api/config/history
 * @desc    Get configuration change history
 * @access  Private (Admin)
 */
export const getChangeHistory = catchAsync(async (req, res) => {
  const config = await SystemConfig.getConfig();

  const history = await SystemConfig.findById(config._id)
    .populate('changeHistory.updatedBy', 'name email')
    .select('changeHistory');

  res.status(200).json({
    success: true,
    count: history.changeHistory.length,
    data: history.changeHistory
  });
});

/**
 * @route   GET /api/config/public
 * @desc    Get public configuration (non-sensitive settings)
 * @access  Public
 */
export const getPublicConfig = catchAsync(async (req, res) => {
  const config = await SystemConfig.getConfig();

  // Only return non-sensitive public settings
  const publicConfig = {
    donationCooldownDays: config.donationSettings.cooldownDays,
    minAge: config.donationSettings.minAge,
    maxAge: config.donationSettings.maxAge,
    defaultSearchRadius: config.matchingSettings.defaultSearchRadiusKm,
    maxSearchRadius: config.matchingSettings.maxSearchRadiusKm,
    maintenanceMode: config.maintenanceMode.enabled,
    maintenanceMessage: config.maintenanceMode.message
  };

  res.status(200).json({
    success: true,
    data: publicConfig
  });
});

export default {
  getConfig,
  updateConfig,
  updateDonationSettings,
  updateMatchingSettings,
  updateFallbackSettings,
  updatePointsSettings,
  toggleMaintenanceMode,
  getChangeHistory,
  getPublicConfig
};
