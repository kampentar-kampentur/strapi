'use strict';

/**
 * visitor controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

const BOT_UA_REGEX =
  /googlebot|bingbot|yandexbot|duckduckbot|slurp|baiduspider|ahrefsbot|semrushbot|dotbot|mj12bot|rogerbot|exabot|facebot|facebookexternalhit|ia_archiver|lighthouse|chrome-lighthouse|speedinsights|headlesschrome|phantomjs|prerender|applebot|petalbot|bytespider|gptbot|claudebot|ccbot|twitterbot|linkedinbot|telegrambot|discordbot|whatsapp|uptimerobot|pingdom/i;

const MAX_TOUCHPOINTS = 25;
const MAX_PAGES_VISITED = 50;
const MAX_KEY_EVENTS = 100;

// Per-visitorId serialization queue to prevent race conditions when rapid beacons arrive
const visitorLocks = new Map();

async function withVisitorLock(visitorId, fn) {
  const prev = visitorLocks.get(visitorId) || Promise.resolve();
  const next = prev
    .catch(() => {})
    .then(() => fn())
    .finally(() => {
      if (visitorLocks.get(visitorId) === next) {
        visitorLocks.delete(visitorId);
      }
    });
  visitorLocks.set(visitorId, next);
  return next;
}

function parseBody(ctx) {
  let raw = ctx.request.body;
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  if (raw.data && typeof raw.data === 'object') {
    return raw.data;
  }
  return raw;
}

const ipGeoCache = new Map();

async function lookupGeoByIp(ip) {
  if (
    !ip ||
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('172.16.')
  ) {
    return null;
  }
  if (ipGeoCache.has(ip)) {
    return ipGeoCache.get(ip);
  }

  // 1. Primary: ip-api.com
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,region,city`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (data && data.status === 'success') {
        const result = {
          ipCity: data.city || null,
          ipRegion: data.region || null,
          ipCountry: data.country || null,
        };
        ipGeoCache.set(ip, result);
        return result;
      }
    }
  } catch (err) {
    // Fall through to secondary provider
  }

  // 2. Secondary: ipwho.is (HTTPS, free, reliable)
  try {
    const controller2 = new AbortController();
    const timer2 = setTimeout(() => controller2.abort(), 2000);
    const res2 = await fetch(
      `https://ipwho.is/${encodeURIComponent(ip)}`,
      { signal: controller2.signal }
    );
    clearTimeout(timer2);
    if (res2.ok) {
      const data2 = await res2.json();
      if (data2 && data2.success) {
        const result = {
          ipCity: data2.city || null,
          ipRegion: data2.region_code || data2.region || null,
          ipCountry: data2.country_code || data2.country || null,
        };
        ipGeoCache.set(ip, result);
        return result;
      }
    }
  } catch (err2) {
    // Graceful fallback if both fail
  }

  return null;
}

async function extractClientGeo(ctx, payload = {}) {
  const headers = ctx.request?.headers || {};
  const forwarded = headers['x-forwarded-for'];
  const firstForwardedIp =
    typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '';

  const ip =
    headers['cf-connecting-ip'] ||
    headers['x-real-ip'] ||
    firstForwardedIp ||
    ctx.request?.ip ||
    '';

  let geoSource = 'none';

  // 1. Direct Cloudflare / Vercel proxy headers
  let ipCity = headers['cf-ipcity'] || headers['x-vercel-ip-city'] || '';
  let ipRegion =
    headers['cf-ipregion'] ||
    headers['cf-region-code'] ||
    headers['x-vercel-ip-country-region'] ||
    '';
  let ipCountry =
    headers['cf-ipcountry'] || headers['x-vercel-ip-country'] || '';
  if (ipCity || ipCountry) {
    geoSource = 'proxy_header';
  }

  // 2. Client-side Cloudflare Geo (__GEO_CITY__) sent in payload
  const clientGeo =
    payload.geo || payload.clientGeo || payload.device?.geo || {};
  if (!ipCity && clientGeo.city) {
    ipCity = clientGeo.city;
    geoSource = clientGeo.source || 'cf_edge';
  }
  if (!ipRegion && (clientGeo.region || clientGeo.state)) {
    ipRegion = clientGeo.region || clientGeo.state;
    if (geoSource === 'none') geoSource = clientGeo.source || 'cf_edge';
  }
  if (!ipCountry && clientGeo.country) {
    ipCountry = clientGeo.country;
    if (geoSource === 'none') geoSource = clientGeo.source || 'cf_edge';
  }

  // 3. Server-side IP lookup fallback if headers & clientGeo are empty or missing fields
  if ((!ipCity || !ipRegion || !ipCountry) && ip) {
    const lookup = await lookupGeoByIp(ip);
    if (lookup) {
      if (!ipCity && lookup.ipCity) {
        ipCity = lookup.ipCity;
        geoSource = 'server_geoip';
      }
      if (!ipRegion && lookup.ipRegion) {
        ipRegion = lookup.ipRegion;
        if (geoSource === 'none') geoSource = 'server_geoip';
      }
      if (!ipCountry && lookup.ipCountry) {
        ipCountry = lookup.ipCountry;
        if (geoSource === 'none') geoSource = 'server_geoip';
      }
    }
  }

  return { ip, ipCity, ipRegion, ipCountry, geoSource };
}

function detectBrowserApp(userAgent = '') {
  if (!userAgent) return 'Unknown';
  if (/Instagram/i.test(userAgent)) return 'Instagram In-App';
  if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(userAgent)) return 'Facebook In-App';
  if (/TikTok|musical_ly|BytedanceWebview/i.test(userAgent)) return 'TikTok In-App';
  if (/LinkedInApp/i.test(userAgent)) return 'LinkedIn In-App';
  if (/Snap/i.test(userAgent)) return 'Snapchat In-App';
  if (/GSA\//i.test(userAgent)) return 'Google App In-App';
  if (/CriOS/i.test(userAgent)) return 'Chrome iOS';
  if (/FxiOS/i.test(userAgent)) return 'Firefox iOS';
  if (/EdgiOS|EdgA|Edg\//i.test(userAgent)) return 'Edge';
  if (/OPR\/|Opera/i.test(userAgent)) return 'Opera';
  if (/Chrome\//i.test(userAgent) && !/Chromium/i.test(userAgent)) {
    return /Mobile|Android/i.test(userAgent) ? 'Chrome Mobile' : 'Chrome Desktop';
  }
  if (/Safari\//i.test(userAgent) && !/Chrome/i.test(userAgent)) {
    return /iPhone|iPad|iPod/i.test(userAgent) ? 'Safari iOS' : 'Safari macOS';
  }
  if (/Firefox\//i.test(userAgent)) return 'Firefox';
  return 'Other Browser';
}

function computeConversionPath(touchpoints) {
  if (!Array.isArray(touchpoints) || touchpoints.length === 0) return '';
  const sources = [];
  for (const tp of touchpoints) {
    const src = tp?.source;
    if (src && sources[sources.length - 1] !== src) {
      sources.push(src);
    }
  }
  return sources.join(' → ');
}

module.exports = createCoreController('api::visitor.visitor', ({ strapi }) => ({
  async sync(ctx) {
    try {
      const payload = parseBody(ctx);
      const visitorId =
        typeof payload.visitorId === 'string' ? payload.visitorId.trim() : '';

      if (!visitorId || !visitorId.startsWith('tvp_')) {
        ctx.status = 400;
        ctx.body = { ok: false, error: 'Invalid or missing visitorId' };
        return;
      }

      const userAgent =
        payload.userAgent ||
        payload.device?.userAgent ||
        ctx.request?.headers?.['user-agent'] ||
        '';

      // Ignore bots & crawlers
      if (
        BOT_UA_REGEX.test(userAgent) ||
        payload.device?.webdriver === true
      ) {
        ctx.status = 200;
        ctx.body = { ok: true, skipped: 'bot' };
        return;
      }

      const geo = await extractClientGeo(ctx, payload);
      const browserApp =
        payload.device?.browserApp || detectBrowserApp(userAgent);
      const now = new Date();

      await withVisitorLock(visitorId, async () => {
        const existing = await strapi.db
          .query('api::visitor.visitor')
          .findOne({ where: { visitorId } });

        const incomingParams = payload.queryParams || payload.params || {};
        const incomingCookies = payload.cookies || {};
        const incomingTouchpoint = payload.touchpoint || null;
        const incomingEvents = Array.isArray(payload.events)
          ? payload.events
          : payload.event
          ? [payload.event]
          : [];
        const currentPage = payload.path || payload.page || '';

        if (!existing) {
          // Build initial arrays
          const touchpoints = [];
          if (incomingTouchpoint && typeof incomingTouchpoint === 'object') {
            touchpoints.push({
              step: 1,
              timestamp: incomingTouchpoint.timestamp || now.toISOString(),
              source: incomingTouchpoint.source || payload.source || 'direct',
              url: incomingTouchpoint.url || payload.url || '',
              path: incomingTouchpoint.path || currentPage || '/',
              referrer: incomingTouchpoint.referrer || payload.referrer || '',
              browserApp,
              params: incomingTouchpoint.params || incomingParams || {},
            });
          } else if (payload.url || currentPage) {
            touchpoints.push({
              step: 1,
              timestamp: now.toISOString(),
              source: payload.source || 'direct',
              url: payload.url || '',
              path: currentPage || '/',
              referrer: payload.referrer || '',
              browserApp,
              params: incomingParams || {},
            });
          }

          const pagesVisited = currentPage ? [currentPage] : [];
          const keyEvents = incomingEvents.slice(-MAX_KEY_EVENTS);
          const firstSource =
            touchpoints[0]?.source || payload.source || 'direct';
          const conversionPath =
            computeConversionPath(touchpoints) || firstSource;

          const createData = {
            visitorId,
            firstSource,
            lastSource: firstSource,
            conversionPath,
            visitsCount: touchpoints.length || 1,
            eventsCount: keyEvents.length,
            hasLead: false,
            firstLandingPage: currentPage || '/',
            lastPage: currentPage || '/',
            firstReferrer: payload.referrer || '',
            fbclid: incomingParams.fbclid || payload.fbclid || null,
            gclid: incomingParams.gclid || payload.gclid || null,
            gbraid: incomingParams.gbraid || payload.gbraid || null,
            wbraid: incomingParams.wbraid || payload.wbraid || null,
            msclkid: incomingParams.msclkid || payload.msclkid || null,
            utm_source: incomingParams.utm_source || payload.utm_source || null,
            utm_medium: incomingParams.utm_medium || payload.utm_medium || null,
            utm_campaign:
              incomingParams.utm_campaign || payload.utm_campaign || null,
            utm_content:
              incomingParams.utm_content || payload.utm_content || null,
            utm_term: incomingParams.utm_term || payload.utm_term || null,
            clarityId:
              incomingCookies.clarityId || payload.clarityId || null,
            _fbp: incomingCookies._fbp || payload._fbp || null,
            _fbc: incomingCookies._fbc || payload._fbc || null,
            _ga: incomingCookies._ga || payload._ga || null,
            _gcl_au: incomingCookies._gcl_au || payload._gcl_au || null,
            ip: geo.ip || null,
            ipCity: geo.ipCity || null,
            ipRegion: geo.ipRegion || null,
            ipCountry: geo.ipCountry || null,
            geoSource: geo.geoSource || null,
            browserApp,
            userAgent: userAgent || null,
            device: payload.device || {},
            touchpoints,
            pagesVisited,
            keyEvents,
            firstSeenAt: now,
            lastSeenAt: now,
          };

          await strapi.db.query('api::visitor.visitor').create({
            data: createData,
          });
        } else {
          // Merge into existing visitor
          const touchpoints = Array.isArray(existing.touchpoints)
            ? [...existing.touchpoints]
            : [];

          if (incomingTouchpoint && typeof incomingTouchpoint === 'object') {
            const lastTp = touchpoints[touchpoints.length - 1];
            const isDuplicate =
              lastTp &&
              lastTp.url === incomingTouchpoint.url &&
              lastTp.sessionId &&
              incomingTouchpoint.sessionId &&
              lastTp.sessionId === incomingTouchpoint.sessionId;

            if (!isDuplicate) {
              touchpoints.push({
                step: touchpoints.length + 1,
                sessionId: incomingTouchpoint.sessionId || undefined,
                timestamp: incomingTouchpoint.timestamp || now.toISOString(),
                source: incomingTouchpoint.source || payload.source || 'direct',
                url: incomingTouchpoint.url || payload.url || '',
                path: incomingTouchpoint.path || currentPage || '/',
                referrer: incomingTouchpoint.referrer || payload.referrer || '',
                browserApp,
                params: incomingTouchpoint.params || incomingParams || {},
              });
            }
          }

          const trimmedTouchpoints = touchpoints.slice(-MAX_TOUCHPOINTS);

          const pagesVisited = Array.isArray(existing.pagesVisited)
            ? [...existing.pagesVisited]
            : [];
          if (
            currentPage &&
            pagesVisited[pagesVisited.length - 1] !== currentPage
          ) {
            pagesVisited.push(currentPage);
          }
          const trimmedPages = pagesVisited.slice(-MAX_PAGES_VISITED);

          const keyEvents = Array.isArray(existing.keyEvents)
            ? [...existing.keyEvents]
            : [];
          for (const ev of incomingEvents) {
            if (ev && typeof ev === 'object') {
              keyEvents.push({
                ...ev,
                timestamp: ev.timestamp || now.toISOString(),
              });
            }
          }
          const trimmedEvents = keyEvents.slice(-MAX_KEY_EVENTS);

          const firstSource =
            existing.firstSource ||
            trimmedTouchpoints[0]?.source ||
            payload.source ||
            'direct';

          // Determine last meaningful source (prefer non-direct if available, else latest)
          let lastSource =
            trimmedTouchpoints[trimmedTouchpoints.length - 1]?.source ||
            payload.source ||
            existing.lastSource ||
            firstSource;

          const conversionPath =
            computeConversionPath(trimmedTouchpoints) ||
            existing.conversionPath ||
            firstSource;

          const updateData = {
            firstSource,
            lastSource,
            conversionPath,
            visitsCount: trimmedTouchpoints.length || existing.visitsCount || 1,
            eventsCount: trimmedEvents.length,
            lastPage: currentPage || existing.lastPage || '/',
            // Never overwrite captured click IDs or UTMs with null/empty
            fbclid:
              incomingParams.fbclid || payload.fbclid || existing.fbclid || null,
            gclid:
              incomingParams.gclid || payload.gclid || existing.gclid || null,
            gbraid:
              incomingParams.gbraid || payload.gbraid || existing.gbraid || null,
            wbraid:
              incomingParams.wbraid || payload.wbraid || existing.wbraid || null,
            msclkid:
              incomingParams.msclkid ||
              payload.msclkid ||
              existing.msclkid ||
              null,
            utm_source:
              incomingParams.utm_source ||
              payload.utm_source ||
              existing.utm_source ||
              null,
            utm_medium:
              incomingParams.utm_medium ||
              payload.utm_medium ||
              existing.utm_medium ||
              null,
            utm_campaign:
              incomingParams.utm_campaign ||
              payload.utm_campaign ||
              existing.utm_campaign ||
              null,
            utm_content:
              incomingParams.utm_content ||
              payload.utm_content ||
              existing.utm_content ||
              null,
            utm_term:
              incomingParams.utm_term ||
              payload.utm_term ||
              existing.utm_term ||
              null,
            clarityId:
              incomingCookies.clarityId ||
              payload.clarityId ||
              existing.clarityId ||
              null,
            _fbp: incomingCookies._fbp || payload._fbp || existing._fbp || null,
            _fbc: incomingCookies._fbc || payload._fbc || existing._fbc || null,
            _ga: incomingCookies._ga || payload._ga || existing._ga || null,
            _gcl_au:
              incomingCookies._gcl_au ||
              payload._gcl_au ||
              existing._gcl_au ||
              null,
            ip: geo.ip || existing.ip || null,
            ipCity: geo.ipCity || existing.ipCity || null,
            ipRegion: geo.ipRegion || existing.ipRegion || null,
            ipCountry: geo.ipCountry || existing.ipCountry || null,
            geoSource:
              geo.geoSource && geo.geoSource !== 'none'
                ? geo.geoSource
                : existing.geoSource || null,
            browserApp: browserApp || existing.browserApp || null,
            userAgent: userAgent || existing.userAgent || null,
            device:
              payload.device && Object.keys(payload.device).length > 0
                ? { ...(existing.device || {}), ...payload.device }
                : existing.device,
            touchpoints: trimmedTouchpoints,
            pagesVisited: trimmedPages,
            keyEvents: trimmedEvents,
            lastSeenAt: now,
          };

          await strapi.db.query('api::visitor.visitor').update({
            where: { id: existing.id },
            data: updateData,
          });
        }
      });

      ctx.status = 200;
      ctx.body = { ok: true, visitorId };
    } catch (err) {
      strapi.log.error('[Visitor Sync] Error:', err.message || err);
      ctx.status = 200; // Always return 200 to beacon so client doesn't error
      ctx.body = { ok: false };
    }
  },

  async findByVisitorId(ctx) {
    try {
      const { visitorId } = ctx.params;
      if (!visitorId) {
        return ctx.badRequest('Missing visitorId parameter');
      }

      const visitor = await strapi.db
        .query('api::visitor.visitor')
        .findOne({ where: { visitorId } });

      if (!visitor) {
        return ctx.notFound('Visitor not found');
      }

      const leads = await strapi.db
        .query('api::website-lead.website-lead')
        .findMany({
          where: { visitorId },
          orderBy: { submittedAt: 'desc' },
        });

      ctx.body = {
        ok: true,
        data: {
          ...visitor,
          leads,
        },
      };
    } catch (err) {
      strapi.log.error('[Visitor Lookup] Error:', err.message || err);
      return ctx.internalServerError('Failed to fetch visitor');
    }
  },
}));
