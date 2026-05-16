/**
 * AuraSync — Weekly Report Dispatcher
 * This job runs once a week to generate and email reports to all users
 */
require('dotenv').config();
const { supabase, getWeeklyData, getStressTriggers } = require('../services/supabase');
const { generateWeeklyReport } = require('../services/gemini');
const { sendWeeklyReportEmail } = require('../services/email');
const logger = require('../utils/logger');

async function dispatchWeeklyReports() {
  logger.info('🚀 Starting Weekly Report Dispatcher...');

  try {
    // 1. Fetch all users from Supabase
    const { data: users, error } = await supabase
      .from('profiles')
      .select('user_id, display_name, subscription_tier, trial_start_date');

    if (error) throw error;

    for (const user of users) {
      try {
        // 2. Check if user is eligible (not past trial or is pro)
        const trialStart = new Date(user.trial_start_date);
        const daysSinceStart = Math.floor((Date.now() - trialStart) / (1000 * 60 * 60 * 24));
        
        if (daysSinceStart > 7 && user.subscription_tier === 'free') {
          logger.info(`Skipping report for user ${user.user_id} (trial expired)`);
          continue;
        }

        // 3. Fetch user email (from auth)
        const { data: authUser } = await supabase.auth.admin.getUserById(user.user_id);
        if (!authUser || !authUser.user.email) continue;

        // 4. Gather weekly data and triggers
        const weeklyData = await getWeeklyData(user.user_id);
        const triggers = await getStressTriggers(user.user_id);

        if (weeklyData.length === 0) {
          logger.info(`Not enough data for user ${user.user_id}`);
          continue;
        }

        // 5. Generate AI Report using Gemini
        const report = await generateWeeklyReport(weeklyData, triggers);

        // 6. Send Email
        await sendWeeklyReportEmail(authUser.user.email, { report, triggers });

        logger.info(`✅ Successfully dispatched report to ${authUser.user.email}`);
      } catch (err) {
        logger.error(`Failed to dispatch for user ${user.user_id}:`, err.message);
      }
    }

    logger.info('✨ All weekly reports processed.');
  } catch (error) {
    logger.error('Dispatcher critical error:', error.message);
  }
}

// If run directly
if (require.main === module) {
  dispatchWeeklyReports();
}

module.exports = { dispatchWeeklyReports };
