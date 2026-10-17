'use strict';

const logger = require('./services/logger');

let isCrashing = false;

async function handleFatalCrash(eventType, error) {
  if (isCrashing) return;
  isCrashing = true;

  const errorMessage = error instanceof Error ? error.message : String(error || 'Unknown fatal error');
  const errorStack = error instanceof Error ? error.stack : new Error(errorMessage).stack;

  // Log fatal error via logger
  logger.fatal(`[CRITICAL] Uncaught exception/rejection (${eventType}): ${errorMessage}`, {
    eventType,
    stack: errorStack,
  });

  // Send Critical Telegram Alert
  try {
    await logger.sendTelegramAlert({
      level: 'FATAL',
      message: `Fatal ${eventType}: ${errorMessage}`,
      stack: errorStack,
      context: {
        eventType,
        action: 'Backend process will terminate in 3s',
        pid: process.pid,
      },
      isCritical: true,
    });
  } catch (err) {
    process.stderr.write(`Failed to send crash alert to Telegram: ${err.message}\n`);
  }

  // Flush Cloudflare R2 logs
  try {
    await logger.flushR2();
  } catch (err) {
    // Ignore R2 flush errors during exit
  }

  // Grace period before process exit
  setTimeout(() => {
    process.exit(1);
  }, 3000);
}

// Global crash handlers
process.on('uncaughtException', (error) => {
  handleFatalCrash('uncaughtException', error);
});

process.on('unhandledRejection', (reason) => {
  handleFatalCrash('unhandledRejection', reason);
});

// Graceful shutdown listeners
const handleShutdown = async (signal) => {
  logger.info(`Received ${signal}. Flushing log buffers...`);
  try {
    await logger.flushR2();
  } catch (e) {}
  process.exit(0);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   */
  register({ strapi }) {
    strapi.server.use(async (ctx, next) => {
      await next();

      // Catch and alert on any /api/* error response (4xx/5xx, e.g. 400 ValidationError)
      if (
        ctx.status >= 400 &&
        ctx.request?.url?.startsWith('/api/') &&
        !ctx.request.url.startsWith('/api/log-error')
      ) {
        const errBody = ctx.body && typeof ctx.body === 'object' ? ctx.body.error || ctx.body : ctx.body;
        const errName = errBody?.name || 'HttpError';
        const errMsg = errBody?.message || `HTTP ${ctx.status} on ${ctx.request.method} ${ctx.request.url}`;

        logger.error(`[API ${ctx.status} ${errName}] ${ctx.request.method} ${ctx.request.url}: ${errMsg}`, {
          status: ctx.status,
          method: ctx.request.method,
          url: ctx.request.url,
          error: errBody,
          details: errBody?.details || null,
        });
      }
    });

    logger.info('Strapi application register phase completed');
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   */
  bootstrap(/*{ strapi }*/) {
    logger.info('Strapi application bootstrap phase completed');
  },
};
