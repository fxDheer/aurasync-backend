// server.js - Express entry point for AuraSync backend
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const privacyFirst = require('./src/middleware/privacyFirst');
const auth = require('./src/middleware/auth');

const userRouter = require('./src/routes/user');
const nudgeRouter = require('./src/routes/nudge');
const authRouter = require('./src/routes/auth');
const vibeRouter = require('./src/routes/vibe');
const paymentRouter = require('./src/routes/payments');
const webhookRouter = require('./src/routes/webhooks');

const app = express();

// Basic security and parsing
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Apply privacy middleware globally for all incoming data
app.use(privacyFirst);

// Public routes
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/webhooks', webhookRouter);

// Protected routes – require auth middleware
app.use('/api/nudge', auth, nudgeRouter);
app.use('/api/vibe', auth, vibeRouter);
app.use('/api/payments', auth, paymentRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AuraSync backend listening on port ${PORT}`);
  console.log(`🌐 Accessible locally at http://localhost:${PORT}`);
});
