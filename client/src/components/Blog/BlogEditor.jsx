import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { blogAPI } from '../../services/api';
import { useDarkMode } from '../../context/DarkModeContext';
import {
  X, Upload, Save, RotateCcw, Image as ImageIcon, AlertCircle
} from 'lucide-react';

const BlogEditor = ({ blog, onClose }) => {
  const { isDarkMode } = useDarkMode();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('content');

  // Form state
  const [formData, setFormData] = useState({
    title: blog?.title || '',
    content: blog?.content || '',
    excerpt: blog?.excerpt || '',
    category: blog?.category || 'Other',
    tags: blog?.tags?.join(', ') || '',
    featuredImage: blog?.featuredImage || '',
    status: blog?.status || 'draft',
    seo: {
      metaTitle: blog?.seo?.metaTitle || '',
      metaDescription: blog?.seo?.metaDescription || '',
      keywords: blog?.seo?.keywords?.join(', ') || ''
    }
  });

  const [imagePreview, setImagePreview] = useState(blog?.featuredImage || '');

  const categories = ['Education', 'News', 'Success Stories', 'Health Tips', 'Donation Guide', 'Research', 'Community', 'Other'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSeoChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      seo: {
        ...prev.seo,
        [name]: value
      }
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file', { icon: '❌' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB', { icon: '❌' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target.result;
      setImagePreview(imageData);
      setFormData(prev => ({
        ...prev,
        featuredImage: imageData
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required', { icon: '⚠️' });
      return;
    }

    if (!formData.content.trim()) {
      toast.error('Content is required', { icon: '⚠️' });
      return;
    }

    if (!formData.excerpt.trim()) {
      toast.error('Excerpt is required', { icon: '⚠️' });
      return;
    }

    if (formData.excerpt.length > 300) {
      toast.error('Excerpt must be 300 characters or less', { icon: '⚠️' });
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        excerpt: formData.excerpt.trim(),
        category: formData.category,
        tags: formData.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0),
        featuredImage: formData.featuredImage,
        status: formData.status,
        seo: {
          metaTitle: formData.seo.metaTitle.trim(),
          metaDescription: formData.seo.metaDescription.trim(),
          keywords: formData.seo.keywords
            .split(',')
            .map(kw => kw.trim())
            .filter(kw => kw.length > 0)
        }
      };

      let response;
      if (blog) {
        response = await blogAPI.update(blog._id, payload);
        toast.success('Blog updated successfully! ✨');
      } else {
        response = await blogAPI.create(payload);
        toast.success('Blog created successfully! ✨');
      }

      onClose();
    } catch (error) {
      console.error('Failed to save blog:', error);
      toast.error(`Failed to save blog: ${error.message || 'Unknown error'}`, { icon: '❌' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormData({
      title: blog?.title || '',
      content: blog?.content || '',
      excerpt: blog?.excerpt || '',
      category: blog?.category || 'Other',
      tags: blog?.tags?.join(', ') || '',
      featuredImage: blog?.featuredImage || '',
      status: blog?.status || 'draft',
      seo: {
        metaTitle: blog?.seo?.metaTitle || '',
        metaDescription: blog?.seo?.metaDescription || '',
        keywords: blog?.seo?.keywords?.join(', ') || ''
      }
    });
    setImagePreview(blog?.featuredImage || '');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
          boxShadow: '0 20px 25px rgba(0, 0, 0, 0.2)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(0, 0, 0, 0.02)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: isDarkMode ? '#f1f5f9' : '#111827'
          }}>
            {blog ? 'Edit Blog' : 'Create New Blog'}
          </h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            style={{
              padding: '0.5rem',
              background: 'none',
              border: 'none',
              color: isDarkMode ? '#9ca3af' : '#6b7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X style={{ width: '24px', height: '24px' }} />
          </motion.button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
          background: isDarkMode ? 'rgba(15, 23, 42, 0.3)' : 'rgba(0, 0, 0, 0.02)'
        }}>
          {[
            { id: 'content', label: 'Content' },
            { id: 'settings', label: 'Settings' },
            { id: 'seo', label: 'SEO' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '2px solid #dc2626' : 'none',
                color: activeTab === tab.id
                  ? '#dc2626'
                  : isDarkMode ? '#9ca3af' : '#6b7280',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem'
        }}>
          <AnimatePresence mode="wait">
            {/* Content Tab */}
            {activeTab === 'content' && (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
              >
                {/* Title */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: isDarkMode ? '#f1f5f9' : '#111827'
                  }}>
                    Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter blog title..."
                    maxLength={200}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(0, 0, 0, 0.02)',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '8px',
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                  />
                  <p style={{
                    fontSize: '0.75rem',
                    marginTop: '0.5rem',
                    color: isDarkMode ? '#6b7280' : '#9ca3af'
                  }}>
                    {formData.title.length}/200
                  </p>
                </div>

                {/* Featured Image */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: isDarkMode ? '#f1f5f9' : '#111827'
                  }}>
                    Featured Image
                  </label>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <label style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        padding: '2rem',
                        border: `2px dashed ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: isDarkMode ? 'rgba(15, 23, 42, 0.3)' : 'rgba(0, 0, 0, 0.01)',
                        transition: 'all 0.2s'
                      }}>
                        <ImageIcon style={{
                          width: '24px',
                          height: '24px',
                          color: isDarkMode ? '#6b7280' : '#9ca3af'
                        }} />
                        <span style={{
                          fontSize: '0.875rem',
                          color: isDarkMode ? '#cbd5e1' : '#6b7280'
                        }}>
                          Click to upload or drag & drop
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>

                    {imagePreview && (
                      <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)'
                      }}>
                        <img src={imagePreview} alt="Preview" style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Excerpt */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: isDarkMode ? '#f1f5f9' : '#111827'
                  }}>
                    Excerpt (Brief Summary)
                  </label>
                  <textarea
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleInputChange}
                    placeholder="Write a brief excerpt for your blog..."
                    maxLength={300}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(0, 0, 0, 0.02)',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '8px',
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      fontSize: '0.875rem',
                      outline: 'none',
                      resize: 'none',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s'
                    }}
                  />
                  <p style={{
                    fontSize: '0.75rem',
                    marginTop: '0.5rem',
                    color: isDarkMode ? '#6b7280' : '#9ca3af'
                  }}>
                    {formData.excerpt.length}/300
                  </p>
                </div>

                {/* Content */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: isDarkMode ? '#f1f5f9' : '#111827'
                  }}>
                    Content
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="Write your blog content here..."
                    rows={10}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(0, 0, 0, 0.02)',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '8px',
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      fontSize: '0.875rem',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'monospace',
                      transition: 'all 0.2s'
                    }}
                  />
                  <p style={{
                    fontSize: '0.75rem',
                    marginTop: '0.5rem',
                    color: isDarkMode ? '#6b7280' : '#9ca3af'
                  }}>
                    💡 Tip: You can use Markdown formatting
                  </p>
                </div>
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
              >
                {/* Category */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: isDarkMode ? '#f1f5f9' : '#111827'
                  }}>
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(0, 0, 0, 0.02)',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '8px',
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: isDarkMode ? '#f1f5f9' : '#111827'
                  }}>
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="blood donation, health, community..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(0, 0, 0, 0.02)',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '8px',
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                  />
                </div>

                {/* Status */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: isDarkMode ? '#f1f5f9' : '#111827'
                  }}>
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(0, 0, 0, 0.02)',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '8px',
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    <option value="draft">Draft (Private)</option>
                    <option value="published">Published (Visible to all)</option>
                    <option value="archived">Archived (Hidden)</option>
                  </select>
                  <p style={{
                    fontSize: '0.75rem',
                    marginTop: '0.5rem',
                    color: isDarkMode ? '#6b7280' : '#9ca3af'
                  }}>
                    {formData.status === 'draft' && '📝 Draft: Only admins can see this blog'}
                    {formData.status === 'published' && '✨ Published: Visible to all users'}
                    {formData.status === 'archived' && '📦 Archived: Hidden from all users'}
                  </p>
                </div>
              </motion.div>
            )}

            {/* SEO Tab */}
            {activeTab === 'seo' && (
              <motion.div
                key="seo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
              >
                <div style={{
                  padding: '1rem',
                  background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                  border: isDarkMode ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '8px'
                }}>
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <AlertCircle style={{ width: '16px', height: '16px' }} />
                    SEO metadata helps with search engine rankings and social sharing
                  </p>
                </div>

                {/* Meta Title */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: isDarkMode ? '#f1f5f9' : '#111827'
                  }}>
                    Meta Title
                  </label>
                  <input
                    type="text"
                    name="metaTitle"
                    value={formData.seo.metaTitle}
                    onChange={handleSeoChange}
                    placeholder="SEO title (appears in search results)"
                    maxLength={60}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(0, 0, 0, 0.02)',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '8px',
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                  />
                  <p style={{
                    fontSize: '0.75rem',
                    marginTop: '0.5rem',
                    color: isDarkMode ? '#6b7280' : '#9ca3af'
                  }}>
                    {formData.seo.metaTitle.length}/60
                  </p>
                </div>

                {/* Meta Description */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: isDarkMode ? '#f1f5f9' : '#111827'
                  }}>
                    Meta Description
                  </label>
                  <textarea
                    name="metaDescription"
                    value={formData.seo.metaDescription}
                    onChange={handleSeoChange}
                    placeholder="SEO description (appears below title in search results)"
                    maxLength={160}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(0, 0, 0, 0.02)',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '8px',
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      fontSize: '0.875rem',
                      outline: 'none',
                      resize: 'none',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s'
                    }}
                  />
                  <p style={{
                    fontSize: '0.75rem',
                    marginTop: '0.5rem',
                    color: isDarkMode ? '#6b7280' : '#9ca3af'
                  }}>
                    {formData.seo.metaDescription.length}/160
                  </p>
                </div>

                {/* Keywords */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: isDarkMode ? '#f1f5f9' : '#111827'
                  }}>
                    Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="keywords"
                    value={formData.seo.keywords}
                    onChange={handleSeoChange}
                    placeholder="blood donation, health tips, awareness..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(0, 0, 0, 0.02)',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '8px',
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1.5rem',
          borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
          background: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(0, 0, 0, 0.02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '0.75rem'
        }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleReset}
            disabled={saving}
            style={{
              padding: '0.75rem 1.25rem',
              background: isDarkMode ? 'rgba(100, 116, 139, 0.2)' : 'rgba(0, 0, 0, 0.05)',
              color: isDarkMode ? '#cbd5e1' : '#6b7280',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              opacity: saving ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
          >
            <RotateCcw style={{ width: '1rem', height: '1rem', display: 'inline', marginRight: '0.5rem' }} />
            Reset
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '0.75rem 1.25rem',
              background: isDarkMode ? 'rgba(100, 116, 139, 0.2)' : 'rgba(0, 0, 0, 0.05)',
              color: isDarkMode ? '#cbd5e1' : '#6b7280',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              opacity: saving ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              opacity: saving ? 0.7 : 1,
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Save style={{ width: '1rem', height: '1rem' }} />
            {saving ? 'Saving...' : 'Save Blog'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BlogEditor;
