const BaseDataProvider = require('./BaseDataProvider');
const db = require('../../../../db');

class TaskDataProvider extends BaseDataProvider {
  /**
   * Возвращает список доступных переменных для модуля Tasks
   */
  static getAvailableFields() {
    return [
      ...super.getGlobalFields(),
      { key: 'TASK_TITLE', name: 'Название задачи', type: 'string', description: 'Название задачи' },
      { key: 'TASK_DESCRIPTION', name: 'Описание задачи', type: 'string', description: 'Описание задачи' },
      { key: 'TASK_STATUS', name: 'Статус задачи', type: 'string', description: 'Текущий статус' },
      { key: 'TASK_PRIORITY', name: 'Приоритет задачи', type: 'string', description: 'Приоритет задачи' },
      { key: 'TASK_DEADLINE', name: 'Дедлайн', type: 'date', description: 'Дата дедлайна' },
      { key: 'TASK_ASSIGNEE', name: 'Исполнитель', type: 'string', description: 'Имя исполнителя' },
      { key: 'TASK_CREATOR', name: 'Постановщик', type: 'string', description: 'Имя постановщика' },
    ];
  }

  async fetchData() {
    if (!this.entityId) {
      throw new Error('entityId is required for TaskDataProvider');
    }

    const { rows } = await db.query(`
      SELECT t.*, 
             a.name as assignee_name,
             c.name as creator_name,
             s.name as status_name,
             p.name as priority_name
      FROM tasks t
      LEFT JOIN users a ON t.assignee_id = a.id
      LEFT JOIN users c ON t.created_by = c.id
      LEFT JOIN task_statuses s ON t.status_id = s.id
      LEFT JOIN task_priorities p ON t.priority_id = p.id
      WHERE t.id = $1
    `, [this.entityId]);

    const task = rows[0];

    if (!task) {
      throw new Error(`Task with id ${this.entityId} not found`);
    }

    // Здесь мы можем применять пользовательские переменные из БД (визуальный редактор)
    const customVariables = await this.applyCustomVariables(task);

    return {
      ...this.getGlobalData(),
      'TASK_TITLE': task.title || '',
      'TASK_DESCRIPTION': task.description || '',
      'TASK_STATUS': task.status_name || '',
      'TASK_PRIORITY': task.priority_name || '',
      'TASK_DEADLINE': task.due_date ? new Date(task.due_date).toLocaleDateString('ru-RU') : '',
      'TASK_ASSIGNEE': task.assignee_name || '',
      'TASK_CREATOR': task.creator_name || '',
      ...customVariables
    };
  }
}

module.exports = TaskDataProvider;
