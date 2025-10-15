const { getLeadData, getRecentLeads } = require('../services/facebook.js');
const { sendMessage } = require('../../../services/telegram-bot');

const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;

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
};