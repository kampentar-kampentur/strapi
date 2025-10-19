module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/facebook/webhook',
      handler: 'facebook.verify',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/facebook/webhook',
      handler: 'facebook.receive',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/facebook/zapier-lead',
      handler: 'facebook.zapierLead',
      config: { auth: false },
    },
  ],
};
