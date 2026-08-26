const BaseDataProvider = require('./BaseDataProvider');
const db = require('../../../../db');

class ProjectDataProvider extends BaseDataProvider {
  static getAvailableFields() {
    return [
      ...super.getGlobalFields(),
      { key: 'PROJECT_NAME', name: 'Название проекта', type: 'string', description: 'Название проекта' },
      { key: 'PROJECT_CLIENT', name: 'Клиент/Контрагент', type: 'string', description: 'Название клиента' },
      { key: 'PROJECT_MANAGER', name: 'Руководитель', type: 'string', description: 'Имя менеджера' },
      { key: 'PROJECT_BUDGET', name: 'Бюджет проекта', type: 'number', description: 'Общий бюджет' },
      { key: 'PROJECT_START_DATE', name: 'Дата начала', type: 'date', description: 'Дата начала проекта' },
      { key: 'PROJECT_END_DATE', name: 'Дата окончания', type: 'date', description: 'Плановая дата окончания' },
      { key: 'PROJECT_STAGES', name: 'Этапы проекта', type: 'array', description: 'Список этапов проекта (массив)' },
      { key: 'PROJECT_STAGES.NAME', name: 'Название этапа', type: 'string', description: 'Название этапа внутри списка' },
      { key: 'PROJECT_STAGES.STATUS', name: 'Статус этапа', type: 'string', description: 'Статус этапа внутри списка' }
    ];
  }

  async fetchData() {
    const result = await db.query(`
      SELECT * FROM projects WHERE id = $1
    `, [this.entityId]);

    const project = result.rows[0];
    if (!project) {
      throw new Error(`Проект с ID ${this.entityId} не найден`);
    }

    const stagesResult = await db.query(`
      SELECT * FROM project_stages WHERE project_id = $1 ORDER BY start_date ASC
    `, [this.entityId]);

    const PROJECT_STAGES = stagesResult.rows.map(stage => ({
      NAME: stage.name || '',
      STATUS: stage.status || '',
      START_DATE: stage.startDate ? new Date(stage.startDate).toLocaleDateString('ru-RU') : '',
      END_DATE: stage.endDate ? new Date(stage.endDate).toLocaleDateString('ru-RU') : '',
    }));

    return {
      ...this.getGlobalData(),
      PROJECT_NAME: project.name || '',
      PROJECT_CLIENT: project.client || '',
      PROJECT_MANAGER: project.manager || '',
      PROJECT_BUDGET: project.budget || 0,
      PROJECT_START_DATE: project.startDate ? new Date(project.startDate).toLocaleDateString('ru-RU') : '',
      PROJECT_END_DATE: project.endDate ? new Date(project.endDate).toLocaleDateString('ru-RU') : '',
      PROJECT_STAGES,
    };
  }
}

module.exports = ProjectDataProvider;
