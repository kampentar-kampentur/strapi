'use strict';

module.exports = {
  async logError(ctx) {
    try {
      const body = ctx.request.body || {};
      const {
        message = 'Unknown frontend error',
        stack = '',
        url = '',
        userAgent = '',
        errorInfo = null,
        source = 'landing-frontend',
        timestamp = new Date().toISOString(),
        ...rest
      } = body;

      const clientIp = ctx.request.ip || ctx.ip || ctx.headers['x-forwarded-for'] || 'unknown';

      const frontendContext = {
        source,
        url: url || ctx.headers['referer'] || '',
        userAgent: userAgent || ctx.headers['user-agent'] || '',
        clientIp,
        errorInfo,
        clientTimestamp: timestamp,
        ...rest,
      };

      // Log via strapi.log.error which automatically forwards to CentralizedLoggerTransport
      strapi.log.error(`[Frontend Error] ${message}`, {
        isFrontendError: true,
        source: 'landing-frontend',
        stack,
        ...frontendContext,
      });

      ctx.status = 200;
      ctx.body = { ok: true };
    } catch (err) {
      strapi.log.error('Failed to log frontend error payload:', err);
      ctx.status = 200;
      ctx.body = { ok: false, error: err.message };
    }
  },
};
