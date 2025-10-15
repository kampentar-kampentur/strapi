const axios = require('axios');
// ВАЖНО: PAGE_ACCESS_TOKEN должен иметь необходимые разрешения (leads_retrieval, pages_read_engagement).
const PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN; 
const API_VERSION = 'v24.0'; // Используем актуальную версию API

async function getLeadData(leadId) {
  // Эндпоинт для получения данных одного лида
  const url = `https://graph.facebook.com/${API_VERSION}/${leadId}?access_token=${PAGE_ACCESS_TOKEN}`;
  const res = await axios.get(url);
  return res.data;
}

/**
 * Получает список всех лидов для данной страницы за последние N дней.
 * @param {string} pageId - ID страницы Facebook.
 * @param {number} days - Количество дней для поиска (по умолчанию 2 дня).
 * @returns {Promise<object>} - Объект с данными лидов.
 */
async function getRecentLeads(adgroupId = '120233595307300176', days = 2) {
  // Вычисляем Unix-таймстамп для "2 дня назад"
  const sinceTimestamp = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);

  // Эндпоинт: /<PAGE_ID>/leads
  const url = `https://graph.facebook.com/${API_VERSION}/${adgroupId}/leads`;
  
  const params = {
    access_token: PAGE_ACCESS_TOKEN,
    // Запрашиваемые поля (можете добавить больше, если нужно)
    fields: 'ad_id,form_id,created_time,leadgen_id,field_data', 
    // Фильтр по времени создания
    since: sinceTimestamp, 
    // Ограничение на количество возвращаемых результатов
    limit: 100 
  };
  
  try {
    const res = await axios.get(url, { params });
    return res.data;
  } catch (err) {
    // Детальное логирование ошибки Graph API
    if (err.response && err.response.data) {
      throw new Error(`Facebook API Error: ${JSON.stringify(err.response.data)}`);
    }
    throw err;
  }
}

module.exports = { 
    getLeadData,
    getRecentLeads 
};