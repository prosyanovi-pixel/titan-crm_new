/**
 * Контроллеры для управления расходами проекта
 */

const { sendSuccess, sendCreated, sendNotFound, sendDeleted, sendValidationError } = require('../../../utils/responseHelpers');
const projectExpensesService = require('../services/projectExpensesService');

/**
 * GET /api/projects/:id/expenses
 */
async function getProjectExpenses(req, res) {
  const { id: projectId } = req.params;

  try {
    const expenses = await projectExpensesService.getProjectExpenses(parseInt(projectId));
    sendSuccess(res, expenses);
  } catch (error) {
    console.error(`Error in getProjectExpenses for project ${projectId}:`, error);
    sendValidationError(res, error.message || 'Failed to get project expenses');
  }
}

/**
 * GET /api/projects/:id/expenses/summary
 */
async function getProjectExpensesSummary(req, res) {
  const { id: projectId } = req.params;

  try {
    const summary = await projectExpensesService.getProjectExpensesSummary(parseInt(projectId));
    sendSuccess(res, summary);
  } catch (error) {
    console.error(`Error in getProjectExpensesSummary for project ${projectId}:`, error);
    sendValidationError(res, error.message || 'Failed to get expenses summary');
  }
}

/**
 * GET /api/projects/expenses/categories
 */
async function getExpenseCategories(req, res) {
  try {
    const categories = await projectExpensesService.getExpenseCategories();
    sendSuccess(res, categories);
  } catch (error) {
    console.error('Error in getExpenseCategories:', error);
    sendValidationError(res, error.message || 'Failed to get expense categories');
  }
}

/**
 * GET /api/projects/:projectId/expenses/:expenseId
 */
async function getProjectExpense(req, res) {
  const { expenseId } = req.params;

  try {
    const expense = await projectExpensesService.getProjectExpenseById(parseInt(expenseId));

    if (!expense) {
      return sendNotFound(res, 'Expense not found');
    }

    sendSuccess(res, expense);
  } catch (error) {
    console.error(`Error in getProjectExpense ${expenseId}:`, error);
    sendNotFound(res, 'Expense not found');
  }
}

/**
 * POST /api/projects/:id/expenses
 */
async function createProjectExpense(req, res) {
  const { id: projectId } = req.params;
  const expenseData = { ...req.body, projectId: parseInt(projectId) };

  try {
    const expense = await projectExpensesService.createProjectExpense(expenseData);
    sendCreated(res, expense);
  } catch (error) {
    console.error(`Error in createProjectExpense for project ${projectId}:`, error);
    sendValidationError(res, error.message || 'Failed to create project expense');
  }
}

/**
 * PUT /api/projects/:projectId/expenses/:expenseId
 */
async function updateProjectExpense(req, res) {
  const { expenseId } = req.params;
  const expenseData = req.body;

  try {
    const expense = await projectExpensesService.updateProjectExpense(parseInt(expenseId), expenseData);

    if (!expense) {
      return sendNotFound(res, 'Expense not found');
    }

    sendSuccess(res, expense);
  } catch (error) {
    console.error(`Error in updateProjectExpense ${expenseId}:`, error);
    sendValidationError(res, error.message || 'Failed to update project expense');
  }
}

/**
 * DELETE /api/projects/:projectId/expenses/:expenseId
 */
async function deleteProjectExpense(req, res) {
  const { expenseId } = req.params;

  try {
    const deleted = await projectExpensesService.deleteProjectExpense(parseInt(expenseId));

    if (!deleted) {
      return sendNotFound(res, 'Expense not found');
    }

    sendDeleted(res);
  } catch (error) {
    console.error(`Error in deleteProjectExpense ${expenseId}:`, error);
    sendNotFound(res, 'Expense not found');
  }
}

/**
 * POST /api/projects/:projectId/expenses/:expenseId/approve
 */
async function approveExpense(req, res) {
  const { expenseId } = req.params;

  try {
    const expense = await projectExpensesService.approveExpense(parseInt(expenseId));

    if (!expense) {
      return sendNotFound(res, 'Expense not found');
    }

    sendSuccess(res, expense);
  } catch (error) {
    console.error(`Error in approveExpense ${expenseId}:`, error);
    sendValidationError(res, error.message || 'Failed to approve expense');
  }
}

/**
 * POST /api/projects/:projectId/expenses/:expenseId/pay
 */
async function markExpensePaid(req, res) {
  const { expenseId } = req.params;
  const { paymentId, actualDate } = req.body;

  try {
    const expense = await projectExpensesService.markExpensePaid(
      parseInt(expenseId),
      paymentId,
      actualDate
    );

    if (!expense) {
      return sendNotFound(res, 'Expense not found');
    }

    sendSuccess(res, expense);
  } catch (error) {
    console.error(`Error in markExpensePaid ${expenseId}:`, error);
    sendValidationError(res, error.message || 'Failed to mark expense as paid');
  }
}

/**
 * GET /api/projects/:id/expenses/chart
 */
async function getProjectExpensesChart(req, res) {
  const { id: projectId } = req.params;

  try {
    const data = await projectExpensesService.getProjectExpensesChartData(parseInt(projectId));
    sendSuccess(res, data);
  } catch (error) {
    console.error(`Error in getProjectExpensesChart for project ${projectId}:`, error);
    sendValidationError(res, error.message || 'Failed to get expenses chart data');
  }
}

module.exports = {
  getProjectExpenses,
  getProjectExpensesSummary,
  getProjectExpensesChart,
  getExpenseCategories,
  getProjectExpense,
  createProjectExpense,
  updateProjectExpense,
  deleteProjectExpense,
  approveExpense,
  markExpensePaid,
};
