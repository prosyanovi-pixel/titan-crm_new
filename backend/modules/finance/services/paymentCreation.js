const db = require('../../../db');
const { parseDateValue } = require('../utils');
const { recalculateInvoice } = require('../invoices/services');

async function createPaymentForInvoice(invoiceId, line, categoryId, userId) {
  const payId = `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const paymentDate = parseDateValue(line.line_date) || parseDateValue(new Date());

  await db.query(
    `INSERT INTO finance_payments
       (id, kind, invoice_id, amount, currency, payment_date, method, comment,
        category_id, contractor_id, created_by, payment_number)
     VALUES ($1,'income',$2,$3,'RUB',$4,'bank','Привязан из выписки',$5,$6,$7,$8)`,
    [
      payId,
      invoiceId,
      line.amount,
      paymentDate,
      categoryId || null,
      line.contractor_id || null,
      userId,
      line.reference || null,
    ]
  );

  await recalculateInvoice(invoiceId);

  return payId;
}

async function createPaymentByCategory(line, categoryId, userId) {
  const payId = `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const kind = line.direction === 'credit' ? 'income' : 'expense';

  await db.query(
    `INSERT INTO finance_payments
       (id, kind, amount, currency, payment_date, method, comment,
        category_id, contractor_id, created_by, payment_number)
     VALUES ($1,$2,$3,'RUB',$4,'bank',$5,$6,$7,$8,$9)`,
    [
      payId,
      kind,
      line.amount,
      line.line_date,
      (line.purpose || '').substring(0, 100) || 'Из выписки',
      categoryId,
      line.contractor_id || null,
      userId,
      line.reference || null,
    ]
  );

  await db.query(
    `UPDATE finance_statement_lines SET payment_id = $1 WHERE id = $2`,
    [payId, line.id]
  );
}

module.exports = {
  createPaymentForInvoice,
  createPaymentByCategory,
};