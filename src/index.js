/**
 * AuraSync Backend — Main Server Entry Point
 * Proactive Stress Companion API
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');

// Route imports
const vibeRoutes = require('./routes/vibe');
const userRoutes = require('./routes/user');
const nudgeRoutes = require('./routes/nudge');
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payments');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security Middleware ─────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate Limiting ───────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { error: 'Too many requests. Take a breath — AuraSync will be here.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ─── Body Parsing & Compression ──────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// ─── Logging ─────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// ─── Health Check ────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'alive',
    service: 'AuraSync API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── API Routes ──────────────────────────────────
app.use('/api/vibe', vibeRoutes);
app.use('/api/user', userRoutes);
app.use('/api/nudge', nudgeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
const reportRoutes = require('./routes/report');
app.use('/api/report', reportRoutes);

// ─── 404 Handler ─────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ────────────────────────
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
  res.status(500).json({
    error: 'Something went wrong',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ─── Start Server ────────────────────────────────
app.listen(PORT, () => {
  logger.info(`✨ AuraSync API running on port ${PORT}`);
  logger.info(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌐 Accessible on all interfaces (0.0.0.0)`);
});

module.exports = app;
