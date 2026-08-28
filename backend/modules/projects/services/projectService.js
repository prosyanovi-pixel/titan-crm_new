/**
 * Сервис для управления проектами
 * Содержит бизнес-логику CRUD операций
 */

const db = require('../../../db');
const eventBus = require('../../../utils/eventBus');
const { formatDate, parseDate } = require('../../../utils/dateHelpers');
const { loadFinanceForProjects, getProjectFinanceData } = require('./financeService');

/**
 * Преобразование проекта с форматированием дат
 * @param {Object} project - Объект проекта
 * @returns {Object} Преобразованный проект
 */
function transformProject(project) {
  if (!project) return project;
  const result = {
    ...project,
    deadline: project.deadline ? formatDate(project.deadline) : null,
  };

  // Очистка пустых связей и опциональных полей
  const optionalFields = [
    'endDate', 'end_date', 'startDate', 'start_date', 'deadline',
    'judge', 'courtName', 'court_name', 'successFeeAmount', 'success_fee_amount', 
    'parentId', 'parent_id', 'taxRegimeId', 'tax_regime_id'
  ];
  optionalFields.forEach(key => {
    if (result[key] === null || result[key] === '') {
      delete result[key];
    }
  });

  return result;
}

/**
 * Загрузить теги для списка проектов
 * @param {Array} projects - Список проектов
 * @returns {Promise<Map<number, string[]>>} Map (ID -> теги)
 */
async function loadTagsForProjects(projects) {
  if (!projects || projects.length === 0) return new Map();
  const ids = projects.map(p => p.id);
  const { rows } = await db.query('SELECT project_id, tag FROM project_tags WHERE project_id = ANY($1::int[])', [ids]);
  
  const tagsByProjectId = new Map();
  rows.forEach(row => {
    const pid = Number(row.projectId);
    if (!tagsByProjectId.has(pid)) {
      tagsByProjectId.set(pid, []);
    }
    tagsByProjectId.get(pid).push(row.tag);
  });
  return tagsByProjectId;
}

/**
 * Получить все проекты с финансовыми данными
 * @returns {Promise<Array<Object>>} Список проектов с финансами
 */
async function getAllProjects() {
  const { rows } = await db.query(`
    SELECT p.*, u.name as manager_name, u.avatar as manager_avatar 
    FROM projects p
    LEFT JOIN users u ON u.name = p.manager
    WHERE p.deleted_at IS NULL
    ORDER BY p.id DESC
  `, []);
  
  const financeByProjectId = await loadFinanceForProjects(rows);
  const tagsByProjectId = await loadTagsForProjects(rows);
  
  return rows.map((project) => {
    const transformed = transformProject(project);
    // If we have a manager_name from the join, use it. 
    // Otherwise keep the original value (which might be a name already for legacy data)
    if (project.managerName) {
      transformed.manager = project.managerName;
    }
    if (project.managerAvatar) {
      transformed.managerAvatar = project.managerAvatar;
    }
    
    const financeInfo = financeByProjectId.get(Number(project.id)) || {
      hasOverdueInvoice: false,
      financeStatus: null,
      totalPaid: 0,
      totalExpenses: 0,
      budgetUsedPercent: 0,
    };
    const tags = tagsByProjectId.get(Number(project.id)) || [];

    return {
      ...transformed,
      ...financeInfo,
      tags,
    };
  });
}

/**
 * Получить воронку продаж (сделки со статистикой)
 * @returns {Promise<Array<Object>>} Список сделок с агрегацией
 */
async function getSalesPipeline() {
  const query = `
    SELECT p.*, u.name as manager_name, u.avatar as manager_avatar,
      (SELECT COUNT(*) FROM quotes q WHERE q.project_id = p.id) as quotes_count,
      (SELECT COALESCE(SUM(total_amount), 0) FROM quotes q WHERE q.project_id = p.id AND q.status = 'approved') as quotes_sum,
      (SELECT COUNT(*) FROM contracts c WHERE c.project_id = p.id) as contracts_count,
      (SELECT COUNT(*) FROM claims cl WHERE cl.project_id = p.id AND cl.status != 'closed') as active_claims_count
    FROM projects p
    LEFT JOIN users u ON u.name = p.manager
    WHERE p.deleted_at IS NULL AND p.project_type = 'sales_deal'
    ORDER BY p.id DESC
  `;
  const { rows } = await db.query(query);
  
  const financeByProjectId = await loadFinanceForProjects(rows);
  const tagsByProjectId = await loadTagsForProjects(rows);
  
  return rows.map((project) => {
    const transformed = transformProject(project);
    if (project.managerName) transformed.manager = project.managerName;
    if (project.managerAvatar) transformed.managerAvatar = project.managerAvatar;
    
    const financeInfo = financeByProjectId.get(Number(project.id)) || {
      hasOverdueInvoice: false,
      financeStatus: null,
      totalPaid: 0,
      totalExpenses: 0,
      budgetUsedPercent: 0,
    };
    
    return {
      ...transformed,
      ...financeInfo,
      tags: tagsByProjectId.get(Number(project.id)) || [],
      quotesCount: parseInt(project.quotes_count) || 0,
      quotesSum: parseFloat(project.quotes_sum) || 0,
      contractsCount: parseInt(project.contracts_count) || 0,
      activeClaimsCount: parseInt(project.active_claims_count) || 0
    };
  });
}

/**
 * Получить проект по ID с финансовыми данными
 * @param {number} id - ID проекта
 * @returns {Promise<Object|null>} Проект с финансами или null
 */
async function getProjectById(id) {
  const { rows } = await db.query(`
    SELECT p.*, u.name as manager_name, u.avatar as manager_avatar 
    FROM projects p
    LEFT JOIN users u ON u.name = p.manager
    WHERE p.id = $1
  `, [id]);

  if (rows.length === 0) {
    return null;
  }

  const project = rows[0];
  const transformed = transformProject(project);
  if (project.managerName) {
    transformed.manager = project.managerName;
  }
  if (project.managerAvatar) {
    transformed.managerAvatar = project.managerAvatar;
  }

  const financeData = await getProjectFinanceData(id, project.budget);
  const tagsRes = await db.query('SELECT tag FROM project_tags WHERE project_id = $1', [id]);
  
  return {
    ...transformed,
    ...financeData,
    tags: tagsRes.rows.map(r => r.tag),
  };
}

/**
 * Получить статистику проектов
 * @returns {Promise<Object>} Статистика проектов
 */
async function getProjectStats() {
  const { rows } = await db.query(`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'active' OR status = 'В работе') as active,
      COUNT(*) FILTER (WHERE status = 'completed' OR status = 'Завершена') as completed,
      COUNT(*) FILTER (WHERE status = 'pending' OR status = 'Ожидание') as pending,
      COUNT(*) FILTER (WHERE status = 'paused' OR status = 'Приостановлена') as paused,
      COALESCE(SUM(budget::numeric), 0) as total_budget,
      COALESCE(SUM(budget::numeric) FILTER (WHERE status = 'active' OR status = 'В работе'), 0) as active_budget,
      COALESCE(SUM(taskscount::numeric), 0) as total_tasks,
      COALESCE(SUM(completedtasks::numeric), 0) as completed_tasks
    FROM projects
    WHERE deleted_at IS NULL
  `);

  const stats = rows[0];
  const totalTasks = parseInt(stats.total_tasks) || 0;
  const completedTasks = parseInt(stats.completed_tasks) || 0;

  return {
    total: parseInt(stats.total) || 0,
    active: parseInt(stats.active) || 0,
    completed: parseInt(stats.completed) || 0,
    pending: parseInt(stats.pending) || 0,
    paused: parseInt(stats.paused) || 0,
    totalBudget: parseFloat(stats.total_budget) || 0,
    activeBudget: parseFloat(stats.active_budget) || 0,
    totalTasks,
    completedTasks,
    completionRate: totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0,
  };
}

/**
 * Создать новый проект
 * @param {Object} projectData - Данные проекта
 * @returns {Promise<Object>} Созданный проект
 */
async function createProject(projectData) {
  const { name, client, manager, status, stage, priority, budget, deadline, parentId, taxRegimeId, projectType, workflowId, deadlineOrder, deadlinePayment } = projectData;

  // Получение следующего ID
  const idRes = await db.query('SELECT COALESCE(MAX(id), 0) + 1 as "nextId" FROM projects');
  const nextId = idRes.rows[0].nextId;

  const query = `
    INSERT INTO projects (id, parent_id, name, client, manager, status, stage, priority, budget, budgetused, deadline, tax_regime_id, taskscount, completedtasks, description, project_type, workflow_id, deadline_order, deadline_payment)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $10, $11, 0, 0, $12, $13, $14, $15, $16)
    RETURNING *
  `;

  const values = [
    nextId,
    parentId || null,
    name,
    client,
    manager,
    status || 'pending',
    stage || 'todo',
    priority || 'Medium',
    budget || 0,
    parseDate(deadline),
    taxRegimeId ?? null,
    projectData.description || null,
    projectType || 'standard',
    workflowId || null,
    parseDate(deadlineOrder),
    parseDate(deadlinePayment)
  ];

  const { rows } = await db.query(query, values);
  const project = rows[0];

  if (projectData.tags && projectData.tags.length > 0) {
    for (const tag of projectData.tags) {
      await db.query('INSERT INTO project_tags (project_id, tag) VALUES ($1, $2)', [project.id, tag]);
    }
  }
  
  const newProject = {
    ...transformProject(project),
    hasOverdueInvoice: false,
    financeStatus: null,
    totalPaid: 0,
    totalExpenses: 0,
    budgetUsedPercent: 0,
    tags: projectData.tags || [],
  };

  eventBus.emitAsync('projects.created', newProject);

  return newProject;
}

/**
 * Обновить проект
 * @param {number} id - ID проекта
 * @param {Object} projectData - Обновлённые данные
 * @returns {Promise<Object|null>} Обновлённый проект с финансами
 */
async function updateProject(id, projectData) {
  const fields = [];
  const values = [];
  let index = 1;

  // Map JS fields to DB columns
  const fieldMap = {
    name: 'name',
    client: 'client',
    manager: 'manager',
    status: 'status',
    stage: 'stage',
    priority: 'priority',
    budget: 'budget',
    deadline: 'deadline',
    parentId: 'parent_id',
    startDate: 'start_date',
    endDate: 'end_date',
    budgetCurrency: 'budget_currency',
    taxRegimeId: 'tax_regime_id',
    description: 'description',
    projectType: 'project_type',
    workflowId: 'workflow_id',
    deadlineOrder: 'deadline_order',
    deadlinePayment: 'deadline_payment'
  };

  for (const [jsField, dbColumn] of Object.entries(fieldMap)) {
    if (projectData[jsField] !== undefined) {
      fields.push(`${dbColumn} = $${index++}`);
      let value = projectData[jsField];
      if (['deadline', 'startDate', 'endDate', 'deadlineOrder', 'deadlinePayment'].includes(jsField)) {
        value = parseDate(value);
      }
      values.push(value);
    }
  }

  let oldProject = null;
  if (projectData.status || projectData.stage) {
    const { rows } = await db.query('SELECT status, stage FROM projects WHERE id = $1', [id]);
    if (rows.length > 0) oldProject = rows[0];
  }

  if (fields.length > 0) {
    values.push(id);
    const query = `
      UPDATE projects
      SET ${fields.join(', ')}
      WHERE id = $${index}
      RETURNING *
    `;
    const { rows } = await db.query(query, values);
    if (rows.length === 0) return null;
  }

  // Update tags if provided
  if (projectData.tags !== undefined) {
    await db.query('DELETE FROM project_tags WHERE project_id = $1', [id]);
    if (projectData.tags && projectData.tags.length > 0) {
      for (const tag of projectData.tags) {
        await db.query('INSERT INTO project_tags (project_id, tag) VALUES ($1, $2)', [id, tag]);
      }
    }
  }

  const updatedProject = await getProjectById(id);

  if (oldProject && oldProject.status !== updatedProject.status) {
    eventBus.emitAsync('projects.status_changed', {
      projectId: updatedProject.id,
      oldStatus: oldProject.status,
      newStatus: updatedProject.status,
      project: updatedProject
    });
  }

  if (oldProject && oldProject.stage !== updatedProject.stage) {
    eventBus.emitAsync('projects.stage_changed', {
      projectId: updatedProject.id,
      oldStage: oldProject.stage,
      newStage: updatedProject.stage,
      project: updatedProject
    });
  }

  return updatedProject;
}

/**
 * Удалить проект
 * @param {number} id - ID проекта
 * @returns {Promise<boolean>} true если удален
 */
async function deleteProject(id) {
  const result = await db.query('UPDATE projects SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
}

/**
 * Массовое удаление проектов
 * @param {number[]} ids - Список ID проектов
 * @returns {Promise<number>} количество удаленных проектов
 */
async function bulkDeleteProjects(ids) {
  if (!ids || ids.length === 0) return 0;
  const result = await db.query('UPDATE projects SET deleted_at = CURRENT_TIMESTAMP WHERE id = ANY($1::int[]) RETURNING id', [ids]);
  return result.rowCount;
}

/**
 * Массовое обновление проектов
 * @param {number[]} ids - Список ID проектов
 * @param {string} field - Поле для обновления
 * @param {*} value - Новое значение
 * @returns {Promise<Array<Object>>} Обновлённые проекты
 */
async function bulkUpdateProjects(ids, field, value) {
  const allowedFields = ['status', 'priority', 'manager', 'stage'];

  if (!allowedFields.includes(field)) {
    throw new Error(`Invalid field for bulk update: ${field}`);
  }

  const query = `UPDATE projects SET ${field} = $1 WHERE id = ANY($2::int[]) RETURNING *`;
  const { rows } = await db.query(query, [value, ids]);

  // Для массового обновления не считаем финансы (слишком дорого)
  return rows.map(row => ({
    ...transformProject(row),
    hasOverdueInvoice: false,
    financeStatus: null,
    totalPaid: 0,
    totalExpenses: 0,
    budgetUsedPercent: 0,
  }));
}

/**
 * Завершить проект
 * @param {number} id - ID проекта
 * @returns {Promise<Object|null>} Обновлённый проект
 */
async function completeProject(id) {
  const query = `
    UPDATE projects
    SET status = 'completed', stage = 'done', updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `;
  const { rows } = await db.query(query, [id]);
  if (rows.length === 0) return null;
  return transformProject(rows[0]);
}

/**
 * Архивировать проект
 * @param {number} id - ID проекта
 * @returns {Promise<Object|null>} Обновлённый проект
 */
async function archiveProject(id) {
  const query = `
    UPDATE projects
    SET status = 'archived', updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `;
  const { rows } = await db.query(query, [id]);
  if (rows.length === 0) return null;
  return transformProject(rows[0]);
}

module.exports = {
  transformProject,
  getAllProjects,
  getProjectById,
  getProjectStats,
  createProject,
  updateProject,
  deleteProject,
  bulkDeleteProjects,
  bulkUpdateProjects,
  completeProject,
  archiveProject,
  getSalesPipeline,
};
