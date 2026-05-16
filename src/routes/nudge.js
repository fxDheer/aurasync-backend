/**
 * AuraSync — /api/nudge Routes
 * Variable reward notification system
 */
const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { logNudge } = require('../services/supabase');
const logger = require('../utils/logger');

// Variable reward nudge templates — never boring "time to meditate" messages
const VARIABLE_NUDGES = [
  { type: 'visual_reset', content: "I noticed you've been working hard. Here's a 10-second visual reset.", weight: 25 },
  { type: 'breathing', content: "Your pace has been intense. Try this: breathe in for 4, hold for 4, out for 6.", weight: 20 },
  { type: 'reframe', content: "Quick thought: What you're working on right now — will it matter in 5 years? If yes, you've got this.", weight: 15 },
  { type: 'micro_break', content: "You've earned this: look away from the screen for 20 seconds. Your eyes will thank you.", weight: 20 },
  { type: 'celebration', content: "Hey — you've maintained focus for a while. That takes real strength. I see you.", weight: 10 },
  { type: 'grounding', content: "Quick grounding check: feel your feet on the floor. Notice the temperature of the air. You're here.", weight: 10 },
];

function selectVariableNudge() {
  const totalWeight = VARIABLE_NUDGES.reduce((sum, n) => sum + n.weight, 0);
  let random = Math.random() * totalWeight;
  for (const nudge of VARIABLE_NUDGES) {
    random -= nudge.weight;
    if (random <= 0) return nudge;
  }
  return VARIABLE_NUDGES[0];
}

router.get('/variable', optionalAuth, async (req, res) => {
  try {
    const nudge = selectVariableNudge();
    if (req.userId) {
      logNudge(req.userId, { 
        type: nudge.type, 
        content: nudge.content, 
        stressState: req.query.state || 'UNKNOWN' 
      }).catch(err => logger.error('logNudge failed:', err));
    }
    res.json({ success: true, nudge: nudge.content, type: nudge.type, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('variable nudge route exception:', error);
    res.json({ success: true, nudge: "Take a breath. You're doing great.", type: 'breathing' });
  }
});

router.post('/feedback', optionalAuth, async (req, res) => {
  try {
    const { nudgeId, helpful } = req.body;
    // Could update nudge weights over time based on feedback
    res.json({ success: true, message: 'Thanks for the feedback' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

module.exports = router;
