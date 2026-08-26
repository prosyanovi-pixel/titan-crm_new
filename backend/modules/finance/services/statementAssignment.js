const db = require('../../../db');
const logger = require('../../../utils/logger');
const { recalculateInvoice } = require('../invoices/services');
const {
  createPaymentForInvoice,
  createPaymentByCategory,
} = require('./paymentCreation');

/**
 * Ручное назначение счёта/платежа для строки выписки
 * @param {string} lineId - ID строки выписки
 * @param {Object} assignment - Данные для назначения
 * @param {string} userId - ID пользователя
 * @returns {Promise<Object>} Обновлённая строка
 */
async function assignLine(lineId, assignment, userId) {
  const { invoiceId, paymentId, categoryId } = assignment;
  logger.info(`assignLine called: lineId=${lineId}, invoiceId=${invoiceId}, paymentId=${paymentId}, categoryId=${categoryId}, userId=${userId}`);

  const { rows: current } = await db.query(
    `SELECT * FROM finance_statement_lines WHERE id = $1`,
    [lineId]
  );

  if (current.length === 0) {
    logger.error(`Line not found: ${lineId}`);
    throw new Error('Line not found');
  }

  const currentLine = current[0];
  logger.info(`Current line: invoice_id=${currentLine.invoice_id}, payment_id=${currentLine.payment_id}`);

  const isUnlinkInvoice = invoiceId === null && currentLine.invoice_id !== null;

  if (isUnlinkInvoice) {
    logger.info(`Unlinking invoice from line ${lineId}`);
    await db.query(
      `UPDATE finance_statement_lines
       SET invoice_id = NULL,
           payment_id = NULL,
           category_id = COALESCE($1, category_id),
           reconcile_status = 'unmatched'
       WHERE id = $2`,
      [categoryId || null, lineId]
    );

    if (currentLine.payment_id) {
      logger.info(`Deleting payment ${currentLine.payment_id}`);
      await db.query(`DELETE FROM finance_payments WHERE id = $1`, [currentLine.payment_id]);
    }

    if (currentLine.invoice_id) {
      logger.info(`Recalculating invoice ${currentLine.invoice_id}`);
      await recalculateInvoice(currentLine.invoice_id);
    }

    const { rows: updated } = await db.query(
      `SELECT * FROM finance_statement_lines WHERE id = $1`,
      [lineId]
    );
    return updated[0];
  }

  if (invoiceId && currentLine.invoice_id === invoiceId) {
    logger.info(`Invoice ${invoiceId} already linked to line ${lineId}`);
    return currentLine;
  }

  if (invoiceId) {
    const { rows: otherLines } = await db.query(
      `SELECT id FROM finance_statement_lines WHERE invoice_id = $1 AND id != $2 LIMIT 1`,
      [invoiceId, lineId]
    );

    if (otherLines.length > 0) {
      logger.warn(`Invoice ${invoiceId} is already linked to another line ${otherLines[0].id}`);
      await db.query(
        `UPDATE finance_statement_lines SET invoice_id = NULL, reconcile_status = 'unmatched' WHERE id = $1`,
        [otherLines[0].id]
      );
      logger.info(`Unlinked invoice from line ${otherLines[0].id}`);
    }
  }

  const { rows } = await db.query(
    `UPDATE finance_statement_lines
     SET invoice_id        = COALESCE($1, invoice_id),
         payment_id        = $2,
         category_id       = COALESCE($3, category_id),
         reconcile_status  = 'manual'
     WHERE id = $4 RETURNING *`,
    [invoiceId || null, paymentId || currentLine.payment_id, categoryId || null, lineId]
  );

  const line = rows[0];
  logger.info(`Updated line: invoice_id=${line.invoice_id}, payment_id=${line.payment_id}`);

  if (invoiceId && !currentLine.payment_id) {
    const { rows: existingPayments } = await db.query(
      `SELECT id FROM finance_payments WHERE invoice_id = $1 AND kind = 'income' LIMIT 1`,
      [invoiceId]
    );

    if (existingPayments.length > 0) {
      logger.info(`Payment already exists for invoice ${invoiceId}: ${existingPayments[0].id}`);
      await db.query(
        `UPDATE finance_statement_lines SET payment_id = $1, invoice_id = $2, reconcile_status = 'manual' WHERE id = $3`,
        [existingPayments[0].id, invoiceId, lineId]
      );

      await recalculateInvoice(invoiceId);

      const { rows: updated } = await db.query(
        `SELECT * FROM finance_statement_lines WHERE id = $1`,
        [lineId]
      );
      return updated[0];
    }

    logger.info(`Creating payment for invoice ${invoiceId}`);
    const newPaymentId = await createPaymentForInvoice(invoiceId, line, categoryId, userId);

    const { rows: updated } = await db.query(
      `UPDATE finance_statement_lines SET payment_id = $1 WHERE id = $2 RETURNING *`,
      [newPaymentId, lineId]
    );
    logger.info(`Payment created: ${newPaymentId}`);
    return updated[0];
  }

  if (invoiceId && currentLine.payment_id) {
    const { rows: paymentCheck } = await db.query(
      `SELECT invoice_id FROM finance_payments WHERE id = $1`,
      [currentLine.payment_id]
    );

    if (paymentCheck.length > 0 && paymentCheck[0].invoice_id !== invoiceId) {
      logger.info(`Updating payment ${currentLine.payment_id} to link to invoice ${invoiceId}`);
      await db.query(
        `UPDATE finance_payments SET invoice_id = $1 WHERE id = $2`,
        [invoiceId, currentLine.payment_id]
      );

      if (paymentCheck[0].invoice_id) {
        await recalculateInvoice(paymentCheck[0].invoice_id);
      }
      await recalculateInvoice(invoiceId);
    }

    return currentLine;
  }

  if (categoryId && !invoiceId && !currentLine.payment_id) {
    logger.info(`Creating payment by category ${categoryId}`);
    await createPaymentByCategory(line, categoryId, userId);
    return line;
  }

  return line;
}

module.exports = {
  assignLine,
};