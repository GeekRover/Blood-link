import Blog from '../models/Blog.js';
import { catchAsync, AppError } from '../middlewares/errorHandler.js';

export const getBlogs = catchAsync(async (req, res) => {
  const { category, status = 'published', page = 1, limit = 10 } = req.query;

  const query = {};
  if (category) query.category = category;
  if (req.user?.role !== 'admin') query.status = 'published';
  else if (status) query.status = status;

  const blogs = await Blog.find(query)
    .populate('author', 'name profilePicture')
    .sort({ publishedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Blog.countDocuments(query);

  res.status(200).json({
    success: true,
    count: blogs.length,
    totalPages: Math.ceil(count / limit),
    data: blogs
  });
});

export const getBlogBySlug = catchAsync(async (req, res, next) => {
  const blog = await Blog.findOne({ slug: req.params.slug })
    .populate('author', 'name profilePicture')
    .populate('comments.user', 'name profilePicture');

  if (!blog) {
    return next(new AppError('Blog not found', 404));
  }

  await blog.incrementViews();

  res.status(200).json({ success: true, data: blog });
});

export const createBlog = catchAsync(async (req, res) => {
  const blog = await Blog.create({
    ...req.body,
    author: req.user._id
  });

  res.status(201).json({
    success: true,
    message: 'Blog created successfully',
    data: blog
  });
});

export const updateBlog = catchAsync(async (req, res, next) => {
  const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!blog) {
    return next(new AppError('Blog not found', 404));
  }

  res.status(200).json({ success: true, data: blog });
});

export const deleteBlog = catchAsync(async (req, res, next) => {
  const blog = await Blog.findByIdAndDelete(req.params.id);

  if (!blog) {
    return next(new AppError('Blog not found', 404));
  }

  res.status(200).json({ success: true, message: 'Blog deleted' });
});

export const likeBlog = catchAsync(async (req, res, next) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    return next(new AppError('Blog not found', 404));
  }

  await blog.toggleLike(req.user._id);

  res.status(200).json({ success: true, data: blog });
});

export const addComment = catchAsync(async (req, res, next) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    return next(new AppError('Blog not found', 404));
  }

  await blog.addComment(req.user._id, req.body.content);

  res.status(201).json({ success: true, data: blog });
});

export default { getBlogs, getBlogBySlug, createBlog, updateBlog, deleteBlog, likeBlog, addComment };
