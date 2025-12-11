import { getLeaderboard, getDonorRank } from '../services/leaderboardService.js';
import { catchAsync } from '../middlewares/errorHandler.js';

export const getLeaderboardRankings = catchAsync(async (req, res) => {
  const { period = 'all-time', limit = 100 } = req.query;

  const leaderboard = await getLeaderboard(period, parseInt(limit));

  res.status(200).json({
    success: true,
    data: leaderboard
  });
});

export const getUserRank = catchAsync(async (req, res) => {
  const { period = 'all-time' } = req.query;
  const userId = req.params.userId || req.user._id;

  const rank = await getDonorRank(userId, period);

  res.status(200).json({
    success: true,
    data: rank
  });
});

export default { getLeaderboardRankings, getUserRank };
