/**
 * Скрипт миграции настроек Обогащения из системных настроек в настройки модуля
 */
const db = require('../db');
const logger = require('../utils/logger');

async function migrate() {
  logger.info('Начало миграции настроек обогащения...');

  try {
    // 1. Получаем текущие значения из system_settings
    const { rows } = await db.query(
      `SELECT setting_key, value FROM system_settings 
       WHERE setting_key IN ('dadata_api_key', 'apifns_api_key', 'enrichment_priority_service')`
    );

    if (rows.length === 0) {
      logger.info('Старые настройки не найдены в system_settings. Возможно, миграция уже была проведена или ключи не настроены.');
      return;
    }

    const oldSettings = {};
    rows.forEach(r => {
      let val = r.value;
      if (typeof val === 'string') {
        try { val = JSON.parse(val); } catch (e) {}
      }
      oldSettings[r.setting_key] = val;
    });

    logger.info(`Найдено ${rows.length} настроек для миграции.`);

    // 2. Формируем новый объект настроек для модуля enrichment
    // Мы группируем их в apiKeys для порядка
    const apiKeysGroup = {
      dadataKey: oldSettings.dadata_api_key || '',
      apifnsKey: oldSettings.apifns_api_key || '',
      priorityService: oldSettings.enrichment_priority_service || 'dadata'
    };

    // 3. Сохраняем в module_settings
    await db.query(
      `INSERT INTO module_settings (module_id, setting_key, value, updated_at)
       VALUES ($1, $2, $3::jsonb, CURRENT_TIMESTAMP)
       ON CONFLICT (module_id, setting_key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
      ['enrichment', 'apiKeys', JSON.stringify(apiKeysGroup)]
    );

    logger.info('Настройки API успешно перенесены в module_settings для модуля enrichment.');

    // 4. Опционально: удаляем старые записи из system_settings
    await db.query(
      `DELETE FROM system_settings 
       WHERE setting_key IN ('dadata_api_key', 'apifns_api_key', 'enrichment_priority_service')`
    );

    logger.info('Старые системные настройки удалены.');
    logger.info('Миграция завершена успешно.');
    process.exit(0);
  } catch (error) {
    logger.error('Ошибка в процессе миграции:', error);
    process.exit(1);
  }
}

migrate();
