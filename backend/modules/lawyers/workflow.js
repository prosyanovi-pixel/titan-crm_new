/**
 * Workflow Actions для модуля Lawyers
 * Эти действия доступны в визуальном конструкторе воркфлоу
 */

const db = require('../../db');

module.exports = {
  actions: {

    /**
     * Найти юриста по специализации
     */
    find_lawyer: {
      label: 'Найти юриста по специализации',
      inputSchema: {
        properties: {
          specialization: { type: 'string', label: 'Специализация', placeholder: 'Корпоративное право' },
          status:         { type: 'string', label: 'Статус (active / inactive)', default: 'active' },
        }
      },
      handler: async (config, context) => {
        const { specialization, status } = config;

        let query  = `SELECT * FROM users WHERE role = 'Юрист'`;
        const params = [];
        let idx = 1;

        if (status) {
          query += ` AND status = $${idx++}`;
          params.push(status);
        }
        if (specialization) {
          query += ` AND specializations ILIKE $${idx++}`;
          params.push(`%${specialization}%`);
        }
        query += ' ORDER BY name';

        const { rows } = await db.query(query, params);
        return {
          lawyers: rows,
          count:   rows.length,
          // Convenient shortcut: first match
          lawyerId: rows[0]?.id || null,
        };
      }
    },

    /**
     * Назначить юриста ответственным на задачу или дело
     */
    assign_lawyer_to_task: {
      label: 'Назначить юриста на задачу',
      inputSchema: {
        properties: {
          task_id:   { type: 'string', label: 'ID задачи',  placeholder: '{{step1.taskId}}' },
          lawyer_id: { type: 'string', label: 'ID юриста',  placeholder: '{{step2.lawyerId}}' },
        }
      },
      handler: async (config, context) => {
        const { task_id, lawyer_id } = config;
        if (!task_id || !lawyer_id) throw new Error('[lawyers.assign_lawyer_to_task] "task_id" и "lawyer_id" обязательны');

        // Verify lawyer exists and is a Юрист
        const { rows: lawyerRows } = await db.query(
          `SELECT id, name FROM users WHERE id = $1 AND role = 'Юрист'`,
          [lawyer_id]
        );
        if (lawyerRows.length === 0) throw new Error(`Юрист ${lawyer_id} не найден или не имеет роль 'Юрист'`);

        const { rows } = await db.query(
          `UPDATE tasks SET assignee = $1 WHERE id = $2 RETURNING *`,
          [lawyerRows[0].name, task_id]
        );
        if (rows.length === 0) throw new Error(`Task ${task_id} not found`);

        return { updated: true, lawyerName: lawyerRows[0].name, task: rows[0] };
      }
    },

    /**
     * Создать юридическое дело (legal_case)
     */
    create_legal_case: {
      label: 'Создать юридическое дело',
      inputSchema: {
        properties: {
          title:         { type: 'string', label: 'Название дела',    placeholder: '{{trigger.body.caseTitle}}' },
          description:   { type: 'string', label: 'Описание',          placeholder: '' },
          lawyer_id:     { type: 'string', label: 'ID ответственного юриста', placeholder: '{{step1.lawyerId}}' },
          contractor_id: { type: 'string', label: 'ID контрагента (необязательно)', placeholder: '' },
          status:        { type: 'string', label: 'Начальный статус',  default: 'open' },
        }
      },
      handler: async (config, context) => {
        const { title, description, lawyer_id, contractor_id, status } = config;
        if (!title) throw new Error('[lawyers.create_legal_case] "title" обязателен');

        const caseId = `case-wf-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Try legal_cases table; columns may vary — use COALESCE-safe insert
        const { rows } = await db.query(
          `INSERT INTO legal_cases (id, title, description, lawyer_id, contractor_id, status)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [caseId, title, description || '', lawyer_id || null, contractor_id || null, status || 'open']
        );

        return { legalCase: rows[0], caseId: rows[0].id };
      }
    },

    /**
     * Обновить статус юридического дела
     */
    update_case_status: {
      label: 'Изменить статус дела',
      inputSchema: {
        properties: {
          case_id: { type: 'string', label: 'ID дела',        placeholder: '{{step1.caseId}}' },
          status:  { type: 'string', label: 'Новый статус',   default: 'in_progress',
            description: 'Допустимые значения: open, in_progress, resolved, closed' },
        }
      },
      handler: async (config, context) => {
        const { case_id, status } = config;
        if (!case_id) throw new Error('[lawyers.update_case_status] "case_id" обязателен');

        const { rows } = await db.query(
          `UPDATE legal_cases SET status = $1 WHERE id = $2 RETURNING *`,
          [status, case_id]
        );
        if (rows.length === 0) throw new Error(`Legal case ${case_id} not found`);

        return { updated: true, legalCase: rows[0] };
      }
    },

    /**
     * Получить список дел юриста
     */
    get_lawyer_cases: {
      label: 'Получить дела юриста',
      inputSchema: {
        properties: {
          lawyer_id: { type: 'string', label: 'ID юриста',  placeholder: '{{trigger.body.lawyerId}}' },
          status:    { type: 'string', label: 'Статус (оставьте пустым для всех)', placeholder: 'open' },
          limit:     { type: 'number', label: 'Максимум результатов', default: 10 },
        }
      },
      handler: async (config, context) => {
        const { lawyer_id, status, limit = 10 } = config;

        let query  = 'SELECT * FROM legal_cases WHERE 1=1';
        const params = [];
        let idx = 1;

        if (lawyer_id) {
          query += ` AND lawyer_id = $${idx++}`;
          params.push(lawyer_id);
        }
        if (status) {
          query += ` AND status = $${idx++}`;
          params.push(status);
        }
        query += ` ORDER BY created_at DESC LIMIT $${idx}`;
        params.push(parseInt(limit));

        const { rows } = await db.query(query, params);
        return { cases: rows, count: rows.length };
      }
    },

  }
};
