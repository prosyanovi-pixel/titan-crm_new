const db = require('../../../../db');
const logger = require('../../../../utils/logger');
const fs = require('fs');
const path = require('path');
const os = require('os');

const LOGS_DIR = path.join(__dirname, '../../../../logs');
const BACKUPS_DIR = path.join(__dirname, '../../../../backups');

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (d > 0) return `${d}д ${h}ч ${m}м`;
  if (h > 0) return `${h}ч ${m}м ${s}с`;
  return `${m}м ${s}с`;
}

function safeReadLastLines(filePath, maxLines = 200) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());
    return lines.slice(-maxLines).join('\n');
  } catch {
    return '';
  }
}

async function buildHealthChecks() {
  const checks = {};
  const startTime = Date.now();

  try {
    const { rows } = await db.query('SELECT NOW() as time, version() as ver');
    checks.database = {
      status: 'ok',
      serverTime: rows[0].time,
      version: rows[0].ver.split(' ').slice(0, 2).join(' '),
      responseMs: Date.now() - startTime,
    };
  } catch (err) {
    checks.database = { status: 'error', error: err.message };
  }

  try {
    const { rows } = await db.query(`
      SELECT count(*) AS total,
             sum(CASE WHEN state = 'active' THEN 1 ELSE 0 END) AS active,
             sum(CASE WHEN state = 'idle'   THEN 1 ELSE 0 END) AS idle
      FROM pg_stat_activity
      WHERE datname = current_database()
    `);
    checks.database.connections = {
      total: parseInt(rows[0].total),
      active: parseInt(rows[0].active),
      idle: parseInt(rows[0].idle),
    };
  } catch {
    /* ignore */
  }

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  checks.memory = {
    total: formatBytes(totalMem),
    free: formatBytes(freeMem),
    used: formatBytes(totalMem - freeMem),
    usedPct: Math.round(((totalMem - freeMem) / totalMem) * 100),
    process: {
      heapUsed: formatBytes(process.memoryUsage().heapUsed),
      heapTotal: formatBytes(process.memoryUsage().heapTotal),
      rss: formatBytes(process.memoryUsage().rss),
    },
  };

  checks.uptime = {
    process: Math.round(process.uptime()),
    system: Math.round(os.uptime()),
    processHuman: formatUptime(process.uptime()),
    systemHuman: formatUptime(os.uptime()),
  };

  checks.environment = {
    nodeVersion: process.version,
    platform: `${os.platform()} ${os.arch()}`,
    cpus: os.cpus().length,
    hostname: os.hostname(),
    nodeEnv: process.env.NODE_ENV || 'development',
  };

  try {
    if (fs.existsSync(BACKUPS_DIR)) {
      const files = fs.readdirSync(BACKUPS_DIR).filter(f => !f.startsWith('.'));
      let totalSize = 0;
      let lastBackupAt = null;
      files.forEach(f => {
        const stat = fs.statSync(path.join(BACKUPS_DIR, f));
        totalSize += stat.size;
        if (!lastBackupAt || stat.mtime > lastBackupAt) lastBackupAt = stat.mtime;
      });
      checks.backups = { count: files.length, totalSize: formatBytes(totalSize), lastBackupAt };
    } else {
      checks.backups = { count: 0, totalSize: '0 B', lastBackupAt: null };
    }
  } catch {
    checks.backups = { count: 0, totalSize: '0 B', lastBackupAt: null };
  }

  try {
    if (fs.existsSync(LOGS_DIR)) {
      const logFiles = fs.readdirSync(LOGS_DIR).filter(f => f.endsWith('.log'));
      let totalSize = 0;
      logFiles.forEach(f => {
        try {
          totalSize += fs.statSync(path.join(LOGS_DIR, f)).size;
        } catch {
          /* ignore */
        }
      });
      checks.logs = { fileCount: logFiles.length, totalSize: formatBytes(totalSize) };
    }
  } catch {
    /* ignore */
  }

  const hasError = Object.values(checks).some(c => c && c.status === 'error');
  return { status: hasError ? 'degraded' : 'ok', checks, generatedAt: new Date() };
}

function listLogFiles() {
  if (!fs.existsSync(LOGS_DIR)) return [];
  return fs.readdirSync(LOGS_DIR)
    .filter(f => f.endsWith('.log'))
    .map(f => {
      const stat = fs.statSync(path.join(LOGS_DIR, f));
      return { name: f, size: stat.size, sizeHuman: formatBytes(stat.size), modifiedAt: stat.mtime };
    })
    .sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
}

function readLogFile(name, lines = 200) {
  const filename = path.basename(name);
  const filePath = path.join(LOGS_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  return { name: filename, content: safeReadLastLines(filePath, lines), lines };
}

function deleteLogFile(name) {
  const filename = path.basename(name);
  const filePath = path.join(LOGS_DIR, filename);
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  logger.info(`admin: log file deleted: ${filename}`);
  return true;
}

async function getSystemLogs({ level, source, limit = 200, offset = 0 }) {
  const params = [];
  const conditions = [];
  if (level) { params.push(level); conditions.push(`level = $${params.length}`); }
  if (source) { params.push(source); conditions.push(`source = $${params.length}`); }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  params.push(parseInt(limit), parseInt(offset));
  const { rows } = await db.query(
    `SELECT * FROM system_logs ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  const { rows: countRows } = await db.query(
    `SELECT COUNT(*) as total FROM system_logs ${where}`,
    params.slice(0, -2)
  );
  return { rows, total: parseInt(countRows[0].total) };
}

async function clearSystemLogs(olderThanDays = 30) {
  const { rowCount } = await db.query(
    `DELETE FROM system_logs WHERE created_at < NOW() - INTERVAL '${parseInt(olderThanDays)} days'`
  );
  logger.info(`admin: cleared ${rowCount} system log rows older than ${olderThanDays} days`);
  return rowCount;
}

async function getDbStats() {
  const { rows } = await db.query(`
    SELECT
      relname        AS table_name,
      n_live_tup     AS row_count,
      pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
      pg_size_pretty(pg_relation_size(relid))       AS table_size,
      last_vacuum, last_autovacuum, last_analyze, last_autoanalyze
    FROM pg_stat_user_tables
    ORDER BY n_live_tup DESC
  `);
  return rows;
}

module.exports = {
  LOGS_DIR,
  formatBytes,
  buildHealthChecks,
  listLogFiles,
  readLogFile,
  deleteLogFile,
  getSystemLogs,
  clearSystemLogs,
  getDbStats,
};