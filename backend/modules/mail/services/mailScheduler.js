/**
 * Mail Scheduler
 * Планировщик задач для почтового модуля
 * 
 * - Периодическая синхронизация аккаунтов
 * - Обработка очереди исходящих писем
 * - Очистка старых подключений
 */

const db = require('../../../db');
const mailSyncService = require('./mailSyncService');
const mailSendService = require('./mailSendService');
const connectionManager = require('./mailConnectionManager');
const logger = require('../../../utils/logger');

class MailScheduler {
  constructor() {
    this.intervals = new Map();
    this.isRunning = false;
  }

  /**
   * Запустить планировщик
   */
  start() {
    if (this.isRunning) {
      logger.warn('[MailScheduler] Already running');
      return;
    }

    logger.info('[MailScheduler] Starting scheduler');
    this.isRunning = true;

    // Синхронизация каждые 5 минут для активных аккаунтов
    this.startInterval('sync', () => this.runSync(), 5 * 60 * 1000);

    // Обработка очереди исходящих каждые 30 секунд
    this.startInterval('send', () => this.processSendQueue(), 30 * 1000);

    // Очистка старых подключений каждые 5 минут
    this.startInterval('cleanup', () => connectionManager.cleanupIdleConnections(), 5 * 60 * 1000);

    logger.info('[MailScheduler] Scheduler started with 3 jobs');
  }

  /**
   * Остановить планировщик
   */
  stop() {
    logger.info('[MailScheduler] Stopping scheduler');

    for (const [name, intervalId] of this.intervals.entries()) {
      clearInterval(intervalId);
      logger.debug(`[MailScheduler] Stopped job: ${name}`);
    }

    this.intervals.clear();
    this.isRunning = false;
  }

  /**
   * Запустить периодическую задачу
   */
  startInterval(name, fn, intervalMs) {
    const intervalId = setInterval(async () => {
      try {
        await fn();
      } catch (error) {
        logger.error(`[MailScheduler] Error in job "${name}":`, error.message);
      }
    }, intervalMs);

    this.intervals.set(name, intervalId);
    logger.debug(`[MailScheduler] Started job "${name}" with interval ${intervalMs}ms`);
  }

  /**
   * Запустить синхронизацию активных аккаунтов
   */
  async runSync() {
    logger.debug('[MailScheduler] Running scheduled sync');

    try {
      // Получаем активные аккаунты с включённой синхронизацией
      const { rows: accounts } = await db.query(
        `SELECT * FROM mail_accounts 
         WHERE is_active = TRUE 
           AND sync_enabled = TRUE 
           AND (last_sync IS NULL OR last_sync < NOW() - (sync_interval_minutes * INTERVAL '1 minute'))
         LIMIT 10`
      );

      if (accounts.length === 0) {
        logger.debug('[MailScheduler] No accounts to sync');
        return;
      }

      logger.info(`[MailScheduler] Syncing ${accounts.length} accounts`);

      let successCount = 0;
      let errorCount = 0;

      for (const account of accounts) {
        try {
          // Передаём syncFolders из настроек аккаунта
          const syncFolders = account.sync_folders || account.syncFolders || null;
          await mailSyncService.syncAccount(account, { 
            background: true,
            syncFolders: syncFolders
          });
          successCount++;
        } catch (error) {
          logger.error(`[MailScheduler] Sync error for ${account.email}:`, error.message);
          errorCount++;
        }

        // Небольшая задержка между аккаунтами
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      logger.info(`[MailScheduler] Sync completed: ${successCount} success, ${errorCount} errors`);
    } catch (error) {
      logger.error('[MailScheduler] Sync error:', error.message);
    }
  }

  /**
   * Обработать очередь исходящих писем
   */
  async processSendQueue() {
    logger.debug('[MailScheduler] Processing send queue');

    try {
      const result = await mailSendService.processQueue();
      
      if (result.sent > 0 || result.failed > 0) {
        logger.info(`[MailScheduler] Send queue: ${result.sent} sent, ${result.failed} failed`);
      }
    } catch (error) {
      logger.error('[MailScheduler] Send queue error:', error.message);
    }
  }

  /**
   * Получить статус планировщика
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      jobs: Array.from(this.intervals.keys()),
      connections: connectionManager.getStats()
    };
  }
}

// Singleton instance
const instance = new MailScheduler();

// Автозапуск удалён — теперь запускается в modules/mail/index.js

module.exports = instance;
