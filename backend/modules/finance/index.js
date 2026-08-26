/**
 * Главный роутер финансового модуля
 * Объединяет все подмодули в единую точку входа
 */

const express = require('express');
const router = express.Router();
const { ensureSchema } = require('./schema');
const invoicesRouter = require('./invoices');
const paymentsRouter = require('./payments');
const categoriesRouter = require('./categories');
const incomeCategoriesRouter = require('./incomeCategories');
const statementsRouter = require('./statements');
const reportsRouter = require('./reports');
const projectsRouter = require('./projects');
const calendarRouter = require('./calendar');
const reconciliationRouter = require('./reconciliation');
const settingsRouter = require('./settings');

// Middleware для инициализации схемы БД перед каждым запросом
router.use(async (req, res, next) => {
  try {
    await ensureSchema();
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Подключение всех подмодулей
router.use('/projects', projectsRouter);
router.use('/calendar-payments', calendarRouter);
router.use('/reconciliation-act', reconciliationRouter);
router.use('/invoices', invoicesRouter);
router.use('/payments', paymentsRouter);
router.use('/categories', categoriesRouter);
router.use('/income-categories', incomeCategoriesRouter);
router.use('/statements', statementsRouter);
router.use('/reports', reportsRouter);
router.use('/settings', settingsRouter);

// Экспортируем router двумя способами для совместимости
module.exports = router;
module.exports.router = router;
module.exports.settings = {
  features: {
    enableStatistics: true,
    enableTaxAccounting: true,
    enableReporting: true,
    enableBudgeting: true,
  },
  display: {
    defaultSort: 'date_desc',
    itemsPerPage: 25,
  }
};
