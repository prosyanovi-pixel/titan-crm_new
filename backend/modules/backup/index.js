/**
 * Backup Module - Database and project file backup/restore operations
 * Handles database snapshots, full backups, and file management
 */
const express = require('express');
const backupRoutes = require('./routes');

module.exports = function setupBackupModule(app) {
  const router = express.Router();

  /**
   * Mount backup routes
   */
  router.use('/', backupRoutes);

  return router;
};
