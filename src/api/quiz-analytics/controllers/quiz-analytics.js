'use strict';

/**
 * quiz-analytics controller
 */

const ALLOWED_DATA_FIELDS = new Set([
  'sessionId',
  'eventType',
  'device',
  'url',
  'utmSource',
  'utmMedium',
  'utmCampaign',
  'utmTerm',
  'utmContent',
  'utmPosition',
  'utmMatchtype',
  'utmPlacement',
  'utmNetwork',
  'gadSource',
  'gclid',
  'gbraid',
  'wbraid',
  'additionalData',
  'stepId',
  'stepIndex',
  'fieldName',
  'fieldValue',
  'errorType',
  'lastStepIndex',
  'errorMessage',
]);

module.exports = {
  async proxy(ctx) {
    const rawBaseUrl = process.env.TVPRO_CALCULATOR_API_URL || 'https://api.tvpro.com';
    const baseUrl = rawBaseUrl.replace(/\/+$/, '');
    const targetUrl = `${baseUrl}/api/quiz-analytics`;
    const body = ctx.request.body;

    // Normalize payload: move any non-whitelisted fields from body.data into additionalData
    if (body && typeof body === 'object' && body.data && typeof body.data === 'object') {
      const data = body.data;
      let additionalData = data.additionalData && typeof data.additionalData === 'object'
        ? { ...data.additionalData }
        : {};

      for (const key of Object.keys(data)) {
        if (!ALLOWED_DATA_FIELDS.has(key)) {
          additionalData[key] = data[key];
          delete data[key];
        }
      }

      if (Object.keys(additionalData).length > 0) {
        data.additionalData = additionalData;
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.TVPRO_CALCULATOR_API_KEY || '',
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

