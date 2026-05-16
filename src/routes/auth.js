/**
 * AuraSync — Auth Routes
 * Handles user registration and login via Supabase
 */
const express = require('express');
const router = express.Router();
const { supabase, getOrCreateProfile } = require('../services/supabase');
const logger = require('../utils/logger');

/**
 * POST /api/auth/signup
 * Register a new user
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 1. Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName }
      }
    });

    if (error) throw error;

    if (data.user) {
      // 2. Initialize AuraSync profile
      await getOrCreateProfile(data.user.id, { displayName });
      
      res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email for verification.',
        user: { id: data.user.id, email: data.user.email }
      });
    } else {
      res.status(400).json({ error: 'Failed to create user' });
    }
  } catch (error) {
    console.error('CRITICAL SIGNUP ERROR:');
    console.dir(error);
    const status = error.status || 500;
    res.status(status).json({ 
      error: error.message || 'Signup failed', 
      code: error.code 
    });
  }
});

/**
 * POST /api/auth/login
 * Sign in existing user
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    res.json({
      success: true,
      session: data.session,
      user: data.user
    });
  } catch (error) {
    logger.error('Login error:', error.message);
    res.status(401).json({ error: error.message || 'Login failed' });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error.message);
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router;
