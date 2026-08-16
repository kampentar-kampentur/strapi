'use strict';

const { redact } = require('./redact');
const { sendTelegramAlert } = require('./telegram');
const { pushToR2, flushR2 } = require('./r2');

const isProd = process.env.NODE_ENV === 'production';
const LEVEL_NAMES = { 10: 'trace', 20: 'debug', 30: 'info', 40: 'warn', 50: 'error', 60: 'fatal' };
const LEVEL_COLORS = {
  trace: '\x1b[90m',
  debug: '\x1b[36m',
  info: '\x1b[32m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  fatal: '\x1b[35m',
  reset: '\x1b[0m',
};

function log(levelNum, msg, meta = {}) {
  const level = LEVEL_NAMES[levelNum] || 'info';
  const time = new Date().toISOString();
  const redactedMeta = redact(meta);

  let stack = null;
  if (meta instanceof Error) stack = meta.stack;
  else if (meta?.stack) stack = meta.stack;
  else if (meta?.error instanceof Error) stack = meta.error.stack;

  const entry = {
    level,
    time,
    msg: typeof msg === 'string' ? msg : JSON.stringify(redact(msg)),
    pid: process.pid,
    ...(typeof redactedMeta === 'object' && redactedMeta !== null ? redactedMeta : {}),
  };
  if (stack && !entry.stack) entry.stack = stack;

  // 1. Stdout Transport
  if (isProd) {
    process.stdout.write(JSON.stringify(entry) + '\n');
  } else {
    const color = LEVEL_COLORS[level] || LEVEL_COLORS.reset;
    const timeFormatted = time.replace('T', ' ').replace('Z', '');
    let line = `[${timeFormatted}] ${color}${level.toUpperCase().padEnd(5)}${LEVEL_COLORS.reset}: ${entry.msg}`;
    if (stack) line += `\n${stack}`;
    process.stdout.write(line + '\n');
  }

  // 2. Cloudflare R2 Transport
  pushToR2(entry);

  // 3. Telegram Error Transport (level >= 50: error, fatal)
  if (levelNum >= 50) {
    const isFrontend = !!(meta?.isFrontendError || meta?.source === 'landing-frontend' || meta?.source === 'client');
    sendTelegramAlert({
      level,
      message: entry.msg,
      stack,
      context: redactedMeta,
      isFrontend,
      isCritical: levelNum >= 60,
    }).catch(() => {});
  }
}

const logger = {
  trace: (msg, meta) => log(10, msg, meta),
  debug: (msg, meta) => log(20, msg, meta),
  info: (msg, meta) => log(30, msg, meta),
  warn: (msg, meta) => log(40, msg, meta),
  error: (msg, meta) => log(50, msg, meta),
  fatal: (msg, meta) => log(60, msg, meta),

  redact,
  sendTelegramAlert,
  flushR2,
};

module.exports = logger;
