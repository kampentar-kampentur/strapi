'use strict';

const TelegramBot = require('node-telegram-bot-api');

const TGtoken = process.env.TG_TOKEN;
const chatId = process.env.TG_CHAT_ID;
const bot = new TelegramBot(TGtoken);

module.exports = {
  sendMessage: (text, options = {}) => {
    // return bot.sendMessage(chatId, text, options);
    return true;
  }
};