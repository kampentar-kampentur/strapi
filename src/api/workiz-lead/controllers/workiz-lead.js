'use strict';

const axios = require('axios');
const Table = require('cli-table3');
const { sendMessage } = require('../../../services/telegram-bot');

const apiToken = process.env.WORKIZ_API_TOKEN;
const authSecret = process.env.WORKIZ_AUTH_SECRET;
const baseApiUrl = apiToken ? `https://api.workiz.com/api/v1/${apiToken}` : '';

module.exports = {
  async bookNow(ctx) {
    try {
      if (!apiToken || !authSecret) {
        return ctx.internalServerError('Workiz API credentials are not set in environment variables.');
      }
      const { phone, name, email, address, zip } = ctx.request.body.data;
      if (!phone || !name) {
        return ctx.badRequest('Missing "phone" or "name" in request body');
      }

      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || ' ';
      const leadData = {
        "auth_secret": authSecret,
        "Phone": phone,
        "FirstName": firstName,
        "LastName": lastName,
        "JobType": "Installation",
        "JobSource": "TVPro Website",
        "CreatedBy": "Artur Holosnyi",
      };
      if (email) leadData.Email = email;
      if (address) leadData.Address = address;
      if (zip) leadData.PostalCode = zip;

      // const response = await axios.post(`${baseApiUrl}/lead/create/`, leadData);
      // sendMessage(
      //   `📢 <b>New Lead Received!</b>\n\n` +
      //   `👤 <b>Name:</b> ${name}\n` +
      //   `📞 <b>Phone:</b> ${phone}\n` +
      //   `📧 <b>Email:</b> ${email}\n` +
      //   `🏠 <b>Address:</b> ${address}\n` +
      //   `📍 <b>ZIP:</b> ${zip}\n` +
      //   `📍 <b>Link:</b> <a href="${response.data.data[0].link}">View Lead</a>\n` +
      //   `🔗 <b>Source:</b> TVProWebsite`,
      //   { parse_mode: 'HTML' }
      // );
      
      ctx.send({
        ok: true,
        message: 'Lead sent to Workiz successfully.',
        // workizResponse: response.data,
      });
    } catch (error) {
      strapi.log.error('Error sending lead to Workiz:', error);
      ctx.internalServerError('An error occurred while sending the lead to Workiz.', { error: error });
    }
  },

  async bestQuote(ctx) {
    try {
      if (!apiToken || !authSecret) {
        return ctx.internalServerError('Workiz API credentials are not set in environment variables.');
      }
      const data = ctx.request.body.data;
      if (!data || !data.contactInfo || !data.contactInfo.phone || !data.contactInfo.name) {
        return ctx.badRequest('Missing contactInfo (name or phone) in request body');
      }
      const { contactInfo, ...rest } = data;
      let { phone, name, email, address, zip, apt } = contactInfo;
      if (contactInfo.zipApt) {
        zip = contactInfo.zipApt.zip;
        apt = contactInfo.zipApt.apt;
      }
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || ' ';
      const leadData = {
        "auth_secret": authSecret,
        "Phone": phone.replace(/\D/g, ''),
        "FirstName": firstName,
        "LastName": lastName,
        "JobType": "Installation",
        "JobSource": "TVPro Website",
        "CreatedBy": "Artur Holosnyi",
      };
      if (email) leadData.Email = email;
      if (address) leadData.Address = address;
      if (zip) leadData.PostalCode = zip;
      if (apt) leadData.Unit = apt;

      const leadResponse = await axios.post(`${baseApiUrl}/lead/create/`, leadData);
      const workizLead = leadResponse.data && leadResponse.data.data && Array.isArray(leadResponse.data.data) ? leadResponse.data.data[0] : null;
      if (!workizLead) {
        strapi.log.error('Workiz lead response malformed:', leadResponse.data);
        return ctx.internalServerError('Workiz lead response malformed.');
      }
      const { UUID, ClientId } = workizLead;
      const now = new Date();
      const pad = n => n < 10 ? '0' + n : n;
      const createdStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${now.getHours()}:${pad(now.getMinutes())}`;
      const estimateCreateRes = await axios.post(`${baseApiUrl}/estimate/create/`, {
        auth_secret: authSecret,
        ClientId,
        UUID,
        Name: firstName + ' ' + lastName,
        Description: '',
        Created: createdStr,
      });
      const estimateId = estimateCreateRes?.data?.data ;
      if (!estimateId) {
        strapi.log.error('Workiz estimate create response malformed:', estimateCreateRes.data);
        return ctx.internalServerError('Workiz estimate create response malformed.');
      }

      const valueCountPairs = [];
      if (rest['tv-size'] && rest['tv-size'].tvSelection) {
        valueCountPairs.push({ value: rest['tv-size'].tvSelection, count: 1 });
      }
      if (rest['tv-size'] && rest['tv-size'].extraTechnicans) {
        valueCountPairs.push({ value: rest['tv-size'].extraTechnicans, count: 1 });
      }
      if (rest['additional-services'] && typeof rest['additional-services'] === 'object') {
        Object.values(rest['additional-services']).forEach(item => {
          if (item && item.value) valueCountPairs.push({ value: item.value, count: Number(item.count) || 1 });
        });
      }
      if (rest['mounting']) {
        ['mountType'].forEach(field => {
          if (rest['mounting'][field]) {
            valueCountPairs.push({ value: rest['mounting'][field], count: 1 });
          }
        });
      }
      if (rest['wall']) {
        ['wallType', 'wires'].forEach(field => {
          if (rest['wall'][field]) {
            valueCountPairs.push({ value: rest['wall'][field], count: 1 });
          }
        });
      }

      const priceMapItems = await strapi.db.query('api::price-map.price-map').findMany();
      const lineItems = [];
      valueCountPairs.forEach(({ value, count }) => {
        const priceMap = priceMapItems.find(p => p.value === value);
        if (priceMap && priceMap.workizId) {
          for (let i = 0; i < count; i++) {
            lineItems.push({ Id: priceMap.workizId.toString() });
          }
        }
      });

      if (lineItems.length > 0) {
        await axios.post(`${baseApiUrl}/estimate/addLineItems/`, {
          auth_secret: authSecret,
          Id: estimateId.toString(),
          LineItems: lineItems,
        });
      }
      sendMessage(
        `📢 *New Estimate Received!*\n\n` +
        `👤 *Name:* ${name}\n` +
        `📞 *Phone:* ${phone}\n` +
        `📧 *Email:* ${email}\n` +
        `🏠 *Address:* ${address}\n` +
        `📍 *ZIP:* ${zip}\n` +
        `📍 *Link:* ${leadResponse?.data?.data[0]?.link}\n` +
        `🔗 *Source:* TVProWebsite`,
        { parse_mode: 'Markdown' }
      );
      ctx.send({
        ok: true,
        message: 'Lead sent to Workiz successfully.',
        workizResponse: leadResponse.data,
      });
    } catch (error) {
      strapi.log.error('Error in bestQuote:', error && error.response ? error.response.data : error);
      ctx.internalServerError('An error occurred while sending the bestQuote lead to Workiz.', { error: error.message });
    }
  }
};

function arrayToCliTableText(data) {
  if (!Array.isArray(data) || data.length === 0) return '';
  const head = Object.keys(data[0]);
  const table = new Table({ head, style: { head: [], border: [] }, wordWrap: true,chars: { 'top': '', 'top-mid': '', 'top-left': '', 'top-right': '', 'bottom': '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': '', 'left': '', 'left-mid': '', 'mid': '', 'mid-mid': '', 'right': '', 'right-mid': '', 'middle': ' | ' } });
  data.forEach(row => table.push(head.map(h => row[h])));
  return table.toString();
}
