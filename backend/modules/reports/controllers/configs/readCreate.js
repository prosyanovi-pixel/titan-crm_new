const express = require('express');

const db = require('../../../../db');
const settings = require('../../settings');
const checkPermission = require('../../../../middleware/checkPermission');
const { getReportPreview } = require('../../services/previewService');

const router = express.Router();

router.get('/preview', checkPermission('reports.read'), async (req, res) => {
  try {
    const { reportType, page, limit, ...filters } = req.query;
    if (!reportType) {
      return res.status(400).json({ error: 'reportType is required' });
    }

    const preview = await getReportPreview(
      reportType,
      filters,
      parseInt(page || 1, 10),
      parseInt(limit || settings.display.previewLimit || 10, 10)
    );

    res.json(preview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', checkPermission('reports.read'), async (req, res) => {
  try {
    const userId = req.user.id;

    const { rows } = await db.query(
      `SELECT rc.*,
              u.name AS created_by_name
       FROM report_configs rc
       LEFT JOIN users u ON u.id = rc.created_by
       WHERE rc.created_by = $1 OR rc.is_shared = TRUE
       ORDER BY rc.updated_at DESC`,
      [userId]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', checkPermission('reports.read'), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { rows } = await db.query(
      `SELECT rc.*, u.name AS created_by_name
       FROM report_configs rc
       LEFT JOIN users u ON u.id = rc.created_by
       WHERE rc.id = $1 AND (rc.created_by = $2 OR rc.is_shared = TRUE)`,
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Report config not found or no access' });
    }

    const config = rows[0];
    const preview = await getReportPreview(config.reportType, config.filters, 1, settings.display.previewLimit || 10);

    res.json({
      config,
      preview
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', checkPermission('reports.write'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description, reportType, filters = {}, columns = [], chartType, isShared = false, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Report name is required' });
    }

    const { rows } = await db.query(
      `INSERT INTO report_configs (name, description, report_type, filters, columns, chart_type, is_shared, created_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        name.trim(),
        description || null,
        reportType,
        JSON.stringify(filters),
        JSON.stringify(columns),
        chartType || null,
        Boolean(isShared),
        userId,
        status || 'draft',
      ]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
