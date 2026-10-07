module.exports = [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'media.tvprousa.com'
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'dl.airtable.com',
            'media.tvprousa.com'
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:4321',
        'https://tvprousa.com',
        'https://www.tvprousa.com',
        'https://tvpro-landing.pages.dev',
        'https://dev.tvpro-landing.pages.dev',
        'https://tvpro-landing.vercel.app',
        'https://tvpro-landing-z29e.vercel.app',
        /https:\/\/.*\.pages\.dev$/,
        /https:\/\/.*\.vercel\.app$/
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
      headers: '*',
      keepHeaderOnError: true,
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
