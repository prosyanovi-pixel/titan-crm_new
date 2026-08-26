/**
 * Backup Routes - API endpoints for backup operations
 */
const express = require('express');
const router = express.Router();
const backupControllers = require('./controllers');

/**
 * GET /api/backup - Info endpoint
 */
router.get('/', (req, res) => {
  res.json({ message: 'Backup API. Use /backup/list or /backup/create for details.' });
});

/**
 * POST /api/backup/create - Create database-only backup
 * Body: { name?: string }
 */
router.post('/create', backupControllers.createBackup);

/**
 * POST /api/backup/full - Create full backup (database + project files)
 * Body: { name?: string }
 */
router.post('/full', backupControllers.createFullBackup);

/**
 * POST /api/backup/restore - Restore from backup file
 * Body: { file: string }
 */
router.post('/restore', backupControllers.restoreBackup);

/**
 * GET /api/backup/list - List all available backups
 */
router.get('/list', backupControllers.listBackups);

/**
 * GET /api/backup/download/:file - Download backup file
 */
router.get('/download/:file', backupControllers.downloadBackup);

/**
 * DELETE /api/backup/:file - Delete backup file
 */
router.delete('/:file', backupControllers.deleteBackup);

module.exports = router;
