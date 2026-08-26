/**
 * Обработка контрагентов: создание, обновление, поиск
 * Файл: routes/finance/statementHelpers/contractorProcessor.js
 */

const db = require('../../../db');
const logger = require('../../../utils/logger');
const { extractLegalForm, shortName, detectType } = require('./legalFormParser');

/**
 * Результат обработки контрагента
 */
class ContractorResult {
  constructor() {
    this.contractorId = null;
    this.contractorName = null;
    this.isNew = false;
    this.isUpdated = false;
    this.newAccountAdded = false;
    this.accountExists = false;
    this.changes = [];
    this.warnings = [];
  }
}

/**
 * Найти или создать контрагента по ИНН (или имени)
 * Также создаёт/обновляет банковский счёт
 * @param {Object} line - Строка выписки с данными
 * @returns {Promise<ContractorResult>}
 */
async function upsertContractor(line) {
  const result = new ContractorResult();
  
  const {
    counterparty, counterpartyInn, counterpartyKpp,
    counterpartyAccount, counterpartyBankName, counterpartyBik, counterpartyKorAccount,
  } = line;

  if (!counterparty && !counterpartyInn) {
    result.warnings.push('Нет названия или ИНН контрагента');
    return result;
  }

  const lf = extractLegalForm(counterparty);
  const sName = shortName(counterparty) || counterparty;
  const cType = detectType(lf, counterpartyInn);
  const cleanKpp = (counterpartyKpp && counterpartyKpp !== '0') ? counterpartyKpp : null;

  let contractorId = null;
  let existingContractor = null;

  // ШАГ 1: Поиск по ИНН
  if (counterpartyInn) {
    const { rows } = await db.query(
      `SELECT id, name, inn, kpp, full_name, legal_form, type 
       FROM contractors WHERE inn = $1 LIMIT 1`,
      [counterpartyInn]
    );
    
    if (rows.length > 0) {
      contractorId = rows[0].id;
      existingContractor = rows[0];
      
      // Обновляем информацию если есть изменения
      const updates = [];
      const updateValues = [];
      let paramCount = 1;

      if (!existingContractor.kpp && cleanKpp) {
        updates.push(`kpp = $${paramCount++}`);
        updateValues.push(cleanKpp);
        result.changes.push(`Добавлен КПП: ${cleanKpp}`);
      }
      
      if (!existingContractor.full_name && counterparty) {
        updates.push(`full_name = $${paramCount++}`);
        updateValues.push(counterparty);
        result.changes.push(`Обновлено полное название`);
      }
      
      if (!existingContractor.legal_form && lf) {
        updates.push(`legal_form = $${paramCount++}`);
        updateValues.push(lf);
        result.changes.push(`Добавлена правовая форма: ${lf}`);
      }

      if (updates.length > 0) {
        updateValues.push(contractorId);
        await db.query(
          `UPDATE contractors SET ${updates.join(', ')} WHERE id = $${paramCount}`,
          updateValues
        );
        result.isUpdated = true;
      }
    }
  }

  // ШАГ 2: Поиск по названию
  if (!contractorId && sName) {
    const { rows } = await db.query(
      `SELECT id, name, inn, full_name FROM contractors WHERE name ILIKE $1 LIMIT 1`,
      [sName]
    );
    
    if (rows.length > 0) {
      contractorId = rows[0].id;
      existingContractor = rows[0];
      
      // Если у найденного контрагента нет ИНН, а у нас есть — обновляем
      if (counterpartyInn && !existingContractor.inn) {
        await db.query(
          `UPDATE contractors SET inn = $2, kpp = $3, full_name = $4, legal_form = $5, type = $6
           WHERE id = $1`,
          [contractorId, counterpartyInn, cleanKpp, counterparty || null, lf || null, cType]
        );
        result.changes.push(`Добавлен ИНН: ${counterpartyInn}`);
        result.isUpdated = true;
      } else if (counterpartyInn && existingContractor.inn !== counterpartyInn) {
        // ВНИМАНИЕ: Найден контрагент с другим ИНН!
        result.warnings.push(
          `Найден контрагент "${existingContractor.name}" с другим ИНН (${existingContractor.inn}). ` +
          `Возможно это тёзка. Новый ИНН: ${counterpartyInn}`
        );
      }
    }
  }

  // ШАГ 3: Создание нового контрагента
  if (!contractorId) {
    const { rows } = await db.query(
      `INSERT INTO contractors (name, full_name, inn, kpp, legal_form, type, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active')
       RETURNING id, name`,
      [sName, counterparty || sName, counterpartyInn || null, cleanKpp, lf || null, cType]
    );
    contractorId = rows[0].id;
    result.contractorName = rows[0].name;
    result.isNew = true;
    result.changes.push('Создан новый контрагент');
  } else {
    result.contractorName = existingContractor.name || existingContractor.full_name;
  }

  result.contractorId = contractorId;

  // ШАГ 4: Работа с банковскими счетами
  if (contractorId && counterpartyAccount) {
    const { rows: existAcc } = await db.query(
      `SELECT id, bank_name, bik, is_primary 
       FROM contractor_bank_accounts
       WHERE contractor_id = $1 AND account_number = $2 LIMIT 1`,
      [contractorId, counterpartyAccount]
    );
    
    if (existAcc.length === 0) {
      // Новый счёт — добавляем
      const accId = `cba-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      await db.query(
        `INSERT INTO contractor_bank_accounts
           (id, contractor_id, bank_name, bik, account_number, correspondent_account, currency, is_primary)
         VALUES ($1, $2, $3, $4, $5, $6, 'RUB', false)`,
        [accId, contractorId,
         counterpartyBankName || null, counterpartyBik || null,
         counterpartyAccount, counterpartyKorAccount || null]
      );
      result.newAccountAdded = true;
      result.changes.push(`Добавлен новый счёт: ${counterpartyAccount} (${counterpartyBankName || 'Б/Н банка'})`);
    } else {
      result.accountExists = true;
      // Обновляем информацию о счёте если нужно
      if (counterpartyBankName || counterpartyBik) {
        await db.query(
          `UPDATE contractor_bank_accounts SET
             bank_name             = COALESCE(NULLIF(bank_name,''), $2),
             bik                   = COALESCE(NULLIF(bik,''), $3),
             correspondent_account = COALESCE(NULLIF(correspondent_account,''), $4)
           WHERE contractor_id = $1 AND account_number = $5`,
          [contractorId, counterpartyBankName || null, counterpartyBik || null,
           counterpartyKorAccount || null, counterpartyAccount]
        );
      }
    }
  }

  return result;
}

module.exports = {
  ContractorResult,
  upsertContractor,
};
