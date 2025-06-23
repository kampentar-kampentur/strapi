module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/book-now',
      handler: 'workiz-lead.bookNow',
      config: {
        auth: false,
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/best-quote',
      handler: 'workiz-lead.bestQuote',
      config: {
        auth: false,
        policies: [],
      },
    },
  ],
};
