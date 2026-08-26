/**
 * Главный файл экспорта для подмодуля Statements
 * Объединяет контроллеры и сервисы
 * Экспортирует router по умолчанию для совместимости
 */

const router = require('./controllers/statements');
const statementsService = require('./services/statements');
const reconciliationService = require('./services/statementReconciliation');

// Экспорт router по умолчанию для совместимости с index.js
module.exports = router;

// Дополнительный экспорт сервисов
module.exports.statementsService = statementsService;
module.exports.reconciliationService = reconciliationService;
