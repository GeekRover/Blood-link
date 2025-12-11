import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useDarkMode } from '../context/DarkModeContext';
import NotificationBell from './NotificationBell';
import {
  Heart, Home, Trophy, BookOpen, Calendar, LayoutDashboard,
  FileText, Search, MessageCircle, Shield, LogOut, Menu, X,
  Sun, Moon, ChevronDown
} from 'lucide-react';

const Navbar = () => {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuOpen && !event.target.closest('.modern-profile-dropdown')) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen]);

  const publicLinks = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/blog', icon: BookOpen, label: 'Blog' },
    { to: '/events', icon: Calendar, label: 'Events' },
  ];

  const authenticatedLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/requests', icon: FileText, label: 'Requests' },
    ...(user?.role === 'recipient' ? [{ to: '/search-donors', icon: Search, label: 'Find Donors' }] : []),
    { to: '/donations', icon: Heart, label: 'Donations' },
    { to: '/chat', icon: MessageCircle, label: 'Chat' },
    ...(isAdmin ? [{ to: '/admin', icon: Shield, label: 'Admin' }] : []),
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    setProfileMenuOpen(false);

    // Show loading toast
    const loadingToast = toast.loading('Logging out...');

    try {
      await logout();

      // Success toast
      toast.success('Logged out successfully. See you soon!', {
        id: loadingToast,
        icon: '🩸',
        duration: 2000,
      });

      // Navigate after logout completes
      navigate('/', { replace: true });
    } catch (error) {
      toast.error('Logout failed. Please try again.', {
        id: loadingToast,
        duration: 3000,
      });
    }
  };

  return (
    <>
      <motion.nav
        className={`modern-navbar ${scrolled ? 'scrolled' : ''}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="modern-navbar-container">
          {/* Logo */}
          <Link to="/" className="modern-logo">
            <motion.div
              className="modern-logo-icon"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Heart className="w-5 h-5" fill="currentColor" />
            </motion.div>
            <span className="modern-logo-text">BloodLink</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="modern-nav-center">
            {isAuthenticated ? (
              <>
                {authenticatedLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`modern-nav-link ${isActive(link.to) ? 'active' : ''}`}
                  >
                    <link.icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                ))}
              </>
            ) : (
              <>
                {publicLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`modern-nav-link ${isActive(link.to) ? 'active' : ''}`}
                  >
                    <link.icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                ))}
              </>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="modern-nav-actions">
            {/* Dark Mode Toggle */}
            <motion.button
              onClick={toggleDarkMode}
              className="modern-icon-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Toggle dark mode"
            >
              <AnimatePresence mode="wait">
                {isDarkMode ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {isAuthenticated ? (
              <>
                <NotificationBell />

                {/* Profile Dropdown */}
                <div className="modern-profile-dropdown">
                  <motion.button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="modern-profile-btn"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="modern-avatar">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="modern-profile-info">
                      <span className="modern-profile-name">{user?.name}</span>
                      <span className="modern-profile-role">{user?.role}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
                  </motion.button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {profileMenuOpen && (
                      <motion.div
                        className="modern-dropdown-menu"
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Link to="/profile" className="modern-dropdown-item">
                          <span>View Profile</span>
                        </Link>
                        <Link to="/profile/edit" className="modern-dropdown-item">
                          <span>Edit Profile</span>
                        </Link>
                        <div className="modern-dropdown-divider" />
                        <button onClick={handleLogout} className="modern-dropdown-item logout">
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="modern-btn modern-btn-ghost">
                  Login
                </Link>
                <Link to="/register" className="modern-btn modern-btn-primary">
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <motion.button
              className="modern-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90 }}
                    animate={{ rotate: 0 }}
                    exit={{ rotate: 90 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90 }}
                    animate={{ rotate: 0 }}
                    exit={{ rotate: -90 }}
                  >
                    <Menu className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="modern-mobile-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              className="modern-mobile-menu"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="modern-mobile-content">
                {/* Mobile Links */}
                <div className="modern-mobile-section">
                  {(isAuthenticated ? authenticatedLinks : publicLinks).map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`modern-mobile-link ${isActive(link.to) ? 'active' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <link.icon className="w-5 h-5" />
                      <span>{link.label}</span>
                    </Link>
                  ))}
                </div>

                {/* Mobile User Section */}
                {isAuthenticated ? (
                  <div className="modern-mobile-user">
                    <Link
                      to="/profile"
                      className="modern-mobile-profile"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="modern-avatar">
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="modern-profile-info">
                        <span className="modern-profile-name">{user?.name}</span>
                        <span className="modern-profile-role">{user?.role}</span>
                      </div>
                    </Link>
                    <button onClick={handleLogout} className="modern-mobile-logout">
                      <LogOut className="w-5 h-5" />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <div className="modern-mobile-auth">
                    <Link to="/login" className="modern-btn modern-btn-ghost" onClick={() => setMobileMenuOpen(false)}>
                      Login
                    </Link>
                    <Link to="/register" className="modern-btn modern-btn-primary" onClick={() => setMobileMenuOpen(false)}>
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
