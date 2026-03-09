'use strict';

const axios = require('axios');
const Table = require('cli-table3');
const fs = require('fs').promises;
const path = require('path');
const { sendMessage } = require('../../../services/telegram-bot');

const apiToken = process.env.WORKIZ_API_TOKEN;
const authSecret = process.env.WORKIZ_AUTH_SECRET;

// Helper function to send data to ProsBuddy API and save response
async function sendToProsBuddy(firstName, lastName, email, phone, address, zip, apt, services, endpoint, utmParams = {}) {
  try {
    const dataPayload = {
      "first_name": firstName,
      "last_name": lastName,
      "email": email || '',
      "phone": phone || '',
      "address": address || '',
      "zip": zip || '',
      "apt": apt || '',
      "services": services || []
    };

    // Add UTM parameters if present
    const utmFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    utmFields.forEach(field => {
      if (utmParams[field]) {
        dataPayload[field] = utmParams[field];
      }
    });

    const prosbuddyData = {
      "account_key": "tvproHandyServices",
      "event": "form_submitted",
      "data": dataPayload
    };

    const response = await axios.post('https://dev.app.prosbuddy.ai/api/v1/webhook/ghl/create-lead', prosbuddyData);

    // Save response to file for testing
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `prosbuddy_response_${endpoint}_${timestamp}.json`;
    const filepath = path.join(__dirname, '../../../prosbuddy_logs', filename);

    try {
      await fs.mkdir(path.dirname(filepath), { recursive: true });
      await fs.writeFile(filepath, JSON.stringify({
        timestamp,
        endpoint,
        request: prosbuddyData,
        response: response.data
      }, null, 2));
      strapi.log.info(`ProsBuddy response saved to: ${filename}`);
    } catch (fileError) {
      strapi.log.error('Error saving ProsBuddy response to file:', fileError);
    }

    return response.data;
  } catch (error) {
    strapi.log.error('Error sending data to ProsBuddy:', error.response ? error.response.data : error.message);
    throw error;
  }
}

module.exports = {
  async bookNow(ctx) {
    try {
      if (!apiToken || !authSecret) {
        return ctx.internalServerError('Workiz API credentials are not set in environment variables.');
      }
      const { phone, name, email, address, zip, utm_source, utm_medium, utm_campaign, utm_content, utm_term } = ctx.request.body.data;
      if (!phone || !name) {
        return ctx.badRequest('Missing "phone" or "name" in request body');
      }

      const utmParams = { utm_source, utm_medium, utm_campaign, utm_content, utm_term };

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

      // Send data to ProsBuddy API
      try {
        await sendToProsBuddy(firstName, lastName, email, phone, address, zip, '', [], 'bookNow', utmParams);
      } catch (prosbuddyError) {
        strapi.log.error('ProsBuddy API call failed, but continuing with Workiz flow:', prosbuddyError.message);
        // Continue with the flow even if ProsBuddy fails
      }

      sendMessage(
        `📢 <b>New Lead Received!</b>\n\n` +
        `👤 <b>Name:</b> ${name}\n` +
        `📞 <b>Phone:</b> ${phone}\n` +
        `📧 <b>Email:</b> ${email}\n` +
        `🏠 <b>Address:</b> ${address}\n` +
        `📍 <b>ZIP:</b> ${zip}\n` +
        `🔗 <b>Source:</b> TVProWebsite`,
        { parse_mode: 'HTML' }
      );

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
      const { contactInfo, utm_source, utm_medium, utm_campaign, utm_content, utm_term, ...rest } = data;
      const utmParams = { utm_source, utm_medium, utm_campaign, utm_content, utm_term };
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
      const services = [];
      const itemsWithPrices = [];
      let totalPrice = 0;

      valueCountPairs.forEach(({ value, count }) => {
        const priceMap = priceMapItems.find(p => p.value === value);
        if (priceMap && priceMap.workizId) {
          for (let i = 0; i < count; i++) {
            lineItems.push({ Id: priceMap.workizId.toString() });
            services.push({
              id: parseInt(priceMap.workizId),
              name: priceMap.itemName || value  // Use itemName if available, fallback to value
            });
          }
          const itemPrice = priceMap.price || 0;
          const itemTotal = itemPrice * count;
          totalPrice += itemTotal;
          itemsWithPrices.push({
            name: priceMap.itemName || priceMap.label || value,
            price: itemPrice,
            count: count,
            total: itemTotal
          });
        }
      });

      // Send data to ProsBuddy API
      try {
        await sendToProsBuddy(firstName, lastName, email, phone, address, zip, apt, services, 'bestQuote', utmParams);
      } catch (prosbuddyError) {
        strapi.log.error('ProsBuddy API call failed, but continuing with Workiz flow:', prosbuddyError.message);
        // Continue with the flow even if ProsBuddy fails
      }

      // Format items list for Telegram
      let itemsListText = '';
      if (itemsWithPrices.length > 0) {
        itemsListText = '\n\n🛒 *Selected Items:*\n';
        itemsWithPrices.forEach(item => {
          const countText = item.count > 1 ? ` x${item.count}` : '';
          itemsListText += `• ${item.name}${countText} — $${item.total.toFixed(2)}\n`;
        });
        itemsListText += `\n💰 *Total Price:* $${totalPrice.toFixed(2)}`;
      }

      sendMessage(
        `📢 *New Estimate Received!*\n\n` +
        `👤 *Name:* ${name}\n` +
        `📞 *Phone:* ${phone}\n` +
        `📧 *Email:* ${email}\n` +
        `🏠 *Address:* ${address}\n` +
        `📍 *ZIP:* ${zip}\n` +
        `🔗 *Source:* TVProWebsite` +
        itemsListText,
        { parse_mode: 'Markdown' }
      );

      ctx.send({
        ok: true,
        message: 'Lead created successfully.',
      });
    } catch (error) {
      strapi.log.error('Error in bestQuote:', error && error.response ? error.response.data : error);
      ctx.internalServerError('An error occurred while sending the bestQuote lead to Workiz.', { error: error.message });
    }
  }
};
