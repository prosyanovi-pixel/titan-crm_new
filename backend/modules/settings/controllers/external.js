/**
 * Контроллер внешних интеграций (DaData, API-FNS и др.)
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../../../db');
const logger = require('../../../utils/logger');
const { asyncHandler } = require('../../../utils/errorHandler');
const moduleSettingsLoader = require('../../../utils/moduleSettingsLoader');
const { sendSuccess, sendValidationError, sendNotFound } = require('../../../utils/responseHelpers');

/**
 * Получить API ключ DaData из настроек
 */
async function getDadataKey() {
  const settings = await moduleSettingsLoader.getModuleSettings('enrichment');
  return settings.apiKeys?.dadataKey || null;
}

/**
 * Получить API ключ API-FNS из настроек
 */
async function getApifnsKey() {
  const settings = await moduleSettingsLoader.getModuleSettings('enrichment');
  return settings.apiKeys?.apifnsKey || null;
}

/**
 * GET /api/settings/external/dadata
 */
async function dadataInfo(req, res) {
  sendSuccess(res, { message: 'Dadata API. Use /dadata/suggest/party (POST) or /dadata/party (POST) for details.' });
}

/**
 * POST /api/settings/external/dadata/suggest/party
 */
async function dadataSuggest(req, res) {
  const apiKey = await getDadataKey();
  
  if (!apiKey) {
    return res.status(400).json({ error: 'API ключ DaData не настроен' });
  }
  
  const { query, count = 10, filters = {} } = req.body;
  
  if (!query || query.trim().length === 0) {
    return sendSuccess(res, { suggestions: [] });
  }
  
  const dadataRequest = {
    query: query.trim(),
    count: Math.min(count, 20),
  };
  
  if (filters.type) dadataRequest.type = filters.type;
  if (filters.status) dadataRequest.status = filters.status;
  if (filters.okved) dadataRequest.okved = filters.okved;
  if (filters.locations) dadataRequest.locations = filters.locations;
  
  const response = await axios.post(
    'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party',
    dadataRequest,
    {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Token ${apiKey}`,
      },
      timeout: 10000,
    }
  );
  
  sendSuccess(res, response.data);
}

/**
 * POST /api/settings/external/dadata/party
 */
async function dadataParty(req, res) {
  const apiKey = await getDadataKey();
  
  if (!apiKey) {
    return res.status(400).json({ error: 'API ключ DaData не настроен' });
  }
  
  const { inn } = req.body;
  if (!inn) return sendValidationError(res, 'ИНН обязателен');
  
  const response = await axios.post(
    'https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party',
    { query: inn },
    {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Token ${apiKey}`,
      },
      timeout: 10000,
    }
  );
  
  sendSuccess(res, response.data);
}

/**
 * GET /api/settings/external/dadata/check-key
 */
async function checkDadataKey(req, res) {
  const apiKey = await getDadataKey();
  
  if (!apiKey) {
    return sendSuccess(res, { valid: false, message: 'API ключ не настроен' });
  }
  
  try {
    await axios.post(
      'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party',
      { query: '7707083893', count: 1 },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Token ${apiKey}`,
        },
        timeout: 5000,
      }
    );
    
    sendSuccess(res, { valid: true, message: 'API ключ работает' });
  } catch (err) {
    let message = `Ошибка: ${err.message}`;
    if (err.response?.status === 403) message = 'Неверный API ключ или исчерпан лимит';
    else if (err.response?.status === 401) message = 'API ключ не подтверждён';
    
    sendSuccess(res, { valid: false, message });
  }
}

/**
 * GET /api/settings/external/dadata/stat
 */
async function dadataStat(req, res) {
  const apiKey = await getDadataKey();
  if (!apiKey) return sendNotFound(res, 'Ключ DaData не настроен');

  // Получаем статистику за сегодня
  const { rows: todayStats } = await db.query(
    `SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE success = TRUE) AS successful
     FROM enrichment_stats
     WHERE service = 'dadata' AND DATE(requested_at) = CURRENT_DATE`
  );

  // Получаем статистику по дням (последние 7 дней)
  const { rows: dailyStats } = await db.query(
    `SELECT DATE(requested_at) AS date, 
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE success = TRUE) AS successful
     FROM enrichment_stats
     WHERE service = 'dadata' AND requested_at >= CURRENT_DATE - INTERVAL '6 days'
     GROUP BY DATE(requested_at)
     ORDER BY date DESC`
  );

  sendSuccess(res, {
    today: {
      total: parseInt(todayStats[0]?.total || 0),
      successful: parseInt(todayStats[0]?.successful || 0),
      remaining: Math.max(0, 10000 - (todayStats[0]?.total || 0)),
      limit: 10000
    },
    daily: dailyStats.map(row => ({
      date: row.date,
      total: parseInt(row.total),
      successful: parseInt(row.successful)
    }))
  });
}

/**
 * GET /api/settings/external/apifns/stat
 */
async function apifnsStat(req, res) {
  const key = await getApifnsKey();
  if (!key) return sendNotFound(res, 'Ключ api-fns.ru не настроен');

  try {
    const response = await axios.get('https://api-fns.ru/api/stat', {
      params: { key: key.trim() },
      timeout: 10000,
    });
    sendSuccess(res, response.data);
  } catch (err) {
    if (err.response?.status === 403) {
      const ipMessage = err.response?.data?.toString() || '';
      const ipMatch = ipMessage.match(/\((\d+\.\d+\.\d+\.\d+)\)/);
      const blockedIp = ipMatch ? ipMatch[1] : 'неизвестен';
      
      return res.status(403).json({
        error: 'Доступ запрещён',
        message: `IP-адрес ${blockedIp} заблокирован в настройках api-fns.ru`,
        hint: 'Добавьте этот IP в личном кабинете api-fns.ru в разделе настроек API доступа'
      });
    }
    res.status(502).json({ error: err.message });
  }
}

// Маршруты
router.get('/dadata', asyncHandler(dadataInfo));
router.post('/dadata/suggest/party', asyncHandler(dadataSuggest));
router.post('/dadata/party', asyncHandler(dadataParty));
router.get('/dadata/check-key', asyncHandler(checkDadataKey));
router.get('/dadata/stat', asyncHandler(dadataStat));
router.get('/apifns/stat', asyncHandler(apifnsStat));

module.exports = router;
