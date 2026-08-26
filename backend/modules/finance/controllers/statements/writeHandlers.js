/**
 * Обработчики для изменения данных о выписках
 */

const { sendSuccess, sendNotFound } = require('../../../../utils/responseHelpers');
const { deleteStatement } = require('../../services/statements');
const { autoReconcile, assignLine } = require('../../services/statementReconciliation');
const logger = require('../../../../utils/logger');

/**
 * Автоматическая сверка выписки
 * @route POST /api/finance/statements/:id/reconcile
 */
async function reconcile(req, res) {
  const { id } = req.params;
  const { account } = req.body || {};

  const result = await autoReconcile(id, account);
  sendSuccess(res, result);
}

/**
 * Ручное назначение счёта/платежа
 * @route PUT /api/finance/statements/lines/:lineId
 */
async function updateLine(req, res) {
  const { lineId } = req.params;
  const { invoiceId, paymentId, categoryId } = req.body || {};
  
  logger.info(`updateLine: lineId=${lineId}, invoiceId=${invoiceId}, paymentId=${paymentId}, categoryId=${categoryId}`);

  try {
    const line = await assignLine(lineId, { invoiceId, paymentId, categoryId }, req.headers['x-user-id']);
    sendSuccess(res, line);
  } catch (err) {
    logger.error(`updateLine error: ${err.message}`, err);
    
    if (err.message === 'Line not found') {
      return sendNotFound(res, 'Line not found');
    }
    throw err;
  }
}

/**
 * Удалить выписку
 * @route DELETE /api/finance/statements/:id
 */
async function remove(req, res) {
  await deleteStatement(req.params.id);
  sendSuccess(res, { success: true });
}

module.exports = {
  reconcile,
  updateLine,
  remove,
};
