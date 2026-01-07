import express from 'express';
import {
  getAllAuditLogs,
  getAuditLogById,
  getAuditLogsByUser,
  getAuditLogsByTarget,
  getCriticalAuditLogs,
  getAuditStatistics,
  getMyAuditLogs,
  exportAuditLogs
} from '../controllers/auditController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { restrictTo } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// All audit routes require admin authentication
router.use(protect);
router.use(restrictTo('admin'));

// Get all audit logs with filtering
router.get('/', getAllAuditLogs);

// Get audit statistics
router.get('/statistics', getAuditStatistics);

// Get critical audit logs
router.get('/critical', getCriticalAuditLogs);

// Get current admin's own audit logs
router.get('/my-actions', getMyAuditLogs);

// Export audit logs
router.post('/export', exportAuditLogs);

// Get audit logs by specific user
router.get('/user/:userId', getAuditLogsByUser);

// Get audit logs for specific target
router.get('/target/:targetModel/:targetId', getAuditLogsByTarget);

// Get single audit log by ID
router.get('/:id', getAuditLogById);

export default router;
