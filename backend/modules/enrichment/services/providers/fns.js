/**
 * Провайдер ФНС ЕГРЮЛ
 * Документация: https://egrul.nalog.ru
 * Бесплатно, без ключа, официальный сервис ФНС России.
 *
 * Возвращает: полное наименование, ОГРН, КПП, юр. адрес, руководитель.
 * НЕ возвращает: телефон, email (этих данных нет в ЕГРЮЛ).
 */

const axios = require('axios');

const BASE_URL = 'https://egrul.nalog.ru';
const TIMEOUT = 15000;

/**
 * Из объекта адреса ЕГРЮЛ собирает читаемую строку
 */
function buildAddress(addr) {
  if (!addr) return null;
  const parts = [
    addr.index,
    addr.region,
    addr.district,
    addr.city,
    addr.locality,
    addr.street,
    addr.house ? `д. ${addr.house}` : null,
    addr.flat  ? `кв. ${addr.flat}`  : null,
  ].filter(Boolean);
  return parts.join(', ') || null;
}

/**
 * Нормализует ответ ЕГРЮЛ в единый формат enrichment-данных
 */
function normalizeResponse(item) {
  if (!item) return null;

  const result = {
    source: 'fns',
    fields: {},
  };

  // Полное наименование
  const fn = item.n || item.инн_ФЛ || item.full_name;
  if (fn) result.fields.fullName = fn;

  // Краткое наименование
  if (item.с) result.fields.name = item.с;

  // ИНН
  if (item.i) result.fields.inn = item.i;

  // ОГРН
  if (item.o) result.fields.ogrn = item.o;

  // КПП
  if (item.p) result.fields.kpp = item.p;

  // Адрес
  if (item.a) {
    const addr = buildAddress(item.a.a || item.a);
    if (addr) result.fields.legalAddress = addr;
  }

  // Руководитель
  const ceo = item.r || (item.СвРуководит && item.СвРуководит[0]);
  if (ceo) {
    const lastName  = ceo.f || ceo.фамилия || '';
    const firstName = ceo.i || ceo.имя || '';
    const middle    = ceo.o || ceo.отчество || '';
    const fullFio   = [lastName, firstName, middle].filter(Boolean).join(' ');
    if (fullFio) {
      result.fields.director         = fullFio;
      result.fields.directorPosition = ceo.должн || ceo.должность || 'Руководитель';
    }
  }

  // Дата регистрации
  if (item.d) result.fields.registrationDate = item.d;

  return Object.keys(result.fields).length > 0 ? result : null;
}

/**
 * Основная функция — ищет компанию по ИНН через API ЕГРЮЛ
 */
async function lookupByInn(inn) {
  if (!inn) throw new Error('ИНН не указан');

  // Шаг 1 — создать задачу поиска
  const searchResp = await axios.post(
    `${BASE_URL}/`,
    `query=${encodeURIComponent(inn.trim())}&mode=inn`,
    {
      timeout: TIMEOUT,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': BASE_URL,
        'User-Agent': 'Mozilla/5.0 TITAN-CRM/1.0',
      },
    }
  );

  const token = searchResp.data?.t;
  if (!token) {
    // Иногда результат возвращается сразу
    if (searchResp.data?.rows?.length > 0) {
      return normalizeResponse(searchResp.data.rows[0]);
    }
    throw new Error('ФНС ЕГРЮЛ: не удалось получить токен задачи');
  }

  // Шаг 2 — получить результат по токену (с ожиданием)
  let attempt = 0;
  while (attempt < 5) {
    await new Promise(r => setTimeout(r, 1000 + attempt * 500));
    attempt++;

    const resultResp = await axios.get(
      `${BASE_URL}/search-result?t=${token}`,
      {
        timeout: TIMEOUT,
        headers: { 'Referer': BASE_URL },
      }
    );

    const data = resultResp.data;

    // Если данные ещё не готовы
    if (data?.status === 'wait') continue;

    const rows = data?.rows || [];
    if (rows.length === 0) return null; // не найдено

    // Берём только точное совпадение по ИНН — не fallback на первый результат
    const exact = rows.find(r => r.i === inn.trim());
    if (!exact) {
      console.warn(`[enrichment] ФНС ЕГРЮЛ: точного совпадения по ИНН ${inn.trim()} не найдено`);
      return null;
    }
    return normalizeResponse(exact);
  }

  throw new Error('ФНС ЕГРЮЛ: превышено время ожидания ответа');
}

module.exports = { lookupByInn };
