module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/quiz-analytics',
      handler: 'api::quiz-analytics.quiz-analytics.proxy',
      config: {
        auth: false,
        policies: [],
      },
    },
  ],
};
