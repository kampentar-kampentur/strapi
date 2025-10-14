const { getLeadData } = require('../services/facebook.js');

const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;

module.exports = {
  async verify(ctx) { /* ... (оставить без изменений) ... */ },

  async receive(ctx) {
    // 1. Установите статус 200 OK СРАЗУ, чтобы избежать повторной отправки Facebook
    ctx.status = 200; 

    try {
      const body = ctx.request.body;
      console.log('-------------------------')
      console.log('FACEBOOK WEBHOOK RECEIVED')
      console.log(JSON.stringify(body)) // Логирование тела запроса
      console.log('-------------------------')

      if (body.object !== 'page') {
        strapi.log.warn('⚠️ Webhook received for non-page object:', body.object);
        return; // Уже ответили 200, просто выходим
      }

      for (const entry of body.entry) {
        
        // 2. Условный перебор: только если entry.changes существует и является массивом
        if (entry.changes && Array.isArray(entry.changes)) {
          
          for (const change of entry.changes) {
            
            if (change.field === 'leadgen') {
              const leadgenId = change.value.leadgen_id;
              strapi.log.info(`📩 New Facebook Lead: ${leadgenId}`);

              // Асинхронная обработка лидов (лучше запускать ее отдельно)
              getLeadData(leadgenId)
                .then(leadData => {
                  console.log('leadData:', JSON.stringify(leadData));
                })
                .catch(err => {
                  strapi.log.error('❌ Error fetching lead data:', err);
                });
            } else {
                 strapi.log.info(`ℹ️ Received non-leadgen change: ${change.field}`);
            }
          }
        } else {
            // Здесь может быть marketing_message_delivery_failed или другие нестандартные
            strapi.log.warn('⚠️ Received webhook entry without standard changes array:', JSON.stringify(entry));
        }
      }

    } catch (err) {
      // Логгируем ошибку, но уже ответили 200, поэтому Facebook не видит 500
      strapi.log.error('❌ Fatal Webhook Processing Error:', err);
    }
  },
};