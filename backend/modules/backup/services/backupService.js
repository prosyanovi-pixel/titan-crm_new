/**
 * Backup Service - business logic for backup operations
 */
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);
const logger = require('../../../utils/logger');
const { findPgBinary, getDbConfig, extractFullBackup, extractZipBackup, ensureDatabase } = require('./backupHelpers');

const BACKUP_DIR = path.join(__dirname, '../../../backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Create ZIP archive with pg_dump database snapshot
 */
async function createDbZip(backupName, config) {
  const sqlFile = path.join(BACKUP_DIR, `${backupName}.sql`);
  const zipFile = path.join(BACKUP_DIR, `${backupName}.zip`);

  const pgDumpPath = findPgBinary('pg_dump');
  logger.info('[backup] Using pg_dump:', pgDumpPath);

  // --clean --if-exists: generates DROP + CREATE (idempotent)
  // --no-owner --no-acl: doesn't write OWNER/GRANT - works on any user
  await execAsync(
    `"${pgDumpPath}" -h "${config.host}" -p ${config.port} -U "${config.user}" -d "${config.database}" --clean --if-exists --no-owner --no-acl -f "${sqlFile}"`,
    { env: { ...process.env, PGPASSWORD: config.password } }
  );
  logger.info('[backup] pg_dump completed');

  const output = fs.createWriteStream(zipFile);
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(output);
  archive.file(sqlFile, { name: `${backupName}.sql` });

  await new Promise((resolve, reject) => {
    output.on('close', resolve);
    archive.on('error', reject);
    output.on('error', reject);
    archive.finalize();
  });

  fs.unlinkSync(sqlFile);
  return zipFile;
}

/**
 * Create database-only backup
 */
async function createBackup(backupName) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const finalName = backupName || `backup-${timestamp}`;
    const config = getDbConfig();
    const zipFile = await createDbZip(finalName, config);

    return {
      success: true,
      message: 'Backup created successfully',
      backup: {
        name: finalName,
        file: `${finalName}.zip`,
        size: fs.statSync(zipFile).size,
        created: new Date().toISOString(),
      },
    };
  } catch (error) {
    logger.error('[backup] Backup creation error:', error);
    throw error;
  }
}

/**
 * Create full backup: database + project files
 */
async function createFullBackup(backupName) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const finalName = backupName || `full-backup-${timestamp}`;
  const sqlFile = path.join(BACKUP_DIR, `${finalName}-db.sql`);
  const zipFile = path.join(BACKUP_DIR, `${finalName}.zip`);
  const projectRoot = path.join(__dirname, '../../../../');

  try {
    logger.info(`[backup:full] Starting full backup: ${finalName}`);
    const config = getDbConfig();
    const pgDumpPath = findPgBinary('pg_dump');

    logger.info(`[backup:full] Creating database dump...`);
    await execAsync(
      `"${pgDumpPath}" -h "${config.host}" -p ${config.port} -U "${config.user}" -d "${config.database}" --clean --if-exists --no-owner --no-acl -f "${sqlFile}"`,
      { env: { ...process.env, PGPASSWORD: config.password } }
    );
    logger.info(`[backup:full] Database dump created: ${fs.statSync(sqlFile).size} bytes`);

    const output = fs.createWriteStream(zipFile);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('warning', err => {
      if (err.code === 'ENOENT') {
        logger.warn(`[backup:full] Archiver warning: ${err.message}`);
      } else {
        throw err;
      }
    });

    archive.on('progress', progress => {
      const { entries, fs: fsStats } = progress;
      if (entries.processed % 500 === 0) {
        logger.info(`[backup:full] Progress: ${entries.processed} files, ${fsStats.processedBytes} bytes`);
      }
    });

    archive.pipe(output);
    // DB dump to archive root
    archive.file(sqlFile, { name: 'database.sql' });
    // Bootstrap script to archive root (can be extracted with one click)
    const bootstrapSrc = path.join(__dirname, '../../scripts/restore-bootstrap.js');
    if (fs.existsSync(bootstrapSrc)) {
      archive.file(bootstrapSrc, { name: 'restore-bootstrap.js' });
    }

    const ignorePatterns = [
      '.git/**',
      '.github/**',
      'backend/backups/**',
      'local-backups/**',
      'backend/logs/**',
      'frontend/dist/**',
      'playwright-report/**',
      'test-results/**',
      'screenshots/**',
      'node_modules/**',
      'backend/node_modules/**',
      'frontend/node_modules/**',
      '.vscode/**',
      '.codeassistant/**',
      '.qwen/**',
      '.continue/**',
      '.gemini/**',
      '**/.tmp.driveupload/**',
      '**/.tmp.drivedownload/**',
      'backend/backups/*.zip',
      'package-lock.json',
      'backend/package-lock.json',
      'frontend/package-lock.json',
      '**/package-lock.json',
      '.venv/**',
      'venv/**',
      '**/.DS_Store',
      '**/.DS_Store?',
      '**/__MACOSX/**',
      '**/._*',
      '**/.AppleDouble/**',
      '**/.AppleDB/**',
      '**/.AppleDesktop/**',
      '**/.Spotlight-V100/**',
      '**/.Trashes/**',
      '**/.fseventsd/**',
      '**/.TemporaryItems/**',
      '**/*.sock',
    ];

    logger.info(`[backup:full] Collecting files from ${projectRoot}...`);
    archive.glob('**', { cwd: projectRoot, dot: true, ignore: ignorePatterns });

    await new Promise((resolve, reject) => {
      output.on('close', () => {
        logger.info(`[backup:full] Archive finalized. Total size: ${archive.pointer()} bytes`);
        resolve();
      });
      archive.on('error', err => {
        logger.error(`[backup:full] Archiver error: ${err.message}`);
        reject(err);
      });
      output.on('error', err => {
        logger.error(`[backup:full] Output stream error: ${err.message}`);
        reject(err);
      });
      archive.finalize();
    });

    fs.unlinkSync(sqlFile);
    logger.info(`[backup:full] Temporary SQL file deleted.`);

    return {
      success: true,
      message: 'Full project backup created successfully',
      backup: {
        name: finalName,
        file: `${finalName}.zip`,
        size: fs.statSync(zipFile).size,
        created: new Date().toISOString(),
        type: 'full',
      },
    };
  } catch (error) {
    logger.error('[backup:full] Error:', error);
    for (const f of [sqlFile, zipFile]) {
      try {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      } catch (_) {}
    }
    throw error;
  }
}

/**
 * Restore database from backup file
 */
async function restoreFromBackup(file, projectRoot) {
  let extractDir = null;
  let retryCount = 0;
  const maxRetries = 3;

  async function attempt() {
    try {
      if (!file) {
        throw new Error('Backup file is required');
      }

      const backupPath = path.join(BACKUP_DIR, file);
      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup file not found');
      }

      const config = getDbConfig();
      let sqlFile;
      let fileCount = 0;
      let isFullBackup = false;

      if (file.endsWith('.zip')) {
        extractDir = path.join(BACKUP_DIR, `temp-${Date.now()}`);
        try {
          // Extract full backup: restores files + returns SQL
          ({ sqlFile, fileCount, isFullBackup } = await extractFullBackup(backupPath, extractDir, projectRoot));
          logger.info(`[backup] SQL file extracted: ${sqlFile}`);
          if (isFullBackup) {
            logger.info(`[backup] Full backup: restored ${fileCount} project files`);
          }
        } catch (extractError) {
          if (extractDir && fs.existsSync(extractDir)) {
            try {
              fs.rmSync(extractDir, { recursive: true, force: true });
            } catch (_) {}
          }
          throw new Error('Could not extract backup file: ' + extractError.message);
        }
      } else {
        sqlFile = backupPath;
      }

      const psqlPath = findPgBinary('psql');
      logger.info('[backup] Using psql:', psqlPath);
      // Create database if doesn't exist (needed for new server migration)
      await ensureDatabase(config);
      await execAsync(
        `"${psqlPath}" -h "${config.host}" -p ${config.port} -U "${config.user}" -d "${config.database}" -f "${sqlFile}"`,
        { env: { ...process.env, PGPASSWORD: config.password } }
      );
      logger.info('[backup] DB restore completed');

      if (extractDir && fs.existsSync(extractDir)) {
        fs.rmSync(extractDir, { recursive: true, force: true });
      }

      return {
        success: true,
        message: isFullBackup ? `Full backup restored: database + ${fileCount} project files` : 'Database restored successfully',
        isFullBackup,
        fileCount,
      };
    } catch (error) {
      logger.error('[backup] Restore error:', error.message);

      if (extractDir && fs.existsSync(extractDir)) {
        try {
          fs.rmSync(extractDir, { recursive: true, force: true });
        } catch (_) {}
      }

      if (error.message?.includes('Access is denied') && retryCount < maxRetries) {
        retryCount++;
        logger.info(`[backup] Retrying restore (attempt ${retryCount}/${maxRetries})...`);
        await new Promise(r => setTimeout(r, 1000 * retryCount));
        return attempt();
      }

      throw error;
    }
  }

  return attempt();
}

/**
 * List all backups
 */
async function listBackups() {
  try {
    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.zip'))
      .map(f => {
        const fp = path.join(BACKUP_DIR, f);
        const stats = fs.statSync(fp);
        return {
          name: f.replace('.zip', ''),
          file: f,
          size: stats.size,
          created: stats.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));
    return files;
  } catch (error) {
    logger.error('List backups error:', error);
    throw error;
  }
}

/**
 * Delete backup file
 */
async function deleteBackup(file) {
  try {
    const filePath = path.join(BACKUP_DIR, file);
    if (!fs.existsSync(filePath)) {
      throw new Error('Backup file not found');
    }
    fs.unlinkSync(filePath);
    return { success: true, message: 'Backup deleted successfully' };
  } catch (error) {
    logger.error('Delete backup error:', error);
    throw error;
  }
}

/**
 * Download backup file path
 */
function getBackupFilePath(file) {
  const filePath = path.join(BACKUP_DIR, file);
  if (!fs.existsSync(filePath)) {
    throw new Error('Backup file not found');
  }
  return filePath;
}

module.exports = {
  createBackup,
  createFullBackup,
  restoreFromBackup,
  listBackups,
  deleteBackup,
  getBackupFilePath,
  BACKUP_DIR,
};
