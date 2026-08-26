/**
 * Контроллеры для управления доходами проекта
 */

const { sendSuccess, sendCreated, sendNotFound, sendDeleted, sendValidationError } = require('../../../utils/responseHelpers');
const projectRevenuesService = require('../services/projectRevenuesService');

/**
 * GET /api/projects/:id/revenues
 */
async function getRevenues(req, res) {
  const { id: projectId } = req.params;

  try {
    const revenues = await projectRevenuesService.getRevenues(parseInt(projectId));
    sendSuccess(res, revenues);
  } catch (error) {
    console.error(`Error in getRevenues for project ${projectId}:`, error);
    sendValidationError(res, error.message || 'Failed to get revenues');
  }
}

/**
 * GET /api/projects/:id/revenues/summary
 */
async function getRevenuesSummary(req, res) {
  const { id: projectId } = req.params;

  try {
    const summary = await projectRevenuesService.getRevenuesSummary(parseInt(projectId));
    sendSuccess(res, summary);
  } catch (error) {
    console.error(`Error in getRevenuesSummary for project ${projectId}:`, error);
    sendValidationError(res, error.message || 'Failed to get revenues summary');
  }
}

/**
 * GET /api/projects/:projectId/revenues/:revenueId
 */
async function getRevenue(req, res) {
  const { revenueId } = req.params;

  try {
    const revenue = await projectRevenuesService.getRevenueById(parseInt(revenueId));

    if (!revenue) {
      return sendNotFound(res, 'Revenue not found');
    }

    sendSuccess(res, revenue);
  } catch (error) {
    console.error(`Error in getRevenue ${revenueId}:`, error);
    sendNotFound(res, 'Revenue not found');
  }
}

/**
 * POST /api/projects/:id/revenues
 */
async function createRevenue(req, res) {
  const { id: projectId } = req.params;
  const revenueData = { ...req.body, projectId: parseInt(projectId) };

  try {
    const revenue = await projectRevenuesService.createRevenue(revenueData);
    sendCreated(res, revenue);
  } catch (error) {
    console.error(`Error in createRevenue for project ${projectId}:`, error);
    sendValidationError(res, error.message || 'Failed to create revenue');
  }
}

/**
 * PUT /api/projects/:projectId/revenues/:revenueId
 */
async function updateRevenue(req, res) {
  const { revenueId } = req.params;
  const revenueData = req.body;

  try {
    const revenue = await projectRevenuesService.updateRevenue(parseInt(revenueId), revenueData);

    if (!revenue) {
      return sendNotFound(res, 'Revenue not found');
    }

    sendSuccess(res, revenue);
  } catch (error) {
    console.error(`Error in updateRevenue ${revenueId}:`, error);
    sendValidationError(res, error.message || 'Failed to update revenue');
  }
}

/**
 * DELETE /api/projects/:projectId/revenues/:revenueId
 */
async function deleteRevenue(req, res) {
  const { revenueId } = req.params;

  try {
    const deleted = await projectRevenuesService.deleteRevenue(parseInt(revenueId));

    if (!deleted) {
      return sendNotFound(res, 'Revenue not found');
    }

    sendDeleted(res);
  } catch (error) {
    console.error(`Error in deleteRevenue ${revenueId}:`, error);
    sendNotFound(res, 'Revenue not found');
  }
}

/**
 * POST /api/projects/:projectId/revenues/:revenueId/receive
 * Отметить доход как полученный
 */
async function markAsReceived(req, res) {
  const { revenueId } = req.params;
  const { actualDate } = req.body;

  try {
    const revenue = await projectRevenuesService.markAsReceived(
      parseInt(revenueId),
      actualDate,
      null
    );

    if (!revenue) {
      return sendNotFound(res, 'Revenue not found');
    }

    sendSuccess(res, revenue);
  } catch (error) {
    console.error(`Error in markAsReceived ${revenueId}:`, error);
    sendValidationError(res, error.message || 'Failed to mark revenue as received');
  }
}

module.exports = {
  getRevenues,
  getRevenuesSummary,
  getRevenue,
  createRevenue,
  updateRevenue,
  deleteRevenue,
  markAsReceived,
};
