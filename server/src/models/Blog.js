import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Blog title is required'],
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  content: {
    type: String,
    required: [true, 'Blog content is required']
  },
  excerpt: {
    type: String,
    maxlength: 300
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  featuredImage: String,
  category: {
    type: String,
    enum: [
      'Education',
      'News',
      'Success Stories',
      'Health Tips',
      'Donation Guide',
      'Research',
      'Community',
      'Other'
    ],
    default: 'Other'
  },
  tags: [String],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  viewCount: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    createdAt: { type: Date, default: Date.now },
    isApproved: { type: Boolean, default: true }
  }],
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  }
}, {
  timestamps: true
});

// Indexes
blogSchema.index({ slug: 1 });
blogSchema.index({ author: 1 });
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ category: 1 });
blogSchema.index({ tags: 1 });

// Generate slug from title
blogSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Add timestamp to ensure uniqueness
    this.slug += `-${Date.now()}`;
  }

  // Set publishedAt when publishing
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
    this.isPublished = true;
  }

  next();
});

// Virtual for like count
blogSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
blogSchema.virtual('commentCount').get(function() {
  return this.comments.filter(c => c.isApproved).length;
});

// Method to toggle like
blogSchema.methods.toggleLike = function(userId) {
  const index = this.likes.indexOf(userId);

  if (index > -1) {
    this.likes.splice(index, 1);
  } else {
    this.likes.push(userId);
  }

  return this.save();
};

// Method to add comment
blogSchema.methods.addComment = function(userId, content) {
  this.comments.push({
    user: userId,
    content,
    createdAt: new Date()
  });

  return this.save();
};

// Method to increment view count
blogSchema.methods.incrementViews = function() {
  this.viewCount += 1;
  return this.save();
};

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;
