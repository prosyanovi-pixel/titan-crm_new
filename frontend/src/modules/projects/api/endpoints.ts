// ============================================================
// ENDPOINTS МОДУЛЯ PROJECTS
// ============================================================

/**
 * Список всех эндпоинтов API для модуля Проектов
 * 
 * Включает:
 * - CRUD операции для проектов
 * - Управление этапами (Stages)
 * - Управление доходами (Revenues) и расходами (Expenses)
 * - График платежей (Payment Schedule)
 * - Финансовые отчёты (PnL)
 */
export const ENDPOINTS = {
  // Основные endpoints проектов
  PROJECTS: '/projects',
  PROJECT_BY_ID: (id: number) => `/projects/${id}`,
  PROJECT_STATS: '/projects/stats',
  
  // Этапы проекта (Project Stages)
  PROJECT_STAGES: (projectId: number) => `/projects/${projectId}/stages`,
  PROJECT_STAGES_SUMMARY: (projectId: number) => `/projects/${projectId}/stages/summary`,
  PROJECT_STAGE_BY_ID: (projectId: number, stageId: number) => `/projects/${projectId}/stages/${stageId}`,
  PROJECT_STAGE_COMPLETE: (projectId: number, stageId: number) => `/projects/${projectId}/stages/${stageId}/complete`,
  PROJECT_STAGE_REORDER: (projectId: number, stageId: number) => `/projects/${projectId}/stages/${stageId}/reorder`,
  
  // Доходы проекта (Project Revenues)
  PROJECT_REVENUES: (projectId: number) => `/projects/${projectId}/revenues`,
  PROJECT_REVENUES_SUMMARY: (projectId: number) => `/projects/${projectId}/revenues/summary`,
  PROJECT_REVENUE_BY_ID: (projectId: number, revenueId: number) => `/projects/${projectId}/revenues/${revenueId}`,
  PROJECT_REVENUE_RECEIVE: (projectId: number, revenueId: number) => `/projects/${projectId}/revenues/${revenueId}/receive`,
  
  // Расходы проекта (Project Expenses)
  PROJECT_EXPENSES_CATEGORIES: '/projects/expenses/categories',
  PROJECT_EXPENSES: (projectId: number) => `/projects/${projectId}/expenses`,
  PROJECT_EXPENSES_SUMMARY: (projectId: number) => `/projects/${projectId}/expenses/summary`,
  PROJECT_EXPENSES_CHART: (projectId: number) => `/projects/${projectId}/expenses/chart`,
  PROJECT_EXPENSE_BY_ID: (projectId: number, expenseId: number) => `/projects/${projectId}/expenses/${expenseId}`,
  PROJECT_EXPENSE_APPROVE: (projectId: number, expenseId: number) => `/projects/${projectId}/expenses/${expenseId}/approve`,
  PROJECT_EXPENSE_PAY: (projectId: number, expenseId: number) => `/projects/${projectId}/expenses/${expenseId}/pay`,
  
  // График платежей (Payment Schedule)
  PROJECT_PAYMENT_SCHEDULE: (projectId: number) => `/projects/${projectId}/payment-schedule`,
  PROJECT_PAYMENT_SCHEDULE_SUMMARY: (projectId: number) => `/projects/${projectId}/payment-schedule/summary`,
  PROJECT_PAYMENT_BY_ID: (projectId: number, itemId: number) => `/projects/${projectId}/payment-schedule/${itemId}`,
  PROJECT_PAYMENT_PAY: (projectId: number, itemId: number) => `/projects/${projectId}/payment-schedule/${itemId}/pay`,

  // P&L отчёт (Profit & Loss)
  PROJECT_PNL: (projectId: number) => `/projects/${projectId}/pnl`,
} as const;
