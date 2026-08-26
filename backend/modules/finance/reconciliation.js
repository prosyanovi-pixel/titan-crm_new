/**
 * Роут для акта сверки с контрагентом
 * GET /finance/reconciliation-act/:contractorId
 */

const express = require('express');
const router = express.Router();
const db = require('../../db');
const { parseDateValue, toNumber } = require('./utils');

router.get('/:contractorId', async (req, res) => {
  try {
    const { contractorId } = req.params;
    const { dateFrom, dateTo } = req.query;

    const conds = [`fi.contractor_id = $1`];
    const params = [contractorId];
    if (dateFrom) { params.push(parseDateValue(dateFrom)); conds.push(`fi.issue_date >= $${params.length}`); }
    if (dateTo)   { params.push(parseDateValue(dateTo));   conds.push(`fi.issue_date <= $${params.length}`); }

    const { rows: invoices } = await db.query(
      `SELECT fi.*, c.name AS contractor_name
       FROM finance_invoices fi
       LEFT JOIN contractors c ON c.id = fi.contractor_id
       WHERE ${conds.join(' AND ')}
       ORDER BY fi.issue_date`,
      params
    );

    const { rows: payments } = await db.query(
      `SELECT fp.*, fi.identifier AS invoice_identifier
       FROM finance_payments fp
       LEFT JOIN finance_invoices fi ON fi.id = fp.invoice_id
       WHERE fp.contractor_id = $1
         ${dateFrom ? `AND fp.payment_date >= '${parseDateValue(dateFrom)}'` : ''}
         ${dateTo   ? `AND fp.payment_date <= '${parseDateValue(dateTo)}'`   : ''}
       ORDER BY fp.payment_date`,
      [contractorId]
    );

    const contractorName = invoices[0]?.contractorName || invoices[0]?.contractor_name || '';
    const totalInvoiced = invoices.reduce((s, i) => s + toNumber(i.amountTotal || i.amount_total), 0);
    const totalPaid = payments.filter(p => p.kind === 'income').reduce((s, p) => s + toNumber(p.amount), 0);
    const balance = totalInvoiced - totalPaid;

    res.json({
      contractorId,
      contractorName,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      totalInvoiced,
      totalPaid,
      balance,
      invoices: invoices.map(i => ({
        id: i.id,
        identifier: i.identifier,
        issueDate: i.issueDate || i.issue_date,
        dueDate: i.dueDate || i.due_date,
        amountTotal: toNumber(i.amountTotal || i.amount_total),
        amountPaid: toNumber(i.amountPaid || i.amount_paid),
        amountDue: toNumber(i.amountDue || i.amount_due),
        status: i.status,
      })),
      payments: payments.map(p => ({
        id: p.id,
        paymentDate: p.paymentDate || p.payment_date,
        amount: toNumber(p.amount),
        kind: p.kind,
        invoiceIdentifier: p.invoiceIdentifier || p.invoice_identifier,
        comment: p.comment,
      })),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
