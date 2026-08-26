/**
 * Оптимизированная загрузка данных контрагентов (батч-запросы, снижение N+1)
 * Используется для `getAll()` и группировки запросов
 */

const db = require('../../../db');

/**
 * Батч-загрузка связанных данных для множества контрагентов
 * Вместо N+1 запросов (3 запроса на контрагента), делает 3 общих запроса
 * 
 * @param {Array<number>} contractorIds - ID контрагентов
 * @returns {Promise<Object>} {
 *   tags: { contractorId: [tags] },
 *   bankAccounts: { contractorId: [accounts] },
 *   contacts: { contractorId: [contacts] }
 * }
 */
async function batchLoadContractorRelations(contractorIds) {
  if (!contractorIds || contractorIds.length === 0) {
    return { tags: {}, bankAccounts: {}, contacts: {}, documents: {} };
  }

  // Одна query для всех тегов вместо N
  const tagsRes = await db.query(
    'SELECT contractor_id, tag FROM contractor_tags WHERE contractor_id = ANY($1)',
    [contractorIds]
  );
  const tags = {};
  tagsRes.rows.forEach(row => {
    const cid = row.contractorId || row.contractor_id;
    if (!tags[cid]) tags[cid] = [];
    tags[cid].push(row.tag);
  });

  // Одна query для всех счетов вместо N
  const banksRes = await db.query(
    'SELECT * FROM contractor_bank_accounts WHERE contractor_id = ANY($1)',
    [contractorIds]
  );
  const bankAccounts = {};
  banksRes.rows.forEach(row => {
    const cid = row.contractorId || row.contractor_id;
    if (!bankAccounts[cid]) bankAccounts[cid] = [];
    bankAccounts[cid].push(row);
  });

  // Одна query для всех контактов вместо N
  const contactsRes = await db.query(
    'SELECT * FROM contractor_contacts WHERE contractor_id = ANY($1)',
    [contractorIds]
  );
  const contacts = {};
  contactsRes.rows.forEach(row => {
    const cid = row.contractorId || row.contractor_id;
    if (!contacts[cid]) contacts[cid] = [];
    contacts[cid].push(row);
  });

  // Одна query для всех документов вместо N
  const documentsRes = await db.query(
    'SELECT * FROM contractor_documents WHERE contractor_id = ANY($1)',
    [contractorIds]
  );
  const documents = {};
  documentsRes.rows.forEach(row => {
    const cid = row.contractorId || row.contractor_id;
    if (!documents[cid]) documents[cid] = [];
    documents[cid].push(row);
  });

  return { tags, bankAccounts, contacts, documents };
}

/**
 * Кэшированная загрузка справочников (менеджеры, статусы, типы)
 * Запросы выполняются один раз при инициализации
 * 
 * @returns {Promise<Object>} { managers, statuses, types }
 */
const referenceCache = { initialized: false, data: {} };

async function loadReferences() {
  if (referenceCache.initialized) {
    return referenceCache.data;
  }

  // Загружаем менеджеров
  const managersRes = await db.query(
    "SELECT id, name, avatar FROM users WHERE role IN ('manager', 'admin', 'Менеджер', 'Администратор')"
  );
  const managers = {};
  managersRes.rows.forEach(row => {
    managers[row.id] = { name: row.name, avatar: row.avatar };
    managers[String(row.id)] = { name: row.name, avatar: row.avatar };
    // Also index by name for contractors that store manager name instead of ID
    if (row.name) managers[row.name] = { name: row.name, avatar: row.avatar };
  });

  // Загружаем статусы
  const statusesRes = await db.query('SELECT id, name FROM contractor_status');
  const statuses = {};
  statusesRes.rows.forEach(row => {
    statuses[row.id] = row.name;
    statuses[String(row.id)] = row.name;
  });

  // Загружаем типы отношений
  const typesRes = await db.query('SELECT id, name FROM relationship_type');
  const types = {};
  typesRes.rows.forEach(row => {
    types[row.id] = row.name;
    types[String(row.id)] = row.name;
  });

  referenceCache.data = { managers, statuses, types };
  referenceCache.initialized = true;
  return referenceCache.data;
}

/**
 * Очистить кэш справочников (полезно для тестов и дебага)
 */
function clearReferenceCache() {
  referenceCache.initialized = false;
  referenceCache.data = {};
}

/**
 * Обогатить контрагентов справочными данными
 * @param {Array} contractors - Контрагенты с загруженными relations
 * @param {Object} references - Результат loadReferences()
 * @returns {Array} Обогащенные контрагенты
 */
function enrichContractorsWithReferences(contractors, references) {
  return contractors.map(c => {
    if (c.manager && references.managers[c.manager]) {
      const managerInfo = references.managers[c.manager];
      c.managerAvatar = managerInfo.avatar || null;
      c.manager = managerInfo.name;
    } else if (c.manager) {
      c.manager = String(c.manager);
    }

    if (c.status && references.statuses[c.status]) {
      c.statusName = references.statuses[c.status];
    } else if (c.status) {
      c.statusName = c.status.charAt(0).toUpperCase() + c.status.slice(1);
    }

    if (c.type && references.types[c.type]) {
      c.typeName = references.types[c.type];
    } else if (c.type) {
      c.typeName = c.type;
    }

    return c;
  });
}

/**
 * Полная загрузка контрагентов с relations и references
 * Входит: массив контрагентов из БД
 * Выходит: обогащенный массив
 * 
 * @param {Array} contractors - Базовые контрагенты из БД
 * @returns {Promise<Array>} Полностью обогащенные контрагенты
 */
async function loadFullContractorsData(contractors) {
  if (!contractors || contractors.length === 0) return contractors;

  // Получить ID для батч-загрузки
  const ids = contractors.map(c => c.id);

  // Загрузить relations и references параллельно
  const [relations, references] = await Promise.all([
    batchLoadContractorRelations(ids),
    loadReferences()
  ]);

  const optionalFields = ['inn', 'kpp', 'ogrn', 'legalAddress', 'description'];

  // Обогатить каждого контрагента и очистить пустые поля (Sparse Relations)
  const enriched = contractors.map(c => {
    const contractorObj = {
      ...c,
      tags: relations.tags[c.id] || [],
      bankAccounts: relations.bankAccounts[c.id] || [],
      contacts: relations.contacts[c.id] || [],
      documents: relations.documents[c.id] || []
    };

    // Удаляем пустые опциональные поля для сокращения размера ответа и корректной работы UI (SmartMetadataGrid)
    optionalFields.forEach(field => {
      if (contractorObj[field] === null || contractorObj[field] === '') {
        delete contractorObj[field];
      }
    });

    return contractorObj;
  });

  return enrichContractorsWithReferences(enriched, references);
}

module.exports = {
  batchLoadContractorRelations,
  loadReferences,
  clearReferenceCache,
  enrichContractorsWithReferences,
  loadFullContractorsData
};
