const express = require('express');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const { promisify } = require('util');

const logger = require('../../../../utils/logger');
const {
  buildHealthChecks,
  listLogFiles,
  readLogFile,
  deleteLogFile,
  getSystemLogs,
  clearSystemLogs,
  getDbStats,
} = require('./systemHelpers');

const execFileAsync = promisify(execFile);
const SCRIPTS_DIR = path.join(__dirname, '../../../../scripts');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Admin API. Use /admin/users or /admin/settings for details.' });
});

router.get('/health', async (req, res) => {
  try {
    res.json(await buildHealthChecks());
  } catch (err) {
    logger.error('admin: health error', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/log-files', (req, res) => {
  try {
    res.json(listLogFiles());
  } catch (err) {
    logger.error('admin: log-files list error', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/log-files/:name', (req, res) => {
  try {
    const result = readLogFile(req.params.name, parseInt(req.query.lines) || 200);
    if (!result) return res.status(404).json({ error: 'Файл не найден' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/log-files/:name', (req, res) => {
  try {
    const ok = deleteLogFile(req.params.name);
    if (!ok) return res.status(404).json({ error: 'Файл не найден' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/system-logs', async (req, res) => {
  try {
    res.json(await getSystemLogs(req.query));
  } catch (err) {
    logger.error('admin: system-logs error', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/system-logs/clear', async (req, res) => {
  try {
    const deleted = await clearSystemLogs(req.body.olderThanDays);
    res.json({ success: true, deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/settings/log-to-db', async (req, res) => {
  const db = require('../../../../db');
  try {
    const { rows } = await db.query(
      "SELECT value FROM system_settings WHERE setting_key = 'log_to_db' LIMIT 1"
    );
    const enabled = rows.length > 0 && (rows[0].value === true || rows[0].value === 'true');
    res.json({ enabled });
  } catch (err) {
    logger.error('admin: log-to-db setting error', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/settings/log-to-db', async (req, res) => {
  const db = require('../../../../db');
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Параметр enabled должен быть boolean' });
    }

    await db.query(
      "INSERT INTO system_settings (setting_key, value) VALUES ('log_to_db', $1) ON CONFLICT (setting_key) DO UPDATE SET value = $1, updated_at = NOW()",
      [enabled]
    );

    logger.clearCache();
    logger.info(`admin: log_to_db setting changed to ${enabled}`);
    res.json({ success: true, enabled });
  } catch (err) {
    logger.error('admin: set log-to-db error', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/db-stats', async (req, res) => {
  try {
    res.json(await getDbStats());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/maintenance/vacuum', async (req, res) => {
  const db = require('../../../../db');
  try {
    await db.query('VACUUM ANALYZE');
    logger.info('admin: VACUUM ANALYZE executed');
    res.json({ success: true, message: 'VACUUM ANALYZE выполнен успешно' });
  } catch (err) {
    logger.error('admin: vacuum error', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/maintenance/sync-modules', async (req, res) => {
  const scriptPath = path.join(SCRIPTS_DIR, 'sync-modules.js');
  if (!fs.existsSync(scriptPath)) {
    return res.status(404).json({ error: 'Скрипт sync-modules.js не найден' });
  }
  try {
    const { stdout, stderr } = await execFileAsync('node', [scriptPath], {
      timeout: 30000,
      cwd: path.join(__dirname, '../../../..'),
    });
    logger.info('admin: sync-modules completed');
    res.json({ success: true, output: stdout, errors: stderr || null });
  } catch (err) {
    logger.error('admin: sync-modules error', err);
    res.status(500).json({ error: err.message, output: err.stdout, errors: err.stderr });
  }
});

const { clearCache } = require('../../../../utils/moduleSettingsLoader');

router.post('/cache/clear', async (req, res) => {
  const db = require('../../../../db');
  try {
    // 1. Clear in-memory settings cache
    clearCache('all');
    logger.info('admin: Cache cleared for all modules');

    // 2. Clear database enrichment cache
    const result = await db.query('DELETE FROM enrichment_cache');
    const count = result.rowCount;
    logger.info(`admin: Enrichment cache cleared (${count} records)`);

    res.json({ 
      success: true, 
      message: `Кэш настроек и кэш обогащения (${count} записей) успешно очищены`,
    });
  } catch (err) {
    logger.error('admin: cache clear error', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/env-info', (req, res) => {
  const SAFE_KEYS = ['NODE_ENV', 'PORT', 'TZ', 'LANG', 'npm_package_version'];
  const env = {};
  SAFE_KEYS.forEach(k => { if (process.env[k] !== undefined) env[k] = process.env[k]; });
  const pkg = require('../../../../package.json');
  res.json({
    env,
    packageVersion: pkg.version,
    scripts: Object.keys(pkg.scripts || {}),
    dependencies: Object.keys(pkg.dependencies || {}).map(name => ({
      name, version: pkg.dependencies[name],
    })),
  });
});

module.exports = router;