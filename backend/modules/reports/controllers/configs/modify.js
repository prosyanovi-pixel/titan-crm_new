const express = require('express');

const db = require('../../../../db');
const checkPermission = require('../../../../middleware/checkPermission');

const router = express.Router();


router.put('/:id', checkPermission('reports.write'), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, description, reportType, filters, columns, chartType, isShared, status } = req.body;

    const { rows: existing } = await db.query(
      'SELECT id, created_by FROM report_configs WHERE id = $1',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Конфигурация не найдена' });
    }
    if (existing[0].createdBy !== userId) {
      return res.status(403).json({ error: 'Нет прав на редактирование этой конфигурации' });
    }

    if (reportType && !require('../../settings').reportTypes.includes(reportType)) {
      return res.status(400).json({ error: `Недопустимый тип отчёта: ${reportType}` });
    }

    const setClauses = [];
    const params = [];
    const addField = (field, val) => {
      if (val !== undefined) {
        params.push(typeof val === 'object' ? JSON.stringify(val) : val);
        setClauses.push(`${field} = $${params.length}`);
      }
    };

    addField('name', name?.trim());
    addField('description', description);
    addField('report_type', reportType);
    addField('status', status);
    addField('filters', filters);
    addField('columns', columns);
    addField('chart_type', chartType);
    if (isShared !== undefined) {
      params.push(Boolean(isShared));
      setClauses.push(`is_shared = $${params.length}`);
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'Нет данных для обновления' });
    }

    params.push(id);
    const { rows } = await db.query(
      `UPDATE report_configs SET ${setClauses.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', checkPermission('reports.write'), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { rows: existing } = await db.query(
      'SELECT id, created_by FROM report_configs WHERE id = $1',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Конфигурация не найдена' });
    }
    if (existing[0].createdBy !== userId) {
      return res.status(403).json({ error: 'Нет прав на удаление этой конфигурации' });
    }

    await db.query('DELETE FROM report_configs WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/duplicate', checkPermission('reports.write'), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { rows: existing } = await db.query(
      'SELECT * FROM report_configs WHERE id = $1 AND (created_by = $2 OR is_shared = TRUE)',
      [id, userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Конфигурация не найдена' });
    }

    const src = existing[0];
    const { rows } = await db.query(
      `INSERT INTO report_configs
         (name, description, report_type, filters, columns, chart_type, is_shared, created_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE, $7, $8)
       RETURNING *`,
      [
        `${src.name} (копия)`,
        src.description,
        src.reportType,
        JSON.stringify(src.filters || {}),
        JSON.stringify(src.columns || []),
        src.chartType,
        userId,
        src.status || 'draft',
      ]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;