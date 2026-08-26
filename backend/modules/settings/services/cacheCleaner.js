const cron = require('node-cron');
const db = require('../../../db');
const logger = require('../../../utils/logger');
const { clearCache } = require('../../../utils/moduleSettingsLoader');

/**
 * Сервис автоматической очистки кэша
 */
class CacheCleaner {
  constructor() {
    this.task = null;
  }

  /**
   * Инициализация планировщика
   */
  async init() {
    try {
      const { rows } = await db.query(
        "SELECT value FROM system_settings WHERE setting_key = 'cache_config' LIMIT 1"
      );

      const config = rows.length > 0 ? rows[0].value : {
        autoClearEnabled: true,
        settingsTTL: 3600,
        enrichmentTTL: 86400
      };

      if (!config.autoClearEnabled) {
        logger.info('Автоматическая очистка кэша отключена в настройках');
        return;
      }

      this.task = cron.schedule('0 * * * *', async () => {
        await this.performCleanup(config);
      });

      logger.info('Сервис очистки кэша инициализирован (раз в час)');
    } catch (error) {
      logger.error('Ошибка инициализации CacheCleaner:', error);
    }
  }

  async performCleanup(config) {
    try {
      logger.info('Запуск плановой очистки кэша...');

      clearCache('all');
      logger.debug('Кэш настроек модулей очищен по расписанию');

      if (config.enrichmentTTL > 0) {
        const result = await db.query(
          "DELETE FROM enrichment_cache WHERE cached_at < NOW() - ($1 || ' seconds')::INTERVAL",
          [config.enrichmentTTL]
        );
        logger.debug(`Удалено ${result.rowCount} устаревших записей из enrichment_cache`);
      }

      logger.info('Плановая очистка кэша завершена');
    } catch (error) {
      logger.error('Ошибка при выполнении плановой очистки кэша:', error);
    }
  }

  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
    }
  }
}

module.exports = new CacheCleaner();