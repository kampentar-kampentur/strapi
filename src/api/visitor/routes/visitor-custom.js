'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/visitor/sync',
      handler: 'visitor.sync',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/visitor/by-id/:visitorId',
      handler: 'visitor.findByVisitorId',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
