// backend/src/routes/report.js
const express = require('express');
const router = express.Router();
const { getWeeklyReport } = require('../services/gemini');
const { supabase } = require('../services/supabase');

// GET /api/report/weekly?userId=xxx
router.get('/weekly', async (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  // Pull last 7 days of stress events for the user
  const { data, error } = await supabase
    .from('stress_events')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (error) return res.status(500).json({ error: error.message });

  // Build a concise prompt for Gemini
  const prompt = `Generate a friendly weekly resilience report for a user based on the following stress events (timestamp, state):\n${JSON.stringify(data)}. Summarize trends, give one actionable tip, and include an encouraging line.`;

  try {
    const report = await getWeeklyReport(prompt);
    res.json({ report });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;

// Update backend/src/index.js to mount this route (done in a separate call).
