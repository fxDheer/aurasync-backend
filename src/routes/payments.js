/**
 * AuraSync — Payment Routes (RevenueCat Webhook)
 * Handles subscription updates from App Store / Play Store
 */
const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabase');
const logger = require('../utils/logger');

/**
 * POST /api/payments/webhook
 * RevenueCat Webhook Listener
 * Updates user subscription status in Supabase
 */
router.post('/webhook', async (req, res) => {
  try {
    const { event } = req.body;
    
    // RevenueCat event types: INITIAL_PURCHASE, RENEWAL, CANCELLATION, etc.
    const eventType = event.type;
    const userId = event.app_user_id;
    const expirationDate = event.expiration_at_ms;

    logger.info(`Payment Webhook: Received ${eventType} for user ${userId}`);

    let tier = 'free';

    if (['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION'].includes(eventType)) {
      tier = 'pro';
    } else if (['CANCELLATION', 'EXPIRATION'].includes(eventType)) {
      tier = 'free';
    } else {
      // Ignore other events for now
      return res.status(200).json({ received: true });
    }

    // Update the profile in Supabase
    const { error } = await supabase
      .from('profiles')
      .update({ 
        subscription_tier: tier,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) throw error;

    res.status(200).json({ success: true, updatedTier: tier });
  } catch (error) {
    logger.error('Payment Webhook Error:', error.message);
    // RevenueCat will retry if we don't return 2xx
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
