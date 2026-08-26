/**
 * Загрузка связанных данных для кейса
 */

const db = require('../../../db');
const { normalizeNote } = require('./normalizers');
const { toNumber, pickFirstDefined } = require('./utils');

// Кэш типа колонки (будет заполнен при первом обращении)
let notesInternalColumnCache = null;

/**
 * Получает имя колонки is_internal/isinternal для заметок
 * Гарантирует правильное имя колонки для разных версий БД
 * @returns {Promise<string>} Имя колонки ('is_internal' или 'isinternal')
 */
const getCaseNotesInternalColumn = async () => {
  if (notesInternalColumnCache) return notesInternalColumnCache;

  try {
    const { rows } = await db.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'case_notes'
        AND column_name IN ('is_internal', 'isinternal')
      ORDER BY column_name DESC
    `);

    if (rows && rows.length > 0) {
      // Приоритет: is_internal > isinternal
      const colName = rows[0].column_name || rows[0].columnName;
      notesInternalColumnCache = colName;
      return colName;
    }
  } catch (err) {
    console.error('Error checking column name:', err.message);
  }

  // Fallback: используем стандартное имя
  notesInternalColumnCache = 'is_internal';
  return notesInternalColumnCache;
};

/**
 * Сбрасывает кэш колонки is_internal (для тестирования)
 */
const clearCaseNotesInternalColumnCache = () => {
  notesInternalColumnCache = null;
};

/**
 * Применяет финансовые поля из БД к объекту кейса
 * @param {Object} caseObj - Объект кейса
 * @param {Object|null} fin - Финансовые данные из БД
 */
const hydrateFinancials = (caseObj, fin) => {
  if (fin) {
    caseObj.claimAmount = {
      amount:   toNumber(pickFirstDefined(fin.claimAmount,   fin.claimamount)),
      currency: pickFirstDefined(fin.claimCurrency, fin.claimcurrency, 'RUB'),
    };
    caseObj.recoveredAmount = {
      amount:   toNumber(pickFirstDefined(fin.recoveredAmount,   fin.recoveredamount)),
      currency: pickFirstDefined(fin.recoveredCurrency, fin.recoveredcurrency, 'RUB'),
    };
    caseObj.stateDuty           = toNumber(pickFirstDefined(fin.stateDuty,           fin.stateduty));
    caseObj.expertiseCost       = toNumber(pickFirstDefined(fin.expertiseCost,       fin.expertisecost));
    caseObj.otherClaimCosts     = toNumber(pickFirstDefined(fin.otherClaimCosts,     fin.otherclaimcosts));
    caseObj.enforcementFee      = toNumber(pickFirstDefined(fin.enforcementFee,      fin.enforcementfee));
    caseObj.executionCosts      = toNumber(pickFirstDefined(fin.executionCosts,      fin.executioncosts));
    caseObj.transportExpenses   = toNumber(pickFirstDefined(fin.transportExpenses,   fin.transportexpenses));
    caseObj.translationExpenses = toNumber(pickFirstDefined(fin.translationExpenses, fin.translationexpenses));
    caseObj.otherExpenses       = toNumber(pickFirstDefined(fin.otherExpenses,       fin.otherexpenses));
  } else {
    caseObj.claimAmount     = { amount: 0, currency: 'RUB' };
    caseObj.recoveredAmount = { amount: 0, currency: 'RUB' };
    caseObj.stateDuty = caseObj.expertiseCost = caseObj.otherClaimCosts  = 0;
    caseObj.enforcementFee = caseObj.executionCosts = caseObj.transportExpenses = 0;
    caseObj.translationExpenses = caseObj.otherExpenses = 0;
  }
};

/**
 * Загружает и прикрепляет к объекту кейса все дочерние записи
 * @param {Object} caseObj - Объект кейса
 */
const hydrateCaseRelations = async (caseObj) => {
  const id = caseObj.id;

  caseObj.events = (await db.query('SELECT * FROM case_events WHERE case_id = $1', [id])).rows || [];
  caseObj.thirdParties = (await db.query('SELECT * FROM case_third_parties WHERE case_id = $1', [id])).rows || [];

  // Заметки с динамической колонкой is_internal
  const internalCol = await getCaseNotesInternalColumn();
  const notesRes = await db.query(
    `SELECT id, case_id, author, initials, SUBSTRING(date FROM 1 FOR 10) as date, text, COALESCE("${internalCol}", false) as "isInternal" FROM case_notes WHERE case_id = $1`,
    [id]
  );
  caseObj.notes = (notesRes.rows || []).map(normalizeNote);

  // Вложения для каждой заметки (гарантируем что это всегда массив)
  for (const note of caseObj.notes) {
    const attachmentsRes = await db.query(
      'SELECT id, name, url, type, DATE(added_at)::text as "addedAt" FROM case_note_attachments WHERE note_id = $1 ORDER BY added_at',
      [note.id]
    );
    // Всегда гарантируем массив, никогда не undefined
    note.attachments = attachmentsRes.rows && attachmentsRes.rows.length > 0 
      ? attachmentsRes.rows 
      : [];
  }

  caseObj.documents = (await db.query('SELECT * FROM case_documents WHERE case_id = $1', [id])).rows || [];
  caseObj.recoveredItems = (await db.query('SELECT * FROM case_recovered_items WHERE case_id = $1 ORDER BY id', [id])).rows || [];
  caseObj.expenses = (await db.query('SELECT * FROM case_expenses WHERE case_id = $1 ORDER BY id', [id])).rows || [];

  const finRes = await db.query('SELECT * FROM case_financial_details WHERE case_id = $1', [id]);
  hydrateFinancials(caseObj, finRes.rows[0] || null);
};

module.exports = {
  getCaseNotesInternalColumn,
  clearCaseNotesInternalColumnCache,
  hydrateFinancials,
  hydrateCaseRelations,
};
