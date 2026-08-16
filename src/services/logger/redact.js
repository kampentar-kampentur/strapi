'use strict';

const SENSITIVE_REGEX = /^(password|passwd|pass|phone|telephone|phoneNumber|phone_number|email|token|authToken|auth_token|secret|authorization|cookie|apiKey|api_key|access_token|refresh_token|creditCard|card_number)$/i;

/**
 * Recursively mask sensitive fields with [REDACTED]
 */
function redact(data, visited = new WeakSet()) {
  if (!data || typeof data !== 'object') return data;
  if (visited.has(data)) return '[CIRCULAR]';
  visited.add(data);

  if (Array.isArray(data)) {
    return data.map((item) => redact(item, visited));
  }

  if (data instanceof Error) {
    const errObj = {
      name: data.name,
      message: data.message,
      stack: data.stack,
      code: data.code,
      statusCode: data.statusCode || data.status,
      ...data,
    };
    return redact(errObj, visited);
  }

  const result = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_REGEX.test(key)) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redact(value, visited);
    } else {
      result[key] = value;
    }
  }
  return result;
}

module.exports = { redact };
