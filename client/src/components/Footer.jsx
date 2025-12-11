import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart, Mail, Phone, MapPin, Facebook, Twitter, Instagram,
  Linkedin, Github, ArrowUp, Send
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const Footer = () => {
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email) {
      toast.success('Thank you for subscribing! 🎉', {
        icon: '✅',
        duration: 3000,
      });
      setEmail('');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const footerLinks = {
    company: [
      { name: 'About Us', path: '/about' },
      { name: 'Our Mission', path: '/mission' },
      { name: 'How It Works', path: '/how-it-works' },
      { name: 'Success Stories', path: '/stories' },
    ],
    resources: [
      { name: 'Find Donors', path: '/search-donors' },
      { name: 'Blood Requests', path: '/requests' },
      { name: 'Leaderboard', path: '/leaderboard' },
      { name: 'Events', path: '/events' },
    ],
    support: [
      { name: 'Help Center', path: '/help' },
      { name: 'FAQ', path: '/faq' },
      { name: 'Contact Us', path: '/contact' },
      { name: 'Report Issue', path: '/report' },
    ],
    legal: [
      { name: 'Privacy Policy', path: '/privacy' },
      { name: 'Terms of Service', path: '/terms' },
      { name: 'Cookie Policy', path: '/cookies' },
      { name: 'GDPR', path: '/gdpr' },
    ],
  };

  const socialLinks = [
    { icon: Facebook, url: '#', label: 'Facebook', color: '#1877f2' },
    { icon: Twitter, url: '#', label: 'Twitter', color: '#1da1f2' },
    { icon: Instagram, url: '#', label: 'Instagram', color: '#e4405f' },
    { icon: Linkedin, url: '#', label: 'LinkedIn', color: '#0077b5' },
    { icon: Github, url: '#', label: 'GitHub', color: '#333' },
  ];

  return (
    <footer className="footer-modern">
      {/* Back to Top Button */}
      <motion.button
        className="back-to-top"
        onClick={scrollToTop}
        whileHover={{ scale: 1.1, y: -3 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <ArrowUp className="w-5 h-5" />
      </motion.button>

      <div className="footer-container">
        {/* Newsletter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="footer-newsletter"
        >
          <div className="newsletter-content">
            <div className="newsletter-text">
              <h3>Stay Updated</h3>
              <p>Get the latest updates on blood donation drives and community events.</p>
            </div>
            <form onSubmit={handleNewsletterSubmit} className="newsletter-form">
              <div className="input-group">
                <Mail className="input-icon" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <motion.button
                  type="submit"
                  className="newsletter-submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Send className="w-5 h-5" />
                  <span>Subscribe</span>
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Main Footer Content */}
        <div className="footer-main">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="footer-brand"
          >
            <Link to="/" className="footer-logo">
              <div className="logo-icon-footer">
                <Heart className="w-8 h-8" fill="currentColor" />
              </div>
              <span className="logo-text-footer">BloodLink</span>
            </Link>
            <p className="footer-tagline">
              Connecting donors with recipients to save lives, one donation at a time.
            </p>
            <div className="footer-contact">
              <div className="contact-item">
                <MapPin className="w-4 h-4" />
                <span>Dhaka, Bangladesh</span>
              </div>
              <div className="contact-item">
                <Phone className="w-4 h-4" />
                <span>+880 1234-567890</span>
              </div>
              <div className="contact-item">
                <Mail className="w-4 h-4" />
                <span>contact@bloodlink.com</span>
              </div>
            </div>
          </motion.div>

          {/* Links Sections */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="footer-links-section"
          >
            <h4>Company</h4>
            <ul>
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <Link to={link.path}>{link.name}</Link>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="footer-links-section"
          >
            <h4>Resources</h4>
            <ul>
              {footerLinks.resources.map((link, index) => (
                <li key={index}>
                  <Link to={link.path}>{link.name}</Link>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="footer-links-section"
          >
            <h4>Support</h4>
            <ul>
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <Link to={link.path}>{link.name}</Link>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="footer-links-section"
          >
            <h4>Legal</h4>
            <ul>
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <Link to={link.path}>{link.name}</Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="footer-bottom"
        >
          <div className="footer-bottom-content">
            <p className="copyright">
              &copy; {new Date().getFullYear()} BloodLink. All rights reserved.
            </p>
            <div className="social-links">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                  whileHover={{
                    scale: 1.2,
                    backgroundColor: social.color,
                    color: '#ffffff',
                  }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div className="footer-decoration">
        <div className="decoration-blob decoration-blob-1" />
        <div className="decoration-blob decoration-blob-2" />
      </div>
    </footer>
  );
};

export default Footer;
