import express from 'express';
import {
  getDashboard,
  getAllUsers,
  verifyUser,
  rejectUser,
  deactivateUser,
  activateUser,
  getPendingVerifications,
  getAnalytics,
  deleteUser
} from '../controllers/adminController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/roleMiddleware.js';
import { adminLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// Protect all admin routes
router.use(protect);
router.use(isAdmin);
router.use(adminLimiter);

router.get('/dashboard', getDashboard);
router.get('/users', getAllUsers);
router.get('/verifications/pending', getPendingVerifications);
router.get('/analytics', getAnalytics);
router.put('/users/:userId/verify', verifyUser);
router.put('/users/:userId/reject', rejectUser);
router.put('/users/:userId/deactivate', deactivateUser);
router.put('/users/:userId/activate', activateUser);
router.delete('/users/:userId', deleteUser);

export default router;
