/**
 * Logs Module - System logging endpoints
 * Handles logging of system events and errors
 */
const express = require('express');
const logsRoutes = require('./routes');

module.exports = function setupLogsModule(app) {
  const router = express.Router();

  /**
   * Mount logs routes
   */
  router.use('/', logsRoutes);

  /**
   * GET /api/logs - Info endpoint
   */
  router.get('/info', (req, res) => {
    res.json({
      module: 'logs',
      description: 'System logging API',
      endpoints: {
        'POST /logs': 'Create a log entry',
        'GET /logs': 'Get system logs',
        'DELETE /logs/old': 'Clear old logs',
      },
    });
  });

  return router;
};
