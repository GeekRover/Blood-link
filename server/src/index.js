import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import { initializeSocket } from './socket/socketHandler.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { apiLimiter } from './middlewares/rateLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import authRoutes from './routes/authRoutes.js';
import donorRoutes from './routes/donorRoutes.js';
import bloodRequestRoutes from './routes/bloodRequestRoutes.js';
import donationRoutes from './routes/donationRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import fallbackRoutes from './routes/fallbackRoutes.js';
import badgeRoutes from './routes/badgeRoutes.js';
import configRoutes from './routes/configRoutes.js';
import availabilityRoutes from './routes/availabilityRoutes.js';
import mapRoutes from './routes/mapRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const httpServer = createServer(app);

// Connect to MongoDB
connectDB();

// Initialize Socket.IO
export const io = initializeSocket(httpServer);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Disable CSP to allow image loading
})); // Security headers
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BloodLink API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/requests', bloodRequestRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/fallback', fallbackRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/config', configRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/analytics', analyticsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to BloodLink API',
    version: '1.0.0',
    docs: '/api/docs',
    health: '/health'
  });
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║     🩸 BloodLink API Server 🩸       ║
╠═══════════════════════════════════════╣
║  Environment: ${process.env.NODE_ENV || 'development'}
║  Port: ${PORT}
║  Database: Connected
║  Socket.IO: Enabled
╚═══════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  httpServer.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

export default app;

