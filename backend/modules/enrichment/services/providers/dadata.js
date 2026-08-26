/**
 * DaData провайдер
 * API docs: https://dadata.ru/api/find-party/
 * Бесплатно: 10 000 запросов/день после регистрации
 * API ключ хранится в system_settings -> 'dadata_api_key'
 */

const axios = require('axios');

const DADATA_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party';

/**
 * Нормализует данные DaData в единый формат обогащения
 */
function normalizeData(suggestion) {
  if (!suggestion || !suggestion.data) return null;
  const d = suggestion.data;

  const result = {};

  if (suggestion.value)           result.fullName = suggestion.value;
  if (d.inn)                      result.inn = d.inn;
  if (d.ogrn)                     result.ogrn = d.ogrn;
  if (d.kpp)                      result.kpp = d.kpp;
  if (d.okved)                    result.okved = d.okved;
  if (d.okpo)                     result.okpo = d.okpo;
  if (d.okato)                    result.okato = d.okato;
  if (d.capital?.value)           result.authorizedCapital = d.capital.value;
  if (d.address?.value)           result.legalAddress = d.address.value;
  if (d.management?.name)         result.director = d.management.name;
  if (d.management?.post)         result.directorPosition = d.management.post;
  if (d.state?.registration_date) {
    result.registrationDate = new Date(d.state.registration_date).toISOString().split('T')[0];
  }
  if (d.state?.status === 'LIQUIDATED') result.isLiquidated = true;

  // Краткое наименование
  if (d.name?.short_with_opf) result.name = d.name.short_with_opf;
  if (d.name?.full_with_opf)  result.fullName = d.name.full_with_opf;

  // Правовая форма
  if (d.opf?.short) result.legalForm = d.opf.short;
  if (d.opf?.code)  result.opfCode = d.opf.code;  // Код ОКОПФ для определения legalEntityType
  if (d.type)       result.entityType = d.type;    // LEGAL или INDIVIDUAL

  return result;
}

/**
 * Поиск по ИНН через DaData
 * @param {string} inn
 * @param {string} apiKey
 * @returns {object|null}
 */
async function lookupByInn(inn, apiKey) {
  if (!apiKey) throw new Error('DaData API ключ не настроен. Укажите его в Настройки → Интеграции.');
  if (!inn)    throw new Error('ИНН не указан');

  const response = await axios.post(
    DADATA_URL,
    { query: inn, count: 1 },
    {
      headers: {
        'Content-Type': 'application/json',
        'Accept':        'application/json',
        'Authorization': `Token ${apiKey}`,
      },
      timeout: 10000,
    }
  );

  const suggestions = response.data?.suggestions || [];
  if (suggestions.length === 0) return null;

  return normalizeData(suggestions[0]);
}

module.exports = { lookupByInn };
