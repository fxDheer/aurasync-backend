/**
 * AuraSync — Authentication Middleware
 * Validates Supabase JWT tokens
 */
const { supabase } = require('../services/supabase');
const logger = require('../utils/logger');

async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Optional auth — doesn't block, but attaches user if valid
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        req.user = user;
        req.userId = user.id;
      }
    }
    next();
  } catch {
    next();
  }
}

module.exports = { authenticateUser, optionalAuth };
