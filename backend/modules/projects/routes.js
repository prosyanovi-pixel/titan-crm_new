/**
 * Маршруты модуля Projects
 */

const express = require('express');
const router = express.Router();
const controllers = require('./controllers');
const stagesControllers = require('./controllers/projectStagesController');
const paymentScheduleControllers = require('./controllers/paymentScheduleController');
const revenuesControllers = require('./controllers/projectRevenuesController');
const expensesControllers = require('./controllers/projectExpensesController');
const financeControllers = require('./controllers/projectFinanceController');

// ============================================================
// ОСНОВНЫЕ МАРШРУТЫ ПРОЕКТОВ
// ============================================================

// GET /api/projects/stats - Статистика проектов (должен быть выше /:id)
router.get('/stats', controllers.getStats);

// GET /api/projects/sales-pipeline - Воронка продаж
router.get('/sales-pipeline', controllers.getSalesPipeline);

// GET /api/projects - Получить все проекты
router.get('/', controllers.getAll);

// GET /api/projects/:id - Получить проект по ID
router.get('/:id', controllers.getById);

// POST /api/projects - Создать проект
router.post('/', controllers.create);

// PUT /api/projects/:id - Обновить проект
router.put('/:id', controllers.update);

// DELETE /api/projects/:id - Удалить проект
router.delete('/:id', controllers.remove);

// POST /api/projects/bulk-update - Массовое обновление
router.post('/bulk-update', controllers.bulkUpdate);

// POST /api/projects/bulk-delete - Массовое удаление
router.post('/bulk-delete', controllers.bulkDelete);

// POST /api/projects/:id/complete - Завершить проект
router.post('/:id/complete', controllers.complete);

// POST /api/projects/:id/archive - Архивировать проект
router.post('/:id/archive', controllers.archive);

// ============================================================
// МАРШРУТЫ ДЛЯ ЭТАПОВ ПРОЕКТА (PROJECT STAGES)
// ============================================================

// GET /api/projects/:id/stages - Получить все этапы проекта
router.get('/:id/stages', stagesControllers.getStages);

// GET /api/projects/:id/stages/summary - Получить сводку по этапам
router.get('/:id/stages/summary', stagesControllers.getStagesSummary);

// GET /api/projects/:projectId/stages/:stageId - Получить этап по ID
router.get('/:projectId/stages/:stageId', stagesControllers.getStage);

// POST /api/projects/:id/stages - Создать новый этап
router.post('/:id/stages', stagesControllers.createStage);

// PUT /api/projects/:projectId/stages/:stageId - Обновить этап
router.put('/:projectId/stages/:stageId', stagesControllers.updateStage);

// DELETE /api/projects/:projectId/stages/:stageId - Удалить этап
router.delete('/:projectId/stages/:stageId', stagesControllers.deleteStage);

// POST /api/projects/:projectId/stages/:stageId/complete - Завершить этап
router.post('/:projectId/stages/:stageId/complete', stagesControllers.completeStage);

// POST /api/projects/:projectId/stages/:stageId/reorder - Переместить этап
router.post('/:projectId/stages/:stageId/reorder', stagesControllers.reorderStage);

// ============================================================
// МАРШРУТЫ ДЛЯ ГРАФИКА ПЛАТЕЖЕЙ (PAYMENT SCHEDULE)
// ============================================================

// GET /api/projects/:id/payment-schedule - Получить график платежей
router.get('/:id/payment-schedule', paymentScheduleControllers.getPaymentSchedule);

// GET /api/projects/:id/payment-schedule/summary - Получить сводку по графику
router.get('/:id/payment-schedule/summary', paymentScheduleControllers.getPaymentScheduleSummary);

// GET /api/projects/:projectId/payment-schedule/:paymentId - Получить платёж по ID
router.get('/:projectId/payment-schedule/:paymentId', paymentScheduleControllers.getPayment);

// POST /api/projects/:id/payment-schedule - Создать платёж
router.post('/:id/payment-schedule', paymentScheduleControllers.createPayment);

// PUT /api/projects/:projectId/payment-schedule/:paymentId - Обновить платёж
router.put('/:projectId/payment-schedule/:paymentId', paymentScheduleControllers.updatePayment);

// DELETE /api/projects/:projectId/payment-schedule/:paymentId - Удалить платёж
router.delete('/:projectId/payment-schedule/:paymentId', paymentScheduleControllers.deletePayment);

// POST /api/projects/:projectId/payment-schedule/:paymentId/pay - Отметить как оплаченный
router.post('/:projectId/payment-schedule/:paymentId/pay', paymentScheduleControllers.markAsPaid);

// ============================================================
// МАРШРУТЫ ДЛЯ ДОХОДОВ ПРОЕКТА (PROJECT REVENUES)
// ============================================================

// GET /api/projects/:id/revenues - Получить доходы проекта
router.get('/:id/revenues', revenuesControllers.getRevenues);

// GET /api/projects/:id/revenues/summary - Получить сводку по доходам
router.get('/:id/revenues/summary', revenuesControllers.getRevenuesSummary);

// GET /api/projects/:projectId/revenues/:revenueId - Получить доход по ID
router.get('/:projectId/revenues/:revenueId', revenuesControllers.getRevenue);

// POST /api/projects/:id/revenues - Создать доход
router.post('/:id/revenues', revenuesControllers.createRevenue);

// PUT /api/projects/:projectId/revenues/:revenueId - Обновить доход
router.put('/:projectId/revenues/:revenueId', revenuesControllers.updateRevenue);

// DELETE /api/projects/:projectId/revenues/:revenueId - Удалить доход
router.delete('/:projectId/revenues/:revenueId', revenuesControllers.deleteRevenue);

// POST /api/projects/:projectId/revenues/:revenueId/receive - Отметить как полученный
router.post('/:projectId/revenues/:revenueId/receive', revenuesControllers.markAsReceived);

// ============================================================
// МАРШРУТЫ ДЛЯ РАСХОДОВ ПРОЕКТА (PROJECT EXPENSES)
// ============================================================

// GET /api/projects/expenses/categories - Получить категории расходов
router.get('/expenses/categories', expensesControllers.getExpenseCategories);

// GET /api/projects/:id/expenses - Получить расходы проекта
router.get('/:id/expenses', expensesControllers.getProjectExpenses);

// GET /api/projects/:id/expenses/chart - Получить данные для графика
router.get('/:id/expenses/chart', expensesControllers.getProjectExpensesChart);

// GET /api/projects/:id/expenses/summary - Получить сводку по расходам
router.get('/:id/expenses/summary', expensesControllers.getProjectExpensesSummary);

// GET /api/projects/:projectId/expenses/:expenseId - Получить расход по ID
router.get('/:projectId/expenses/:expenseId', expensesControllers.getProjectExpense);

// POST /api/projects/:id/expenses - Создать расход
router.post('/:id/expenses', expensesControllers.createProjectExpense);

// PUT /api/projects/:projectId/expenses/:expenseId - Обновить расход
router.put('/:projectId/expenses/:expenseId', expensesControllers.updateProjectExpense);

// DELETE /api/projects/:projectId/expenses/:expenseId - Удалить расход
router.delete('/:projectId/expenses/:expenseId', expensesControllers.deleteProjectExpense);

// POST /api/projects/:projectId/expenses/:expenseId/approve - Утвердить расход
router.post('/:projectId/expenses/:expenseId/approve', expensesControllers.approveExpense);

// POST /api/projects/:projectId/expenses/:expenseId/pay - Отметить как оплаченный
router.post('/:projectId/expenses/:expenseId/pay', expensesControllers.markExpensePaid);

// ============================================================
// МАРШРУТЫ ДЛЯ ФИНАНСОВОЙ АНАЛИТИКИ
// ============================================================

// GET /api/projects/:id/pnl - P&L отчёт по проекту
router.get('/:id/pnl', financeControllers.getPnLReport);

// GET /api/projects/:id/finance/summary - Краткая финансовая сводка
router.get('/:id/finance/summary', financeControllers.getFinanceSummary);

// GET /api/projects/:id/finance/taxes - Расчёт налогов
router.get('/:id/finance/taxes', financeControllers.getProjectTaxes);

// GET /api/projects/:id/finance/report/pdf - Экспорт P&L отчета в PDF
router.get('/:id/finance/report/pdf', financeControllers.exportPnLReportPdf);

module.exports = router;
