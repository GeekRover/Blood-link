import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { blogAPI } from '../services/api';
import { useDarkMode } from '../context/DarkModeContext';
import {
  Plus, Edit2, Trash2, Search, Filter,
  Calendar, FileText, Tag, CheckCircle, Clock, AlertCircle, X, Eye
} from 'lucide-react';
import BlogEditor from '../components/Blog/BlogEditor';

const AdminBlogManager = () => {
  const { isDarkMode } = useDarkMode();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal states
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, blogId: null, title: '' });

  const categories = [
    'all',
    'Education',
    'News',
    'Success Stories',
    'Health Tips',
    'Donation Guide',
    'Research',
    'Community',
    'Other'
  ];

  const statuses = ['all', 'draft', 'published', 'archived'];

  useEffect(() => {
    fetchBlogs();
  }, [selectedStatus, selectedCategory]);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      // Always fetch all blogs regardless of status filter
      // Filtering will be done client-side
      const data = await blogAPI.getAll({ limit: 100 });
      setBlogs(data.data || []);
    } catch (error) {
      console.error('Failed to fetch blogs:', error);
      toast.error('Failed to load blogs', { icon: '❌' });
    } finally {
      setLoading(false);
    }
  };

  // Filter blogs based on search, category, and status
  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || blog.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || blog.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleCreateNew = () => {
    setEditingBlog(null);
    setEditorOpen(true);
  };

  const handleEdit = (blog) => {
    setEditingBlog(blog);
    setEditorOpen(true);
  };

  const handleEditorClose = () => {
    setEditorOpen(false);
    setEditingBlog(null);
    // Reset status filter to 'all' so user can see newly created/edited blog
    setSelectedStatus('all');
  };

  const handleDeleteClick = (blog) => {
    setDeleteModal({ show: true, blogId: blog._id, title: blog.title });
  };

  const handleConfirmDelete = async () => {
    const deletePromise = blogAPI.delete(deleteModal.blogId);

    toast.promise(
      deletePromise,
      {
        loading: 'Deleting blog...',
        success: 'Blog deleted successfully',
        error: (err) => `Failed to delete blog: ${err.message || 'Unknown error'}`,
      },
      {
        success: { icon: '✅', duration: 3000 },
        error: { icon: '❌', duration: 4000 },
      }
    );

    try {
      await deletePromise;
      setDeleteModal({ show: false, blogId: null, title: '' });
      fetchBlogs();
    } catch (error) {
      console.error('Failed to delete blog:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return {
          bg: isDarkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
          text: '#22c55e',
          border: '1px solid #22c55e'
        };
      case 'draft':
        return {
          bg: isDarkMode ? 'rgba(234, 179, 8, 0.1)' : 'rgba(234, 179, 8, 0.05)',
          text: '#eab308',
          border: '1px solid #eab308'
        };
      case 'archived':
        return {
          bg: isDarkMode ? 'rgba(107, 114, 128, 0.1)' : 'rgba(107, 114, 128, 0.05)',
          text: '#6b7280',
          border: '1px solid #6b7280'
        };
      default:
        return {
          bg: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
          text: '#3b82f6',
          border: '1px solid #3b82f6'
        };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-4 h-4" />;
      case 'draft':
        return <Clock className="w-4 h-4" />;
      case 'archived':
        return <X className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: isDarkMode
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
        : 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '2rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{
              padding: '0.75rem',
              background: 'rgba(220, 38, 38, 0.1)',
              borderRadius: '12px'
            }}>
              <FileText style={{ width: '24px', height: '24px', color: '#dc2626' }} />
            </div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: isDarkMode ? '#f1f5f9' : '#111827'
            }}>
              Blog <span style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>Management</span>
            </h1>
          </div>
          <p style={{
            color: isDarkMode ? '#cbd5e1' : '#6b7280',
            fontSize: '0.875rem'
          }}>
            Create, edit, and manage blog articles
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {[
            { label: 'Total Blogs', value: blogs.length, icon: FileText, color: '#3b82f6' },
            { label: 'Published', value: blogs.filter(b => b.status === 'published').length, icon: CheckCircle, color: '#22c55e' },
            { label: 'Drafts', value: blogs.filter(b => b.status === 'draft').length, icon: Clock, color: '#eab308' },
            { label: 'Archived', value: blogs.filter(b => b.status === 'archived').length, icon: X, color: '#6b7280' }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              style={{
                padding: '1.5rem',
                background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  padding: '0.75rem',
                  background: `${stat.color}20`,
                  borderRadius: '12px'
                }}>
                  <stat.icon style={{ width: '24px', height: '24px', color: stat.color }} />
                </div>
                <div>
                  <p style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#cbd5e1' : '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {stat.label}
                  </p>
                  <p style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    marginTop: '0.25rem'
                  }}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            alignItems: 'center',
            marginBottom: '2rem'
          }}
        >
          <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
            <Search style={{
              position: 'absolute',
              left: '0.75rem',
              top: '0.75rem',
              width: '20px',
              height: '20px',
              color: isDarkMode ? '#6b7280' : '#9ca3af'
            }} />
            <input
              type="text"
              placeholder="Search blogs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '2.5rem',
                paddingRight: '1rem',
                paddingTop: '0.75rem',
                paddingBottom: '0.75rem',
                background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                color: isDarkMode ? '#f1f5f9' : '#111827',
                borderRadius: '12px',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'all 0.2s'
              }}
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              color: isDarkMode ? '#f1f5f9' : '#111827',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              color: isDarkMode ? '#f1f5f9' : '#111827',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {statuses.map(stat => (
              <option key={stat} value={stat}>
                {stat === 'all' ? 'All Statuses' : stat.charAt(0).toUpperCase() + stat.slice(1)}
              </option>
            ))}
          </select>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreateNew}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
            }}
          >
            <Plus style={{ width: '1rem', height: '1rem' }} />
            New Blog
          </motion.button>
        </motion.div>

        {/* Blogs Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            padding: '1.5rem',
            background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            overflowX: 'auto'
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div style={{
                display: 'inline-block',
                width: '40px',
                height: '40px',
                border: `3px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                borderTopColor: '#dc2626',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280', marginTop: '1rem' }}>
                Loading blogs...
              </p>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div style={{
              padding: '3rem 1rem',
              textAlign: 'center'
            }}>
              <FileText style={{
                width: '48px',
                height: '48px',
                margin: '0 auto 1rem',
                color: isDarkMode ? '#475569' : '#cbd5e1'
              }} />
              <p style={{
                color: isDarkMode ? '#cbd5e1' : '#6b7280',
                fontSize: '1rem'
              }}>
                {blogs.length === 0 ? 'No blogs yet. Create your first blog!' : 'No blogs found matching filters'}
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{
                  borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)'
                }}>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#cbd5e1' : '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Title
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#cbd5e1' : '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Category
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#cbd5e1' : '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Status
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#cbd5e1' : '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Views
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#cbd5e1' : '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Date
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#cbd5e1' : '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredBlogs.map((blog, idx) => (
                    <motion.tr
                      key={blog._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{
                        borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <td style={{
                        padding: '1rem',
                        fontSize: '0.875rem',
                        color: isDarkMode ? '#f1f5f9' : '#111827'
                      }}>
                        <div>
                          <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                            {blog.title.length > 40 ? blog.title.slice(0, 40) + '...' : blog.title}
                          </p>
                          <p style={{
                            fontSize: '0.75rem',
                            color: isDarkMode ? '#6b7280' : '#9ca3af',
                            marginTop: '0.25rem'
                          }}>
                            {blog.excerpt ? (blog.excerpt.length > 50 ? blog.excerpt.slice(0, 50) + '...' : blog.excerpt) : 'No excerpt'}
                          </p>
                        </div>
                      </td>
                      <td style={{
                        padding: '1rem',
                        fontSize: '0.875rem'
                      }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.25rem 0.75rem',
                          background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                          color: '#3b82f6',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          <Tag style={{ width: '0.875rem', height: '0.875rem' }} />
                          {blog.category || 'Other'}
                        </span>
                      </td>
                      <td style={{
                        padding: '1rem',
                        fontSize: '0.875rem'
                      }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.25rem 0.75rem',
                          background: getStatusColor(blog.status).bg,
                          color: getStatusColor(blog.status).text,
                          border: getStatusColor(blog.status).border,
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          {getStatusIcon(blog.status)}
                          {blog.status.charAt(0).toUpperCase() + blog.status.slice(1)}
                        </span>
                      </td>
                      <td style={{
                        padding: '1rem',
                        fontSize: '0.875rem',
                        color: isDarkMode ? '#cbd5e1' : '#6b7280'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Eye style={{ width: '1rem', height: '1rem' }} />
                          {blog.viewCount || 0}
                        </div>
                      </td>
                      <td style={{
                        padding: '1rem',
                        fontSize: '0.875rem',
                        color: isDarkMode ? '#cbd5e1' : '#6b7280'
                      }}>
                        {blog.publishedAt ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar style={{ width: '1rem', height: '1rem' }} />
                            {new Date(blog.publishedAt).toLocaleDateString()}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem' }}>Not published</span>
                        )}
                      </td>
                      <td style={{
                        padding: '1rem',
                        textAlign: 'center'
                      }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEdit(blog)}
                            style={{
                              padding: '0.5rem',
                              background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                              color: '#3b82f6',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            title="Edit"
                          >
                            <Edit2 style={{ width: '1rem', height: '1rem' }} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteClick(blog)}
                            style={{
                              padding: '0.5rem',
                              background: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                              color: '#ef4444',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            title="Delete"
                          >
                            <Trash2 style={{ width: '1rem', height: '1rem' }} />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </motion.div>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>

      {/* Blog Editor Modal */}
      <AnimatePresence>
        {editorOpen && (
          <BlogEditor
            blog={editingBlog}
            onClose={handleEditorClose}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
              padding: '1rem'
            }}
            onClick={() => setDeleteModal({ show: false, blogId: null, title: '' })}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderRadius: '16px',
                padding: '1.5rem',
                maxWidth: '400px',
                width: '100%',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                boxShadow: '0 20px 25px rgba(0, 0, 0, 0.2)'
              }}
            >
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                color: isDarkMode ? '#f1f5f9' : '#111827'
              }}>
                Delete Blog?
              </h2>
              <p style={{
                marginBottom: '1.5rem',
                color: isDarkMode ? '#cbd5e1' : '#6b7280',
                fontSize: '0.875rem'
              }}>
                Are you sure you want to delete <strong>"{deleteModal.title}"</strong>? This action cannot be undone.
              </p>
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end'
              }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDeleteModal({ show: false, blogId: null, title: '' })}
                  style={{
                    padding: '0.75rem 1.25rem',
                    background: isDarkMode ? 'rgba(100, 116, 139, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                    color: isDarkMode ? '#cbd5e1' : '#6b7280',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s'
                  }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmDelete}
                  style={{
                    padding: '0.75rem 1.25rem',
                    background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                    transition: 'all 0.2s'
                  }}
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminBlogManager;
