/**
 * Контроллер для overhead articles в Finance
 */

const { sendSuccess, sendCreated, sendNotFound, sendDeleted, sendValidationError } = require('../../../utils/responseHelpers');
const financeSettingsService = require('../services/financeSettingsService');

/**
 * GET /api/module-settings/finance/overhead-articles
 */
async function getOverheadArticles(req, res) {
  try {
    const articles = await financeSettingsService.getOverheadArticles();
    sendSuccess(res, articles);
  } catch (error) {
    console.error('Error in getOverheadArticles:', error);
    sendValidationError(res, error.message || 'Failed to get overhead articles');
  }
}

/**
 * POST /api/module-settings/finance/overhead-articles
 */
async function createOverheadArticle(req, res) {
  try {
    const article = await financeSettingsService.createOverheadArticle(req.body);
    sendCreated(res, article);
  } catch (error) {
    console.error('Error in createOverheadArticle:', error);
    sendValidationError(res, error.message || 'Failed to create overhead article');
  }
}

/**
 * PUT /api/module-settings/finance/overhead-articles/:id
 */
async function updateOverheadArticle(req, res) {
  const { id } = req.params;

  try {
    const article = await financeSettingsService.updateOverheadArticle(parseInt(id), req.body);

    if (!article) {
      return sendNotFound(res, 'Overhead article not found');
    }

    sendSuccess(res, article);
  } catch (error) {
    console.error(`Error in updateOverheadArticle ${id}:`, error);
    sendValidationError(res, error.message || 'Failed to update overhead article');
  }
}

/**
 * DELETE /api/module-settings/finance/overhead-articles/:id
 */
async function deleteOverheadArticle(req, res) {
  const { id } = req.params;

  try {
    const deleted = await financeSettingsService.deleteOverheadArticle(parseInt(id));

    if (!deleted) {
      return sendNotFound(res, 'Overhead article not found');
    }

    sendDeleted(res);
  } catch (error) {
    console.error(`Error in deleteOverheadArticle ${id}:`, error);
    sendNotFound(res, 'Overhead article not found');
  }
}

module.exports = {
  getOverheadArticles,
  createOverheadArticle,
  updateOverheadArticle,
  deleteOverheadArticle,
};
