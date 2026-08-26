const cron = require('node-cron');
const db = require('../../../db');
const logger = require('../../../utils/logger');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);
const { clearCache } = require('../../../utils/moduleSettingsLoader');

/**
 * Сервис планирования системных задач
 */
class SyncScheduler {
  constructor() {
    this.tasks = [];
  }

  /**
   * Инициализация всех задач
   */
  async init() {
    try {
      const { rows } = await db.query(
        "SELECT value FROM system_settings WHERE setting_key = 'sync_config' LIMIT 1"
      );

      const config = rows.length > 0 ? rows[0].value : {
        backupCron: "0 0 * * *",
        enrichmentCron: "0 3 * * *",
        moduleSyncCron: "0 1 * * *",
        cacheClearCron: "0 5 * * *",
        trashCleanupCron: "0 4 * * *",
        enabled: true
      };

      if (!config.enabled) {
        logger.info('SyncScheduler отключен в настройках');
        return;
      }

      this.stopAll();

      if (config.backupCron) {
        this.tasks.push(cron.schedule(config.backupCron, () => this.runBackup()));
        logger.info(`Задача бэкапа запланирована: ${config.backupCron}`);
      }

      if (config.enrichmentCron) {
        this.tasks.push(cron.schedule(config.enrichmentCron, () => this.runEnrichment()));
        logger.info(`Задача обогащения запланирована: ${config.enrichmentCron}`);
      }

      if (config.moduleSyncCron) {
        this.tasks.push(cron.schedule(config.moduleSyncCron, () => this.runModuleSync()));
        logger.info(`Задача синхронизации модулей запланирована: ${config.moduleSyncCron}`);
      }

      if (config.cacheClearCron) {
        this.tasks.push(cron.schedule(config.cacheClearCron, () => this.runCacheClear()));
        logger.info(`Задача очистки кэша запланирована: ${config.cacheClearCron}`);
      }

      if (config.trashCleanupCron) {
        this.tasks.push(cron.schedule(config.trashCleanupCron, () => this.runTrashCleanup()));
        logger.info(`Задача очистки корзины запланирована: ${config.trashCleanupCron}`);
      }

    } catch (error) {
      logger.error('Ошибка инициализации SyncScheduler:', error);
    }
  }

  async runBackup() {
    const scriptPath = path.join(__dirname, '../../../scripts/create-backup.js');
    logger.info('[SyncScheduler] Запуск автоматического бэкапа...');
    try {
      await execFileAsync('node', [scriptPath], { cwd: path.join(__dirname, '../../../') });
      logger.info('[SyncScheduler] Автоматический бэкап успешно завершен');
    } catch (error) {
      logger.error('[SyncScheduler] Ошибка автоматического бэкапа:', error);
    }
  }

  async runEnrichment() {
    logger.info('[SyncScheduler] Запуск автоматического обогащения...');
    try {
      const { rows: contractors } = await db.query(
        "SELECT id, name, inn FROM contractors WHERE inn IS NOT NULL AND (enriched_at IS NULL OR enriched_at < NOW() - INTERVAL '30 days') LIMIT 100"
      );

      if (contractors.length === 0) {
        logger.info('[SyncScheduler] Нет контрагентов для обогащения');
        return;
      }

      const { makeJobId, runEnrichmentJob } = require('../../../modules/enrichment/services/enrichmentJob');
      const jobId = makeJobId();

      await db.query(
        `INSERT INTO enrichment_jobs (id, status, total, progress, started_at)
         VALUES ($1, 'pending', $2, 0, NOW())`,
        [jobId, contractors.length]
      );

      runEnrichmentJob(jobId, contractors, true);

      logger.info(`[SyncScheduler] Задача обогащения запущена: ${jobId} (${contractors.length} контр.)`);
    } catch (error) {
      logger.error('[SyncScheduler] Ошибка автоматического обогащения:', error);
    }
  }

  async runModuleSync() {
    const scriptPath = path.join(__dirname, '../../../scripts/sync-modules.js');
    logger.info('[SyncScheduler] Запуск автоматической синхронизации модулей...');
    try {
      await execFileAsync('node', [scriptPath], { cwd: path.join(__dirname, '../../../') });
      logger.info('[SyncScheduler] Автоматическая синхронизация модулей завершена');
    } catch (error) {
      logger.error('[SyncScheduler] Ошибка автоматической синхронизации модулей:', error);
    }
  }
  
  async runCacheClear() {
    logger.info('[SyncScheduler] Запуск очистки кэша...');
    try {
      clearCache('all');
      const result = await db.query('DELETE FROM enrichment_cache');
      logger.info(`[SyncScheduler] Очистка кэша завершена. Удалено ${result.rowCount} записей из enrichment_cache.`);
    } catch (error) {
      logger.error('[SyncScheduler] Ошибка очистки кэша:', error);
    }
  }

  async runTrashCleanup() {
    logger.info('[SyncScheduler] Запуск автоматической очистки корзины...');
    try {
      const port = process.env.PORT || 3000;
      // Используем глобальный fetch Node.js (доступен в Node 18+)
      const response = await fetch(`http://127.0.0.1:${port}/api/trash/cleanup`, { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        logger.info(`[SyncScheduler] Автоматическая очистка корзины завершена: ${result.message}`);
      } else {
        logger.error(`[SyncScheduler] Ошибка автоматической очистки корзины: ${result.message}`);
      }
    } catch (error) {
      logger.error('[SyncScheduler] Ошибка автоматической очистки корзины:', error);
    }
  }

  stopAll() {
    this.tasks.forEach(t => t.stop());
    this.tasks = [];
  }
}

module.exports = new SyncScheduler();