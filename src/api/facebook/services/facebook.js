const axios = require('axios');

const PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;

async function getLeadData(leadId) {
  const url = `https://graph.facebook.com/v21.0/${leadId}?access_token=${PAGE_ACCESS_TOKEN}`;
  const res = await axios.get(url);
  return res.data;
}

module.exports = { getLeadData };
