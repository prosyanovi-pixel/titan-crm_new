/**
 * Контроллер отчётов по юристам
 *
 * Маршруты:
 *   GET /api/reports/lawyers/performance - Эффективность юристов
 */

const express = require('express');
const router = express.Router();
const db = require('../../../db');

// GET /api/reports/lawyers/performance - Эффективность юристов
router.get('/performance', async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const conds = [];
    const params = [];
    if (dateFrom) { params.push(dateFrom); conds.push(`lc.created_at >= $${params.length}`); }
    if (dateTo)   { params.push(dateTo);   conds.push(`lc.created_at <= $${params.length}`); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const { rows } = await db.query(
      `SELECT
         u.id,
         u.name        AS full_name,
         u.role        AS specialization,
         COUNT(DISTINCT lc.id)                                     AS cases_total,
         COUNT(DISTINCT lc.id) FILTER (WHERE lc.status = 'closed') AS cases_closed,
         COUNT(DISTINCT lc.id) FILTER (WHERE lc.outcome = 'win')   AS cases_won,
         COUNT(DISTINCT lc.id) FILTER (WHERE lc.outcome = 'loss')  AS cases_lost,
         ROUND(
           COUNT(DISTINCT lc.id) FILTER (WHERE lc.outcome = 'win')::numeric
           / NULLIF(COUNT(DISTINCT lc.id) FILTER (WHERE lc.outcome IN ('win','loss')), 0) * 100,
           1
         ) AS win_rate
       FROM users u
       LEFT JOIN legal_cases lc ON lc.lawyer_id = u.id
       ${where}
       GROUP BY u.id, u.name, u.role
       ORDER BY cases_total DESC`,
      params
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/lawyers/workload - Судебная нагрузка
router.get('/workload', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.name AS full_name,
              COUNT(lc.id) AS active_cases,
              (SELECT COUNT(*) FROM calendar_events ce WHERE ce.assignee = u.id AND ce.date >= CURRENT_DATE AND ce.date <= CURRENT_DATE + INTERVAL '7 days') AS hearings_soon
       FROM users u
       LEFT JOIN legal_cases lc ON lc.lawyer_id = u.id AND lc.status = 'active'
       WHERE u.role = 'lawyer' OR u.id IN (SELECT DISTINCT lawyer_id FROM legal_cases)
       GROUP BY u.id, u.name
       ORDER BY active_cases DESC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
