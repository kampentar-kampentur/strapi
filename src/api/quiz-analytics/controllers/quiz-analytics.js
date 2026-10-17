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

    const payloadStr = JSON.stringify(body);
    const maxAttempts = 2;
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        const response = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Connection': 'close',
            'x-api-key': process.env.TVPRO_CALCULATOR_API_KEY || '',
          },
          body: payloadStr,
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
        return;
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error;
        const code = error?.cause?.code || error?.code || '';
        const isTransient =
          code === 'ECONNRESET' ||
          code === 'ETIMEDOUT' ||
          code === 'EPIPE' ||
          code === 'UND_ERR_SOCKET' ||
          error?.message === 'fetch failed';

        if (!isTransient || attempt === maxAttempts) {
          break;
        }
      }
    }

    strapi.log.warn('Quiz analytics proxy transient failure after retry:', {
      message: lastError?.message,
      code: lastError?.cause?.code || lastError?.code,
    });
    ctx.status = 202;
    ctx.body = { ok: false, warning: 'Quiz analytics temporarily unavailable' };
  },
};

