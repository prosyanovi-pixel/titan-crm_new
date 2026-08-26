/**
 * Backup Helpers - auxiliary functions for backup module
 * Finds PostgreSQL binaries, manages directory operations, handles ZIP extraction
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const unzipper = require('unzipper');
const logger = require('../../../utils/logger');

/**
 * Automatically searches for PostgreSQL binary (pg_dump / psql)
 * Search order: env variable → PATH → standard directories → bare name
 * @param {'pg_dump'|'psql'} name
 * @returns {string}
 */
function findPgBinary(name) {
  const envKey = name === 'pg_dump' ? 'PG_DUMP_PATH' : 'PSQL_PATH';
  const envVal = (process.env[envKey] || '').trim();
  if (envVal) return envVal;

  const platform = os.platform();

  try {
    const whichCmd = platform === 'win32' ? `where ${name}` : `which ${name}`;
    const found = execSync(whichCmd, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
      .split(/\r?\n/)[0]
      .trim();
    if (found) return found;
  } catch (_) {
    /* not in PATH */
  }

  const versions = ['18', '17', '16', '15', '14', '13', '12'];
  const candidates = {
    win32: versions.flatMap(v => [
      `C:\\Program Files\\PostgreSQL\\${v}\\bin\\${name}.exe`,
      `C:\\Program Files (x86)\\PostgreSQL\\${v}\\bin\\${name}.exe`,
    ]),
    darwin: [
      ...versions.flatMap(v => [
        `/Applications/Postgres.app/Contents/Versions/${v}/bin/${name}`,
        `/Library/PostgreSQL/${v}/bin/${name}`,
        `/opt/local/lib/postgresql${v}/bin/${name}`,
      ]),
      `/opt/homebrew/bin/${name}`,
      `/usr/local/bin/${name}`,
      `/opt/local/bin/${name}`,
      `/usr/bin/${name}`,
    ],
    linux: [`/usr/bin/${name}`, `/usr/local/bin/${name}`],
  };

  const list = candidates[platform] || candidates.linux;
  for (const p of list) {
    if (fs.existsSync(p)) return p;
  }
  return name;
}

/**
 * Recursively copy directory
 */
function copyDirectoryRecursive(source, target) {
  if (!fs.existsSync(source)) return;
  if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });

  for (const file of fs.readdirSync(source)) {
    const srcPath = path.join(source, file);
    const dstPath = path.join(target, file);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirectoryRecursive(srcPath, dstPath);
    } else {
      try {
        fs.copyFileSync(srcPath, dstPath);
      } catch (err) {
        logger.error(`[backup] Failed to copy ${srcPath}:`, err.message);
      }
    }
  }
}

/**
 * Read database connection parameters from pool or environment variables
 */
function getDbConfig() {
  const db = require('../../../db');
  const pool = db.pool || db;

  if (pool.options) {
    const { host, port, database, user, password } = pool.options;
    if (!host || !port || !database || !user) {
      throw new Error('Missing required connection parameters in pool.options');
    }
    return { host, port, database, user, password };
  }

  const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };

  const missing = ['host', 'port', 'database', 'user'].filter(k => !config[k]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
  return config;
}

/**
 * Extract ZIP archive, extracting only .sql files
 */
async function extractZipBackup(backupPath, extractDir) {
  if (fs.existsSync(extractDir)) {
    try {
      fs.rmSync(extractDir, { recursive: true, force: true });
    } catch (_) {}
  }
  fs.mkdirSync(extractDir, { recursive: true });

  await new Promise((resolve, reject) => {
    let hasError = false;
    const readStream = fs.createReadStream(backupPath);

    readStream.on('error', err => {
      hasError = true;
      reject(err);
    });

    readStream
      .pipe(unzipper.Parse())
      .on('entry', entry => {
        if (hasError) return;
        const { path: entryPath, type } = entry;

        if (type !== 'File' || !entryPath.endsWith('.sql')) {
          entry.autodrain();
          return;
        }

        const dest = path.join(extractDir, path.basename(entryPath));
        const ws = fs.createWriteStream(dest);
        ws.on('error', err => {
          hasError = true;
          reject(err);
        });
        entry.pipe(ws);
      })
      .on('close', () => {
        if (!hasError) resolve();
      })
      .on('error', err => {
        hasError = true;
        reject(err);
      });
  });

  const sqlFileName = fs.readdirSync(extractDir).find(f => f.endsWith('.sql'));
  if (!sqlFileName) throw new Error('SQL file not found in backup archive');
  return path.join(extractDir, sqlFileName);
}

/**
 * Extract full backup (DB + project files) from ZIP archive
 *
 * Logic for determining DB dump:
 *   - File is in archive ROOT (no `/` in path) AND ends with `.sql`
 *   → this is PostgreSQL dump; saved to extractDir.
 *
 * All other files are treated as project files and extracted to targetRoot,
 * preserving directory structure.
 */
async function extractFullBackup(backupPath, extractDir, targetRoot) {
  if (fs.existsSync(extractDir)) {
    try {
      fs.rmSync(extractDir, { recursive: true, force: true });
    } catch (_) {}
  }
  fs.mkdirSync(extractDir, { recursive: true });

  let sqlFile = null;
  let fileCount = 0;
  const pending = [];

  await new Promise((resolve, reject) => {
    let hasError = false;
    const readStream = fs.createReadStream(backupPath);
    readStream.on('error', err => {
      hasError = true;
      reject(err);
    });

    readStream
      .pipe(unzipper.Parse())
      .on('entry', entry => {
        if (hasError) {
          entry.autodrain();
          return;
        }
        const { path: entryPath, type } = entry;

        if (type !== 'File') {
          entry.autodrain();
          return;
        }

        // Root-level .sql → DB dump
        const isRootSql = !entryPath.includes('/') && entryPath.endsWith('.sql');

        if (isRootSql) {
          const dest = path.join(extractDir, path.basename(entryPath));
          const ws = fs.createWriteStream(dest);
          const p = new Promise((res, rej) => {
            ws.on('finish', () => {
              sqlFile = dest;
              res();
            });
            ws.on('error', e => {
              hasError = true;
              rej(e);
            });
          });
          pending.push(p);
          entry.pipe(ws);
        } else {
          // Project file - restore to targetRoot
          const dest = path.join(targetRoot, entryPath);
          const dir = path.dirname(dest);
          try {
            fs.mkdirSync(dir, { recursive: true });
          } catch (_) {}
          const ws = fs.createWriteStream(dest);
          const p = new Promise((res, rej) => {
            ws.on('finish', () => {
              fileCount++;
              res();
            });
            ws.on('error', e => {
              logger.error(`[backup] Failed to restore ${entryPath}:`, e.message);
              res(); // don't break entire process due to one file
            });
          });
          pending.push(p);
          entry.pipe(ws);
        }
      })
      .on('close', () => {
        if (!hasError) Promise.all(pending).then(resolve).catch(reject);
      })
      .on('error', err => {
        hasError = true;
        reject(err);
      });
  });

  if (!sqlFile) throw new Error('SQL dump file not found in backup archive');
  const isFullBackup = fileCount > 0;
  return { sqlFile, fileCount, isFullBackup };
}

/**
 * Ensure database exists
 * Connects to `postgres` system database and creates target database if it doesn't exist.
 * Safe to call before restore on a new server.
 */
async function ensureDatabase(config) {
  const psqlPath = findPgBinary('psql');
  const env = { ...process.env, PGPASSWORD: config.password };

  // Check if database exists
  try {
    await execAsync(
      `"${psqlPath}" -h "${config.host}" -p ${config.port} -U "${config.user}" -d "${config.database}" -c "SELECT 1" --no-psqlrc -q`,
      { env }
    );
    logger.info(`[backup] Database "${config.database}" already exists`);
    return;
  } catch (_) {
    // Database doesn't exist - create it
  }

  logger.info(`[backup] Creating database "${config.database}"...`);
  await execAsync(
    `"${psqlPath}" -h "${config.host}" -p ${config.port} -U "${config.user}" -d postgres -c "CREATE DATABASE \\"${config.database}\\" ENCODING 'UTF8'"`,
    { env }
  );
  logger.info(`[backup] Database "${config.database}" created`);
}

module.exports = {
  findPgBinary,
  copyDirectoryRecursive,
  getDbConfig,
  extractZipBackup,
  extractFullBackup,
  ensureDatabase,
};
