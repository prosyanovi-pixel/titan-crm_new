/**
 * Контроллеры для управления этапами проекта
 * Обработчики HTTP-запросов для project_stages
 */

const { sendSuccess, sendCreated, sendNotFound, sendDeleted, sendValidationError } = require('../../../utils/responseHelpers');
const projectStagesService = require('../services/projectStagesService');

/**
 * Получить все этапы проекта
 * @route GET /api/projects/:id/stages
 * @param {string} req.params.id - ID проекта
 * @returns {Array} Список этапов
 */
async function getStages(req, res) {
  const { id: projectId } = req.params;

  try {
    const stages = await projectStagesService.getStagesByProjectId(parseInt(projectId));
    sendSuccess(res, stages);
  } catch (error) {
    console.error(`Error in getStages for project ${projectId}:`, error);
    sendValidationError(res, error.message || 'Failed to get stages');
  }
}

/**
 * Получить сводку по этапам проекта
 * @route GET /api/projects/:id/stages/summary
 * @param {string} req.params.id - ID проекта
 * @returns {Object} Сводка по этапам
 */
async function getStagesSummary(req, res) {
  const { id: projectId } = req.params;

  try {
    const summary = await projectStagesService.getStagesSummary(parseInt(projectId));
    sendSuccess(res, summary);
  } catch (error) {
    console.error(`Error in getStagesSummary for project ${projectId}:`, error);
    sendValidationError(res, error.message || 'Failed to get stages summary');
  }
}

/**
 * Получить этап по ID
 * @route GET /api/projects/:projectId/stages/:stageId
 * @param {string} req.params.projectId - ID проекта
 * @param {string} req.params.stageId - ID этапа
 * @returns {Object} Этап
 */
async function getStage(req, res) {
  const { stageId } = req.params;

  try {
    const stage = await projectStagesService.getStageById(parseInt(stageId));

    if (!stage) {
      return sendNotFound(res, 'Stage not found');
    }

    sendSuccess(res, stage);
  } catch (error) {
    console.error(`Error in getStage ${stageId}:`, error);
    sendNotFound(res, 'Stage not found');
  }
}

/**
 * Создать новый этап
 * @route POST /api/projects/:id/stages
 * @param {string} req.params.id - ID проекта
 * @param {Object} req.body - Данные этапа
 * @returns {Object} Созданный этап
 */
async function createStage(req, res) {
  const { id: projectId } = req.params;
  const stageData = { ...req.body, projectId: parseInt(projectId) };

  try {
    const stage = await projectStagesService.createStage(stageData);
    sendCreated(res, stage);
  } catch (error) {
    console.error(`Error in createStage for project ${projectId}:`, error);
    sendValidationError(res, error.message || 'Failed to create stage');
  }
}

/**
 * Обновить этап
 * @route PUT /api/projects/:projectId/stages/:stageId
 * @param {string} req.params.projectId - ID проекта
 * @param {string} req.params.stageId - ID этапа
 * @param {Object} req.body - Обновлённые данные
 * @returns {Object} Обновлённый этап
 */
async function updateStage(req, res) {
  const { stageId } = req.params;
  const stageData = req.body;

  try {
    const stage = await projectStagesService.updateStage(parseInt(stageId), stageData);

    if (!stage) {
      return sendNotFound(res, 'Stage not found');
    }

    sendSuccess(res, stage);
  } catch (error) {
    console.error(`Error in updateStage ${stageId}:`, error);
    sendValidationError(res, error.message || 'Failed to update stage');
  }
}

/**
 * Удалить этап
 * @route DELETE /api/projects/:projectId/stages/:stageId
 * @param {string} req.params.projectId - ID проекта
 * @param {string} req.params.stageId - ID этапа
 */
async function deleteStage(req, res) {
  const { stageId } = req.params;

  try {
    const deleted = await projectStagesService.deleteStage(parseInt(stageId));

    if (!deleted) {
      return sendNotFound(res, 'Stage not found');
    }

    sendDeleted(res);
  } catch (error) {
    console.error(`Error in deleteStage ${stageId}:`, error);
    sendNotFound(res, 'Stage not found');
  }
}

/**
 * Завершить этап
 * @route POST /api/projects/:projectId/stages/:stageId/complete
 * @param {string} req.params.projectId - ID проекта
 * @param {string} req.params.stageId - ID этапа
 * @param {number} req.body.progress - Прогресс (0-100)
 * @returns {Object} Обновлённый этап
 */
async function completeStage(req, res) {
  const { stageId } = req.params;
  const { progress } = req.body;

  try {
    const stage = await projectStagesService.completeStage(parseInt(stageId), progress);

    if (!stage) {
      return sendNotFound(res, 'Stage not found');
    }

    sendSuccess(res, stage);
  } catch (error) {
    console.error(`Error in completeStage ${stageId}:`, error);
    sendValidationError(res, error.message || 'Failed to complete stage');
  }
}

/**
 * Переместить этап (изменить порядок)
 * @route POST /api/projects/:projectId/stages/:stageId/reorder
 * @param {string} req.params.projectId - ID проекта
 * @param {string} req.params.stageId - ID этапа
 * @param {number} req.body.orderIndex - Новая позиция
 * @returns {Object} Обновлённый этап
 */
async function reorderStage(req, res) {
  const { stageId } = req.params;
  const { orderIndex } = req.body;

  try {
    if (orderIndex === undefined || orderIndex < 0) {
      return sendValidationError(res, 'orderIndex is required and must be >= 0');
    }

    const stage = await projectStagesService.reorderStage(parseInt(stageId), orderIndex);

    if (!stage) {
      return sendNotFound(res, 'Stage not found');
    }

    sendSuccess(res, stage);
  } catch (error) {
    console.error(`Error in reorderStage ${stageId}:`, error);
    sendValidationError(res, error.message || 'Failed to reorder stage');
  }
}

module.exports = {
  getStages,
  getStagesSummary,
  getStage,
  createStage,
  updateStage,
  deleteStage,
  completeStage,
  reorderStage
};
