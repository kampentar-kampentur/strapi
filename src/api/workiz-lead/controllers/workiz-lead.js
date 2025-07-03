'use strict';

const axios = require('axios');
const Table = require('cli-table3');

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
      const lastName = nameParts.slice(1).join(' ') || 'CostumField';
      const leadData = {
        "auth_secret": authSecret,
        "Phone": phone,
        "FirstName": firstName,
        "LastName": lastName,
        "JobType": "Service",
        "JobSource": "Google",
        "CreatedBy": "Artur Holosnyi",
      };
      if (email) leadData.Email = email;
      if (address) leadData.Address = address;
      if (zip) leadData.PostalCode = zip;

      const response = await axios.post(`${baseApiUrl}/lead/create/`, leadData);

      ctx.send({
        ok: true,
        message: 'Lead sent to Workiz successfully.',
        workizResponse: response.data,
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
      const { phone, name, email, address, zip } = contactInfo;
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || 'CostumField';

      // 1. Создаём лид
      const leadData = {
        "auth_secret": authSecret,
        "Phone": phone,
        "FirstName": firstName,
        "LastName": lastName,
        "JobType": "Service",
        "JobSource": "Google",
        "CreatedBy": "Artur Holosnyi",
      };
      if (email) leadData.Email = email;
      if (address) leadData.Address = address;
      if (zip) leadData.PostalCode = zip;

      const leadResponse = await axios.post(`${baseApiUrl}/lead/create/`, leadData);
      const workizLead = leadResponse.data && leadResponse.data.data && Array.isArray(leadResponse.data.data) ? leadResponse.data.data[0] : null;
      if (!workizLead) {
        strapi.log.error('Workiz lead response malformed:', leadResponse.data);
        return ctx.internalServerError('Workiz lead response malformed.');
      }
      const { UUID, ClientId } = workizLead;

      // 2. Создаём смету (estimate)
      // Формируем дату в формате 'YYYY-MM-DD H:mm'
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

      // 3. Собираем все value+count из формы
      const valueCountPairs = [];
      // tv-size.tvSelection
      if (rest['tv-size'] && Array.isArray(rest['tv-size'].tvSelection)) {
        rest['tv-size'].tvSelection.forEach(tv => {
          if (tv.value) valueCountPairs.push({ value: tv.value, count: Number(tv.count) || 1 });
        });
      }
      // additional-services
      if (rest['additional-services'] && typeof rest['additional-services'] === 'object') {
        Object.values(rest['additional-services']).forEach(arr => {
          if (Array.isArray(arr)) {
            arr.forEach(item => {
              if (item.value) valueCountPairs.push({ value: item.value, count: Number(item.count) || 1 });
            });
          }
        });
      }
      // mounting-X (динамические шаги для каждого телевизора)
      if (rest['tv-size'] && Array.isArray(rest['tv-size'].tvSelection)) {
        let mountingIdx = 1;
        rest['tv-size'].tvSelection.forEach(tv => {
          const count = Number(tv.count) || 1;
          for (let i = 0; i < count; i++) {
            const mount = rest[`mounting-${mountingIdx}`];
            if (mount) {
              ['mountType', 'wallType', 'wires'].forEach(field => {
                if (mount[field]) {
                  valueCountPairs.push({ value: mount[field], count: 1 });
                }
              });
            }
            mountingIdx++;
          }
        });
      }

      // 4. Достаём workizId из price-map по value
      const priceMapItems = await strapi.db.query('api::price-map.price-map').findMany();
      const lineItems = [];
      valueCountPairs.forEach(({ value, count }) => {
        const priceMap = priceMapItems.find(p => p.value === value);
        if (priceMap && priceMap.workizId) {
          lineItems.push({ Id: priceMap.workizId.toString(), Qty: count });
        }
      });

      // 5. Добавляем line items в estimate
      if (lineItems.length > 0) {
        await axios.post(`${baseApiUrl}/estimate/addLineItems/`, {
          auth_secret: authSecret,
          Id: estimateId.toString(),
          LineItems: lineItems,
        });
      }

      // 6. Возвращаем только ответ createLead
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