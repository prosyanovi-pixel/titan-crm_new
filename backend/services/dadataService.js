/**
 * Сервис для работы с DaData API
 * Справочники: суды, адреса, организации
 *
 * API-ключ читается из настроек модуля enrichment (moduleSettingsLoader),
 * где он хранится под путём apiKeys.dadataKey — так же, как используется
 * при обогащении контрагентов.
 */

const logger = require('../utils/logger');
const moduleSettingsLoader = require('../utils/moduleSettingsLoader');

const DADATA_BASE = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs';

/**
 * Получить API-ключ DaData из настроек модуля enrichment (хранится в БД)
 * @returns {Promise<string>}
 * @throws {Error} если ключ не настроен
 */
async function getApiKey() {
  const settings = await moduleSettingsLoader.getModuleSettings('enrichment');
  const key = settings?.apiKeys?.dadataKey;

  if (!key || typeof key !== 'string' || !key.trim()) {
    throw new Error(
      'DaData API-ключ не настроен. Перейдите в Настройки → Интеграции и укажите ключ DaData.'
    );
  }

  return key.trim();
}

/**
 * Универсальный метод запроса к DaData Suggestions API
 * @param {string} endpoint - путь, например suggest/court или findById/court
 * @param {object} body - тело запроса
 * @returns {Promise<object>}
 */
async function dadataRequest(endpoint, body) {
  const token = await getApiKey();
  const url = `${DADATA_BASE}/${endpoint}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Token ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    logger.error('[DaData] Request failed', { endpoint, status: response.status, body: text });
    throw new Error(`DaData API error: ${response.status} ${text}`);
  }

  return response.json();
}

/**
 * Полнотекстовый поиск судов по DaData
 * @param {string} query - поисковый запрос (минимум 2 символа)
 * @param {object} [options]
 * @param {string} [options.courtType] - фильтр по типу суда (AS, RS, MS, OS и т.д.)
 * @param {number} [options.count] - количество результатов (max 20)
 * @returns {Promise<Array>} - массив нормализованных записей о судах
 */
async function suggestCourts(query, { courtType, count = 10 } = {}) {
  const body = { query, count };

  if (courtType) {
    body.filters = [{ court_type: courtType }];
  }

  const result = await dadataRequest('suggest/court', body);
  return (result.suggestions || []).map(normalizeCourt);
}

/**
 * Найти суд по коду DaData
 * @param {string} code - код суда (data.code из DaData)
 * @returns {Promise<object|null>}
 */
async function findCourtByCode(code) {
  const result = await dadataRequest('findById/court', { query: code });
  const suggestions = result.suggestions || [];
  return suggestions.length > 0 ? normalizeCourt(suggestions[0]) : null;
}

/**
 * Нормализовать запись суда из DaData в формат для CRM
 * @param {object} suggestion - запись из DaData API
 * @returns {object}
 */
function normalizeCourt(suggestion) {
  const d = suggestion.data || {};
  return {
    name:          suggestion.value || d.name || '',
    dadataCode:    d.code          || null,
    courtType:     d.court_type    || null,
    courtTypeName: d.court_type_name || null,
    inn:           d.inn           || null,
    address:       d.address       || null,
    legalAddress:  d.legal_address || null,
    website:       d.website       || null,
  };
}

module.exports = {
  suggestCourts,
  findCourtByCode,
  normalizeCourt,
};
