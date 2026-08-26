/**
 * Контроллер отчётов по контрагентам
 *
 * Маршруты:
 *   GET /api/reports/contractors/activity - Активность контрагентов
 *   GET /api/reports/contractors/debts    - Должники (топ по дебиторке)
 */

const express = require('express');
const router = express.Router();
const db = require('../../../db');

// GET /api/reports/contractors/activity - Активность контрагентов
router.get('/activity', async (req, res) => {
  try {
    const { dateFrom, dateTo, limit = 50 } = req.query;
    const conds = [];
    const params = [];
    if (dateFrom) { params.push(dateFrom); conds.push(`fp.payment_date >= $${params.length}`); }
    if (dateTo)   { params.push(dateTo);   conds.push(`fp.payment_date <= $${params.length}`); }
    const where = conds.length ? `WHERE c.id IS NOT NULL AND ${conds.join(' AND ')}` : 'WHERE c.id IS NOT NULL';

    params.push(parseInt(limit) || 50);

    const { rows } = await db.query(
      `SELECT
         c.id,
         c.name,
         c.inn,
         COUNT(DISTINCT fp.project_id) AS projects_count,
         COUNT(DISTINCT fp.id)         AS payments_count,
         COALESCE(SUM(fp.amount) FILTER (WHERE fp.kind = 'income'),  0) AS total_income,
         COALESCE(SUM(fp.amount) FILTER (WHERE fp.kind = 'expense'), 0) AS total_expense,
         MAX(fp.payment_date) AS last_payment_date
       FROM contractors c
       LEFT JOIN finance_payments fp ON fp.contractor_id = c.id
       ${where}
       GROUP BY c.id, c.name, c.inn
       HAVING COUNT(DISTINCT fp.id) > 0
       ORDER BY total_income DESC
       LIMIT $${params.length}`,
      params
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/contractors/debts - Должники по дебиторке
router.get('/debts', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
         c.id,
         c.name,
         c.inn,
         COUNT(fi.id)          AS invoices_count,
         SUM(fi.amount_due)    AS total_debt,
         MIN(fi.due_date)      AS oldest_due_date,
         COUNT(fi.id) FILTER (WHERE fi.due_date < CURRENT_DATE) AS overdue_count
       FROM contractors c
       JOIN finance_invoices fi ON fi.contractor_id = c.id
       WHERE fi.amount_due > 0
       GROUP BY c.id, c.name, c.inn
       ORDER BY total_debt DESC
       LIMIT 50`
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/contractors/contracts - Реестр договоров
router.get('/contracts', async (req, res) => {
  try {
    const { contractorId } = req.query;
    const conds = [];
    const params = [];
    if (contractorId) { params.push(contractorId); conds.push(`c.contractor_id = $${params.length}`); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const { rows } = await db.query(
      `SELECT c.contract_number, ctr.name AS contractor_name, c.status, c.start_date, c.expiration_date AS end_date, c.amount
       FROM contracts c
       JOIN contractors ctr ON ctr.id = c.contractor_id
       ${where}
       ORDER BY c.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
