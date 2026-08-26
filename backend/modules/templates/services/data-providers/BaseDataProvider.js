const db = require('../../../../db');
const _ = require('lodash');

/**
 * BaseDataProvider
 * Базовый класс для всех провайдеров данных шаблонов.
 */
class BaseDataProvider {
  constructor(entityId, moduleId) {
    this.entityId = entityId;
    this.moduleId = moduleId;
  }

  /**
   * Возвращает список доступных полей для конструктора шаблонов
   * @returns {Array<{key: string, name: string, type: string, description: string}>}
   */
  static getAvailableFields() {
    throw new Error('Метод getAvailableFields должен быть переопределен');
  }

  static getGlobalFields() {
    return [
      { key: 'DOCUMENT_NUMBER', name: 'Номер документа (из Нумератора)', type: 'string', description: 'Сгенерированный номер из нумератора шаблона' },
      { key: 'CURRENT_DATE', name: 'Текущая дата', type: 'date', description: 'Дата генерации документа' },
      { key: 'CURRENT_YEAR', name: 'Текущий год', type: 'string', description: 'Год генерации документа' }
    ];
  }

  getGlobalData() {
    const now = new Date();
    return {
      CURRENT_DATE: now.toLocaleDateString('ru-RU'),
      CURRENT_YEAR: String(now.getFullYear())
    };
  }

  /**
   * Применяет пользовательские переменные из БД (созданные через визуальный редактор)
   * к переданной сущности
   */
  async applyCustomVariables(entityRawData) {
    if (!this.moduleId) return {};

    try {
      const { rows } = await db.query(
        'SELECT key, db_path FROM template_variables WHERE module_id = $1',
        [this.moduleId]
      );

      const customVariables = {};
      for (const row of rows) {
        // Извлекаем значение по пути. Если путь 'client.name', lodash.get найдет entityRawData.client.name
        const value = _.get(entityRawData, row.db_path, '');
        customVariables[row.key] = value || '';
      }
      return customVariables;
    } catch (err) {
      console.error('Failed to apply custom variables:', err);
      return {};
    }
  }

  /**
   * Получает данные сущности по ID и формирует объект ключ-значение для подстановки
   * @returns {Promise<Object>} Ключи - плейсхолдеры (например DEAL_TITLE), значения - реальные данные
   */
  async fetchData() {
    throw new Error('Метод fetchData должен быть переопределен');
  }
}

module.exports = BaseDataProvider;
