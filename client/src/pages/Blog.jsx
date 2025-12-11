import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { blogAPI } from '../services/api';
import LiquidBackground from '../components/LiquidBackground';
import { BookOpen, Calendar, Tag, ArrowRight, Newspaper, Clock } from 'lucide-react';

const Blog = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const data = await blogAPI.getAll();
      setBlogs(data.data || []);
    } catch (error) {
      console.error('Failed to fetch blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LiquidBackground />
        <div className="relative z-10 text-center">
          <BookOpen className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
          <p className="text-xl text-gray-600 dark:text-gray-300 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page-modern">
      {/* Liquid Background */}
      <LiquidBackground />

      {/* Blog Posts Section */}
      <section className="features-modern" style={{ background: 'transparent', backdropFilter: 'none', paddingTop: '1rem' }}>
        <div className="container-modern">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="section-header"
          >
            <h2 className="section-title">
              Latest <span className="text-gradient">Articles</span>
            </h2>
            <p className="section-subtitle">
              Discover stories that inspire and inform
            </p>
          </motion.div>

          <div className="mt-12 flex flex-col gap-8 max-w-7xl mx-auto px-4">
            {blogs.map((blog, index) => (
              <motion.article
                key={blog._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group"
              >
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-900/50 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-xl" style={{ padding: '2.5rem' }}>
                  <div className="flex flex-col justify-between">
                    <div>
                      {/* Category Badge */}
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold mb-4" style={{ padding: '0.5rem 1rem' }}>
                        {blog.category || 'General'}
                      </span>

                      {/* Title */}
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                        {blog.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base leading-relaxed line-clamp-2 mb-6">
                        {blog.excerpt || 'Discover more about this topic and how it impacts the blood donation community...'}
                      </p>

                      {/* Meta Info */}
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-6">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(blog.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        {blog.readTime && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{blog.readTime} min read</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* CTA Button - Right Aligned */}
                    <div className="flex justify-end" style={{ paddingTop: '1rem' }}>
                      <button className="inline-flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-semibold text-sm hover:bg-red-100 dark:hover:bg-red-950/50 transition-all duration-300 group/btn" style={{ padding: '0.75rem 1.5rem' }}>
                        <span>Read More</span>
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          {/* Empty State */}
          {blogs.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center py-16"
            >
              <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Articles Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Check back soon for inspiring stories and updates!
              </p>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Blog;
