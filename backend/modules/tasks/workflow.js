/**
 * Workflow Actions для модуля Tasks
 * Эти действия доступны в конструкторе воркфлоу
 */

const db = require('../../db');

module.exports = {
  actions: {

    /**
     * Создать задачу автоматически
     */
    create_task: {
      label: 'Создать задачу',
      inputSchema: {
        properties: {
          title:      { type: 'string', label: 'Название задачи', placeholder: 'Обработать письмо: {{step1.emails.0.subject}}' },
          assignee:   { type: 'string', label: 'Ответственный (ID пользователя)', placeholder: '{{trigger.body.assignee}}' },
          priority:   { type: 'string', label: 'Приоритет (High / Medium / Low)', default: 'Medium' },
          status:     { type: 'string', label: 'Статус', default: 'To Do' },
          project:    { type: 'string', label: 'Проект (название)', placeholder: '' },
          due_date:   { type: 'string', label: 'Срок (YYYY-MM-DD)', placeholder: '' },
        }
      },
      handler: async (config, context) => {
        const { title, assignee, priority, status, project, due_date } = config;
        if (!title) throw new Error('[tasks.create_task] "title" обязателен');

        const id = `task-wf-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const { rows } = await db.query(
          `INSERT INTO tasks (id, title, assignee, priority, status, project, due_date, assignee_initials)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
          [
            id,
            title,
            assignee || '',
            priority || 'Medium',
            status || 'To Do',
            project || '',
            due_date || null,
            assignee ? assignee.substring(0, 2).toUpperCase() : 'WF',
          ]
        );

        return { task: rows[0], taskId: rows[0].id };
      }
    },

    /**
     * Изменить статус задачи
     */
    update_task_status: {
      label: 'Изменить статус задачи',
      inputSchema: {
        properties: {
          task_id: { type: 'string', label: 'ID задачи', placeholder: '{{step1.taskId}}' },
          status:  { type: 'string', label: 'Новый статус', default: 'In Progress' },
        }
      },
      handler: async (config, context) => {
        const { task_id, status } = config;
        if (!task_id) throw new Error('[tasks.update_task_status] "task_id" обязателен');

        const { rows } = await db.query(
          `UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *`,
          [status, task_id]
        );
        if (rows.length === 0) throw new Error(`Task ${task_id} not found`);

        return { updated: true, task: rows[0] };
      }
    },

    /**
     * Найти задачу по ключевому слову в названии
     */
    find_tasks: {
      label: 'Найти задачи по названию',
      inputSchema: {
        properties: {
          keyword:  { type: 'string', label: 'Ключевое слово' },
          status:   { type: 'string', label: 'Статус (оставьте пустым для всех)', placeholder: 'To Do' },
          limit:    { type: 'number', label: 'Максимум результатов', default: 5 },
        }
      },
      handler: async (config, context) => {
        const { keyword, status, limit = 5 } = config;

        let query = 'SELECT * FROM tasks WHERE title ILIKE $1';
        const params = [`%${keyword || ''}%`];
        if (status) {
          query += ' AND status = $2 LIMIT $3';
          params.push(status, parseInt(limit));
        } else {
          query += ' LIMIT $2';
          params.push(parseInt(limit));
        }

        const { rows } = await db.query(query, params);
        return { tasks: rows, count: rows.length };
      }
    },

  }
};
