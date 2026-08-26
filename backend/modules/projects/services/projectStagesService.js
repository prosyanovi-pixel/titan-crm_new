/**
 * Сервис для управления этапами проекта
 * Содержит бизнес-логику CRUD операций для project_stages
 */

const db = require('../../../db');

/**
 * Преобразование этапа проекта с форматированием дат
 * @param {Object} stage - Объект этапа
 * @returns {Object} Преобразованный этап
 */
function transformStage(stage) {
  if (!stage) return stage;
  return {
    ...stage,
    startDate: stage.startDate ? formatDate(stage.startDate) : null,
    endDate: stage.endDate ? formatDate(stage.endDate) : null,
    plannedStartDate: stage.plannedStartDate ? formatDate(stage.plannedStartDate) : null,
    plannedEndDate: stage.plannedEndDate ? formatDate(stage.plannedEndDate) : null,
    completedAt: stage.completedAt ? formatDate(stage.completedAt) : null,
  };
}

/**
 * Форматирование даты в dd.MM.yyyy
 */
function formatDate(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Парсинг даты из dd.MM.yyyy
 */
function parseDate(dateStr) {
  if (!dateStr || dateStr === '') return null;
  
  // Поддержка dd.MM.yyyy
  if (typeof dateStr === 'string' && dateStr.includes('.')) {
    const [day, month, year] = dateStr.split('.');
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return isNaN(d.getTime()) ? null : d;
  }
  
  // ISO формат
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Получить все этапы проекта
 * @param {number} projectId - ID проекта
 * @returns {Promise<Array>} Список этапов
 */
async function getStagesByProjectId(projectId) {
  const query = `
    SELECT 
      ps.id,
      ps.project_id as "projectId",
      ps.name,
      ps.description,
      ps.start_date as "startDate",
      ps.end_date as "endDate",
      ps.planned_start_date as "plannedStartDate",
      ps.planned_end_date as "plannedEndDate",
      ps.progress,
      ps.is_completed as "isCompleted",
      ps.completed_at as "completedAt",
      ps.order_index as "orderIndex",
      ps.budget,
      ps.budget_used as "budgetUsed",
      ps.responsible_user_id as "responsibleUserId",
      ps.color,
      ps.created_at as "createdAt",
      ps.updated_at as "updatedAt",
      COALESCE(
        (SELECT json_agg(
          json_build_object(
            'id', t.id,
            'title', t.title,
            'status', t.status,
            'priority', t.priority,
            'dueDate', t.due_date,
            'assignee', t.assignee,
            'assigneeInitials', t.assignee_initials,
            'identifier', t.identifier,
            'stageId', t.project_stage_id,
            'project', t.project
          )
        )
        FROM tasks t
        WHERE t.project_stage_id = ps.id),
        '[]'::json
      ) as tasks
    FROM project_stages ps
    WHERE ps.project_id = $1
    ORDER BY ps.order_index, ps.id
  `;

  const { rows } = await db.query(query, [projectId]);
  return rows.map(transformStage);
}

/**
 * Получить этап по ID
 * @param {number} id - ID этапа
 * @returns {Promise<Object|null>} Этап или null
 */
async function getStageById(id) {
  const query = 'SELECT * FROM project_stages WHERE id = $1';
  const { rows } = await db.query(query, [id]);
  
  if (rows.length === 0) return null;
  return transformStage(rows[0]);
}

/**
 * Создать новый этап
 * @param {Object} stageData - Данные этапа
 * @returns {Promise<Object>} Созданный этап
 */
async function createStage(stageData) {
  const {
    projectId,
    name,
    description,
    startDate,
    endDate,
    plannedStartDate,
    plannedEndDate,
    budget,
    orderIndex,
    responsibleUserId,
    color
  } = stageData;

  // Валидация
  if (!projectId || !name || !startDate || !endDate) {
    throw new Error('Missing required fields: projectId, name, startDate, endDate');
  }

  // Получение следующего ID
  const idRes = await db.query('SELECT COALESCE(MAX(id), 0) + 1 as "nextId" FROM project_stages');
  const nextId = idRes.rows[0].nextId;

  // Если orderIndex не указан, добавляем этап в конец
  const finalOrderIndex = orderIndex !== undefined ? orderIndex : (
    await db.query('SELECT COALESCE(MAX(order_index), -1) + 1 as "nextOrder" FROM project_stages WHERE project_id = $1', [projectId])
  ).rows[0].nextOrder;

  const query = `
    INSERT INTO project_stages (
      id, project_id, name, description, start_date, end_date,
      planned_start_date, planned_end_date, budget, order_index,
      responsible_user_id, progress, is_completed, color
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, FALSE, $12)
    RETURNING *
  `;

  const values = [
    nextId,
    projectId,
    name,
    description || null,
    parseDate(startDate),
    parseDate(endDate),
    plannedStartDate ? parseDate(plannedStartDate) : null,
    plannedEndDate ? parseDate(plannedEndDate) : null,
    budget || 0,
    finalOrderIndex,
    responsibleUserId || null,
    color || null
  ];

  const { rows } = await db.query(query, values);
  return transformStage(rows[0]);
}

/**
 * Обновить этап
 * @param {number} id - ID этапа
 * @param {Object} stageData - Обновлённые данные
 * @returns {Promise<Object|null>} Обновлённый этап
 */
async function updateStage(id, stageData) {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  // Динамическое построение запроса
  const updatableFields = [
    'name', 'description', 'startDate', 'endDate',
    'plannedStartDate', 'plannedEndDate', 'budget', 'budgetUsed',
    'orderIndex', 'responsibleUserId', 'progress', 'isCompleted', 'color'
  ];

  for (const field of updatableFields) {
    if (stageData[field] !== undefined) {
      const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
      
      if (field.includes('Date')) {
        // Пропускаем пустые строки для дат
        if (stageData[field] === '' || stageData[field] === null) {
          continue;
        }
        const parsedDate = parseDate(stageData[field]);
        if (isNaN(parsedDate.getTime())) {
          console.warn(`Invalid date for field ${field}: ${stageData[field]}`);
          continue;
        }
        fields.push(`${dbField} = $${paramIndex}`);
        values.push(parsedDate);
        paramIndex++;
      } else {
        fields.push(`${dbField} = $${paramIndex}`);
        values.push(stageData[field]);
        paramIndex++;
      }
    }
  }

  // Автоматическое обновление completedAt при завершении
  if (stageData.isCompleted === true) {
    fields.push(`completed_at = COALESCE(completed_at, $${paramIndex})`);
    values.push(new Date());
    paramIndex++;
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);
  const query = `
    UPDATE project_stages
    SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const { rows } = await db.query(query, values);
  
  if (rows.length === 0) return null;
  return transformStage(rows[0]);
}

/**
 * Удалить этап
 * @param {number} id - ID этапа
 * @returns {Promise<boolean>} true если удалён
 */
async function deleteStage(id) {
  const result = await db.query('DELETE FROM project_stages WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
}

/**
 * Завершить этап
 * @param {number} id - ID этапа
 * @param {number} progress - Финальный прогресс (0-100)
 * @returns {Promise<Object|null>} Обновлённый этап
 */
async function completeStage(id, progress = 100) {
  return updateStage(id, {
    isCompleted: true,
    progress: Math.min(100, Math.max(0, progress))
  });
}

/**
 * Переместить этап (изменить порядок)
 * @param {number} id - ID этапа
 * @param {number} newOrderIndex - Новая позиция
 * @returns {Promise<Object|null>} Обновлённый этап
 */
async function reorderStage(id, newOrderIndex) {
  const stage = await getStageById(id);
  if (!stage) return null;

  const { projectId, orderIndex: oldOrderIndex } = stage;

  // Сдвигаем этапы
  if (newOrderIndex > oldOrderIndex) {
    // Двигаем вниз - сдвигаем вверх этапы между old и new
    await db.query(`
      UPDATE project_stages
      SET order_index = order_index - 1
      WHERE project_id = $1 AND order_index > $2 AND order_index <= $3
    `, [projectId, oldOrderIndex, newOrderIndex]);
  } else {
    // Двигаем вверх - сдвигаем вниз этапы между new и old
    await db.query(`
      UPDATE project_stages
      SET order_index = order_index + 1
      WHERE project_id = $1 AND order_index >= $2 AND order_index < $3
    `, [projectId, newOrderIndex, oldOrderIndex]);
  }

  // Обновляем порядок текущего этапа
  return updateStage(id, { orderIndex: newOrderIndex });
}

/**
 * Получить сводку по этапам проекта
 * @param {number} projectId - ID проекта
 * @returns {Promise<Object>} Сводка по этапам
 */
async function getStagesSummary(projectId) {
  const query = `
    SELECT
      COUNT(*) as total_stages,
      COUNT(*) FILTER (WHERE is_completed) as completed_stages,
      COUNT(*) FILTER (WHERE NOT is_completed) as pending_stages,
      AVG(progress) as avg_progress,
      SUM(budget) as total_budget,
      SUM(budget_used) as total_budget_used,
      MIN(start_date) as earliest_start,
      MAX(end_date) as latest_end
    FROM project_stages
    WHERE project_id = $1
  `;

  const { rows } = await db.query(query, [projectId]);
  
  if (rows.length === 0) {
    return {
      totalStages: 0,
      completedStages: 0,
      pendingStages: 0,
      avgProgress: 0,
      totalBudget: 0,
      totalBudgetUsed: 0,
      earliestStart: null,
      latestEnd: null
    };
  }

  const stats = rows[0];
  return {
    totalStages: parseInt(stats.total_stages) || 0,
    completedStages: parseInt(stats.completed_stages) || 0,
    pendingStages: parseInt(stats.pending_stages) || 0,
    avgProgress: parseFloat(stats.avg_progress) || 0,
    totalBudget: parseFloat(stats.total_budget) || 0,
    totalBudgetUsed: parseFloat(stats.total_budget_used) || 0,
    earliestStart: stats.earliest_start ? formatDate(stats.earliest_start) : null,
    latestEnd: stats.latest_end ? formatDate(stats.latest_end) : null
  };
}

module.exports = {
  transformStage,
  getStagesByProjectId,
  getStageById,
  createStage,
  updateStage,
  deleteStage,
  completeStage,
  reorderStage,
  getStagesSummary
};
