/**
 * Backup Controllers - HTTP request handlers for backup operations
 */
const logger = require('../../utils/logger');
const backupService = require('./services/backupService');

/**
 * POST /api/backup/create - Create database-only backup
 */
async function createBackup(req, res) {
  try {
    const { name } = req.body;
    const result = await backupService.createBackup(name);
    res.json(result);
  } catch (error) {
    logger.error('[backup] Backup creation error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/backup/full - Create full backup (database + project files)
 */
async function createFullBackup(req, res) {
  // Increase timeout for this long operation
  res.setTimeout(0);

  try {
    const { name } = req.body;
    const result = await backupService.createFullBackup(name);
    res.json(result);
  } catch (error) {
    logger.error('[backup:full] Full backup error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/backup/restore - Restore from backup file
 */
async function restoreBackup(req, res) {
  try {
    const { file } = req.body;
    const projectRoot = require('path').join(__dirname, '../../..');

    if (!file) {
      return res.status(400).json({ error: 'Backup file is required' });
    }

    const result = await backupService.restoreFromBackup(file, projectRoot);
    res.json(result);
  } catch (error) {
    logger.error('[backup] Restore error:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * GET /api/backup/list - List all available backups
 */
async function listBackups(req, res) {
  try {
    const backups = await backupService.listBackups();
    res.json(backups);
  } catch (error) {
    logger.error('List backups error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * DELETE /api/backup/:file - Delete backup file
 */
async function deleteBackup(req, res) {
  try {
    const result = await backupService.deleteBackup(req.params.file);
    res.json(result);
  } catch (error) {
    logger.error('Delete backup error:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * GET /api/backup/download/:file - Download backup file
 */
function downloadBackup(req, res) {
  try {
    const filePath = backupService.getBackupFilePath(req.params.file);
    res.download(filePath);
  } catch (error) {
    logger.error('Download backup error:', error);
    res.status(400).json({ error: error.message });
  }
}

module.exports = {
  createBackup,
  createFullBackup,
  restoreBackup,
  listBackups,
  deleteBackup,
  downloadBackup,
};
