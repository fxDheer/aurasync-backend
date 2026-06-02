const express = require('express');
const { Resend } = require('resend');
const router = express.Router();

const resend = new Resend('re_XBRy9u2V_9yZcCKxiZE63mTXUkRt4WdVj');

// RevenueCat Webhook Endpoint
router.post('/revenuecat', async (req, res) => {
  try {
    const event = req.body.event;
    
    // We only care about initial purchases or renewals that we want to welcome them for.
    // For a Welcome Email, INITIAL_PURCHASE is best.
    if (!event || event.type !== 'INITIAL_PURCHASE') {
      return res.status(200).json({ received: true, message: 'Event ignored' });
    }

    const email = event.app_user_id;

    // Check if it's actually an email format
    if (!email || !email.includes('@')) {
      console.log('Webhook received but app_user_id is not an email:', email);
      return res.status(200).json({ received: true, message: 'No valid email found' });
    }

    // Send the Welcome Email via Resend
    const { data, error } = await resend.emails.send({
      from: 'AuraSync <onboarding@resend.dev>', // Resend test domain
      to: email,
      subject: '✨ Welcome to AuraSync Plus!',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #0D1B2A; color: #ffffff; padding: 40px; border-radius: 12px;">
          <h1 style="color: #FFD700; text-align: center;">Welcome to AuraSync Plus!</h1>
          <p style="font-size: 16px; line-height: 1.5; color: #e0e0e0;">
            Thank you for upgrading! Your premium tools are now fully unlocked and ready to help you find your calm.
          </p>
          <div style="background-color: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 215, 0, 0.3); border-radius: 8px; padding: 20px; margin: 30px 0;">
            <h3 style="color: #FFD700; margin-top: 0;">What's Unlocked:</h3>
            <ul style="color: #e0e0e0; line-height: 1.6;">
              <li>Continuous AI Voice Guidance</li>
              <li>Deep Wearable Integration</li>
              <li>Advanced HRV & Resilience Analytics</li>
              <li>Unlimited Doomscroll Shield</li>
            </ul>
          </div>
          <p style="font-size: 16px; color: #e0e0e0; text-align: center;">
            Open the app and tap the blue orb to start your first premium scan.
          </p>
        </div>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error });
    }

    console.log('Welcome email sent successfully to:', email);
    res.status(200).json({ success: true, message: 'Email sent' });

  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
