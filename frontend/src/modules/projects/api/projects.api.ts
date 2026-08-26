import { api } from "@/lib/api";
import { ENDPOINTS } from "./endpoints";
import {
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateProjectStageDTO,
  UpdateProjectStageDTO,
  CreatePaymentScheduleItemDTO,
  UpdatePaymentScheduleItemDTO,
  CreateProjectRevenueDTO,
  UpdateProjectRevenueDTO,
  CreateProjectExpenseDTO,
  UpdateProjectExpenseDTO,
} from "../types";

// ============================================================
// API ДЛЯ УПРАВЛЕНИЯ ПРОЕКТАМИ
// ============================================================

export const projectsApi = {
  /**
   * Получить список всех проектов
   */
  getAll: () => api.get(ENDPOINTS.PROJECTS),

  /**
   * Получить проект по ID
   */
  getById: (id: number) => api.get(ENDPOINTS.PROJECT_BY_ID(id)),

  /**
   * Создать новый проект
   */
  create: (data: CreateProjectRequest) => api.post(ENDPOINTS.PROJECTS, data),

  /**
   * Обновить существующий проект
   */
  update: (id: number, data: UpdateProjectRequest) => api.put(ENDPOINTS.PROJECT_BY_ID(id), data),

  /**
   * Удалить проект
   */
  delete: (id: number) => api.delete(ENDPOINTS.PROJECT_BY_ID(id)),

  /**
   * Массовое удаление проектов
   */
  bulkDelete: (ids: number[]) => api.post(`${ENDPOINTS.PROJECTS}/bulk-delete`, { ids }),

  /**
   * Массовое обновление проектов
   */
  bulkUpdate: (ids: number[], field: string, value: any) => 
    api.post(`${ENDPOINTS.PROJECTS}/bulk-update`, { ids, field, value }),

  /**
   * Получить статистику по всем проектам
   */
  getStats: () => api.get(ENDPOINTS.PROJECT_STATS),
  
  // ============================================================
  // API ДЛЯ ЭТАПОВ ПРОЕКТА (PROJECT STAGES)
  // ============================================================
  
  /**
   * Получить все этапы проекта
   */
  getStages: (projectId: number) => api.get(ENDPOINTS.PROJECT_STAGES(projectId)),
  
  /**
   * Получить сводку по этапам проекта
   */
  getStagesSummary: (projectId: number) => api.get(ENDPOINTS.PROJECT_STAGES_SUMMARY(projectId)),
  
  /**
   * Получить этап по ID
   */
  getStage: (projectId: number, stageId: number) => 
    api.get(ENDPOINTS.PROJECT_STAGE_BY_ID(projectId, stageId)),
  
  /**
   * Создать новый этап
   */
  createStage: (projectId: number, data: CreateProjectStageDTO) =>
    api.post(ENDPOINTS.PROJECT_STAGES(projectId), data),
  
  /**
   * Обновить этап
   */
  updateStage: (projectId: number, stageId: number, data: UpdateProjectStageDTO) =>
    api.put(ENDPOINTS.PROJECT_STAGE_BY_ID(projectId, stageId), data),
  
  /**
   * Удалить этап
   */
  deleteStage: (projectId: number, stageId: number) =>
    api.delete(ENDPOINTS.PROJECT_STAGE_BY_ID(projectId, stageId)),
  
  /**
   * Завершить этап
   */
  completeStage: (projectId: number, stageId: number, progress?: number) =>
    api.post(ENDPOINTS.PROJECT_STAGE_COMPLETE(projectId, stageId), { progress }),
  
  /**
   * Переместить этап (изменить порядок)
   */
  reorderStage: (projectId: number, stageId: number, orderIndex: number) =>
    api.post(ENDPOINTS.PROJECT_STAGE_REORDER(projectId, stageId), { orderIndex }),
  
  // ============================================================
  // API ДЛЯ ГРАФИКА ПЛАТЕЖЕЙ (PAYMENT SCHEDULE)
  // ============================================================
  
  /**
   * Получить график платежей проекта
   */
  getPaymentSchedule: (projectId: number) => 
    api.get(ENDPOINTS.PROJECT_PAYMENT_SCHEDULE(projectId)),
  
  /**
   * Получить сводку по графику платежей
   */
  getPaymentScheduleSummary: (projectId: number) =>
    api.get(ENDPOINTS.PROJECT_PAYMENT_SCHEDULE_SUMMARY(projectId)),
  
  /**
   * Получить платёж по ID
   */
  getPayment: (projectId: number, paymentId: number) =>
    api.get(ENDPOINTS.PROJECT_PAYMENT_BY_ID(projectId, paymentId)),
  
  /**
   * Создать платёж в графике
   */
  createPayment: (projectId: number, data: CreatePaymentScheduleItemDTO) =>
    api.post(ENDPOINTS.PROJECT_PAYMENT_SCHEDULE(projectId), data),
  
  /**
   * Обновить платёж
   */
  updatePayment: (projectId: number, paymentId: number, data: UpdatePaymentScheduleItemDTO) =>
    api.put(ENDPOINTS.PROJECT_PAYMENT_BY_ID(projectId, paymentId), data),
  
  /**
   * Удалить платёж
   */
  deletePayment: (projectId: number, paymentId: number) =>
    api.delete(ENDPOINTS.PROJECT_PAYMENT_BY_ID(projectId, paymentId)),
  
  /**
   * Отметить платёж как оплаченный
   */
  markAsPaid: (projectId: number, paymentId: number, data?: { 
    paidAmount?: number; 
    paymentDate?: string; 
    paymentReference?: string;
  }) =>
    api.post(ENDPOINTS.PROJECT_PAYMENT_PAY(projectId, paymentId), data),
  
  // ============================================================
  // API ДЛЯ ДОХОДОВ ПРОЕКТА (PROJECT REVENUES)
  // ============================================================
  
  /**
   * Получить доходы проекта
   */
  getRevenues: (projectId: number) => 
    api.get(ENDPOINTS.PROJECT_REVENUES(projectId)),
  
  /**
   * Получить сводку по доходам
   */
  getRevenuesSummary: (projectId: number) =>
    api.get(ENDPOINTS.PROJECT_REVENUES_SUMMARY(projectId)),
  
  /**
   * Получить доход по ID
   */
  getRevenue: (projectId: number, revenueId: number) =>
    api.get(ENDPOINTS.PROJECT_REVENUE_BY_ID(projectId, revenueId)),
  
  /**
   * Создать доход
   */
  createRevenue: (projectId: number, data: CreateProjectRevenueDTO) =>
    api.post(ENDPOINTS.PROJECT_REVENUES(projectId), data),
  
  /**
   * Обновить доход
   */
  updateRevenue: (projectId: number, revenueId: number, data: UpdateProjectRevenueDTO) =>
    api.put(ENDPOINTS.PROJECT_REVENUE_BY_ID(projectId, revenueId), data),
  
  /**
   * Удалить доход
   */
  deleteRevenue: (projectId: number, revenueId: number) =>
    api.delete(ENDPOINTS.PROJECT_REVENUE_BY_ID(projectId, revenueId)),
  
  /**
   * Отметить доход как полученный
   */
  markAsReceived: (projectId: number, revenueId: number, actualDate?: string) =>
    api.post(ENDPOINTS.PROJECT_REVENUE_RECEIVE(projectId, revenueId), { actualDate }),
  
  // ============================================================
  // API ДЛЯ РАСХОДОВ ПРОЕКТА (PROJECT EXPENSES)
  // ============================================================
  
  /**
   * Получить категории расходов (из Finance модуля)
   */
  getExpenseCategories: () =>
    api.get('/finance/categories?kind=expense'),
  
  /**
   * Получить расходы проекта
   */
  getProjectExpenses: (projectId: number) =>
    api.get(ENDPOINTS.PROJECT_EXPENSES(projectId)),
  
  /**
   * Получить данные для графика расходов
   */
  getProjectExpensesChart: (projectId: number) =>
    api.get(ENDPOINTS.PROJECT_EXPENSES_CHART(projectId)),
  
  /**
   * Получить сводку по расходам
   */
  getProjectExpensesSummary: (projectId: number) =>
    api.get(ENDPOINTS.PROJECT_EXPENSES_SUMMARY(projectId)),
  
  /**
   * Получить расход по ID
   */
  getExpense: (projectId: number, expenseId: number) =>
    api.get(ENDPOINTS.PROJECT_EXPENSE_BY_ID(projectId, expenseId)),
  
  /**
   * Создать расход
   */
  createExpense: (projectId: number, data: CreateProjectExpenseDTO) =>
    api.post(ENDPOINTS.PROJECT_EXPENSES(projectId), data),
  
  /**
   * Обновить расход
   */
  updateExpense: (projectId: number, expenseId: number, data: UpdateProjectExpenseDTO) =>
    api.put(ENDPOINTS.PROJECT_EXPENSE_BY_ID(projectId, expenseId), data),
  
  /**
   * Удалить расход
   */
  deleteExpense: (projectId: number, expenseId: number) =>
    api.delete(ENDPOINTS.PROJECT_EXPENSE_BY_ID(projectId, expenseId)),
  
  /**
   * Утвердить расход
   */
  approveExpense: (projectId: number, expenseId: number) =>
    api.post(ENDPOINTS.PROJECT_EXPENSE_APPROVE(projectId, expenseId), {}),
  
  /**
   * Отметить расход как оплаченный
   */
  markExpensePaid: (projectId: number, expenseId: number, paymentId?: number, actualDate?: string) =>
    api.post(ENDPOINTS.PROJECT_EXPENSE_PAY(projectId, expenseId), { paymentId, actualDate }),

  // ============================================================
  // P&L ОТЧЁТ (PROFIT & LOSS)
  // ============================================================

  /**
   * Получить P&L отчёт по проекту
   */
  getPnL: (projectId: number) =>
    api.get(ENDPOINTS.PROJECT_PNL(projectId)),
};
