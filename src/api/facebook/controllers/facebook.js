const { getLeadData } = require('../services/facebook.js');

const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;

module.exports = {
  async verify(ctx) {
    const mode = ctx.query['hub.mode'];
    const token = ctx.query['hub.verify_token'];
    const challenge = ctx.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      strapi.log.info('✅ Facebook webhook verified');
      ctx.send(challenge);
    } else {
      strapi.log.warn('❌ Facebook webhook verification failed');
      ctx.status = 403;
      ctx.body = 'Forbidden';
    }
  },

  async receive(ctx) {
    try {
      const body = ctx.request.body;
      console.log('-------------------------')
      console.log('LEED')
      console.log(JSON.stringify(ctx.request.body))
      console.log('-------------------------')

      if (body.object !== 'page') {
        ctx.status = 404;
        return;
      }

      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'leadgen') {
            const leadgenId = change.value.leadgen_id;
            strapi.log.info(`📩 New Facebook Lead: ${leadgenId}`);

            const leadData = await getLeadData(leadgenId);
            console.log('leadData');
            console.log(JSON.stringify(leadData));
            
            
          }
        }
      }

      ctx.status = 200;
    } catch (err) {
      strapi.log.error('⚠️ Webhook Error:', err);
      ctx.status = 500;
    }
  },
};
