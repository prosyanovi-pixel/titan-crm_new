const db = require('../../../../db');
const logger = require('../../../../utils/logger');

async function processPayment(line, contractorId, lineId, userId) {
  const { rows: existingPayments } = await db.query(
    `SELECT id FROM finance_payments
     WHERE amount = $1
       AND payment_date = $2
       AND contractor_id IS NOT DISTINCT FROM $3
       AND kind = $4
     LIMIT 1`,
    [
      line.amount,
      line.date,
      contractorId || null,
      line.direction === 'credit' ? 'income' : 'expense',
    ]
  );

  if (existingPayments.length > 0) {
    const existingId = existingPayments[0].id;
    await db.query(
      `UPDATE finance_statement_lines
       SET payment_id = $1, reconcile_status = 'auto'
       WHERE id = $2`,
      [existingId, lineId]
    );

    const purposeRef = `${line.purpose || ''} ${line.reference || ''}`;
    if (purposeRef.trim()) {
      const invoiceNumMatch = purposeRef.match(/сч[её]т[уа]?\s*(?:№|:|#)?\s*([A-Za-z0-9\-]+)/i);
      if (invoiceNumMatch) {
        const invoiceIdentifier = invoiceNumMatch[1];
        const { rows: invRows } = await db.query(
          `SELECT id FROM finance_invoices WHERE identifier = $1 OR id = $1 LIMIT 1`,
          [invoiceIdentifier]
        );
        if (invRows.length > 0) {
          const invoiceId = invRows[0].id;
          await db.query(`UPDATE finance_payments SET invoice_id = $1, kind = 'income' WHERE id = $2`, [invoiceId, existingId]);
          await db.query(`UPDATE finance_statement_lines SET invoice_id = $1 WHERE id = $2`, [invoiceId, lineId]);
          const { recalculateInvoice } = require('../../invoices/services');
          await recalculateInvoice(invoiceId);
          logger.info(`Linked existing payment ${existingId} to invoice ${invoiceId}`);
        }
      }
    }

    logger.info(`Duplicate payment skipped: amount=${line.amount}, date=${line.date}`);

    return {
      created: false,
      duplicate: true,
      paymentId: existingId,
    };
  }

  // Создаём новый платёж
  const payId = `pay-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const kind = line.direction === 'credit' ? 'income' : 'expense';

  try {
    const { rows: invoiceMatch } = await db.query(
      `SELECT invoice_id FROM finance_statement_lines WHERE id = $1 AND invoice_id IS NOT NULL`,
      [lineId]
    );

    let invoiceId = invoiceMatch.length > 0 ? invoiceMatch[0].invoice_id : null;

    if (!invoiceId && (line.purpose || line.reference)) {
      const purposeRef = `${line.purpose || ''} ${line.reference || ''}`;
      const invoiceNumMatch = purposeRef.match(/сч[её]т[уа]?\s*(?:№|:|#)?\s*([A-Za-z0-9\-]+)/i);
      if (invoiceNumMatch) {
        const invoiceIdentifier = invoiceNumMatch[1];
        const { rows: invRows } = await db.query(
          `SELECT id FROM finance_invoices WHERE identifier = $1 OR id = $1 LIMIT 1`,
          [invoiceIdentifier]
        );
        if (invRows.length > 0) {
          invoiceId = invRows[0].id;
          logger.info(`Found invoice by purpose: ${invoiceId} for ${invoiceIdentifier}`);
          await db.query(
            `UPDATE finance_statement_lines SET invoice_id = $1 WHERE id = $2`,
            [invoiceId, lineId]
          );
        }
      }
    }

    const kindToInsert = invoiceId ? 'income' : (line.direction === 'credit' ? 'income' : 'expense');

    await db.query(
      `INSERT INTO finance_payments
         (id, kind, amount, currency, payment_date, method, comment,
          category_id, contractor_id, created_by, invoice_id, payment_number)
       VALUES ($1,$2,$3,'RUB',$4,'bank','Импорт из выписки',$5,$6,$7,$8,$9)`,
      [
        payId,
        kindToInsert,
        line.amount,
        line.date,
        line.category_id || null,
        contractorId || null,
        userId,
        invoiceId,
        line.reference || null,
      ]
    );

    await db.query(
      `UPDATE finance_statement_lines SET payment_id = $1, reconcile_status = 'auto' WHERE id = $2`,
      [payId, lineId]
    );

    if (invoiceId) {
      const { recalculateInvoice } = require('../../invoices/services');
      await recalculateInvoice(invoiceId);
      logger.info(`Payment ${payId} linked to invoice ${invoiceId}, status recalculated`);
    }

    return {
      created: true,
      duplicate: false,
      paymentId: payId,
      invoiceId,
    };
  } catch (payErr) {
    logger.warn('Failed to auto-create payment for line', { err: payErr.message });
    return {
      created: false,
      duplicate: false,
      paymentId: null,
      error: payErr.message,
    };
  }
}

module.exports = { processPayment };
