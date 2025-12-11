import express from 'express';
import { getLeaderboardRankings, getUserRank } from '../controllers/leaderboardController.js';
import { protect, optionalAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', optionalAuth, getLeaderboardRankings);
router.get('/:userId', protect, getUserRank);

export default router;
