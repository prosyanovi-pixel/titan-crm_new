/**
 * Сервис для сверки выписок (reconciliation)
 * Автоматическое и ручное сопоставление со счетами и платежами
 */

const db = require('../../../db');
const logger = require('../../../utils/logger');
const { toNumber } = require('../utils');
const { recalculateInvoice } = require('../invoices/services');
const { assignLine } = require('./statementAssignment');

/**
 * Автоматическая сверка выписки со счетами
 * @param {string} statementId - ID выписки
 * @param {string} account - Номер счёта для фильтрации (опционально)
 * @returns {Promise<Object>} Результат сверки
 */
async function autoReconcile(statementId, account = null) {
  const accountCondition = account ? `AND (account_number = $2 OR $2 = '')` : '';
  const accountParam = account ? [statementId, account] : [statementId];

  const { rows: lines } = await db.query(
    `SELECT * FROM finance_statement_lines
     WHERE statement_id = $1
       AND reconcile_status = 'unmatched'
       ${accountCondition}`,
    accountParam
  );

  let matched = 0;

  for (const line of lines) {
    let invoices;

    if (account) {
      invoices = await db.query(
        `SELECT fi.id FROM finance_invoices fi
         WHERE fi.amount_due > 0
           AND ABS(fi.amount_due - $1) < 0.01
         LIMIT 1`,
        [line.amount]
      );
    } else {
      invoices = await db.query(
        `SELECT fi.id FROM finance_invoices fi
         LEFT JOIN contractors c ON c.id = fi.contractor_id
         WHERE fi.amount_due > 0
           AND ABS(fi.amount_due - $1) < 0.01
           AND (c.name ILIKE $2 OR $2 = '')
         LIMIT 1`,
        [line.amount, `%${line.counterparty || ''}%`]
      );
    }

    if (invoices.rows && invoices.rows.length > 0) {
      const invoiceId = invoices.rows[0].id;

      await db.query(
        `UPDATE finance_statement_lines
         SET invoice_id = $1, reconcile_status = 'auto'
         WHERE id = $2`,
        [invoiceId, line.id]
      );

      if (line.payment_id) {
        await db.query(
          `UPDATE finance_payments SET invoice_id = $1 WHERE id = $2`,
          [invoiceId, line.payment_id]
        );
        await recalculateInvoice(invoiceId);
        logger.info(`Auto-reconciled (linked existing payment): line=${line.id}, invoice=${invoiceId}, payment=${line.payment_id}`);
      } else {
        const payId = `pay-auto-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        await db.query(
          `INSERT INTO finance_payments
           (id, kind, invoice_id, amount, currency, payment_date, method, comment)
           VALUES ($1, 'income', $2, $3, 'RUB', $4, 'bank', 'Авто-платеж из выписки')`,
          [payId, invoiceId, line.amount, line.line_date]
        );

        await db.query(
          `UPDATE finance_statement_lines SET payment_id = $1 WHERE id = $2`,
          [payId, line.id]
        );

        await recalculateInvoice(invoiceId);
        logger.info(`Auto-reconciled: line=${line.id}, invoice=${invoiceId}, payment=${payId}`);
      }

      matched++;
    }
  }

  const { rows: unmatched } = await db.query(
    `SELECT COUNT(*) AS cnt FROM finance_statement_lines
     WHERE statement_id = $1 AND reconcile_status = 'unmatched'`,
    [statementId]
  );

  if (toNumber(unmatched[0].cnt) === 0) {
    await db.query(
      `UPDATE finance_bank_statements SET status = 'reconciled' WHERE id = $1`,
      [statementId]
    );
  }

  return {
    matched,
    total: lines.length,
  };
}

module.exports = {
  autoReconcile,
  assignLine,
};
