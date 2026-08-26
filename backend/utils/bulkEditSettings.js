/**
 * Bulk Edit Settings - утилиты для работы с настройками массового редактирования
 */

const db = require('../db');
const logger = require('./logger');

/**
 * Получить настройки массового редактирования для модуля
 * @param {string} moduleId - ID модуля
 * @returns {Promise<object>} Настройки массового редактирования
 */
async function getModuleBulkEditSettings(moduleId) {
  try {
    const result = await db.query(
      `SELECT value FROM module_settings 
       WHERE module_id = $1 AND setting_key = 'bulk_edit_fields'`,
      [moduleId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].value;
  } catch (error) {
    logger.error(`Error fetching bulk edit settings for module ${moduleId}`, error);
    throw error;
  }
}

/**
 * Сохранить настройки массового редактирования для модуля
 * @param {string} moduleId - ID модуля
 * @param {object} fields - Поля для массового редактирования
 * @returns {Promise<object>} Результат операции
 */
async function saveModuleBulkEditSettings(moduleId, fields) {
  try {
    // Проверяем существует ли запись
    const existing = await db.query(
      `SELECT id FROM module_settings 
       WHERE module_id = $1 AND setting_key = 'bulk_edit_fields'`,
      [moduleId]
    );

    if (existing.rows.length > 0) {
      // Обновляем существующую запись
      await db.query(
        `UPDATE module_settings 
         SET value = $1, updated_at = NOW() 
         WHERE module_id = $2 AND setting_key = 'bulk_edit_fields'`,
        [JSON.stringify(fields), moduleId]
      );
    } else {
      // Создаём новую запись
      await db.query(
        `INSERT INTO module_settings (module_id, setting_key, value, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [moduleId, 'bulk_edit_fields', JSON.stringify(fields)]
      );
    }

    return { success: true };
  } catch (error) {
    logger.error(`Error saving bulk edit settings for module ${moduleId}`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Получить все настройки массового редактирования для всех модулей
 * @returns {Promise<object>} Объект с настройками для всех модулей
 */
async function getAllBulkEditSettings() {
  try {
    const result = await db.query(
      `SELECT module_id, value FROM module_settings
       WHERE setting_key = 'bulk_edit_fields'`
    );

    const settings = {};
    result.rows.forEach(row => {
      // pg возвращает moduleId (camelCase) из-за настройки types
      const moduleId = row.moduleId || row.module_id;
      if (moduleId) {
        settings[moduleId] = row.value;
      }
    });

    return settings;
  } catch (error) {
    logger.error('Error fetching all bulk edit settings', error);
    return {};
  }
}

/**
 * Получить доступные поля для массового редактирования модуля
 * Возвращает только включённые (enabled) поля, отсортированные по порядку
 * @param {string} moduleId - ID модуля
 * @returns {Promise<Array>} Массив полей
 */
async function getEnabledBulkEditFields(moduleId) {
  const settings = await getModuleBulkEditSettings(moduleId);
  
  if (!settings || !settings.fields) {
    return { fields: [], enabled: false };
  }

  const enabledFields = settings.fields
    .filter(field => field.enabled)
    .sort((a, b) => a.order - b.order);

  return {
    fields: enabledFields,
    enabled: settings.enabled !== false
  };
}

module.exports = {
  getModuleBulkEditSettings,
  saveModuleBulkEditSettings,
  getAllBulkEditSettings,
  getEnabledBulkEditFields,
};
