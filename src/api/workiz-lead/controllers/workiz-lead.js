'use strict';

const axios = require('axios');
const Table = require('cli-table3');
const fs = require('fs').promises;
const path = require('path');
const { sendMessage } = require('../../../services/telegram-bot');

const apiToken = process.env.WORKIZ_API_TOKEN;
const authSecret = process.env.WORKIZ_AUTH_SECRET;

const staticPriceMap = {
  // tv-size
  'under31': { price: 69, label: 'Under 31"', workizId: 1003 },
  'upTo31': { price: 69, label: 'Under 31"', workizId: 1003 },
  '32-59': { price: 125, label: '32"-59"', workizId: 1004 },
  '60-69': { price: 144, label: '60"-69"', workizId: 1005 },
  '70-85': { price: 149, label: '70"-85"', workizId: 1006 },
  'over-86': { price: 189, label: '98"-100"', workizId: 1007 },
  'notSure_tvSelection': { price: 125, label: 'Not Sure', workizId: 1004 },

  // mounting
  'alreadyThere': { price: 0, label: 'Already there', workizId: 1013 },
  'fixed': { price: 44, label: 'Fixed Mount', workizId: 1014 },
  'tilting': { price: 52, label: 'Tilt Mount', workizId: 1016 },
  'fullMotion': { price: 69, label: 'Full-Motion Mount', workizId: 1012 },
  'corner': { price: 69, label: 'Corner Mount', workizId: 1015 },
  'ceilingMount': { price: 69, label: 'Ceiling Mount', workizId: 1036 },
  'ultraSlim': { price: 79, label: 'Ultra Slim 0.3', workizId: 1040 },
  'needHelp': { price: 0, label: 'Need help choosing', workizId: 1013 },

  // wall
  'drywall': { price: 0, label: 'Drywall', workizId: 1017 },
  'stoneBrickConcrete': { price: 49, label: 'Brick / Stone / Concrete', workizId: 1018 },
  'ceiling': { price: 39, label: 'Ceiling', workizId: 1044 },
  'tile': { price: 69, label: 'Tile', workizId: 1043 },
  'metalStuds': { price: 30, label: 'Metal Studs', workizId: 1042 },
  'notSure_wallType': { price: 0, label: 'Not Sure', workizId: 1017 },

  // fireplace
  'fireplace_yes': { price: 32, label: 'Above Fireplace', workizId: 1045 },
  'fireplaceYes': { price: 32, label: 'Above Fireplace', workizId: 1045 },
  'fireplace_no': { price: 0, label: 'No', workizId: 1017 },

  // wires
  'open': { price: 0, label: 'Exposed', workizId: 1017 },
  'cableChannelDrywall': { price: 43, label: 'Cable Channel', workizId: 1047 },
  'wallDrywall': { price: 93, label: 'Put it in the wall', workizId: 1048 },
  'socketDrywall': { price: 129, label: 'In wall with socket', workizId: 1049 },
  'wallFireplace': { price: 109, label: 'In-Wall Concealment (Fireplace)', workizId: 1051 },
  'socketFireplace': { price: 149, label: 'In Wall with Socket (Fireplace)', workizId: 1052 },
  'cableChannelBrick': { price: 52, label: 'Cable channel (Brick)', workizId: 1053 },
  'wallBrick': { price: 249, label: 'In-Wall Concealment (Brick)', workizId: 1054 },
  'socketBrick': { price: 289, label: 'In-Wall with Socket (Brick)', workizId: 1055 },
  'wires_yes': { price: 109, label: 'Yes, hide all wires', workizId: 1051 },
  'wires_no': { price: 0, label: 'No, standard installation', workizId: 1017 },
  'wires_notSure': { price: 0, label: 'Not Sure', workizId: 1017 },

  // addons
  'soundbar': { price: 69, label: 'Soundbar Installation', workizId: 1022 },
  'soundbarYes': { price: 69, label: 'Soundbar Installation', workizId: 1022 },
  'gamingConsole': { price: 50, label: 'Gaming Console Setup', workizId: 1024 },
  'ledLight': { price: 39, label: 'LED Light Strip Installation', workizId: 1026 },
  'installLEDLight': { price: 39, label: 'LED Light Strip Installation', workizId: 1026 },
  'paintings': { price: 39, label: 'Install Painting or Mirrors', workizId: 1030 },
  'installPaintingsAndDecor': { price: 39, label: 'Install Painting or Mirrors', workizId: 1030 }
};

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
        const key = tvSizeStep.tvSelection === 'notSure' ? 'notSure_tvSelection' : tvSizeStep.tvSelection;
        valueCountPairs.push({ key, value: tvSizeStep.tvSelection, count: 1 });
      }
      if (tvSizeStep.extraTechnicans) {
        valueCountPairs.push({ key: tvSizeStep.extraTechnicans, value: tvSizeStep.extraTechnicans, count: 1 });
      }

      // Step: mounting
      const mountingStep = rest['mounting'] || {};
      if (mountingStep.mountType) {
        valueCountPairs.push({ key: mountingStep.mountType, value: mountingStep.mountType, count: 1 });
      }

      // Step: wall
      const wallStep = rest['wall'] || {};
      if (wallStep.wallType) {
        const key = wallStep.wallType === 'notSure' ? 'notSure_wallType' : wallStep.wallType;
        valueCountPairs.push({ key, value: wallStep.wallType, count: 1 });
      }
      if (wallStep.wallTypeProjector) {
        valueCountPairs.push({ key: wallStep.wallTypeProjector, value: wallStep.wallTypeProjector, count: 1 });
      }
      if (wallStep.fireplace) {
        const key = wallStep.fireplace === 'yes' ? 'fireplace_yes' : wallStep.fireplace === 'no' ? 'fireplace_no' : wallStep.fireplace;
        valueCountPairs.push({ key, value: wallStep.fireplace, count: 1 });
      }
      if (wallStep.wires) {
        const key = wallStep.wires === 'yes' ? 'wires_yes' : wallStep.wires === 'no' ? 'wires_no' : wallStep.wires === 'notSure' ? 'wires_notSure' : wallStep.wires;
        valueCountPairs.push({ key, value: wallStep.wires, count: 1 });
      }

      // Step: fireplace (New Schema)
      const fireplaceStep = rest['fireplace'] || {};
      if (fireplaceStep.fireplace) {
        const key = fireplaceStep.fireplace === 'yes' ? 'fireplace_yes' : fireplaceStep.fireplace === 'no' ? 'fireplace_no' : fireplaceStep.fireplace;
        // Avoid duplicate if already parsed from old structure
        if (!valueCountPairs.some(p => p.key === key)) {
          valueCountPairs.push({ key, value: fireplaceStep.fireplace, count: 1 });
        }
      }
      if (fireplaceStep.addons && Array.isArray(fireplaceStep.addons)) {
        fireplaceStep.addons.forEach(addon => {
          if (!valueCountPairs.some(p => p.key === addon)) {
            valueCountPairs.push({ key: addon, value: addon, count: 1 });
          }
        });
      }

      // Step: wires (New Schema)
      const wiresStep = rest['wires'] || {};
      if (wiresStep.wires) {
        const key = wiresStep.wires === 'yes' ? 'wires_yes' : wiresStep.wires === 'no' ? 'wires_no' : wiresStep.wires === 'notSure' ? 'wires_notSure' : wiresStep.wires;
        // Avoid duplicate if already parsed from old structure
        if (!valueCountPairs.some(p => p.key === key)) {
          valueCountPairs.push({ key, value: wiresStep.wires, count: 1 });
        }
      }

      // Step: additionalServices
      const additionalServicesStep = rest['additionalServices'] || rest['additional-services'] || {};
      if (additionalServicesStep && typeof additionalServicesStep === 'object') {
        // Support radio fields from the new BestQuoteScheme
        ['soundbar', 'soundbarMount', 'screenInstallation'].forEach(field => {
          if (additionalServicesStep[field]) {
            valueCountPairs.push({ key: additionalServicesStep[field], value: additionalServicesStep[field], count: 1 });
          }
        });

        // Support for old popular services checkboxes if sent as nested objects
        Object.keys(additionalServicesStep).forEach(key => {
          const item = additionalServicesStep[key];
          if (item && typeof item === 'object' && item.value && !['soundbar', 'soundbarMount', 'screenInstallation'].includes(key)) {
            valueCountPairs.push({ key: item.value, value: item.value, count: Number(item.count) || 1 });
          }
        });
      }

      let priceMapItems = [];
      try {
        priceMapItems = await strapi.db.query('api::price-map.price-map').findMany();
      } catch (err) {
        strapi.log.error('Could not fetch price-map from database, using static fallback:', err.message);
      }
      
      const lineItems = [];
      const services = [];
      const itemsWithPrices = [];
      let totalPrice = 0;

      valueCountPairs.forEach(({ key, value, count }) => {
        let resolvedItem = staticPriceMap[key || value];
        
        if (!resolvedItem) {
          const priceMap = priceMapItems.find(p => p.value === value);
          if (priceMap) {
            resolvedItem = {
              price: Number(priceMap.price) || 0,
              label: priceMap.itemName || priceMap.label || value,
              workizId: priceMap.workizId
            };
          }
        }
        
        if (resolvedItem && resolvedItem.workizId) {
          for (let i = 0; i < count; i++) {
            lineItems.push({ Id: resolvedItem.workizId.toString() });
            services.push({
              id: parseInt(resolvedItem.workizId),
              name: resolvedItem.label
            });
          }
          const itemPrice = resolvedItem.price || 0;
          const itemTotal = itemPrice * count;
          totalPrice += itemTotal;
          itemsWithPrices.push({
            name: resolvedItem.label,
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
