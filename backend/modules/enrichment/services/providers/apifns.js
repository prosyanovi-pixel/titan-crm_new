/**
 * Провайдер api-fns.ru
 * Документация: https://api-fns.ru/api_help
 * Endpoint: GET https://api-fns.ru/api/egr?req=<ИНН>&key=<ключ>
 * API ключ хранится в system_settings -> 'apifns_api_key'
 */

const axios = require('axios');

const BASE_URL = 'https://api-fns.ru/api/egr';
const TIMEOUT = 15000;

/**
 * ОКОПФ → краткое обозначение правовой формы
 * api-fns.ru возвращает полное название ОКОПФ, приводим к стандартному сокращению
 */
function extractLegalForm(okopf) {
  if (!okopf) return null;
  const s = okopf.toLowerCase();
  if (s.includes('общество с ограниченной') || s.includes('обществ') && s.includes('ограниченной')) return 'ООО';
  if (s.includes('акционерное общество') && s.includes('публичн')) return 'ПАО';
  if (s.includes('акционерн') && s.includes('непубличн')) return 'НАО';
  if (s.includes('акционерн') && (s.includes('публичн') || s.includes('открыт'))) return 'АО';
  if (s.includes('закрытое акционерное') || s.includes('закрытых акционерных')) return 'ЗАО';
  if (s.includes('открытое акционерное') || s.includes('открытых акционерных')) return 'ОАО';
  if (s.includes('акционерн')) return 'АО';
  if (s.includes('индивидуальный предприниматель') || s.includes('индивидуальных предпринимателей')) return 'ИП';
  if (s.includes('государственное унитарное') || s.includes('государственных унитарных')) return 'ГУП';
  if (s.includes('муниципальное унитарное') || s.includes('муниципальных унитарных')) return 'МУП';
  if (s.includes('некоммерческое партнёрство') || s.includes('некоммерческое партнерство') || s.includes('некоммерческих партнерств')) return 'НП';
  if (s.includes('производственный кооператив') || s.includes('производственных кооперативов')) return 'ПК';
  if (s.includes('потребительский кооператив') || s.includes('потребительских кооперативов')) return 'ПотК';
  if (s.includes('автономная некоммерческая') || s.includes('автономных некоммерческих')) return 'АНО';
  if (s.includes('фонд') || s.includes('фондов')) return 'Фонд';
  if (s.includes('ассоциац')) return 'Ассоц.';
  if (s.includes('товарищество с ограниченной')) return 'ТОО';
  // Если не распознали — возвращаем как есть
  return okopf;
}

/**
 * Нормализует данные юридического лица (ЮЛ) в единый формат обогащения
 */
function normalizeYL(company) {
  const result = {};

  if (company['НаимСокрЮЛ'])  result.name             = company['НаимСокрЮЛ'];
  if (company['НаимПолнЮЛ'])  result.fullName          = company['НаимПолнЮЛ'];
  if (company['ИНН'])          result.inn               = company['ИНН'];
  if (company['ОГРН'])         result.ogrn              = company['ОГРН'];
  if (company['КПП'])          result.kpp               = company['КПП'];

  const addr = company['Адрес']?.['АдресПолн'];
  if (addr) result.legalAddress = addr;

  const director = company['Руководитель'];
  if (director?.['ФИОПолн'])  result.director          = director['ФИОПолн'];
  if (director?.['Должн'])    result.directorPosition   = director['Должн'];

  const regDate = company['ДатаРег'] || company['ДатаОГРН'];
  if (regDate) result.registrationDate = regDate.split('T')[0];

  const lf = extractLegalForm(company['ОКОПФ']);
  if (lf) result.legalForm = lf;

  // Телефон из Контакты.Телефон (массив)
  const phones = company['Контакты']?.['Телефон'];
  if (Array.isArray(phones) && phones.length > 0) result.phone = phones[0];

  // Email: сначала верхнеуровневый E-mail, иначе из Контакты
  const emailTop = company['E-mail'];
  const emailContact = company['Контакты']?.['e-mail'];
  if (emailTop) {
    result.email = emailTop.toLowerCase();
  } else if (Array.isArray(emailContact) && emailContact.length > 0) {
    result.email = emailContact[0].toLowerCase();
  }

  // Сайт
  const sites = company['Контакты']?.['Сайт'];
  if (Array.isArray(sites) && sites.length > 0) result.website = sites[0];

  // ОКВЭД (основной вид деятельности)
  const okved = company['ОснВидДеят'];
  if (okved?.['Код'])   result.okved     = okved['Код'];
  if (okved?.['Текст']) result.okvedName = okved['Текст'];

  // Уставный капитал
  const capital = company['Капитал'];
  if (capital?.['СумКап']) {
    const parsed = parseFloat(capital['СумКап']);
    if (!isNaN(parsed)) result.authorizedCapital = parsed;
  }

  // Статус (действующее / ликвидировано)
  const status = company['Статус'];
  if (status) {
    result.isActive = status === 'Действующее';
    result.orgStatus = status;
  }

  return result;
}

/**
 * Нормализует данные индивидуального предпринимателя (ИП) в единый формат обогащения
 */
function normalizeIP(ip) {
  const result = {};
  const fio = ip['ФИОПолн'];

  if (fio) {
    result.name             = 'ИП ' + fio;
    result.fullName         = 'Индивидуальный предприниматель ' + fio;
    result.director         = fio;
    result.directorPosition = 'Индивидуальный предприниматель';
  }

  if (ip['ИННФЛ'])   result.inn  = ip['ИННФЛ'];
  if (ip['ОГРНИП'])  result.ogrn = ip['ОГРНИП'];

  const addr = ip['Адрес']?.['АдресПолн'];
  if (addr) result.legalAddress = addr;

  const regDate = ip['ДатаРег'];
  if (regDate) result.registrationDate = regDate.split('T')[0];

  result.legalForm = 'ИП';

  // Телефон
  const phones = ip['Контакты']?.['Телефон'];
  if (Array.isArray(phones) && phones.length > 0) result.phone = phones[0];

  // Email
  const emailTop = ip['E-mail'];
  const emailContact = ip['Контакты']?.['e-mail'];
  if (emailTop) {
    result.email = emailTop.toLowerCase();
  } else if (Array.isArray(emailContact) && emailContact.length > 0) {
    result.email = emailContact[0].toLowerCase();
  }

  // Сайт
  const sites = ip['Контакты']?.['Сайт'];
  if (Array.isArray(sites) && sites.length > 0) result.website = sites[0];

  // ОКВЭД
  const okved = ip['ОснВидДеят'];
  if (okved?.['Код'])   result.okved     = okved['Код'];
  if (okved?.['Текст']) result.okvedName = okved['Текст'];

  // Статус
  const status = ip['Статус'];
  if (status) {
    result.isActive = status === 'Действующее';
    result.orgStatus = status;
  }

  return result;
}

/**
 * Поиск по ИНН через api-fns.ru
 * @param {string} inn
 * @param {string} apiKey
 * @returns {object|null}
 */
async function lookupByInn(inn, apiKey) {
  if (!apiKey) throw new Error('api-fns.ru API ключ не настроен. Укажите его в Настройки → Интеграции.');
  if (!inn)    throw new Error('ИНН не указан');

  const response = await axios.get(BASE_URL, {
    params: { req: inn, key: apiKey },
    timeout: TIMEOUT,
  });

  const items = response.data?.items || [];
  if (!items.length) return null;

  const item = items[0];

  if (item['ЮЛ']) {
    const data = normalizeYL(item['ЮЛ']);
    // Валидация ИНН
    if (data.inn && data.inn.replace(/\D/g, '') !== inn.replace(/\D/g, '')) {
      console.warn(`[enrichment] api-fns.ru: ИНН в ответе (${data.inn}) не совпадает с запросом (${inn})`);
      return null;
    }
    return data;
  }

  if (item['ИП']) {
    const data = normalizeIP(item['ИП']);
    if (data.inn && data.inn.replace(/\D/g, '') !== inn.replace(/\D/g, '')) {
      console.warn(`[enrichment] api-fns.ru: ИНН ИП в ответе (${data.inn}) не совпадает с запросом (${inn})`);
      return null;
    }
    return data;
  }

  return null;
}

module.exports = { lookupByInn };
