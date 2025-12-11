import express from 'express';
import { getReviews, createReview, updateReview, deleteReview, getAverageRating } from '../controllers/reviewController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getReviews);
router.post('/', protect, createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.get('/user/:userId/rating', protect, getAverageRating);

export default router;
