/**
 * Контроллеры для управления графиком платежей проекта
 */

const { sendSuccess, sendCreated, sendNotFound, sendDeleted, sendValidationError } = require('../../../utils/responseHelpers');
const paymentScheduleService = require('../services/paymentScheduleService');

/**
 * GET /api/projects/:id/payment-schedule
 */
async function getPaymentSchedule(req, res) {
  const { id: projectId } = req.params;

  try {
    const payments = await paymentScheduleService.getPaymentSchedule(parseInt(projectId));
    sendSuccess(res, payments);
  } catch (error) {
    console.error(`Error in getPaymentSchedule for project ${projectId}:`, error);
    sendValidationError(res, error.message || 'Failed to get payment schedule');
  }
}

/**
 * GET /api/projects/:id/payment-schedule/summary
 */
async function getPaymentScheduleSummary(req, res) {
  const { id: projectId } = req.params;

  try {
    const summary = await paymentScheduleService.getPaymentScheduleSummary(parseInt(projectId));
    sendSuccess(res, summary);
  } catch (error) {
    console.error(`Error in getPaymentScheduleSummary for project ${projectId}:`, error);
    sendValidationError(res, error.message || 'Failed to get payment schedule summary');
  }
}

/**
 * GET /api/projects/:projectId/payment-schedule/:paymentId
 */
async function getPayment(req, res) {
  const { paymentId } = req.params;

  try {
    const payment = await paymentScheduleService.getPaymentById(parseInt(paymentId));

    if (!payment) {
      return sendNotFound(res, 'Payment not found');
    }

    sendSuccess(res, payment);
  } catch (error) {
    console.error(`Error in getPayment ${paymentId}:`, error);
    sendNotFound(res, 'Payment not found');
  }
}

/**
 * POST /api/projects/:id/payment-schedule
 */
async function createPayment(req, res) {
  const { id: projectId } = req.params;
  const paymentData = { ...req.body, projectId: parseInt(projectId) };

  try {
    const payment = await paymentScheduleService.createPayment(paymentData);
    sendCreated(res, payment);
  } catch (error) {
    console.error(`Error in createPayment for project ${projectId}:`, error);
    sendValidationError(res, error.message || 'Failed to create payment');
  }
}

/**
 * PUT /api/projects/:projectId/payment-schedule/:paymentId
 */
async function updatePayment(req, res) {
  const { paymentId } = req.params;
  const paymentData = req.body;

  try {
    const payment = await paymentScheduleService.updatePayment(parseInt(paymentId), paymentData);

    if (!payment) {
      return sendNotFound(res, 'Payment not found');
    }

    sendSuccess(res, payment);
  } catch (error) {
    console.error(`Error in updatePayment ${paymentId}:`, error);
    sendValidationError(res, error.message || 'Failed to update payment');
  }
}

/**
 * DELETE /api/projects/:projectId/payment-schedule/:paymentId
 */
async function deletePayment(req, res) {
  const { paymentId } = req.params;

  try {
    const deleted = await paymentScheduleService.deletePayment(parseInt(paymentId));

    if (!deleted) {
      return sendNotFound(res, 'Payment not found');
    }

    sendDeleted(res);
  } catch (error) {
    console.error(`Error in deletePayment ${paymentId}:`, error);
    sendNotFound(res, 'Payment not found');
  }
}

/**
 * POST /api/projects/:projectId/payment-schedule/:paymentId/pay
 * Отметить платёж как оплаченный
 */
async function markAsPaid(req, res) {
  const { paymentId } = req.params;
  const { paidAmount, paymentDate, paymentReference } = req.body;

  try {
    const payment = await paymentScheduleService.markAsPaid(
      parseInt(paymentId),
      paidAmount,
      paymentDate,
      paymentReference
    );

    if (!payment) {
      return sendNotFound(res, 'Payment not found');
    }

    sendSuccess(res, payment);
  } catch (error) {
    console.error(`Error in markAsPaid ${paymentId}:`, error);
    sendValidationError(res, error.message || 'Failed to mark payment as paid');
  }
}

module.exports = {
  getPaymentSchedule,
  getPaymentScheduleSummary,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
  markAsPaid,
};
