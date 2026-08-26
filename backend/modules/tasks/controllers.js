/**
 * Контроллеры модуля Tasks
 * Обработчики HTTP-запросов для управления задачами
 */

const { asyncHandler } = require('../../utils/errorHandler');
const { sendSuccess, sendCreated, sendDeleted, sendValidationError } = require('../../utils/responseHelpers');
const db = require('../../db');
const { generateNextNumber } = require('../../utils/numbering');

/**
 * Загрузка подзадач для задачи
 * @param {string} taskId - ID задачи
 * @returns {Promise<Array>} Список подзадач
 */
const loadSubtasks = async (taskId) => {
  const subRes = await db.query('SELECT * FROM subtasks WHERE task_id = $1', [taskId]);
  return subRes.rows;
};

/**
 * Очистка задачи от пустых значений для Sparse Relations UI
 */
const transformTask = (task) => {
  const transformed = { ...task };
  const optionalFields = ['project', 'assignee', 'due_date', 'priority', 'status', 'description', 'project_stage_id', 'assignee_avatar'];
  
  optionalFields.forEach(field => {
    if (transformed[field] === null || transformed[field] === '' || transformed[field] === undefined) {
      delete transformed[field];
    }
  });
  
  return transformed;
};

/**
 * Получить все задачи
 * @route GET /api/tasks
 * @returns {Array} Список задач с подзадачами
 */
const getAll = asyncHandler(async (req, res) => {
  const { rows } = await db.query(`
    SELECT t.*, u.avatar as assignee_avatar
    FROM tasks t
    LEFT JOIN users u ON t.assignee = u.name
    WHERE t.deleted_at IS NULL
    ORDER BY t.id DESC
  `);

  // Загрузка подзадач для каждой задачи
  const transformedRows = [];
  for (let task of rows) {
    task.subTasks = await loadSubtasks(task.id);
    transformedRows.push(transformTask(task));
  }

  sendSuccess(res, transformedRows);
});

/**
 * Получить задачу по ID
 * @route GET /api/tasks/:id
 * @param {string} req.params.id - ID задачи
 * @returns {Object} Задача с подзадачами
 */
const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await db.query(`
    SELECT t.*, u.avatar as assignee_avatar
    FROM tasks t
    LEFT JOIN users u ON t.assignee = u.name
    WHERE t.id = $1
  `, [id]);

  if (rows.length === 0) {
    return sendValidationError(res, 'Task not found');
  }

  const task = rows[0];
  task.subTasks = await loadSubtasks(id);

  sendSuccess(res, transformTask(task));
});

/**
 * Создать задачу
 * @route POST /api/tasks
 * @param {Object} req.body - Данные задачи
 * @returns {Object} Созданная задача
 */
const create = asyncHandler(async (req, res) => {
  const { title, project, assignee, priority, status, dueDate, subTasks, projectId, stageId } = req.body;

  // Валидация обязательных полей
  if (!title || title.trim() === '') {
    return sendValidationError(res, 'Title is required');
  }

  const id = `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const identifier = await generateNextNumber('tasks');

  // Вставка задачи
  const { rows } = await db.query(
    `INSERT INTO tasks (id, identifier, title, project, assignee, priority, status, due_date, assignee_initials, project_stage_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [
      id,
      identifier,
      title.trim(),
      project || '',
      assignee || '',
      priority || 'Medium',
      status || 'To Do',
      dueDate || '',
      assignee ? assignee.substring(0, 2).toUpperCase() : 'UN',
      stageId || null
    ]
  );
  const task = rows[0];

  // Вставка подзадач
  if (subTasks && Array.isArray(subTasks) && subTasks.length > 0) {
    for (const sub of subTasks) {
      if (sub.title && sub.title.trim() !== '') {
        await db.query(
          `INSERT INTO subtasks (id, task_id, title, completed) VALUES ($1, $2, $3, $4)`,
          [sub.id || 'sub-' + Math.random(), id, sub.title.trim(), sub.completed || false]
        );
      }
    }
  }

  // Возврат полной задачи с подзадачами
  task.subTasks = await loadSubtasks(id);
  sendCreated(res, transformTask(task));
});

/**
 * Обновить задачу
 * @route PUT /api/tasks/:id
 * @param {string} req.params.id - ID задачи
 * @param {Object} req.body - Обновлённые данные
 * @returns {Object} Обновлённая задача
 */
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Build a dynamic UPDATE query from only the fields provided in req.body
  const fieldMap = {
    title:            'title',
    project:          'project',
    assignee:         'assignee',
    priority:         'priority',
    status:           'status',
    dueDate:          'due_date',
    stageId:          'project_stage_id',
    description:      'description',
  };

  const setClauses = [];
  const values = [];
  let idx = 1;

  for (const [jsKey, dbCol] of Object.entries(fieldMap)) {
    if (jsKey in req.body) {
      setClauses.push(`${dbCol} = $${idx}`);
      values.push(req.body[jsKey]);
      idx++;
    }
  }

  if (setClauses.length === 0) {
    return sendValidationError(res, 'No updatable fields provided');
  }

  values.push(id); // WHERE id = $N
  const { rows } = await db.query(
    `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );

  const task = rows[0];
  if (!task) {
    return sendValidationError(res, 'Task not found');
  }

  // Only touch subtasks if the caller explicitly included subTasks in the body
  if ('subTasks' in req.body) {
    const subTasks = req.body.subTasks;
    await db.query('DELETE FROM subtasks WHERE task_id = $1', [id]);
    if (Array.isArray(subTasks) && subTasks.length > 0) {
      for (const sub of subTasks) {
        if (sub.title && sub.title.trim() !== '') {
          await db.query(
            `INSERT INTO subtasks (id, task_id, title, completed) VALUES ($1, $2, $3, $4)`,
            [sub.id || 'sub-' + Math.random(), id, sub.title.trim(), sub.completed || false]
          );
        }
      }
    }
  }

  task.subTasks = await loadSubtasks(id);
  sendSuccess(res, transformTask(task));
});

/**
 * Удалить задачу
 * @route DELETE /api/tasks/:id
 * @param {string} req.params.id - ID задачи
 */
const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await db.query('UPDATE tasks SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
  sendDeleted(res);
});

/**
 * Получить статистику по задачам
 * @route GET /api/tasks/stats
 * @returns {Object} Статистика
 */
const getStats = asyncHandler(async (req, res) => {
  const { rows } = await db.query(`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'done' OR status = 'Done' OR status LIKE '%Завершена%') as completed,
      COUNT(*) FILTER (WHERE status = 'in_progress' OR status = 'In Progress' OR status LIKE '%В работе%') as in_progress,
      COUNT(*) FILTER (WHERE status = 'to_do' OR status = 'To Do' OR status LIKE '%Ожидание%') as todo,
      COUNT(*) FILTER (WHERE priority = 'High' OR priority = 'Высокий') as high_priority,
      COUNT(*) FILTER (WHERE priority = 'Medium' OR priority = 'Средний') as medium_priority,
      COUNT(*) FILTER (WHERE priority = 'Low' OR priority = 'Низкий') as low_priority,
      COALESCE(COUNT(*) FILTER (WHERE due_date IS NOT NULL AND due_date <> '' AND due_date < CURRENT_DATE::text AND status NOT IN ('done', 'Done')), 0) as overdue
    FROM tasks
    WHERE deleted_at IS NULL
  `);

  const stats = rows[0];
  sendSuccess(res, {
    total: parseInt(stats.total) || 0,
    completed: parseInt(stats.completed) || 0,
    inProgress: parseInt(stats.inProgress) || 0,
    todo: parseInt(stats.todo) || 0,
    highPriority: parseInt(stats.highPriority) || 0,
    mediumPriority: parseInt(stats.mediumPriority) || 0,
    lowPriority: parseInt(stats.lowPriority) || 0,
    overdue: parseInt(stats.overdue) || 0,
    completionRate: stats.total > 0
      ? Math.round((parseInt(stats.completed) / parseInt(stats.total)) * 100)
      : 0,
  });
});

/**
 * Массовое удаление задач
 * @route POST /api/tasks/bulk-delete
 * @param {number[]} req.body.ids - Список ID задач
 */
const bulkDelete = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!ids || ids.length === 0) {
    return sendSuccess(res, { deletedCount: 0 });
  }

  const result = await db.query('UPDATE tasks SET deleted_at = CURRENT_TIMESTAMP WHERE id = ANY($1::int[]) RETURNING id', [ids]);
  sendSuccess(res, { deletedCount: result.rowCount });
});

/**
 * Массовое обновление задач
 * @route POST /api/tasks/bulk-update
 * @param {number[]} req.body.ids - Список ID задач
 * @param {string} req.body.field - Поле для обновления
 * @param {*} req.body.value - Новое значение
 */
const bulkUpdate = asyncHandler(async (req, res) => {
  const { ids, field, value } = req.body;
  if (!ids || ids.length === 0) {
    return sendSuccess(res, []);
  }

  const allowedFields = {
    status: 'status',
    priority: 'priority',
    assignee: 'assignee',
    dueDate: 'due_date'
  };

  const dbField = allowedFields[field];
  if (!dbField) {
    return sendValidationError(res, 'Invalid field for bulk update');
  }

  const result = await db.query(`UPDATE tasks SET ${dbField} = $1 WHERE id = ANY($2::int[]) RETURNING *`, [value, ids]);
  
  const updatedTasks = await Promise.all(result.rows.map(async (row) => {
    row.subTasks = await loadSubtasks(row.id);
    return transformTask(row);
  }));

  sendSuccess(res, updatedTasks);
});

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getStats,
  bulkDelete,
  bulkUpdate,
  getActivity: asyncHandler(async (req, res) => {
    // Stub for now
    sendSuccess(res, []);
  }),
};
