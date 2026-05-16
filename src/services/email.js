/**
 * AuraSync — Email Service (Resend)
 * Sends premium weekly reports and intervention alerts
 */
const { Resend } = require('resend');
const logger = require('../utils/logger');

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

/**
 * Send the Weekly Resilience Report Email
 */
async function sendWeeklyReportEmail(email, reportData) {
  try {
    const { report, triggers } = reportData;

    const { data, error } = await resend.emails.send({
      from: 'AuraSync <reports@aurasync.app>',
      to: email,
      subject: `✨ Your Weekly Resilience Report: ${report.headline}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; color: #111;">
          <h1 style="color: #4FC3F7;">AuraSync ✨</h1>
          <h2 style="margin-bottom: 20px;">${report.headline}</h2>
          
          <div style="background: #f4f7f6; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <p style="font-size: 16px; line-height: 1.6;">${report.insight}</p>
          </div>

          <h3 style="color: #333;">💡 Growth Tip</h3>
          <p style="font-size: 16px; font-style: italic; color: #555;">${report.tip}</p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />

          <h3 style="color: #333;">📉 Patterns Detected</h3>
          <ul style="list-style: none; padding: 0;">
            ${triggers.map(t => `
              <li style="margin-bottom: 12px; padding: 10px; border-left: 4px solid #FFB74D; background: #fffcf5;">
                <strong>${t.day} at ${t.timeLabel}</strong><br/>
                <span style="font-size: 14px; color: #666;">${t.description}</span>
              </li>
            `).join('')}
          </ul>

          <div style="margin-top: 40px; text-align: center;">
            <a href="https://aurasync.app/dashboard" style="background: #4FC3F7; color: white; padding: 12px 24px; border-radius: 30px; text-decoration: none; font-weight: bold;">
              Open AuraSync
            </a>
          </div>

          <p style="margin-top: 40px; font-size: 12px; color: #999; text-align: center;">
            You received this because you're prioritizing your mental wellbeing with AuraSync.
            <br/>To manage your notifications, open the app settings.
          </p>
        </div>
      `,
    });

    if (error) throw error;
    logger.info(`Weekly report email sent to ${email}`);
    return data;
  } catch (error) {
    logger.error('Email send failed:', error.message);
    return null;
  }
}

module.exports = { sendWeeklyReportEmail };
