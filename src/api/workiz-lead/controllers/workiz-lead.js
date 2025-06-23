'use strict';

const axios = require('axios');
const Table = require('cli-table3');

/**
 * A set of functions called "actions" for `workiz-lead`
 */

const apiToken = process.env.WORKIZ_API_TOKEN;
const authSecret = process.env.WORKIZ_AUTH_SECRET;
const baseApiUrl = apiToken ? `https://api.workiz.com/api/v1/${apiToken}` : '';

module.exports = {
  async bookNow(ctx) {
    try {
      if (!apiToken || !authSecret) {
        return ctx.internalServerError('Workiz API credentials are not set in environment variables.');
      }
      const { phone, name } = ctx.request.body.data;
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
        "JobType": "add",
        "JobSource": "Google",
        "CreatedBy": "WebSite",
      };

      const response = await axios.post(`${baseApiUrl}/lead/create/`, leadData);

      ctx.send({
        ok: true,
        message: 'Lead sent to Workiz successfully.',
        workizResponse: response.data,
      });
    } catch (error) {
      strapi.log.error('Error sending lead to Workiz:', error);
      ctx.internalServerError('An error occurred while sending the lead to Workiz.', { error: error.message });
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
      const { phone, name } = contactInfo;
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || 'CostumField';

      // Формируем таблицу установок
      let installTable = '';
      let tvSizeExtraNotes = [];
      if (rest['tv-size'] && Array.isArray(rest['tv-size'].tvSelection)) {
        const tvs = rest['tv-size'].tvSelection;
        const installArr = [];
        // Собираем дополнительные поля из tv-size кроме tvSelection
        Object.entries(rest['tv-size']).forEach(([key, value]) => {
          if (key !== 'tvSelection') {
            tvSizeExtraNotes.push(`${key}: ${value}`);
          }
        });
        tvs.forEach((tv, idx) => {
          const mount = rest[`mounting-${idx+1}`];
          if (mount) {
            installArr.push({
              'TV Size': tv.label,
              'Mount Type': mount.mountType || '',
              'Wall Type': mount.wallType || '',
              'Wires': mount.wires || ''
            });
          }
        });
        if (installArr.length) {
          installTable = arrayToCliTableText(installArr);
        }
      }

      // Плоский формат дополнительных сервисов
      let additionalNotes = [];
      Object.entries(rest).forEach(([key, value]) => {
        if (key.startsWith('mounting') || key === 'tv-size') return;
        if (typeof value === 'object' && value !== null) {
          Object.entries(value).forEach(([subKey, subVal]) => {
            if (Array.isArray(subVal)) {
              subVal.forEach(item => {
                if (item.value && item.label) {
                  let note = `${item.label} (${item.value})`;
                  if (item.count && Number(item.count) > 1) {
                    note += ` x${item.count}`;
                  }
                  additionalNotes.push(note);
                }
              });
            } else if (subVal && subVal.value && subVal.label) {
              let note = `${subVal.label} (${subVal.value})`;
              if (subVal.count && Number(subVal.count) > 1) {
                note += ` x${subVal.count}`;
              }
              additionalNotes.push(note);
            }
          });
        }
      });

      let leadNotes = '';
      if (installTable) {
        leadNotes += 'Installations:\n' + installTable + '\n';
      }
      if (tvSizeExtraNotes.length) {
        leadNotes += '\nTV Size Extra:\n' + tvSizeExtraNotes.join(', ') + '\n';
      }
      if (additionalNotes.length) {
        leadNotes += '\nAdditional Services:\n' + additionalNotes.join(', ');
      }

      const leadData = {
        "auth_secret": authSecret,
        "Phone": phone,
        "FirstName": firstName,
        "LastName": lastName,
        "JobType": "add",
        "JobSource": "Google",
        "CreatedBy": "WebSite",
        "LeadNotes": leadNotes,
      };

      const response = await axios.post(`${baseApiUrl}/lead/create/`, leadData);

      ctx.send({
        ok: true,
        message: 'Lead sent to Workiz successfully.',
        workizResponse: response.data,
        leadNotes,
      });
    } catch (error) {
      strapi.log.error('Error sending bestQuote lead to Workiz:', error);
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