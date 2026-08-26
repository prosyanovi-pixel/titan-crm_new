/**
 * Logs Controllers - handles HTTP requests for logs
 */
const logsService = require('./services/logsService');
const logger = require('../../utils/logger');

/**
 * POST /api/logs - Create a new log entry
 */
async function createLog(req, res) {
  try {
    const { level, source, message, details, userId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await logsService.createLog(level, source, message, details, userId);

    // Don't send error response to avoid infinite loops if logging fails
    res.status(201).json(result);
  } catch (err) {
    logger.error('Failed to create log', err);
    res.status(200).json({ success: false });
  }
}

/**
 * GET /api/logs - Get system logs
 */
async function getLogs(req, res) {
  try {
    const { limit = 100, level, source } = req.query;

    let logs;
    if (level || source) {
      logs = await logsService.getFilteredLogs(level, source, parseInt(limit));
    } else {
      logs = await logsService.getLogs(parseInt(limit));
    }

    res.json(logs);
  } catch (err) {
    logger.error('Failed to get logs', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * DELETE /api/logs/old - Clear old logs
 */
async function clearOldLogs(req, res) {
  try {
    const { daysOld = 30 } = req.query;

    const result = await logsService.clearOldLogs(parseInt(daysOld));

    res.json(result);
  } catch (err) {
    logger.error('Failed to clear old logs', err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createLog,
  getLogs,
  clearOldLogs,
};
