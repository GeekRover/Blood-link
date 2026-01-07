import express from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  updatePassword,
  logout,
  uploadHospitalID,
  getHospitalIDStatus
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authLimiter, registerLimiter } from '../middlewares/rateLimiter.js';
import { uploadHospitalID as uploadMiddleware, handleUploadError } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.post('/register', registerLimiter, register);
router.post('/login', authLimiter, login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.post('/logout', protect, logout);

// Hospital ID upload routes
router.post('/upload-hospital-id', protect, uploadMiddleware, handleUploadError, uploadHospitalID);
router.get('/hospital-id-status', protect, getHospitalIDStatus);

export default router;
