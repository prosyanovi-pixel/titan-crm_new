/**
 * Обработчики для чтения данных о выписках
 */

const { sendSuccess } = require('../../../../utils/responseHelpers');
const {
  getAllStatements,
  getStatementLines,
} = require('../../services/statements');

/**
 * Получить все выписки
 * @route GET /api/finance/statements
 */
async function getAll(req, res) {
  const statements = await getAllStatements();
  sendSuccess(res, statements);
}

/**
 * Получить строки выписки
 * @route GET /api/finance/statements/:id/lines
 */
async function getLines(req, res) {
  const lines = await getStatementLines(req.params.id);
  sendSuccess(res, lines);
}

module.exports = {
  getAll,
  getLines,
};
