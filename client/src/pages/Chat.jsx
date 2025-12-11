import { motion } from 'framer-motion';
import { useDarkMode } from '../context/DarkModeContext';
import {
  MessageCircle, Send, Users, Zap, Shield, Clock,
  CheckCircle, Bell, Search, Image
} from 'lucide-react';

const Chat = () => {
  const { isDarkMode } = useDarkMode();

  const features = [
    {
      icon: Zap,
      title: 'Real-time Messaging',
      description: 'Instant communication with donors and recipients',
      color: '#eab308'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'End-to-end encrypted conversations',
      color: '#22c55e'
    },
    {
      icon: Users,
      title: 'Group Chats',
      description: 'Connect with multiple people at once',
      color: '#3b82f6'
    },
    {
      icon: Bell,
      title: 'Smart Notifications',
      description: 'Never miss an important message',
      color: '#dc2626'
    },
    {
      icon: Image,
      title: 'Media Sharing',
      description: 'Share images and documents easily',
      color: '#8b5cf6'
    },
    {
      icon: Search,
      title: 'Quick Search',
      description: 'Find messages and conversations instantly',
      color: '#06b6d4'
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: isDarkMode
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
        : 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)',
      padding: '2rem 1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        right: '10%',
        width: '300px',
        height: '300px',
        background: 'rgba(220, 38, 38, 0.05)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        animation: 'float 8s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '10%',
        width: '300px',
        height: '300px',
        background: 'rgba(239, 68, 68, 0.05)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        animation: 'float 10s ease-in-out infinite reverse'
      }} />

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(220, 38, 38, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(220, 38, 38, 0.5);
          }
        }

        @keyframes message-float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(2deg);
          }
        }
      `}</style>

      <div style={{ maxWidth: '1200px', width: '100%', position: 'relative', zIndex: 1 }}>
        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '4rem' }}
        >
          {/* Animated Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '120px',
              height: '120px',
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              borderRadius: '30px',
              marginBottom: '2rem',
              animation: 'pulse-glow 3s ease-in-out infinite',
              position: 'relative'
            }}
          >
            <MessageCircle
              style={{ width: '60px', height: '60px', color: 'white' }}
              fill="white"
            />

            {/* Floating mini messages */}
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                width: '30px',
                height: '30px',
                background: '#22c55e',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
              }}
            >
              <Send style={{ width: '16px', height: '16px', color: 'white' }} />
            </motion.div>
          </motion.div>

          <h1 style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '1rem'
          }}>
            Coming Soon
          </h1>

          <p style={{
            fontSize: '1.25rem',
            color: isDarkMode ? '#cbd5e1' : '#6b7280',
            marginBottom: '0.5rem',
            maxWidth: '600px',
            margin: '0 auto 2rem'
          }}>
            Real-time messaging feature is under development
          </p>

          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: isDarkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '50px',
              color: '#22c55e',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}
          >
            <Clock style={{ width: '16px', height: '16px' }} />
            In Development
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: isDarkMode ? '#f1f5f9' : '#111827',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            Upcoming Features
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
            marginBottom: '3rem'
          }}>
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                style={{
                  padding: '2rem',
                  background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(12px)',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  cursor: 'default',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: `linear-gradient(90deg, ${feature.color}, transparent)`
                }} />

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    padding: '0.75rem',
                    background: `${feature.color}15`,
                    borderRadius: '12px'
                  }}>
                    <feature.icon style={{ width: '24px', height: '24px', color: feature.color }} />
                  </div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    margin: 0
                  }}>
                    {feature.title}
                  </h3>
                </div>

                <p style={{
                  fontSize: '0.875rem',
                  color: isDarkMode ? '#cbd5e1' : '#6b7280',
                  lineHeight: '1.6',
                  margin: 0
                }}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          style={{
            padding: '2rem',
            background: isDarkMode
              ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(220, 38, 38, 0.05) 0%, rgba(254, 242, 242, 0.5) 100%)',
            border: isDarkMode ? '1px solid rgba(220, 38, 38, 0.2)' : '1px solid rgba(220, 38, 38, 0.2)',
            borderRadius: '16px',
            textAlign: 'center'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            <CheckCircle style={{ width: '24px', height: '24px', color: '#dc2626' }} />
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: isDarkMode ? '#f1f5f9' : '#111827',
              margin: 0
            }}>
              Stay Tuned!
            </h3>
          </div>
          <p style={{
            fontSize: '0.875rem',
            color: isDarkMode ? '#cbd5e1' : '#6b7280',
            margin: 0,
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            We're working hard to bring you a seamless messaging experience.
            Connect with donors and recipients in real-time, share important information,
            and coordinate blood donations more efficiently than ever before.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Chat;
