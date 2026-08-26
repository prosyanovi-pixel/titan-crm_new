const ContractDataProvider = require('./ContractDataProvider');
const ProjectDataProvider = require('./ProjectDataProvider');
const LegalCaseDataProvider = require('./LegalCaseDataProvider');
const MailDataProvider = require('./MailDataProvider');
const TaskDataProvider = require('./TaskDataProvider');
const ContractorDataProvider = require('./ContractorDataProvider');

class DataProviderFactory {
  /**
   * Возвращает инстанс провайдера данных для конкретного модуля
   * @param {string} moduleId - код модуля (например, 'contracts', 'projects')
   * @param {string|number} entityId - ID сущности
   * @returns {import('./BaseDataProvider')}
   */
  static create(moduleId, entityId) {
    switch (moduleId) {
      case 'contracts':
        return new ContractDataProvider(entityId, moduleId);
      case 'projects':
        return new ProjectDataProvider(entityId, moduleId);
      case 'cases':
        return new LegalCaseDataProvider(entityId, moduleId);
      case 'mail':
        return new MailDataProvider(entityId, moduleId);
      case 'tasks':
        return new TaskDataProvider(entityId, moduleId);
      case 'contractors':
        return new ContractorDataProvider(entityId, moduleId);
      default:
        throw new Error(`Нет доступного DataProvider для модуля: ${moduleId}`);
    }
  }

  /**
   * Возвращает класс провайдера для получения статических методов (например, списка полей)
   */
  static getProviderClass(moduleId) {
    switch (moduleId) {
      case 'contracts':
        return ContractDataProvider;
      case 'projects':
        return ProjectDataProvider;
      case 'cases':
        return LegalCaseDataProvider;
      case 'mail':
        return MailDataProvider;
      case 'tasks':
        return TaskDataProvider;
      case 'contractors':
        return ContractorDataProvider;
      default:
        return null;
    }
  }
}

module.exports = DataProviderFactory;
