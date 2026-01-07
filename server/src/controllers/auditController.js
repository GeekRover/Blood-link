import AuditLog from '../models/AuditLog.js';
import { catchAsync, AppError } from '../middlewares/errorHandler.js';

/**
 * @route   GET /api/audit
 * @desc    Get all audit logs (admin only)
 * @access  Private (Admin)
 */
export const getAllAuditLogs = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    action,
    category,
    performedBy,
    targetModel,
    severity,
    startDate,
    endDate
  } = req.query;

  // Build query
  const query = {};

  if (action) query.action = action;
  if (category) query.actionCategory = category;
  if (performedBy) query.performedBy = performedBy;
  if (targetModel) query.targetModel = targetModel;
  if (severity) query.severity = severity;

  // Date range filter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const logs = await AuditLog.find(query)
    .populate('performedBy', 'name email role')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await AuditLog.countDocuments(query);

  res.status(200).json({
    success: true,
    count: logs.length,
    totalCount: count,
    totalPages: Math.ceil(count / limit),
    currentPage: parseInt(page),
    data: logs
  });
});

/**
 * @route   GET /api/audit/:id
 * @desc    Get single audit log
 * @access  Private (Admin)
 */
export const getAuditLogById = catchAsync(async (req, res, next) => {
  const log = await AuditLog.findById(req.params.id)
    .populate('performedBy', 'name email role phone address');

  if (!log) {
    return next(new AppError('Audit log not found', 404));
  }

  res.status(200).json({
    success: true,
    data: log
  });
});

/**
 * @route   GET /api/audit/user/:userId
 * @desc    Get audit logs by specific user
 * @access  Private (Admin)
 */
export const getAuditLogsByUser = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, action, category } = req.query;

  const logs = await AuditLog.getLogsByUser(req.params.userId, {
    page,
    limit,
    action,
    category
  });

  const count = await AuditLog.countDocuments({ performedBy: req.params.userId });

  res.status(200).json({
    success: true,
    count: logs.length,
    totalCount: count,
    totalPages: Math.ceil(count / limit),
    currentPage: parseInt(page),
    data: logs
  });
});

/**
 * @route   GET /api/audit/target/:targetModel/:targetId
 * @desc    Get audit logs for a specific target
 * @access  Private (Admin)
 */
export const getAuditLogsByTarget = catchAsync(async (req, res) => {
  const { targetModel, targetId } = req.params;

  const logs = await AuditLog.getLogsByTarget(targetModel, targetId);

  res.status(200).json({
    success: true,
    count: logs.length,
    data: logs
  });
});

/**
 * @route   GET /api/audit/critical
 * @desc    Get recent critical audit logs
 * @access  Private (Admin)
 */
export const getCriticalAuditLogs = catchAsync(async (req, res) => {
  const { days = 7 } = req.query;

  const logs = await AuditLog.getCriticalActions(parseInt(days));

  res.status(200).json({
    success: true,
    count: logs.length,
    data: logs
  });
});

/**
 * @route   GET /api/audit/statistics
 * @desc    Get audit log statistics
 * @access  Private (Admin)
 */
export const getAuditStatistics = catchAsync(async (req, res) => {
  const { days = 30 } = req.query;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

  // Total logs
  const totalLogs = await AuditLog.countDocuments({
    createdAt: { $gte: cutoffDate }
  });

  // Logs by category
  const logsByCategory = await AuditLog.aggregate([
    {
      $match: { createdAt: { $gte: cutoffDate } }
    },
    {
      $group: {
        _id: '$actionCategory',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  // Logs by action
  const logsByAction = await AuditLog.aggregate([
    {
      $match: { createdAt: { $gte: cutoffDate } }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 10
    }
  ]);

  // Logs by severity
  const logsBySeverity = await AuditLog.aggregate([
    {
      $match: { createdAt: { $gte: cutoffDate } }
    },
    {
      $group: {
        _id: '$severity',
        count: { $sum: 1 }
      }
    }
  ]);

  // Most active admins
  const mostActiveAdmins = await AuditLog.aggregate([
    {
      $match: { createdAt: { $gte: cutoffDate } }
    },
    {
      $group: {
        _id: '$performedBy',
        name: { $first: '$performerName' },
        email: { $first: '$performerEmail' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 10
    }
  ]);

  // Daily activity
  const dailyActivity = await AuditLog.aggregate([
    {
      $match: { createdAt: { $gte: cutoffDate } }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalLogs,
      period: `Last ${days} days`,
      logsByCategory,
      logsByAction,
      logsBySeverity,
      mostActiveAdmins,
      dailyActivity
    }
  });
});

/**
 * @route   GET /api/audit/my-actions
 * @desc    Get current admin's own audit logs
 * @access  Private (Admin)
 */
export const getMyAuditLogs = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const logs = await AuditLog.getLogsByUser(req.user._id, {
    page,
    limit
  });

  const count = await AuditLog.countDocuments({ performedBy: req.user._id });

  res.status(200).json({
    success: true,
    count: logs.length,
    totalCount: count,
    totalPages: Math.ceil(count / limit),
    currentPage: parseInt(page),
    data: logs
  });
});

/**
 * @route   POST /api/audit/export
 * @desc    Export audit logs to CSV/JSON
 * @access  Private (Admin)
 */
export const exportAuditLogs = catchAsync(async (req, res) => {
  const { format = 'json', startDate, endDate, ...filters } = req.body;

  // Build query
  const query = {};
  if (filters.action) query.action = filters.action;
  if (filters.category) query.actionCategory = filters.category;
  if (filters.performedBy) query.performedBy = filters.performedBy;
  if (filters.severity) query.severity = filters.severity;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const logs = await AuditLog.find(query)
    .populate('performedBy', 'name email role')
    .sort({ createdAt: -1 })
    .limit(10000); // Limit to 10k records for export

  if (format === 'json') {
    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } else {
    // CSV export would be implemented here
    // For now, return JSON
    res.status(200).json({
      success: true,
      message: 'CSV export not yet implemented',
      count: logs.length,
      data: logs
    });
  }
});

export default {
  getAllAuditLogs,
  getAuditLogById,
  getAuditLogsByUser,
  getAuditLogsByTarget,
  getCriticalAuditLogs,
  getAuditStatistics,
  getMyAuditLogs,
  exportAuditLogs
};
