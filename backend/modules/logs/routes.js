/**
 * Logs Routes - API endpoints for logs
 */
const express = require('express');
const router = express.Router();
const logsControllers = require('./controllers');

/**
 * POST /api/logs - Create a new log entry
 * Body: { level, source, message, details, userId }
 */
router.post('/', logsControllers.createLog);

/**
 * GET /api/logs - Get system logs
 * Query: ?limit=100&level=error&source=frontend
 */
router.get('/', logsControllers.getLogs);

/**
 * DELETE /api/logs/old - Clear logs older than X days
 * Query: ?daysOld=30
 */
router.delete('/old', logsControllers.clearOldLogs);

module.exports = router;
