/**
 * Workflow Actions для модуля Projects
 * Эти действия доступны в конструкторе воркфлоу
 */

const db = require('../../db');

module.exports = {
  actions: {

    /**
     * Создать проект
     */
    create_project: {
      label: 'Создать проект',
      inputSchema: {
        properties: {
          name:        { type: 'string', label: 'Название проекта', placeholder: '{{trigger.body.projectName}}' },
          description: { type: 'string', label: 'Описание', placeholder: '' },
          status:      { type: 'string', label: 'Статус (active / planning / completed)', default: 'planning' },
          manager_id:  { type: 'string', label: 'ID менеджера', placeholder: '{{trigger.body.managerId}}' },
        }
      },
      handler: async (config, context) => {
        const { name, description, status, manager_id } = config;
        if (!name) throw new Error('[projects.create_project] "name" обязателен');

        const id = `proj-wf-${Date.now()}`;
        const { rows } = await db.query(
          `INSERT INTO projects (id, name, description, status, manager_id)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [id, name, description || '', status || 'planning', manager_id || null]
        );

        return { project: rows[0], projectId: rows[0].id };
      }
    },

    /**
     * Обновить статус проекта
     */
    update_project_status: {
      label: 'Изменить статус проекта',
      inputSchema: {
        properties: {
          project_id: { type: 'string', label: 'ID проекта', placeholder: '{{step1.projectId}}' },
          status:     { type: 'string', label: 'Новый статус', default: 'active' },
        }
      },
      handler: async (config, context) => {
        const { project_id, status } = config;
        if (!project_id) throw new Error('[projects.update_project_status] "project_id" обязателен');

        const { rows } = await db.query(
          `UPDATE projects SET status = $1 WHERE id = $2 RETURNING *`,
          [status, project_id]
        );
        if (rows.length === 0) throw new Error(`Project ${project_id} not found`);

        return { updated: true, project: rows[0] };
      }
    },

    /**
     * Найти проект по строке поиска
     */
    find_project: {
      label: 'Найти проект по названию',
      inputSchema: {
        properties: {
          keyword: { type: 'string', label: 'Ключевое слово', placeholder: 'Договор' },
          status:  { type: 'string', label: 'Статус (оставьте пустым для всех)', placeholder: '' },
        }
      },
      handler: async (config, context) => {
        const { keyword, status } = config;
        let query = 'SELECT * FROM projects WHERE name ILIKE $1';
        const params = [`%${keyword || ''}%`];
        if (status) {
          query += ' AND status = $2';
          params.push(status);
        }
        query += ' LIMIT 10';

        const { rows } = await db.query(query, params);
        return { projects: rows, count: rows.length };
      }
    },

  }
};
