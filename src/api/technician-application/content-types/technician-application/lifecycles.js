'use strict';

const TelegramBot = require('node-telegram-bot-api');

const botToken = '8930597618:AAFAe4B8OPXUOrckXpirZMhTbZksBWpIMTk';
const chatId = '-5508219997';
let bot;
const processedIds = new Set();

try {
  bot = new TelegramBot(botToken);
} catch (err) {
  strapi.log.error('Failed to initialize TelegramBot in technician-application lifecycle:', err);
}

module.exports = {
  async afterCreate(event) {
    const { result } = event;
    if (!result) return;

    // Skip if this is the published version creation to prevent duplicate notifications
    if (result.publishedAt !== null && result.publishedAt !== undefined) {
      return;
    }

    // Deduplicate by ID to handle Strapi double-triggering or hot-reload cache duplication
    const uniqueKey = `${result.id}`;
    if (processedIds.has(uniqueKey)) {
      return;
    }
    processedIds.add(uniqueKey);
    setTimeout(() => processedIds.delete(uniqueKey), 10000); // clear after 10s

    strapi.log.info(`Technician application lifecycle triggered for ID: ${result.id}`);

    let entry = result;

    // Try to populate 'file' relation if possible, but don't crash if it fails
    const docId = result.documentId || result.document_id;
    if (docId) {
      try {
        const populated = await strapi.documents('api::technician-application.technician-application').findOne({
          documentId: docId,
          populate: ['file']
        });
        if (populated) {
          entry = populated;
        }
      } catch (err) {
        strapi.log.warn(`Could not populate file relation for technician application ${docId}:`, err.message);
      }
    }

    try {
      // Grouping the application details into logical sections
      const sections = [
        {
          title: '📞 Contact Details',
          fields: [
            { label: 'Name', value: entry.name },
            { label: 'Phone', value: entry.phone },
            { label: 'Email', value: entry.email },
            { label: 'City', value: entry.city }
          ]
        },
        {
          title: '🛡️ Status & Verification',
          fields: [
            { label: 'Work Authorization', value: entry.workAuth },
            { label: 'Over 18', value: entry.over18 },
            { label: 'Driver License', value: entry.driverLicense },
            { label: 'Driving Range', value: entry.drivingRange },
            { label: 'Background Check Consent', value: entry.backgroundCheck }
          ]
        },
        {
          title: '🛠️ Experience & Skills',
          fields: [
            { label: 'Experience Level', value: entry.experienceLevel },
            { label: 'Languages', value: entry.languages },
            { label: 'Has Tools', value: entry.hasTools },
            { label: 'Services Performed', value: entry.servicesPerformed },
            { label: 'Previous Work', value: entry.previousWork }
          ]
        },
        {
          title: '📝 Technical Quiz Answers',
          fields: [
            { label: 'Q1 Studs Spacing', value: entry.q1Studs },
            { label: 'Q2 Power Cord', value: entry.q2Power }
          ]
        },
        {
          title: '💼 Preferences & Income',
          fields: [
            { label: 'Schedule', value: entry.schedule },
            { label: 'Days Per Week', value: entry.daysPerWeek },
            { label: 'Desired Income', value: entry.desiredIncome },
            { label: 'Liability Insurance', value: entry.insurance }
          ]
        },
        {
          title: 'ℹ️ About Candidate',
          fields: [
            { label: 'Self-Introduction', value: entry.about },
            { label: 'Strengths', value: entry.strengths },
            { label: 'Weaknesses', value: entry.weaknesses }
          ]
        }
      ];

      let messageText = `💼 <b>New Technician Application</b>\n`;
      messageText += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      for (const section of sections) {
        const activeFields = section.fields.filter(f => f.value !== undefined && f.value !== null && f.value !== '');
        
        if (activeFields.length > 0) {
          messageText += `<b>${section.title}</b>\n`;
          for (const field of activeFields) {
            messageText += `• <b>${field.label}:</b> ${field.value}\n`;
          }
          messageText += `\n`;
        }
      }

      // Add UTM parameters if present
      const utmFields = [
        { label: 'Source', value: entry.utm_source },
        { label: 'Medium', value: entry.utm_medium },
        { label: 'Campaign', value: entry.utm_campaign },
        { label: 'Term', value: entry.utm_term },
        { label: 'Content', value: entry.utm_content },
        { label: 'GCLID', value: entry.gclid },
        { label: 'MSCLKID', value: entry.msclkid },
        { label: 'FBCLID', value: entry.fbclid }
      ].filter(f => f.value !== undefined && f.value !== null && f.value !== '');

      if (utmFields.length > 0) {
        messageText += `<b>🔗 UTM Tracking</b>\n`;
        for (const utm of utmFields) {
          messageText += `• <b>${utm.label}:</b> <code>${utm.value}</code>\n`;
        }
        messageText += `\n`;
      }

      // If a file was uploaded, resolve its URL and append it
      if (entry.file && entry.file.url) {
        const serverUrl = strapi.config.get('server.url') || '';
        const fileUrl = entry.file.url.startsWith('http') ? entry.file.url : `${serverUrl}${entry.file.url}`;
        messageText += `📁 <b>Attachment:</b> <a href="${fileUrl}">Download File</a>\n\n`;
      }

      if (bot) {
        await bot.sendMessage(chatId, messageText, { parse_mode: 'HTML' });
        strapi.log.info(`Telegram message sent successfully for application ID: ${entry.id}`);
      } else {
        strapi.log.error('Telegram bot client is not initialized.');
      }
    } catch (err) {
      strapi.log.error('Failed to process and send Telegram message for technician application:', err);
    }
  }
};
