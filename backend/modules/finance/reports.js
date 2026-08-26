/**
 * Роуты для финансовых отчетов (reports)
 */

const express = require('express');
const router = express.Router();
const db = require('../../db');
const { parseDateValue, toNumber } = require('./utils');

// GET /reports/receivables - отчет по дебиторской задолженности
router.get('/receivables', async (req, res) => {
  try {
    const { groupBy = 'contractor_project' } = req.query;

    const { rows } = await db.query(
      `SELECT
         fi.id,
         fi.identifier,
         fi.amount_total,
         fi.amount_paid,
         fi.amount_due,
         fi.due_date,
         fi.status,
         c.id AS contractor_id,
         c.name AS contractor_name,
         p.id AS project_id,
         p.name AS project_name,
         CASE
           WHEN fi.amount_due > 0 AND fi.due_date < CURRENT_DATE THEN TRUE
           ELSE FALSE
         END AS is_overdue,
         CASE
           WHEN fi.amount_due > 0 AND fi.due_date < CURRENT_DATE THEN (CURRENT_DATE - fi.due_date)
           ELSE 0
         END AS overdue_days
       FROM finance_invoices fi
       LEFT JOIN contractors c ON c.id = fi.contractor_id
       LEFT JOIN projects p ON p.id = fi.project_id
       WHERE fi.amount_due > 0
       ORDER BY fi.due_date ASC`
    );

    const bucket = new Map();
    rows.forEach((row) => {
      let key = 'all';
      if (groupBy === 'contractor') {
        key = `contractor:${row.contractorId || 'none'}`;
      } else if (groupBy === 'project') {
        key = `project:${row.projectId || 'none'}`;
      } else {
        key = `cp:${row.contractorId || 'none'}:${row.projectId || 'none'}`;
      }

      if (!bucket.has(key)) {
        bucket.set(key, {
          contractorId: row.contractorId || null,
          contractorName: row.contractorName || 'Без контрагента',
          projectId: row.projectId || null,
          projectName: row.projectName || 'Без проекта',
          totalInvoiced: 0,
          totalPaid: 0,
          totalDue: 0,
          overdueCount: 0,
          maxOverdueDays: 0,
          invoices: [],
        });
      }

      const group = bucket.get(key);
      group.totalInvoiced += toNumber(row.amountTotal);
      group.totalPaid += toNumber(row.amountPaid);
      group.totalDue += toNumber(row.amountDue);
      if (row.isOverdue) {
        group.overdueCount += 1;
        group.maxOverdueDays = Math.max(group.maxOverdueDays, toNumber(row.overdueDays));
      }
      group.invoices.push({
        id: row.id,
        identifier: row.identifier,
        amountDue: toNumber(row.amountDue),
        dueDate: row.dueDate,
        status: row.status,
        isOverdue: row.isOverdue,
      });
    });

    res.json(Array.from(bucket.values()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /reports/pl - отчет о прибылях и убытках (P&L)
router.get('/pl', async (req, res) => {
  try {
    const { projectId, dateFrom, dateTo, categoryId } = req.query;

    const conds = [];
    const params = [];
    if (dateFrom) { params.push(parseDateValue(dateFrom)); conds.push(`fp.payment_date >= $${params.length}`); }
    if (dateTo)   { params.push(parseDateValue(dateTo));   conds.push(`fp.payment_date <= $${params.length}`); }
    if (projectId) { params.push(projectId);               conds.push(`fp.project_id = $${params.length}`); }
    if (categoryId) { params.push(categoryId);             conds.push(`fp.category_id = $${params.length}`); }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const { rows: payments } = await db.query(
      `SELECT fp.kind,
              fp.amount,
              fp.payment_date,
              fp.category_id,
              fc.name AS category_name,
              p.name AS project_name,
              c.name AS contractor_name
       FROM finance_payments fp
       LEFT JOIN finance_expense_categories fc ON fc.id = fp.category_id
       LEFT JOIN projects p ON p.id = fp.project_id
       LEFT JOIN contractors c ON c.id = fp.contractor_id
       ${where}
       ORDER BY fp.payment_date`,
      params
    );

    const totalIncome  = payments.filter(p => p.kind === 'income').reduce((s, p) => s + toNumber(p.amount), 0);
    const totalExpense = payments.filter(p => p.kind === 'expense').reduce((s, p) => s + toNumber(p.amount), 0);
    const profit = totalIncome - totalExpense;

    // Group by category
    const byCategory = {};
    for (const p of payments) {
      const key = p.categoryId || p.category_id || (p.kind === 'income' ? 'inc_other' : 'exp_other');
      const label = p.categoryName || p.category_name || (p.kind === 'income' ? 'Прочие поступления' : 'Прочие расходы');
      if (!byCategory[key]) byCategory[key] = { categoryId: key, categoryName: label, kind: p.kind, total: 0 };
      byCategory[key].total += toNumber(p.amount);
    }

    res.json({
      totalIncome,
      totalExpense,
      profit,
      byCategory: Object.values(byCategory),
      payments,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /reports/dds - отчет о движении денежных средств (ДДС)
router.get('/dds', async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const conds = [];
    const params = [];
    if (dateFrom) { params.push(parseDateValue(dateFrom)); conds.push(`fp.payment_date >= $${params.length}`); }
    if (dateTo)   { params.push(parseDateValue(dateTo));   conds.push(`fp.payment_date <= $${params.length}`); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const { rows } = await db.query(
      `SELECT
         fp.kind,
         fp.category_id,
         COALESCE(fc.name, CASE WHEN fp.kind = 'income' THEN 'Прочие поступления' ELSE 'Прочие расходы' END) AS category_name,
         fc.color AS category_color,
         SUM(fp.amount) AS total
       FROM finance_payments fp
       LEFT JOIN finance_expense_categories fc ON fc.id = fp.category_id
       ${where}
       GROUP BY fp.kind, fp.category_id, fc.name, fc.color
       ORDER BY fp.kind, total DESC`,
      params
    );    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /reports/register - реестр платежей (для экспорта)
router.get('/register', async (req, res) => {
  try {
    const { dateFrom, dateTo, kind, projectId, contractorId, categoryId } = req.query;
    const conds = [];
    const params = [];
    if (kind)         { params.push(kind);                  conds.push(`fp.kind = $${params.length}`); }
    if (projectId)    { params.push(projectId);             conds.push(`fp.project_id = $${params.length}`); }
    if (contractorId) { params.push(contractorId);          conds.push(`fp.contractor_id = $${params.length}`); }
    if (categoryId)   { params.push(categoryId);            conds.push(`fp.category_id = $${params.length}`); }
    if (dateFrom)     { params.push(parseDateValue(dateFrom)); conds.push(`fp.payment_date >= $${params.length}`); }
    if (dateTo)       { params.push(parseDateValue(dateTo));   conds.push(`fp.payment_date <= $${params.length}`); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const { rows } = await db.query(
      `SELECT
         fp.id,
         fp.kind,
         fp.amount,
         fp.currency,
         fp.payment_date,
         fp.method,
         fp.comment,
         fp.category_id,
         fc.name AS category_name,
         fi.identifier AS invoice_identifier,
         p.name AS project_name,
         c.name AS contractor_name
       FROM finance_payments fp
       LEFT JOIN finance_expense_categories fc ON fc.id = fp.category_id
       LEFT JOIN finance_invoices fi ON fi.id = fp.invoice_id
       LEFT JOIN projects p ON p.id = fp.project_id
       LEFT JOIN contractors c ON c.id = fp.contractor_id
       ${where}
       ORDER BY fp.payment_date DESC`,
      params
    );

    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
