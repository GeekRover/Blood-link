import express from 'express';
import { getBlogs, getBlogBySlug, createBlog, updateBlog, deleteBlog, likeBlog, addComment } from '../controllers/blogController.js';
import { protect, optionalAuth } from '../middlewares/authMiddleware.js';
import { restrictTo } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.get('/', optionalAuth, getBlogs);
router.get('/:slug', optionalAuth, getBlogBySlug);
router.post('/', protect, restrictTo('admin'), createBlog);
router.put('/:id', protect, restrictTo('admin'), updateBlog);
router.delete('/:id', protect, restrictTo('admin'), deleteBlog);
router.post('/:id/like', protect, likeBlog);
router.post('/:id/comments', protect, addComment);

export default router;
