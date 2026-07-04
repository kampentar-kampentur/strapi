'use strict';

/**
 * quiz-analytics controller
 */

module.exports = {
  async proxy(ctx) {
    const rawBaseUrl = process.env.TVPRO_CALCULATOR_API_URL || 'https://api.tvpro.com';
    const baseUrl = rawBaseUrl.replace(/\/+$/, '');
    const targetUrl = `${baseUrl}/api/quiz-analytics`;
    const body = ctx.request.body;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'tvpro_strapi_db45c09d464bf6f9e8ac8d1965e2ddc0388d0def42c31c39',
        },
        body: JSON.stringify(body),
        keepalive: true,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let responseData = null;
      try {
        responseData = await response.json();
      } catch (e) {
        // Response is not JSON or empty
      }

      ctx.status = response.status;
      ctx.body = responseData || { ok: response.ok };
    } catch (error) {
      strapi.log.error('Quiz analytics proxy error:', error);
      ctx.status = 500;
      ctx.body = { error: 'Failed to forward quiz analytics' };
    }
  },
};
