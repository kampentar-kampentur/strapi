const { getLeadData, getRecentLeads } = require('../services/facebook.js');
const { sendMessage } = require('../../../services/telegram-bot');

const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;
const ZAPIER_TOKEN = process.env.ZAPIER_TOKEN || 'your-zapier-token-here';

module.exports = {
  async verify(ctx) { /* ... (оставить без изменений) ... */ },

  async receive(ctx) {
    ctx.status = 200;

    try {
      const body = ctx.request.body;
      console.log('-------------------------')
      console.log('FACEBOOK WEBHOOK RECEIVED')
      console.log(JSON.stringify(body))
      console.log('-------------------------')

      if (body.object !== 'page') {
        strapi.log.warn('⚠️ Webhook received for non-page object:', body.object);
        return;
      }

      // Send notification to Telegram
      sendMessage('new facebook lead');

    } catch (err) {
      strapi.log.error('❌ Fatal Webhook Processing Error:', err);
    }
  },

  async zapierLead(ctx) {
    try {
      // Check Zapier token for authentication
      const providedToken = ctx.request.body.token || ctx.request.headers['x-zapier-token'];
      if (!providedToken || providedToken !== ZAPIER_TOKEN) {
        return ctx.forbidden('Invalid or missing Zapier token');
      }

      const leadData = ctx.request.body;

      // Extract lead information from Zapier payload
      const name = leadData.full_name || leadData.name || '';
      const phone = leadData.phone_number || leadData.phone || '';
      const email = leadData.email || '';
      const address = leadData.address || '';
      const zip = leadData.zip_code || leadData.zip || '';
      const inboxUrl = leadData.inbox_url || leadData.inboxUrl || '';
      const workizLeadUrl = leadData.workiz_lead_url || leadData.workizLeadUrl || '';

      // Send formatted message to Telegram
      sendMessage(
        `📢 <b>New Lead Received!</b>\n\n` +
        `👤 <b>Name:</b> ${name}\n` +
        `📞 <b>Phone:</b> ${phone}\n` +
        `📧 <b>Email:</b> ${email}\n` +
        `🏠 <b>Address:</b> ${address}\n` +
        `📍 <b>ZIP:</b> ${zip}\n` +
        (inboxUrl ? `📨 <b>Inbox URL:</b> <a href="${inboxUrl}">View in Inbox</a>\n` : '') +
        (workizLeadUrl ? `📍 <b>Workiz Lead URL:</b> <a href="${workizLeadUrl}">View in Workiz</a>\n` : '') +
        `� <b>Source:</b> Meta`,
        { parse_mode: 'HTML' }
      );

      ctx.send({
        ok: true,
        message: 'Lead notification sent to Telegram successfully.',
      });
    } catch (error) {
      strapi.log.error('Error processing Zapier lead:', error);
      ctx.internalServerError('An error occurred while processing the lead.', { error: error.message });
    }
  },
};