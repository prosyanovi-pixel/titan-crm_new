/**
 * Провайдер данных по ИНН: парсинг rusprofile.ru + Яндекс
 * API ключи не нужны.
 */

const axios   = require('axios');
const cheerio = require('cheerio');

const BROWSER_HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.5',
  'Connection':      'keep-alive',
};

// ─── RusProfile парсер ────────────────────────────────────────────────────────

function parseRusProfileCard($) {
  const result = {};
  const t = (sel) => $(sel).first().text().trim() || null;

  // Наименование
  result.name = t('h1.company-title') || t('h1') || null;
  if (result.name) result.name = result.name.replace(/\s+/g, ' ').trim();

  // ИНН / КПП / ОГРН — у них есть id-якоря с чистыми значениями
  result.inn  = t('#clip_inn')  || null;
  result.kpp  = t('#clip_kpp')  || null;
  result.ogrn = t('#clip_ogrn') || t('#clip_ogrnip') || null;

  // Очищаем от нецифровых символов
  if (result.inn)  result.inn  = result.inn.replace(/\D/g, '');
  if (result.kpp)  result.kpp  = result.kpp.replace(/\D/g, '');
  if (result.ogrn) result.ogrn = result.ogrn.replace(/\D/g, '');

  const isIP = result.inn && result.inn.length === 12;

  // Дата регистрации
  const dateEl = $('[itemprop="foundingDate"]').first().text().trim();
  if (dateEl) {
    const m = dateEl.match(/(\d{2})\.(\d{2})\.(\d{4})/);
    if (m) result.registrationDate = `${m[3]}-${m[2]}-${m[1]}`;
  }
  // Для ИП: дата регистрации может быть в другом месте
  if (!result.registrationDate) {
    $('dt, .company-info__title, .info-row__title').each((_, el) => {
      const label = $(el).text().toLowerCase();
      if (label.includes('дата регистрации') || label.includes('зарегистрирован')) {
        const val = $(el).next().text().trim();
        const m = val.match(/(\d{2})\.(\d{2})\.(\d{4})/);
        if (m) result.registrationDate = `${m[3]}-${m[2]}-${m[1]}`;
      }
    });
  }

  // Для ИП: адрес проживания / регистрации
  $('dt, .company-info__title, .info-row__title').each((_, el) => {
    const label = $(el).text().toLowerCase();
    const next  = $(el).next();

    if ((label.includes('юридический адрес') || label.includes('адрес') || label.includes('место жительства') || label.includes('регистрации')) && !result.legalAddress) {
      const val = next.find('[itemprop="streetAddress"], .company-info__text').first().text().trim()
               || next.text().trim();
      if (val && val.length > 5) result.legalAddress = val.replace(/\s+/g, ' ');
    }

    if (!isIP && label.includes('руководитель') && !result.director) {
      result.directorPosition = next.find('.chief-title').first().text().trim() || null;
      result.director = next.find('.company-info__text a').first().text().trim()
                     || next.find('.company-info__text').first().text().trim()
                     || null;
      if (result.director) result.director = result.director.replace(/\s+/g, ' ');
      if (result.directorPosition) result.directorPosition = result.directorPosition.replace(/\s+/g, ' ');
    }
  });

  // Для ИП: ФИО предпринимателя — сам он и есть «директор»/владелец
  if (isIP && !result.director) {
    // Имя ИП обычно в h1 или в специальном блоке
    const ipName = t('.ip-fio, .person-name, [itemprop="name"]');
    if (ipName && ipName !== result.name) {
      result.director = ipName.replace(/\s+/g, ' ');
    } else if (result.name) {
      // Убираем "ИП " из начала названия если есть
      const cleaned = result.name.replace(/^ИП\s+/i, '').trim();
      if (cleaned && cleaned !== result.name) result.director = cleaned;
    }
    result.directorPosition = 'Индивидуальный предприниматель';
  }

  // Альтернатива для адреса через itemprop
  if (!result.legalAddress) {
    result.legalAddress = $('[itemprop="address"]').first().text().trim().replace(/\s+/g, ' ') || null;
  }

  // Полное наименование для ИП
  if (isIP && !result.fullName && result.name) {
    if (!result.name.toLowerCase().startsWith('индивидуальный')) {
      result.fullName = result.name.replace(/^ИП\s+/i, 'Индивидуальный предприниматель ');
    }
  }

  // Правовая форма
  if (isIP) {
    result.legalForm = 'ИП';
  } else if (result.name) {
    const m = result.name.match(/^(ООО|АО|ПАО|ЗАО|ОАО|АНО|НКО|ГУП|МУП|ФГУП|ФГБУ|СНТ)\b/i);
    if (m) result.legalForm = m[1].toUpperCase();
  }

  // Убираем пустые поля
  Object.keys(result).forEach(k => { if (!result[k]) delete result[k]; });

  return Object.keys(result).length >= 2 ? result : null;
}

async function lookupRusProfile(inn) {
  const cleanInn = String(inn).replace(/\D/g, '');
  // ИП имеет 12-значный ИНН, юр. лицо — 10-значный
  const type = cleanInn.length === 12 ? 'ip' : 'ul';
  const url = `https://www.rusprofile.ru/search?query=${cleanInn}&type=${type}`;
  const res = await axios.get(url, {
    headers: BROWSER_HEADERS,
    timeout: 15000,
    maxRedirects: 10,
  });
  const $ = cheerio.load(res.data);

  // Если поиск вернул список — переходим на карточку первого результата
  const firstLink = $('a.company-item__title, a.company-name, .search-results a').first().attr('href');
  let data;
  if (firstLink) {
    const cardUrl = firstLink.startsWith('http') ? firstLink : `https://www.rusprofile.ru${firstLink}`;
    const cardRes = await axios.get(cardUrl, { headers: BROWSER_HEADERS, timeout: 15000, maxRedirects: 5 });
    data = parseRusProfileCard(cheerio.load(cardRes.data));
  } else {
    // Поиск редиректнул прямо на карточку
    data = parseRusProfileCard($);
  }

  // Проверяем, что ИНН в ответе совпадает с запрошенным
  if (!data) return null;
  if (data.inn && data.inn.replace(/\D/g, '') !== cleanInn) {
    console.warn(`[enrichment] RusProfile ИНН не совпадает: запросили ${cleanInn}, получили ${data.inn}`);
    return null;
  }
  return data;
}

// ─── Яндекс парсер (fallback) ─────────────────────────────────────────────────

async function lookupYandex(inn) {
  const res = await axios.get(
    `https://yandex.ru/search/?text=${encodeURIComponent(inn + ' реквизиты ОГРН')}&lr=213`,
    { headers: { ...BROWSER_HEADERS, 'Referer': 'https://yandex.ru/' }, timeout: 15000 }
  );
  const $ = cheerio.load(res.data);
  const result = {};

  // Яндекс рисует Knowledge-карточку, ищем ИНН, ОГРН, адрес в тексте
  const bodyText = $.text().replace(/\s+/g, ' ');
  const rx = (label, len = 30) => {
    const m = bodyText.match(new RegExp(label + '[:\\s]+([\\w\\s,./-]{2,' + len + '})(?:[,.]|\\s{2}|$)', 'i'));
    return m ? m[1].trim() : null;
  };

  result.ogrn = (bodyText.match(/ОГРН[:\s]*(\d{13,15})/)?.[1]) || null;
  result.kpp  = (bodyText.match(/КПП[:\s]*(\d{9})/)?.[1])  || null;
  result.director = rx('Руководитель') || rx('Директор') || rx('Генеральный директор', 40);
  result.legalAddress = rx('Адрес', 100);

  Object.keys(result).forEach(k => { if (!result[k]) delete result[k]; });
  return Object.keys(result).length >= 2 ? result : null;
}

// ─── Публичный метод: поиск по ИНН ──────────────────────────────────────────

async function lookupByInn(inn) {
  if (!inn) throw new Error('ИНН не указан');
  const cleanInn = String(inn).replace(/\D/g, '');

  try {
    const data = await lookupRusProfile(cleanInn);
    // lookupRusProfile уже проверяет совпадение ИНН, null — несовпадение
    if (data && Object.keys(data).length > 0) return data;
  } catch (e) {
    console.warn('[enrichment] RusProfile ошибка:', e.message);
  }

  // Яндекс не извлекает ИНН — не используем как fallback для поиска по ИНН,
  // чтобы не вернуть данные другой компании
  return null;
}

// ─── Публичный метод: поиск по произвольному запросу ────────────────────────
// query — ИНН, ОГРН, название компании или любая другая строка

async function lookupByQuery(query) {
  if (!query || !query.trim()) throw new Error('Поисковый запрос не указан');
  const q = query.trim();

  // Числовая строка — пробуем как ИНН/ОГРН
  if (/^\d+$/.test(q)) {
    try {
      const data = await lookupRusProfile(q);
      // lookupRusProfile уже проверяет совпадение ИНН
      if (data && Object.keys(data).length >= 2) return { data, source: 'rusprofile.ru' };
    } catch (e) {
      console.warn('[enrichment] RusProfile by numeric query ошибка:', e.message);
    }
    // Если 12-значный ИНН — не пробуем ul ещё раз
  }

  // Поиск по имени / смешанному запросу через rusprofile
  try {
    const encoded = encodeURIComponent(q);
    // Пробуем сначала ЮЛ, потом ИП
    for (const type of ['ul', 'ip']) {
      const url = `https://www.rusprofile.ru/search?query=${encoded}&type=${type}`;
      const res = await axios.get(url, {
        headers: BROWSER_HEADERS,
        timeout: 15000,
        maxRedirects: 10,
      });
      const $ = cheerio.load(res.data);

      // Если поиск выдал список — берём первый результат
      const firstLink = $('a.company-item__title, a.company-name, .search-results a').first().attr('href');
      if (firstLink) {
        const cardUrl = firstLink.startsWith('http') ? firstLink : `https://www.rusprofile.ru${firstLink}`;
        const cardRes = await axios.get(cardUrl, { headers: BROWSER_HEADERS, timeout: 15000, maxRedirects: 5 });
        const $card = cheerio.load(cardRes.data);
        const data = parseRusProfileCard($card);
        if (data && Object.keys(data).length >= 2) return { data, source: 'rusprofile.ru' };
      } else {
        // Поиск сразу редиректнул на карточку
        const data = parseRusProfileCard($);
        if (data && Object.keys(data).length >= 2) return { data, source: 'rusprofile.ru' };
      }
    }
  } catch (e) {
    console.warn('[enrichment] RusProfile by query ошибка:', e.message);
  }

  // Fallback — Яндекс
  try {
    const data = await lookupYandex(q);
    if (data && Object.keys(data).length >= 2) return { data, source: 'yandex.ru' };
  } catch (e) {
    console.warn('[enrichment] Yandex парсинг ошибка:', e.message);
  }

  return null;
}

module.exports = { lookupByInn, lookupByQuery };
