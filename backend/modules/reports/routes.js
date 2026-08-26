const express = require('express');
const router = express.Router();
const checkPermission = require('../../middleware/checkPermission');

// Подмодули
const financeRouter      = require('./controllers/finance');
const projectsRouter     = require('./controllers/projects');
const contractorsRouter  = require('./controllers/contractors');
const lawyersRouter      = require('./controllers/lawyers');
const tasksRouter        = require('./controllers/tasks');
const configsRouter      = require('./controllers/configs');
const exportRouter       = require('./controllers/export');
const { getReportPreview } = require('./services/previewService');
const settings = require('./settings');

// Прямой маршрут для предпросмотра (для надежности)
router.get('/preview', checkPermission('reports.read'), async (req, res) => {
  try {
    const { reportType, page, limit, sortBy, sortDir, ...filters } = req.query;
    if (!reportType) {
      return res.status(400).json({ error: 'reportType is required' });
    }

    const preview = await getReportPreview(
      reportType,
      filters,
      parseInt(page || 1, 10),
      parseInt(limit || settings.display.previewLimit || 10, 10),
      sortBy,
      sortDir
    );

    res.json(preview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Маршруты подмодулей
router.use('/finance',      financeRouter);
router.use('/projects',     projectsRouter);
router.use('/contractors',  contractorsRouter);
router.use('/lawyers',      lawyersRouter);
router.use('/tasks',        tasksRouter);
router.use('/configs',      configsRouter);
router.use('/export',       exportRouter);

module.exports = router;
