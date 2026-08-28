/**
 * Контроллеры модуля Projects
 * Обработчики HTTP-запросов для управления проектами
 * Тонкие контроллеры - бизнес-логика в сервисах
 */

const { sendSuccess, sendCreated, sendNotFound, sendDeleted, sendValidationError } = require('../../utils/responseHelpers');
const projectService = require('./services/projectService');

/**
 * Получить все проекты
 * @route GET /api/projects
 * @returns {Array} Список проектов
 */
async function getAll(req, res) {
  try {
    const projects = await projectService.getAllProjects();
    sendSuccess(res, projects);
  } catch (error) {
    console.error('Error in getAll projects:', error);
    sendSuccess(res, []);
  }
}

/**
 * Получить воронку продаж
 * @route GET /api/projects/sales-pipeline
 * @returns {Array} Список сделок со статистикой
 */
async function getSalesPipeline(req, res) {
  try {
    const pipeline = await projectService.getSalesPipeline();
    sendSuccess(res, pipeline);
  } catch (error) {
    console.error('Error in getSalesPipeline:', error);
    sendSuccess(res, []);
  }
}

/**
 * Получить статистику проектов
 * @route GET /api/projects/stats
 * @returns {Object} Статистика проектов
 */
async function getStats(req, res) {
  try {
    const stats = await projectService.getProjectStats();
    sendSuccess(res, stats);
  } catch (error) {
    console.error('Error in getStats:', error);
    sendSuccess(res, {
      total: 0,
      active: 0,
      completed: 0,
      pending: 0,
      paused: 0,
      totalBudget: 0,
      activeBudget: 0,
      totalTasks: 0,
      completedTasks: 0,
      completionRate: 0,
    });
  }
}

/**
 * Получить проект по ID
 * @route GET /api/projects/:id
 * @param {string} req.params.id - ID проекта
 * @returns {Object} Проект с финансовой информацией
 */
async function getById(req, res) {
  const { id } = req.params;
  
  try {
    const project = await projectService.getProjectById(id);
    
    if (!project) {
      return sendNotFound(res, 'Project not found');
    }
    
    sendSuccess(res, project);
  } catch (error) {
    console.error(`Error in getById for project ${id}:`, error);
    return sendNotFound(res, 'Project not found');
  }
}

/**
 * Создать новый проект
 * @route POST /api/projects
 * @param {Object} req.body - Данные проекта
 * @returns {Object} Созданный проект
 */
async function create(req, res) {
  try {
    const projectData = req.body;
    const project = await projectService.createProject(projectData);
    sendCreated(res, project);
  } catch (error) {
    console.error('Error in create project:', error);
    sendValidationError(res, error.message || 'Failed to create project');
  }
}

/**
 * Обновить проект
 * @route PUT /api/projects/:id
 * @param {string} req.params.id - ID проекта
 * @param {Object} req.body - Обновлённые данные
 * @returns {Object} Обновлённый проект
 */
async function update(req, res) {
  const { id } = req.params;
  const projectData = req.body;

  try {
    const project = await projectService.updateProject(id, projectData);
    
    if (!project) {
      return sendNotFound(res, 'Project not found');
    }
    
    sendSuccess(res, project);
  } catch (error) {
    console.error(`Error in update project ${id}:`, error);
    sendValidationError(res, error.message || 'Failed to update project');
  }
}

/**
 * Удалить проект
 * @route DELETE /api/projects/:id
 * @param {string} req.params.id - ID проекта
 */
async function remove(req, res) {
  const { id } = req.params;
  
  try {
    const deleted = await projectService.deleteProject(id);
    
    if (!deleted) {
      return sendNotFound(res, 'Project not found');
    }
    
    sendDeleted(res);
  } catch (error) {
    console.error(`Error in delete project ${id}:`, error);
    sendNotFound(res, 'Project not found');
  }
}

/**
 * Массовое обновление проектов
 * @route POST /api/projects/bulk-update
 * @param {number[]} req.body.ids - Список ID проектов
 * @param {string} req.body.field - Поле для обновления
 * @param {*} req.body.value - Новое значение
 * @returns {Array} Обновлённые проекты
 */
async function bulkUpdate(req, res) {
  const { ids, field, value } = req.body;

  try {
    const projects = await projectService.bulkUpdateProjects(ids, field, value);
    sendSuccess(res, projects);
  } catch (error) {
    console.error('Error in bulkUpdate:', error);
    sendValidationError(res, error.message || 'Invalid field for bulk update');
  }
}

/**
 * Массовое удаление проектов
 * @route POST /api/projects/bulk-delete
 * @param {number[]} req.body.ids - Список ID проектов
 */
async function bulkDelete(req, res) {
  const { ids } = req.body;

  try {
    const deletedCount = await projectService.bulkDeleteProjects(ids);
    sendSuccess(res, { deletedCount });
  } catch (error) {
    console.error('Error in bulkDelete:', error);
    sendError(res, error, 500, 'Error deleting projects');
  }
}

/**
 * Завершить проект
 * @route POST /api/projects/:id/complete
 */
async function complete(req, res) {
  const { id } = req.params;
  try {
    const project = await projectService.completeProject(id);
    if (!project) return sendNotFound(res, 'Project not found');
    sendSuccess(res, project);
  } catch (error) {
    console.error(`Error in complete project ${id}:`, error);
    sendValidationError(res, error.message || 'Failed to complete project');
  }
}

/**
 * Архивировать проект
 * @route POST /api/projects/:id/archive
 */
async function archive(req, res) {
  const { id } = req.params;
  try {
    const project = await projectService.archiveProject(id);
    if (!project) return sendNotFound(res, 'Project not found');
    sendSuccess(res, project);
  } catch (error) {
    console.error(`Error in archive project ${id}:`, error);
    sendValidationError(res, error.message || 'Failed to archive project');
  }
}

module.exports = {
  getAll,
  getById,
  getStats,
  create,
  update,
  remove,
  bulkUpdate,
  bulkDelete,
  complete,
  archive,
  getSalesPipeline,
};
