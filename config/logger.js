'use strict';

const { winston } = require('@strapi/logger');
const customLogger = require('../src/services/logger');

/**
 * Custom Winston Transport to route all Strapi internal logs (strapi.log)
 * through our centralized logger with data redaction, Telegram alerts, and R2 shipping.
 */
class CentralizedLoggerTransport extends winston.Transport {
  constructor(options = {}) {
    super(options);
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    const { level, message, ...meta } = info;
    const levelStr = String(level || 'info').toLowerCase();

    if (levelStr.includes('error')) {
      customLogger.error(message, meta);
    } else if (levelStr.includes('warn')) {
      customLogger.warn(message, meta);
    } else if (levelStr.includes('debug')) {
      customLogger.debug(message, meta);
    } else if (levelStr.includes('silly') || levelStr.includes('verbose')) {
      customLogger.trace(message, meta);
    } else {
      customLogger.info(message, meta);
    }

    if (typeof callback === 'function') {
      callback();
    }
  }
}

module.exports = {
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  transports: [
    new CentralizedLoggerTransport(),
  ],
};
