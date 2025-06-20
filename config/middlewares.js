module.exports = [
  {
    name: 'strapi::cors',
    config: {
      origin: ['http://localhost:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      headers: '*',
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: ['https://tvpro-landing.vercel.app/'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      headers: '*',
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: ['https://tvpro-landing-z29e.vercel.app/'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      headers: '*',
    },
  },
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
