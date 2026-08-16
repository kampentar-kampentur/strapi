'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/log-error',
      handler: 'log-error.logError',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
