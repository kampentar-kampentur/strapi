'use strict';

const { redact } = require('./redact');

const recentAlerts = new Map();
let alertCount = 0;
let windowStart = Date.now();
const MAX_PER_MIN = 20;
const DEDUP_MS = 60000;

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cleanContext(ctx) {
  if (!ctx || typeof ctx !== 'object') return null;
  const cleaned = { ...ctx };
  const ignores = ['pid', 'hostname', 'level', 'time', 'timestamp', 'isFrontendError', 'stack', 'splat', 'message', 'label'];
  ignores.forEach((k) => delete cleaned[k]);
  Object.getOwnPropertySymbols(cleaned).forEach((s) => delete cleaned[s]);
  return Object.keys(cleaned).length ? cleaned : null;
}

/**
 * Send an alert message to Telegram
 */
async function sendTelegramAlert({
  level = 'ERROR',
  message = '',
  stack = '',
  context = null,
  isFrontend = false,
  isCritical = false,
}) {
  const token = process.env.TELEGRAM_TOKEN || process.env.TG_TOKEN;
  const chatId = process.env.TELEGRAM_TO || process.env.TG_CHAT_ID;
  if (!token || !chatId || process.env.DISABLE_TELEGRAM_NOTIFICATIONS === 'true') {
    return false;
  }

  // Rate limiting & deduplication
  const now = Date.now();
  if (now - windowStart > 60000) {
    alertCount = 0;
    windowStart = now;
  }
  if (alertCount >= MAX_PER_MIN) return false;

  const dedupKey = `${level}:${message}:${(stack || '').slice(0, 80)}`;
  if (recentAlerts.get(dedupKey) && now - recentAlerts.get(dedupKey) < DEDUP_MS) {
    return false;
  }
  recentAlerts.set(dedupKey, now);
  alertCount++;

  // Build HTML text
  const icon = isCritical ? '🔥' : isFrontend ? '🌐' : '🚨';
  const header = isCritical ? 'CRITICAL CRASH' : isFrontend ? 'LANDING FRONTEND ERROR' : `${level.toUpperCase()} ALERT`;
  const env = process.env.NODE_ENV || 'development';
  const time = new Date().toISOString().replace('T', ' ').replace(/\..+/, '') + ' UTC';

  let html = `${icon} <b>[${escapeHtml(header)}]</b>\n\n`;
  html += `<b>Message:</b> ${escapeHtml(message || 'Unknown error')}\n`;
  html += `<b>Environment:</b> <code>${escapeHtml(env)}</code>\n`;
  html += `<b>Time:</b> <code>${escapeHtml(time)}</code>\n`;

  const cleanedCtx = cleanContext(redact(context));
  if (cleanedCtx) {
    const jsonStr = JSON.stringify(cleanedCtx, null, 2);
    const shortJson = jsonStr.length > 800 ? jsonStr.slice(0, 800) + '\n... [truncated]' : jsonStr;
    html += `\n📦 <b>Context:</b>\n<pre><code>${escapeHtml(shortJson)}</code></pre>\n`;
  }

  if (stack) {
    const raw = String(stack);
    const shortStack = raw.length > 2000 ? raw.slice(0, 2000) + '\n... [truncated to 2000 chars]' : raw;
    html += `\n⚠️ <b>Stack Trace:</b>\n<pre><code>${escapeHtml(shortStack)}</code></pre>`;
  }

  if (html.length > 4000) {
    html = html.slice(0, 3950) + '\n... [message truncated]</pre>';
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: html,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch (err) {
    process.stderr.write(`[TelegramAlert] Failed to dispatch: ${err.message}\n`);
    return false;
  }
}

module.exports = { sendTelegramAlert };
