/**
 * Контроллер отчётов по проектам
 *
 * Маршруты:
 *   GET /api/reports/projects/summary          - Сводка по всем проектам
 *   GET /api/reports/projects/tasks-by-status  - Задачи по статусам в разрезе проектов
 */

const express = require('express');
const router = express.Router();
const db = require('../../../db');

// GET /api/reports/projects/summary - Сводка по всем проектам
router.get('/summary', async (req, res) => {
  try {
    const { status, managerId } = req.query;
    const conds = [];
    const params = [];
    if (status)    { params.push(status);    conds.push(`p.status = $${params.length}`); }
    if (managerId) { params.push(managerId); conds.push(`p.manager_id = $${params.length}`); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const { rows } = await db.query(
      `SELECT
         p.id,
         p.name,
         p.status,
         p.created_at,
         p.deadline,
         p.manager        AS manager_name,
         p.client         AS contractor_name,
         COALESCE(tsk.tasks_total, 0) AS tasks_total,
         COALESCE(tsk.tasks_done,  0) AS tasks_done,
         COALESCE(SUM(fp.amount) FILTER (WHERE fp.kind = 'income'),  0) AS total_income,
         COALESCE(SUM(fp.amount) FILTER (WHERE fp.kind = 'expense'), 0) AS total_expense
       FROM projects p
       LEFT JOIN LATERAL (
         SELECT
           COUNT(*) AS tasks_total,
           COUNT(*) FILTER (WHERE t.status = 'done') AS tasks_done
         FROM tasks t
         JOIN project_stages ps ON ps.id = t.project_stage_id
         WHERE ps.project_id = p.id
       ) tsk ON true
       LEFT JOIN finance_payments fp ON fp.project_id = p.id
       ${where}
       GROUP BY p.id, p.name, p.status, p.created_at, p.deadline, p.manager, p.client, tsk.tasks_total, tsk.tasks_done
       ORDER BY p.created_at DESC`,
      params
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/projects/tasks-by-status - Задачи по статусам в разрезе проектов
router.get('/tasks-by-status', async (req, res) => {
  try {
    const { projectId } = req.query;
    const conds = [];
    const params = [];
    if (projectId) { params.push(projectId); conds.push(`t.project_id = $${params.length}`); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const { rows } = await db.query(
      `SELECT
         p.id   AS project_id,
         p.name AS project_name,
         t.status,
         COUNT(*) AS count
       FROM tasks t
       LEFT JOIN projects p ON p.id = t.project_id
       ${where}
       GROUP BY p.id, p.name, t.status
       ORDER BY p.name, t.status`,
      params
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/projects/budget - Исполнение бюджетов
router.get('/budget', async (req, res) => {
  try {
    const { projectId } = req.query;
    const conds = [];
    const params = [];
    if (projectId) { params.push(projectId); conds.push(`p.id = $${params.length}`); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const { rows } = await db.query(
      `SELECT p.id, p.name, p.budget,
              COALESCE(SUM(fp.amount) FILTER (WHERE fp.kind = 'income'), 0) AS total_income,
              p.budget - COALESCE(SUM(fp.amount) FILTER (WHERE fp.kind = 'income'), 0) AS variance,
              CASE WHEN p.budget > 0 THEN ROUND((COALESCE(SUM(fp.amount) FILTER (WHERE fp.kind = 'income'), 0) / p.budget) * 100, 1) ELSE 0 END AS usage_percent
       FROM projects p
       LEFT JOIN finance_payments fp ON fp.project_id = p.id
       ${where}
       GROUP BY p.id, p.name, p.budget
       ORDER BY p.budget DESC`,
      params
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/projects/stages - Аналитика по этапам
router.get('/stages', async (req, res) => {
  try {
    const { projectId } = req.query;
    const conds = [];
    const params = [];
    if (projectId) { params.push(projectId); conds.push(`p.id = $${params.length}`); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const { rows } = await db.query(
      `SELECT p.name AS project_name, ps.name AS stage_name, 
              CASE WHEN ps.is_completed THEN 'completed' ELSE 'active' END AS status,
              COUNT(t.id) AS tasks_count
       FROM project_stages ps
       JOIN projects p ON p.id = ps.project_id
       LEFT JOIN tasks t ON t.project_stage_id = ps.id
       ${where}
       GROUP BY p.id, p.name, ps.id, ps.name, ps.is_completed, ps.order_index
       ORDER BY p.name, ps.order_index`,
      params
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;
