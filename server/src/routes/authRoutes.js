import express from 'express';
import { register, login, getProfile, updateProfile, updatePassword, logout } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authLimiter, registerLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/register', registerLimiter, register);
router.post('/login', authLimiter, login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.post('/logout', protect, logout);

export default router;
