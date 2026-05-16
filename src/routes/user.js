/**
 * AuraSync — /api/user Routes
 * Profile, triggers, weekly reports
 */
const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { getOrCreateProfile, getStressTriggers, getWeeklyData } = require('../services/supabase');
const { generateWeeklyReport } = require('../services/gemini');
const logger = require('../utils/logger');

router.get('/profile', optionalAuth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Auth required' });
    const profile = await getOrCreateProfile(req.userId);
    res.json({ success: true, profile });
  } catch (error) {
    logger.error('get profile error:', error.message);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

router.get('/triggers', optionalAuth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Auth required' });
    const triggers = await getStressTriggers(req.userId);
    res.json({ success: true, triggers });
  } catch (error) {
    logger.error('get triggers error:', error.message);
    res.status(500).json({ error: 'Failed to get triggers' });
  }
});

router.get('/weekly-report', optionalAuth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Auth required' });
    const profile = await getOrCreateProfile(req.userId);
    // Paywall check — free users only get reports for first 7 days
    const trialStart = new Date(profile.trial_start_date);
    const daysSinceStart = Math.floor((Date.now() - trialStart) / (1000*60*60*24));
    if (daysSinceStart > 7 && profile.subscription_tier === 'free') {
      return res.json({
        success: true, paywalled: true,
        preview: { headline: 'Your Weekly Resilience Report is ready' },
        message: 'Upgrade to Pro to see the full breakdown of your triggers and keep the Proactive Stress Shield active.',
      });
    }
    const weeklyData = await getWeeklyData(req.userId);
    const triggers = await getStressTriggers(req.userId);
    const report = await generateWeeklyReport(weeklyData, triggers);
    res.json({ success: true, paywalled: false, report, triggers });
  } catch (error) {
    logger.error('weekly report error:', error.message);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;
