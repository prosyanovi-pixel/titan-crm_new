/**
 * Сервис импорта и обработки банковских выписок
 */

const db = require('../../../db');
const logger = require('../../../utils/logger');
const { detectCategory, upsertContractor } = require('../statementHelpers');
const { parseStatementContent, createImportPreview } = require('./statementParts/parse');
const paymentProcessor = require('./statementParts/paymentProcessor');

async function createStatement(statementData, userId) {
  await db.query(
    `INSERT INTO finance_bank_statements
       (id, file_name, import_type, account, date_from, date_to, total_credit, total_debit, imported_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      statementData.id,
      statementData.fileName,
      statementData.importType,
      statementData.account,
      statementData.dateFrom,
      statementData.dateTo,
      statementData.totalCredit,
      statementData.totalDebit,
      userId,
    ]
  );
  return statementData.id;
}

async function processStatementLine(line, stmtId, userId) {
  const lineId = `stl-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  let contractorResult;
  try {
    contractorResult = await upsertContractor(line);
  } catch (cpErr) {
    logger.warn('Failed to upsert contractor for line', {
      err: cpErr.message,
      counterparty: line.counterparty,
    });
    contractorResult = {
      contractorId: null,
      warnings: ['Ошибка обработки контрагента'],
    };
  }

  const autoCategoryId = detectCategory(line.purpose, line.direction, line.counterparty);

  try {
    await db.query(
      `INSERT INTO finance_statement_lines
         (id, statement_id, line_date, amount, direction, counterparty, purpose, reference,
          contractor_id, counterparty_inn, account_number, category_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        lineId,
        stmtId,
        line.date,
        line.amount,
        line.direction,
        line.counterparty || null,
        line.purpose || null,
        line.reference || null,
        contractorResult.contractorId || null,
        line.counterpartyInn || null,
        line.counterpartyAccount || null,
        autoCategoryId || null,
      ]
    );
  } catch (err) {
    if (err && err.message && err.message.includes('violates foreign key constraint')) {
      logger.warn(`FK violation inserting statement line ${lineId} (stmt=${stmtId}), attempting to recreate parent statement`);
      try {
        await createStatement({ id: stmtId, fileName: 'recreated-import', importType: 'unknown', account: null, dateFrom: line.date, dateTo: line.date, totalCredit: 0, totalDebit: 0 }, userId);
        await db.query(
          `INSERT INTO finance_statement_lines
             (id, statement_id, line_date, amount, direction, counterparty, purpose, reference,
              contractor_id, counterparty_inn, account_number, category_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [
            lineId,
            stmtId,
            line.date,
            line.amount,
            line.direction,
            line.counterparty || null,
            line.purpose || null,
            line.reference || null,
            contractorResult.contractorId || null,
            line.counterpartyInn || null,
            line.counterpartyAccount || null,
            autoCategoryId || null,
          ]
        );
      } catch (err2) {
        logger.error('Failed to insert statement line after recreating parent:', err2.message);
        throw err2;
      }
    } else {
      throw err;
    }
  }

  let paymentResult = { created: false, duplicate: false, paymentId: null };

  if (autoCategoryId && line.amount > 0) {
    paymentResult = await processPayment(line, contractorResult.contractorId, lineId, userId);
  }

  return {
    lineId,
    contractorResult,
    autoCategoryId,
    paymentResult,
  };
}

async function processPayment(line, contractorId, lineId, userId) {
  return paymentProcessor.processPayment(line, contractorId, lineId, userId);
}

module.exports = {
  parseStatementContent,
  createImportPreview,
  createStatement,
  processStatementLine,
  processPayment,
};