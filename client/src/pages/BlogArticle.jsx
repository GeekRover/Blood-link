import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { blogAPI } from '../services/api';
import { useDarkMode } from '../context/DarkModeContext';
import toast from 'react-hot-toast';
import { ArrowLeft, Calendar, Clock, Eye, Heart, MessageCircle, Share2 } from 'lucide-react';
import LiquidBackground from '../components/LiquidBackground';

const BlogArticle = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    fetchBlog();
  }, [slug]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const data = await blogAPI.getBySlug(slug);
      setBlog(data.data);
    } catch (error) {
      console.error('Failed to fetch blog:', error);
      toast.error('Blog not found', { icon: '❌' });
      navigate('/blog');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!blog) return;
    try {
      await blogAPI.like(blog._id);
      setLiked(!liked);
      toast.success(liked ? 'Removed from favorites' : 'Added to favorites', { icon: '❤️' });
    } catch (error) {
      toast.error('Failed to like blog', { icon: '❌' });
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: blog.title,
          text: blog.excerpt,
          url: url
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!', { icon: '📋' });
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: isDarkMode
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
          : 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <LiquidBackground />
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: `3px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            borderTopColor: '#dc2626',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{
            color: isDarkMode ? '#cbd5e1' : '#6b7280'
          }}>
            Loading article...
          </p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div style={{
        minHeight: '100vh',
        background: isDarkMode
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
          : 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)',
        padding: '2rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <LiquidBackground />
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            color: isDarkMode ? '#f1f5f9' : '#111827'
          }}>
            Article Not Found
          </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/blog')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Back to Blogs
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: isDarkMode
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
        : 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)',
      padding: '2rem 1rem'
    }}>
      <LiquidBackground />

      <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/blog')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '2rem',
            padding: '0.5rem 1rem',
            background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            color: isDarkMode ? '#cbd5e1' : '#6b7280',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <ArrowLeft style={{ width: '16px', height: '16px' }} />
          Back to Articles
        </motion.button>

        {/* Article Container */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            borderRadius: '16px',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* Featured Image */}
          {blog.featuredImage && (
            <div style={{
              width: '100%',
              height: '400px',
              overflow: 'hidden'
            }}>
              <motion.img
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6 }}
                src={blog.featuredImage}
                alt={blog.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
          )}

          {/* Content */}
          <div style={{ padding: '3rem 2rem' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
              {/* Category */}
              <span style={{
                display: 'inline-block',
                padding: '0.5rem 1rem',
                background: isDarkMode ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.05)',
                color: '#dc2626',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: '600',
                marginBottom: '1rem'
              }}>
                {blog.category || 'Article'}
              </span>

              {/* Title */}
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: isDarkMode ? '#f1f5f9' : '#111827',
                marginBottom: '1rem',
                lineHeight: '1.3'
              }}>
                {blog.title}
              </h1>

              {/* Meta Info */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '2rem',
                paddingBottom: '2rem',
                borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar style={{ width: '18px', height: '18px', color: '#dc2626' }} />
                  <span style={{
                    fontSize: '0.875rem',
                    color: isDarkMode ? '#cbd5e1' : '#6b7280'
                  }}>
                    {new Date(blog.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                {blog.readTime && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock style={{ width: '18px', height: '18px', color: '#dc2626' }} />
                    <span style={{
                      fontSize: '0.875rem',
                      color: isDarkMode ? '#cbd5e1' : '#6b7280'
                    }}>
                      {blog.readTime} min read
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Eye style={{ width: '18px', height: '18px', color: '#dc2626' }} />
                  <span style={{
                    fontSize: '0.875rem',
                    color: isDarkMode ? '#cbd5e1' : '#6b7280'
                  }}>
                    {blog.viewCount || 0} views
                  </span>
                </div>
              </div>
            </div>

            {/* Article Body */}
            <div style={{
              fontSize: '1rem',
              lineHeight: '1.8',
              color: isDarkMode ? '#e2e8f0' : '#374151',
              whiteSpace: 'pre-wrap',
              marginBottom: '2rem'
            }}>
              {blog.content}
            </div>

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                marginBottom: '2rem',
                paddingTop: '2rem',
                borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)'
              }}>
                {blog.tags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      display: 'inline-block',
                      padding: '0.4rem 0.8rem',
                      background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                      color: '#3b82f6',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              paddingTop: '2rem',
              borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)'
            }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLike}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  background: liked ? '#dc2626' : isDarkMode ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.05)',
                  color: '#dc2626',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s'
                }}
              >
                <Heart style={{
                  width: '18px',
                  height: '18px',
                  fill: liked ? 'currentColor' : 'none'
                }} />
                {liked ? 'Liked' : 'Like'}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShare}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                  color: '#3b82f6',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s'
                }}
              >
                <Share2 style={{ width: '18px', height: '18px' }} />
                Share
              </motion.button>
            </div>
          </div>
        </motion.article>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default BlogArticle;
