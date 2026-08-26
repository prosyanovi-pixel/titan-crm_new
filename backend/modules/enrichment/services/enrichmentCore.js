/**
 * Оркестратор обогащения данных контрагентов
 * Порядок провайдеров:
 *   1. Приоритетный сервис (настраивается в Интеграциях)
 *   2. Второй сервис (если настроен)
 *   3. egrul.nalog.ru — официальный ЕГРЮЛ, бесплатно, без ключа
 */

const db = require('../../../db');
const moduleSettingsLoader = require('../../../utils/moduleSettingsLoader');
const dadata   = require('./providers/dadata');
const apiFns   = require('./providers/apifns');
const nalogFns = require('./providers/nalog-fns');

const LEGAL_FORM_FALLBACKS = {
  individual: ['ip', 'self', 'private'],
  legal: ['ooo', 'ao', 'pao', 'nano', 'ano', 'np', 'gup', 'mup'],
  foreign: ['foreign'],
  private: ['private', 'self'],
};

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function canRegimeApplyToForm(regime, formCode) {
  const applies = regime.applies_to_legal_forms || regime.appliesToLegalForms || [];
  if (!Array.isArray(applies) || applies.length === 0) return true;
  return applies.includes(formCode);
}

async function resolveTaxRegimeId(enrichedData = {}) {
  const legalForm = normalizeText(enrichedData.legalForm);
  const legalEntityType = normalizeText(enrichedData.legalEntityType);
  const taxSystemRaw = normalizeText(enrichedData.taxSystem || enrichedData.taxRegimeCode || enrichedData.taxRegimeName);

  const { rows: regimes } = await db.query(
    `SELECT id, code, name, applies_to_legal_forms, is_active
       FROM finance_tax_regimes
      WHERE is_active = TRUE
      ORDER BY id`
  );

  if (!regimes.length) return null;

  // 1. Попробовать найти по коду/названию из данных
  if (taxSystemRaw) {
    const byCode = regimes.find((r) => normalizeText(r.code) === taxSystemRaw);
    if (byCode) return byCode.id;

    const byName = regimes.find((r) => normalizeText(r.name).includes(taxSystemRaw) || taxSystemRaw.includes(normalizeText(r.name)));
    if (byName) return byName.id;
  }

  // 2. Если не нашли, возвращаем null (не назначаем режим по умолчанию наугад)
  return null;
}

async function addDerivedFields(data = {}) {
  const enrichedData = { ...data };

  // status - активен если организация действующая
  if (data.state?.status === 'ACTIVE') {
    enrichedData.status = 'active';
  } else if (data.state?.status === 'LIQUIDATED') {
    enrichedData.status = 'inactive';
  } else if (data.state?.status === 'BANKRUPT') {
    enrichedData.status = 'paused';
  } else if (!enrichedData.status) {
    enrichedData.status = 'pending';
  }

  // legalForm + legalEntityType
  if (data.entityType === 'INDIVIDUAL') {
    enrichedData.legalForm = 'ip';
    enrichedData.legalEntityType = 'individual';
  } else if (data.opfCode) {
    const opfCode = data.opfCode;
    if (opfCode === '12247') {
      enrichedData.legalForm = 'pao';
      enrichedData.legalEntityType = 'legal';
    } else if (opfCode.startsWith('122')) {
      enrichedData.legalForm = 'ao';
      enrichedData.legalEntityType = 'legal';
    } else if (opfCode.startsWith('123')) {
      enrichedData.legalForm = 'nano';
      enrichedData.legalEntityType = 'legal';
    } else if (opfCode.startsWith('6')) {
      enrichedData.legalForm = 'ooo';
      enrichedData.legalEntityType = 'legal';
    } else if (opfCode.startsWith('1')) {
      enrichedData.legalForm = 'ao';
      enrichedData.legalEntityType = 'legal';
    } else if (opfCode.startsWith('7')) {
      enrichedData.legalForm = 'ip';
      enrichedData.legalEntityType = 'individual';
    } else if (opfCode.startsWith('5')) {
      enrichedData.legalForm = 'ano';
      enrichedData.legalEntityType = 'legal';
    } else if (opfCode.startsWith('4')) {
      enrichedData.legalForm = 'np';
      enrichedData.legalEntityType = 'legal';
    } else if (opfCode.startsWith('2')) {
      enrichedData.legalForm = 'gup';
      enrichedData.legalEntityType = 'legal';
    } else if (opfCode.startsWith('3')) {
      enrichedData.legalForm = 'mup';
      enrichedData.legalEntityType = 'legal';
    } else {
      enrichedData.legalForm = 'foreign';
      enrichedData.legalEntityType = 'foreign';
    }
  } else if (data.legalForm) {
    const lf = String(data.legalForm).toUpperCase();
    if (lf.includes('ИП') || lf.includes('INDIVIDUAL')) {
      enrichedData.legalForm = 'ip';
      enrichedData.legalEntityType = 'individual';
    } else if (lf.includes('ПАО')) {
      enrichedData.legalForm = 'pao';
      enrichedData.legalEntityType = 'legal';
    } else if (lf.includes('ООО')) {
      enrichedData.legalForm = 'ooo';
      enrichedData.legalEntityType = 'legal';
    } else if (lf.includes('АО') && !lf.includes('ПАО')) {
      enrichedData.legalForm = 'ao';
      enrichedData.legalEntityType = 'legal';
    } else if (lf.includes('АНО')) {
      enrichedData.legalForm = 'ano';
      enrichedData.legalEntityType = 'legal';
    } else {
      enrichedData.legalForm = 'foreign';
      enrichedData.legalEntityType = 'foreign';
    }
  }

  const taxRegimeId = await resolveTaxRegimeId(enrichedData);
  if (taxRegimeId != null) {
    enrichedData.taxRegimeId = taxRegimeId;
  }

  return enrichedData;
}

/** Получить настройку из настроек модуля или системных настроек */
async function getSetting(key) {
  try {
    // Сначала ищем в настройках модуля enrichment
    const modSettings = await moduleSettingsLoader.getModuleSettings('enrichment');
    
    // Если ключ в apiKeys
    if (modSettings.apiKeys && modSettings.apiKeys[key] !== undefined) {
      return modSettings.apiKeys[key];
    }
    
    // Если ключ в основной структуре
    if (modSettings[key] !== undefined) {
      return modSettings[key];
    }

    // Резервный вариант: старые системные настройки (на всякий случай)
    const { rows } = await db.query(
      'SELECT value FROM system_settings WHERE setting_key = $1', [key]
    );
    if (!rows.length) return null;
    let val = rows[0].value;
    if (typeof val === 'string') { try { val = JSON.parse(val); } catch {} }
    return val;
  } catch { return null; }
}

/** Попробовать получить данные из кеша (TTL = ttl_days дней) */
async function getCached(inn) {
  try {
    const { rows } = await db.query(
      `SELECT source, data FROM enrichment_cache
       WHERE inn = $1
         AND cached_at > NOW() - (ttl_days || ' days')::INTERVAL`,
      [inn]
    );
    return rows.length ? { source: rows[0].source, data: rows[0].data } : null;
  } catch { return null; }
}

/** Сохранить результат в кеш */
async function setCached(inn, source, data) {
  try {
    await db.query(
      `INSERT INTO enrichment_cache (inn, source, data, cached_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (inn) DO UPDATE
         SET source = EXCLUDED.source, data = EXCLUDED.data, cached_at = NOW()`,
      [inn, source, JSON.stringify(data)]
    );
  } catch (err) {
    console.warn('[enrichment] Не удалось сохранить кеш:', err.message);
  }
}

/**
 * Запросить данные из всех доступных источников для одного контрагента
 * @param {{id, inn, name}} contractor
 * @returns {{ source, data }|null}
 */
async function fetchEnrichmentData(contractor) {
  if (!contractor.inn) return { source: null, data: null, error: 'У контрагента не указан ИНН' };

  const inn = contractor.inn.replace(/\D/g, '');

  // --- Кеш (не тратим платные запросы повторно) ---
  const cached = await getCached(inn);
  if (cached) {
    console.log(`[enrichment] INN ${inn}: возвращаем из кеша (${cached.source})`);
    const enrichedData = await addDerivedFields(cached.data || {});
    return { source: cached.source + ' (cache)', data: enrichedData };
  }

  // --- Получаем API ключи из настроек модуля ---
  const modSettings = await moduleSettingsLoader.getModuleSettings('enrichment');
  const apiKeys = modSettings.apiKeys || {};
  
  const priorityService = apiKeys.priorityService || 'dadata';
  const dadataKey = apiKeys.dadataKey;
  const apiFnsKey = apiKeys.apifnsKey;
  
  console.log(`[enrichment] Приоритетный сервис: ${priorityService}`);
  console.log(`[enrichment] DaData ключ: ${dadataKey ? 'настроен' : 'не настроен'}`);
  console.log(`[enrichment] api-fns.ru ключ: ${apiFnsKey ? 'настроен' : 'не настроен'}`);

  // --- Формируем порядок провайдеров ---
  const providers = [];

  if (priorityService === 'apifns') {
    // Сначала api-fns.ru, потом DaData
    console.log('[enrichment] Порядок: api-fns.ru → DaData');
    if (apiFnsKey && typeof apiFnsKey === 'string' && apiFnsKey.trim()) {
      providers.push({ name: 'api-fns.ru', lookup: apiFns.lookupByInn, key: apiFnsKey.trim() });
    }
    if (dadataKey && typeof dadataKey === 'string' && dadataKey.trim()) {
      providers.push({ name: 'dadata', lookup: dadata.lookupByInn, key: dadataKey.trim() });
    }
  } else {
    // По умолчанию: сначала DaData, потом api-fns.ru
    console.log('[enrichment] Порядок: DaData → api-fns.ru');
    if (dadataKey && typeof dadataKey === 'string' && dadataKey.trim()) {
      providers.push({ name: 'dadata', lookup: dadata.lookupByInn, key: dadataKey.trim() });
    }
    if (apiFnsKey && typeof apiFnsKey === 'string' && apiFnsKey.trim()) {
      providers.push({ name: 'api-fns.ru', lookup: apiFns.lookupByInn, key: apiFnsKey.trim() });
    }
  }
  
  console.log(`[enrichment] Активных провайдеров: ${providers.length}`);

  // --- Пробуем провайдеров по порядку ---
  for (const provider of providers) {
    try {
      const data = await provider.lookup(inn, provider.key);
      if (data && Object.keys(data).length > 0) {
        await setCached(inn, provider.name, data);

        // Записываем статистику
        await db.query(
          'INSERT INTO enrichment_stats (service, inn, success) VALUES ($1, $2, TRUE)',
          [provider.name, inn]
        );

        const enrichedData = await addDerivedFields(data);

        console.log(`[enrichment] ✅ Бизнес-поля: status=${enrichedData.status}, legalEntityType=${enrichedData.legalEntityType}, legalForm=${enrichedData.legalForm}`);

        return { source: provider.name, data: enrichedData };
      }
    } catch (err) {
      console.warn(`[enrichment] ${provider.name} error for INN ${inn}:`, err.message);
      
      // Записываем ошибку в статистику
      await db.query(
        'INSERT INTO enrichment_stats (service, inn, success, error_message) VALUES ($1, $2, FALSE, $3)',
        [provider.name, inn, err.message]
      );
    }
  }

  // --- Попытка 3: egrul.nalog.ru (бесплатно, без ключа) ---
  try {
    const data = await nalogFns.lookupByInn(inn);
    if (data && Object.keys(data).length > 0) {
      const enrichedData = await addDerivedFields(data);
      return { source: 'egrul.nalog.ru', data: enrichedData };
    }
  } catch (err) {
    console.warn(`[enrichment] egrul.nalog.ru error for INN ${inn}:`, err.message);
    return { source: null, data: null, error: err.message };
  }

  return { source: null, data: null, error: 'Данные не найдены ни в одном источнике' };
}

/**
 * Маппинг полей enrichment → поля таблицы contractors
 */
const FIELD_MAP = {
  name:               'name',
  fullName:           'full_name',
  inn:                'inn',
  ogrn:               'ogrn',
  kpp:                'kpp',
  legalAddress:       'legal_address',
  director:           'director',
  directorPosition:   'director_position',
  registrationDate:   'registration_date',
  legalForm:          'legal_form',
  legalEntityType:    'legal_entity_type',  // Правовая сущность (ИП/ЮЛ/Физлицо/Иностранная)
  taxRegimeId:        'tax_regime_id',
  phone:              'phone',
  email:              'email',
  website:            'website',
  okved:              'okved',
  okvedName:          'okved_name',
  okpo:               'okpo',
  okato:              'okato',
  authorizedCapital:  'authorized_capital',
  isActive:           'is_active',
  // Бизнес-поля (автоматическое заполнение)
  status:             'status',           // active/pending/vip/paused
  manager:            'manager',          // ответственный менеджер
  // type - НЕ заполняется при обогащении! Это тип отношений (клиент/партнер), а не юр.форма
};

/** Человекочитаемые названия полей */
const FIELD_LABELS = {
  name:              'Краткое наименование',
  fullName:          'Полное наименование',
  inn:               'ИНН',
  ogrn:              'ОГРН',
  kpp:               'КПП',
  legalAddress:      'Юридический адрес',
  director:          'Руководитель (ФИО)',
  directorPosition:  'Должность руководителя',
  registrationDate:  'Дата регистрации',
  legalForm:         'Правовая форма',
  legalEntityType:   'Правовая сущность',
  taxRegimeId:       'Система налогообложения',
  phone:             'Телефон',
  email:             'E-mail',
  website:           'Сайт',
  okved:             'ОКВЭД (код)',
  okvedName:         'ОКВЭД (описание)',
  okpo:              'ОКПО',
  okato:             'ОКАТО',
  authorizedCapital: 'Уставный капитал',
  isActive:          'Статус (действующее)',
  // Бизнес-поля
  status:            'Статус контрагента',
  manager:           'Ответственный менеджер',
};

/**
 * Сохранить выбранные поля в БД
 * @param {number} contractorId
 * @param {object} currentData  — текущие данные контрагента
 * @param {object} newData      — новые данные от источника
 * @param {string[]} fields     — поля для применения
 * @param {string} source
 * @param {number} userId
 */
async function applyEnrichment(contractorId, currentData, newData, fields, source, userId) {
  const setClauses = [];
  const values = [];
  const updatedFields = [];

  for (const field of fields) {
    const dbCol = FIELD_MAP[field];
    if (!dbCol || newData[field] === undefined) continue;

    // === ВАЖНО: Не перезаписываем бизнес-поля если они уже заполнены ===
    
    // 1. manager - не перезаписываем если уже заполнен
    if (field === 'manager') {
      if (currentData.manager && String(currentData.manager).trim()) {
        console.log(`[enrichment] ⚠️ Пропускаем поле '${field}' — уже заполнено (${currentData.manager})`);
        continue;
      } else {
        // Если поле пустое — заполняем текущим пользователем
        if (userId) {
          newData[field] = userId;
          console.log(`[enrichment] ✅ Заполняем manager: ${userId}`);
        } else {
          console.log(`[enrichment] ⚠️ Пропускаем поле '${field}' — нет userId`);
          continue;
        }
      }
    }

    values.push(newData[field]);
    setClauses.push(`${dbCol} = $${values.length}`);
    updatedFields.push(field);
  }

  if (setClauses.length === 0) return { updated: 0, fields: [] };

  values.push(contractorId);
  await db.query(
    `UPDATE contractors SET ${setClauses.join(', ')}, updated_at = NOW(), enriched_at = NOW()
     WHERE id = $${values.length}`,
    values
  );

  // Лог
  const dataBefore = {};
  const dataAfter  = {};
  for (const f of updatedFields) {
    const dbCol = FIELD_MAP[f];
    dataBefore[f] = currentData[dbCol] ?? currentData[f] ?? null;
    dataAfter[f]  = newData[f];
  }

  await db.query(
    `INSERT INTO enrichment_log
       (contractor_id, source, status, data_before, data_after, fields_updated, created_by)
     VALUES ($1, $2, 'applied', $3, $4, $5, $6)`,
    [contractorId, source, JSON.stringify(dataBefore), JSON.stringify(dataAfter), updatedFields, userId || null]
  );

  return { updated: updatedFields.length, fields: updatedFields };
}

module.exports = { fetchEnrichmentData, applyEnrichment, FIELD_MAP, FIELD_LABELS };
