import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import LiquidBackground from '../components/LiquidBackground';
import { BentoGrid, BentoGridItem } from '../components/BentoGrid';
import AnimatedCounter from '../components/AnimatedCounter';
import SparklesCore from '../components/SparklesCore';
import {
  Heart, Search, MessageCircle, Trophy, Bell, BarChart,
  Shield, Zap, Users, Target, ArrowRight, Sparkles
} from 'lucide-react';

const Home = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <Search className="w-12 h-12 text-red-600" />,
      title: 'Smart Donor Matching',
      description: 'Advanced AI-powered location-based search with blood type compatibility and availability tracking.',
    },
    {
      icon: <MessageCircle className="w-12 h-12 text-red-600" />,
      title: 'Real-time Communication',
      description: 'Instant chat with donors and recipients. Stay connected and coordinate donations seamlessly.',
    },
    {
      icon: <Trophy className="w-12 h-12 text-red-600" />,
      title: 'Gamified Leaderboard',
      description: 'Earn points, unlock badges, and compete with other donors. Make donating blood fun and rewarding.',
    },
    {
      icon: <Shield className="w-12 h-12 text-red-600" />,
      title: 'Digital Donation Cards',
      description: 'QR code verification system for secure and instant donation history access.',
    },
    {
      icon: <Bell className="w-12 h-12 text-red-600" />,
      title: 'Instant Notifications',
      description: 'Get real-time alerts when your blood type is urgently needed in your area.',
    },
    {
      icon: <BarChart className="w-12 h-12 text-red-600" />,
      title: 'Track Your Impact',
      description: 'Comprehensive analytics and insights on your donation history and lives saved.',
    },
  ];

  return (
    <div className="home-page-modern">
      {/* Liquid Background */}
      <LiquidBackground />

      {/* Hero Section */}
      <section className="hero-modern">
        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center relative z-10"
          >
            {/* Sparkles effect */}
            <div className="absolute inset-0 w-full h-full">
              <SparklesCore
                id="hero-sparkles"
                background="transparent"
                minSize={0.6}
                maxSize={1.4}
                particleDensity={50}
                className="w-full h-full"
                particleColor="#dc2626"
              />
            </div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-block mb-6"
            >
              <div className="hero-icon">
                <Heart className="w-20 h-20" fill="currentColor" />
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="hero-title"
            >
              Welcome to{' '}
              <span className="text-gradient-animated">BloodLink</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="hero-subtitle"
            >
              Connecting Blood Donors with Recipients to Save Lives
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="hero-description"
            >
              Join thousands of donors making a difference every day. Your blood can save up to three lives.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="hero-buttons"
            >
              {!isAuthenticated ? (
                <>
                  <Link to="/register">
                    <motion.button
                      className="btn-hero btn-primary-gradient"
                      whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(220, 38, 38, 0.4)' }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span>Get Started</span>
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </motion.button>
                  </Link>
                  <Link to="/search-donors">
                    <motion.button
                      className="btn-hero btn-secondary-glass "
                      whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Search className="w-5 h-5 mr-2 dark:text-white" />
                      <span className='dark:text-white'>Find Donors</span>
                    </motion.button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/dashboard">
                    <motion.button
                      className="btn-hero btn-primary-gradient"
                      whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(220, 38, 38, 0.4)' }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <BarChart className="w-5 h-5 mr-2" />
                      <span>Dashboard</span>
                    </motion.button>
                  </Link>
                  <Link to="/requests">
                    <motion.button
                      className="btn-hero btn-secondary-glass"
                      whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span>View Requests</span>
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </motion.button>
                  </Link>
                </>
              )}
            </motion.div>

            {/* Floating stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="hero-stats"
            >
              <div className="stat-item">
                <Users className="w-5 h-5 text-red-600" />
                <span className="stat-number">5K+</span>
                <span className="stat-label">Donors</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <Heart className="w-5 h-5 text-red-600" />
                <span className="stat-number">2.5K+</span>
                <span className="stat-label">Lives Saved</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <Zap className="w-5 h-5 text-red-600" />
                <span className="stat-number">10K+</span>
                <span className="stat-label">Units Donated</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="scroll-indicator"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="scroll-mouse"
          />
        </motion.div>
      </section>

      {/* Features Section - Why Choose BloodLink */}
      <section className="features-modern">
        <div className="container-modern">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="section-header"
          >
            <h2 className="section-title">
              Why Choose <span className="text-gradient">BloodLink</span>?
            </h2>
            <p className="section-subtitle">
              Cutting-edge technology meets life-saving compassion
            </p>
          </motion.div>

          <BentoGrid className="mt-12">
            {features.map((feature, index) => (
              <BentoGridItem
                key={index}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                index={index}
                className={
                  index === 0 || index === 3
                    ? 'md:col-span-2'
                    : 'md:col-span-1'
                }
              />
            ))}
          </BentoGrid>
        </div>
      </section>

      {/* Impact Section */}
      <section className="impact-modern">
        <div className="container-modern">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="section-header"
          >
            <h2 className="section-title">
              Our <span className="text-gradient">Impact</span>
            </h2>
            <p className="section-subtitle">
              Making a difference, one donation at a time
            </p>
          </motion.div>

          <div className="impact-grid">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="impact-card"
              whileHover={{ y: -10, boxShadow: '0 25px 50px rgba(220, 38, 38, 0.3)' }}
            >
              <div className="impact-icon">
                <Users className="w-10 h-10" />
              </div>
              <div className="impact-number">
                <AnimatedCounter value={5000} suffix="+" />
              </div>
              <div className="impact-label">Registered Donors</div>
              <div className="impact-description">Active community members</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="impact-card"
              whileHover={{ y: -10, boxShadow: '0 25px 50px rgba(220, 38, 38, 0.3)' }}
            >
              <div className="impact-icon">
                <Heart className="w-10 h-10" />
              </div>
              <div className="impact-number">
                <AnimatedCounter value={2500} suffix="+" />
              </div>
              <div className="impact-label">Lives Saved</div>
              <div className="impact-description">And counting every day</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="impact-card"
              whileHover={{ y: -10, boxShadow: '0 25px 50px rgba(220, 38, 38, 0.3)' }}
            >
              <div className="impact-icon">
                <Zap className="w-10 h-10" />
              </div>
              <div className="impact-number">
                <AnimatedCounter value={10000} suffix="+" />
              </div>
              <div className="impact-label">Blood Units Donated</div>
              <div className="impact-description">Making healthcare accessible</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="impact-card"
              whileHover={{ y: -10, boxShadow: '0 25px 50px rgba(220, 38, 38, 0.3)' }}
            >
              <div className="impact-icon">
                <Target className="w-10 h-10" />
              </div>
              <div className="impact-number">
                <AnimatedCounter value={50} suffix="+" />
              </div>
              <div className="impact-label">Blood Camps Organized</div>
              <div className="impact-description">Community outreach events</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-modern">
        <div className="container-modern">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="cta-card"
          >
            <div className="cta-sparkles">
              <SparklesCore
                id="cta-sparkles"
                background="transparent"
                minSize={0.4}
                maxSize={1}
                particleDensity={30}
                className="w-full h-full"
                particleColor="#ffffff"
              />
            </div>

            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="cta-icon"
            >
              <Sparkles className="w-16 h-16" />
            </motion.div>

            <h2 className="cta-title">Ready to Save Lives?</h2>
            <p className="cta-description">
              Join our community of heroes and make a lasting impact. Every donation counts!
            </p>

            {!isAuthenticated && (
              <Link to="/register">
                <motion.button
                  className="btn-cta"
                  whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(255, 255, 255, 0.3)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>Register Now</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </motion.button>
              </Link>
            )}

            {isAuthenticated && (
              <Link to="/dashboard">
                <motion.button
                  className="btn-cta"
                  whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(255, 255, 255, 0.3)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </motion.button>
              </Link>
            )}

            <div className="cta-benefits">
              <div className="benefit-item">
                <Shield className="w-5 h-5" />
                <span>100% Secure</span>
              </div>
              <div className="benefit-item">
                <Zap className="w-5 h-5" />
                <span>Instant Matching</span>
              </div>
              <div className="benefit-item">
                <Heart className="w-5 h-5" />
                <span>Save Lives</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
