/**
 * Сервис для управления банковскими выписками
 * Бизнес-логика импорта и обработки statements
 */

const db = require('../../../db');
const logger = require('../../../utils/logger');
const { generateImportReport } = require('../statementHelpers');
const {
  parseStatementContent,
  createImportPreview,
  createStatement,
  processStatementLine,
  processPayment,
} = require('./statementIngestion');

/**
 * Получить все выписки
 * @returns {Promise<Array>} Список выписок
 */
async function getAllStatements() {
  const { rows } = await db.query(
    `SELECT * FROM finance_bank_statements ORDER BY created_at DESC`
  );
  return rows;
}

/**
 * Получить выписку по ID
 * @param {string} id - ID выписки
 * @returns {Promise<Object|null>}
 */
async function getStatementById(id) {
  const { rows } = await db.query(
    `SELECT * FROM finance_bank_statements WHERE id = $1`,
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Получить строки выписки с связанными данными
 * @param {string} statementId - ID выписки
 * @returns {Promise<Array>}
 */
async function getStatementLines(statementId) {
  const { rows } = await db.query(
    `SELECT sl.*,
            fi.identifier AS invoice_identifier,
            fp.amount     AS payment_amount,
            ec.name       AS category_name,
            ec.kind       AS category_kind,
            ec.color      AS category_color
     FROM finance_statement_lines sl
     LEFT JOIN finance_invoices fi         ON fi.id = sl.invoice_id
     LEFT JOIN finance_payments fp         ON fp.id = sl.payment_id
     LEFT JOIN finance_expense_categories ec ON ec.id = sl.category_id
     WHERE sl.statement_id = $1
     ORDER BY sl.line_date ASC`,
    [statementId]
  );
  return rows;
}

/**
 * Распарсить контент выписки
 * @param {string} content - Содержимое файла
 * @param {string} importType - Тип импорта (csv, 1c_txt)
 * @returns {Array} Распарсенные строки
 */
// Parsing and preview helpers delegated to ./statementParts/parse

/**
 * Удалить выписку
 * @param {string} id - ID выписки
 * @returns {Promise<boolean>}
 */
async function deleteStatement(id) {
  await db.query('DELETE FROM finance_bank_statements WHERE id = $1', [id]);
  return true;
}

module.exports = {
  getAllStatements,
  getStatementById,
  getStatementLines,
  parseStatementContent,
  createStatement,
  processStatementLine,
  processPayment,
  deleteStatement,
};
