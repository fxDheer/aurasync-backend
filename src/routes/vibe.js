/**
 * AuraSync — /api/vibe Routes
 * Core endpoint: /process-vibe
 */
const express = require('express');
const router = express.Router();
const { privacyFirst } = require('../middleware/privacyFirst');
const { optionalAuth } = require('../middleware/auth');
const { generateNudge, generateVibeScan } = require('../services/gemini');
const { logStressEvent, updateResilienceScore } = require('../services/supabase');
const logger = require('../utils/logger');

/**
 * POST /api/vibe/process-vibe
 * Takes interaction data → returns AI-generated nudge
 */
router.post('/process-vibe', optionalAuth, privacyFirst, async (req, res) => {
  try {
    const { stressState, typingCadence, scrollSpeed, appSwitchFreq, timeContext } = req.body;

    if (!stressState) {
      return res.status(400).json({ error: 'stressState is required' });
    }

    // Use ANONYMIZED body for AI — privacy first
    const nudge = await generateNudge({
      stressState,
      typingCadence: req.anonymizedBody.typingCadence || typingCadence,
      scrollSpeed: req.anonymizedBody.scrollSpeed || scrollSpeed,
      appSwitchFreq: req.anonymizedBody.appSwitchFreq || appSwitchFreq,
      timeContext: timeContext || `${new Date().getHours()}:${new Date().getMinutes()}`,
    });

    // Log stress event if user is authenticated
    if (req.userId) {
      await logStressEvent(req.userId, {
        stressLevel: getStressLevel(stressState),
        stressState, typingCadence, scrollSpeed, appSwitchFreq,
        interventionType: nudge.interventionType,
      });
      // Update resilience score based on state
      const scoreDelta = { CALM: 2, DRIFTING: 0, STRESSED: -1, SPIRALING: -3 };
      await updateResilienceScore(req.userId, scoreDelta[stressState] || 0);
    }

    res.json({
      success: true,
      nudge: nudge.nudge,
      interventionType: nudge.interventionType,
      urgency: nudge.urgency,
      stressState,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('process-vibe error:', error.message);
    res.status(500).json({ error: 'Failed to process vibe' });
  }
});

/**
 * POST /api/vibe/scan
 * The "hook" — immediate vibe scan on app open
 */
router.post('/scan', optionalAuth, privacyFirst, async (req, res) => {
  try {
    const scan = await generateVibeScan({
      recentState: req.body.recentState || 'returning',
      mood: req.body.mood,
      timeContext: req.body.timeContext || `${new Date().getHours()}:00`,
    });
    res.json({ success: true, ...scan, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('vibe-scan error:', error.message);
    res.json({
      success: true,
      greeting: "I see you. Let's take a breath together.",
      suggestedAction: 'breathe',
    });
  }
});

function getStressLevel(state) {
  const levels = { CALM: 1, DRIFTING: 3, STRESSED: 6, SPIRALING: 9 };
  return levels[state] || 5;
}

module.exports = router;
