/**
 * Контроллер отчётов по задачам
 *
 * Маршруты:
 *   GET /api/reports/tasks/workload  - Загрузка сотрудников
 *   GET /api/reports/tasks/overdue   - Просроченные задачи
 */

const express = require('express');
const router = express.Router();
const db = require('../../../db');

// GET /api/reports/tasks/workload - Загрузка сотрудников
router.get('/workload', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT assignee AS assignee_name,
              COUNT(*) FILTER (WHERE status = 'in_progress') AS active_tasks,
              COUNT(*) FILTER (WHERE status = 'todo' OR status = 'pending') AS pending_tasks,
              COUNT(*) AS total_tasks
       FROM tasks
       WHERE assignee IS NOT NULL
       GROUP BY assignee
       ORDER BY total_tasks DESC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/tasks/overdue - Просроченные задачи
router.get('/overdue', async (req, res) => {
  try {
    const { projectId } = req.query;
    const conds = ["t.status != 'done'", "t.due_date::date < CURRENT_DATE"];
    const params = [];
    if (projectId) { params.push(projectId); conds.push(`t.project_id = $${params.length}`); }
    const where = `WHERE ${conds.join(' AND ')}`;

    const { rows } = await db.query(
      `SELECT t.title, t.project AS project_name, t.assignee AS assignee_name, t.due_date,
              (CURRENT_DATE - t.due_date::date) AS days_overdue
       FROM tasks t
       ${where}
       ORDER BY days_overdue DESC`,
      params
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
