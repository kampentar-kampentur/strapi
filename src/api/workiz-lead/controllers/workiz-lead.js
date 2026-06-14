'use strict';

const axios = require('axios');
const Table = require('cli-table3');
const fs = require('fs').promises;
const path = require('path');
const { sendMessage } = require('../../../services/telegram-bot');

const apiToken = process.env.WORKIZ_API_TOKEN;
const authSecret = process.env.WORKIZ_AUTH_SECRET;

// Helper function to format submission date to Houston time (America/Chicago) with maximum precision
function formatHoustonTime(isoString) {
  try {
    const date = isoString ? new Date(isoString) : new Date();
    if (isNaN(date.getTime())) {
      return new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });
    }
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    const parts = formatter.formatToParts(date);
    const partMap = {};
    parts.forEach(p => partMap[p.type] = p.value);
    const ms = String(date.getMilliseconds()).padStart(3, '0');
    return `${partMap.year}-${partMap.month}-${partMap.day} ${partMap.hour}:${partMap.minute}:${partMap.second}.${ms}`;
  } catch (e) {
    return new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });
  }
}

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
      const { phone, name, email, address, zip, utm_source, utm_medium, utm_campaign, utm_content, utm_term, source, city, submittedAt } = ctx.request.body.data;
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

      const formattedTime = formatHoustonTime(submittedAt);

      sendMessage(
        `📢 <b>New Lead Received!</b>\n\n` +
        `👤 <b>Name:</b> ${name}\n` +
        `📞 <b>Phone:</b> ${phone}\n` +
        `📧 <b>Email:</b> ${email}\n` +
        `🏠 <b>Address:</b> ${address}\n` +
        `📍 <b>ZIP:</b> ${zip}\n` +
        `🔗 <b>Source:</b> TVProWebsite - ${source}\n` +
        `🏙️ <b>City:</b> ${city}\n` +
        `📅 <b>Submitted At (Houston):</b> ${formattedTime}`,
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
      const { contactInfo, utm_source, utm_medium, utm_campaign, utm_content, utm_term, submittedAt, ...rest } = data;
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
      
      // Step: tv-size
      const tvSizeStep = rest['tv-size'] || rest['tvSize'] || {};
      if (tvSizeStep.tvSelection) {
        valueCountPairs.push({ value: tvSizeStep.tvSelection, count: 1 });
      }
      if (tvSizeStep.extraTechnicans) {
        valueCountPairs.push({ value: tvSizeStep.extraTechnicans, count: 1 });
      }

      // Step: mounting
      const mountingStep = rest['mounting'] || {};
      if (mountingStep.mountType) {
        valueCountPairs.push({ value: mountingStep.mountType, count: 1 });
      }

      // Step: wall
      const wallStep = rest['wall'] || {};
      if (wallStep.wallType) {
        valueCountPairs.push({ value: wallStep.wallType, count: 1 });
      }
      if (wallStep.wallTypeProjector) {
        valueCountPairs.push({ value: wallStep.wallTypeProjector, count: 1 });
      }
      if (wallStep.fireplace) {
        valueCountPairs.push({ value: wallStep.fireplace, count: 1 });
      }
      if (wallStep.wires) {
        valueCountPairs.push({ value: wallStep.wires, count: 1 });
      }

      // Step: additionalServices
      const additionalServicesStep = rest['additionalServices'] || rest['additional-services'] || {};
      if (additionalServicesStep && typeof additionalServicesStep === 'object') {
        // Support radio fields from the new BestQuoteScheme
        ['soundbar', 'soundbarMount', 'screenInstallation'].forEach(field => {
          if (additionalServicesStep[field]) {
            valueCountPairs.push({ value: additionalServicesStep[field], count: 1 });
          }
        });

        // Support for old popular services checkboxes if sent as nested objects
        Object.keys(additionalServicesStep).forEach(key => {
          const item = additionalServicesStep[key];
          if (item && typeof item === 'object' && item.value && !['soundbar', 'soundbarMount', 'screenInstallation'].includes(key)) {
            valueCountPairs.push({ value: item.value, count: Number(item.count) || 1 });
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

      const formattedTime = formatHoustonTime(submittedAt);

      sendMessage(
        `📢 *New Estimate Received!*\n\n` +
        `👤 *Name:* ${name}\n` +
        `📞 *Phone:* ${phone}\n` +
        `📧 *Email:* ${email}\n` +
        `🏠 *Address:* ${address}\n` +
        `📍 *ZIP:* ${zip}\n` +
        `🔗 *Source:* TVProWebsite\n` +
        `📅 *Submitted At (Houston):* ${formattedTime}` +
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
