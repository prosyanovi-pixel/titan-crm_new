import type { ProjectTask } from "./project-task.types";

// ============================================================
// СТАТУСЫ И ПРИОРИТЕТЫ
// ============================================================

export type ProjectStatus = "active" | "pending" | "paused" | "finished" | "archived";
export type ProjectCompletionStage = string;
export type ProjectPriority = "High" | "Medium" | "Low";

// ============================================================
// ОСНОВНОЙ ИНТЕРФЕЙС PROJECT
// ============================================================

export interface Project {
  id: number;
  parentId?: number | null;
  name: string;
  client: string;
  description?: string; // Описание проекта
  manager: string;
  managerAvatar?: string;
  status: ProjectStatus;
  stage: ProjectCompletionStage; // Статус выполнения (todo/in_progress/review/done)
  priority: ProjectPriority;
  
  // Бюджет и финансы
  budgetUsed: number;
  budget: number;
  budgetCurrency?: string; // Валюта проекта (RUB, USD, EUR)
  budgetUsedPercent?: number; // Процент использования бюджета
  totalPaid?: number; // Общая сумма полученных платежей
  totalExpenses?: number; // Общая сумма расходов
  overheadAllocated?: number; // Распределённые накладные расходы
  profitActual?: number; // Фактическая прибыль
  profitPlan?: number; // Плановая прибыль
  wipAmount?: number; // Незавершённое производство
  
  // Даты
  deadline: string; // Устаревшее поле (для обратной совместимости)
  startDate?: string; // Дата начала проекта
  endDate?: string; // Дата окончания проекта
  
  // Задачи
  tasksCount: number;
  completedTasks: number;
  
  // Вложенность
  subProjects?: Project[];
  
  // Системные поля
  createdAt?: string;
  updatedAt?: string;
  
  // Настройки
  taxRegimeId?: number; // Режим налогообложения
  tags?: string[]; // Теги проекта

  // Продажи и процессы
  projectType?: string; // e.g. 'standard'
  workflowId?: string; // UUID процесса воронки
  deadlineOrder?: string; // Дедлайн по заказу/поставке
  deadlinePayment?: string; // Дедлайн по оплате
}

// ============================================================
// ЭТАПЫ ПРОЕКТА (PROJECT STAGES)
// ============================================================

export interface ProjectStage {
  id: number;
  projectId: number;
  name: string;
  type?: string; // stage, milestone, meeting, delivery
  description?: string;
  startDate: string;
  endDate: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  progress: number; // 0-100
  isCompleted: boolean;
  completedAt?: string;
  orderIndex: number;
  budget?: number;
  budgetUsed?: number;
  responsibleUserId?: number;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Этап проекта с вложенными задачами
 */
export interface ProjectStageWithTasks extends ProjectStage {
  tasks?: ProjectTask[];
}

export interface CreateProjectStageDTO {
  name: string;
  type?: string;
  description?: string;
  startDate: string;
  endDate: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  budget?: number;
  progress?: number;
  isCompleted?: boolean;
  orderIndex?: number;
  responsibleUserId?: number;
  color?: string;
}

export interface UpdateProjectStageDTO {
  name?: string;
  type?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  progress?: number;
  isCompleted?: boolean;
  budget?: number;
  budgetUsed?: number;
  orderIndex?: number;
  responsibleUserId?: number;
  color?: string;
}

// ============================================================
// ДОХОДЫ ПРОЕКТА (PROJECT REVENUES)
// ============================================================

export type RevenueStatus = "planned" | "invoiced" | "received" | "overdue" | "cancelled";

export interface ProjectRevenue {
  id: number;
  projectId: number;
  stageId?: number;  // Связь с этапом
  contractorId?: number;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  vatRate?: number;
  vatAmount?: number;
  plannedDate: string;
  actualDate?: string;
  invoiceId?: number;
  paymentId?: number;
  status: RevenueStatus;
  overdueSince?: string;
  isTaxable: boolean;
  incomeCategoryId?: string | null;
  incomeCategoryName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProjectRevenueDTO {
  name: string;
  description?: string;
  amount: number;
  currency?: string;
  vatRate?: number;
  plannedDate: string;
  stageId?: number;
  contractorId?: number;
  isTaxable?: boolean;
  incomeCategoryId?: string;
}

export interface UpdateProjectRevenueDTO {
  name?: string;
  description?: string;
  amount?: number;
  currency?: string;
  vatRate?: number;
  plannedDate?: string;
  actualDate?: string;
  stageId?: number;
  isTaxable?: boolean;
  incomeCategoryId?: string;
  status?: RevenueStatus;
}

// ============================================================
// ГРАФИК ПЛАТЕЖЕЙ (PAYMENT SCHEDULE)
// ============================================================

export type PaymentStatus = "pending" | "paid" | "partial" | "overdue" | "cancelled";
export type PaymentMethod = "bank" | "cash" | "card" | "other";

export interface PaymentScheduleItem {
  id: number;
  projectId: number;
  stageId?: number;
  revenueId?: number;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  dueDate: string;
  paidDate?: string;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  overdueSince?: string;
  isEarly: boolean;
  paymentReference?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePaymentScheduleItemDTO {
  name: string;
  description?: string;
  amount: number;
  currency?: string;
  dueDate: string;
  paymentMethod?: PaymentMethod;
  stageId?: number;
  revenueId?: number;
}

export interface UpdatePaymentScheduleItemDTO {
  name?: string;
  description?: string;
  amount?: number;
  currency?: string;
  dueDate?: string;
  paidAmount?: number;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
}

// ============================================================
// ФИЛЬТРЫ И СТАТИСТИКА
// ============================================================

export interface ProjectFilters {
  status?: ProjectStatus;
  stage?: ProjectCompletionStage;
  priority?: ProjectPriority;
  manager?: string;
  client?: string;
  searchQuery?: string;
}

export interface ProjectStats {
  total: number;
  active: number;
  finished: number;
  totalBudget: number;
  usedBudget: number;
}

// ============================================================
// СВОДНЫЕ ДАННЫЕ (SUMMARY)
// ============================================================

export interface ProjectStagesSummary {
  totalStages: number;
  completedStages: number;
  pendingStages: number;
  avgProgress: number;
  totalBudget: number;
  totalBudgetUsed: number;
  earliestStart?: string;
  latestEnd?: string;
}

export interface ProjectRevenuesSummary {
  totalRevenues: number;
  plannedAmount: number;
  receivedAmount: number;
  overdueAmount: number;
  totalVat: number;
  overdueCount: number;
}

export interface ProjectPaymentScheduleSummary {
  totalPayments: number;
  totalAmount: number;
  totalPaid: number;
  pendingAmount: number;
  overdueAmount: number;
  overdueCount: number;
  paidCount: number;
  nextDueDate?: string;
}

// ============================================================
// РАСХОДЫ ПРОЕКТА (PROJECT EXPENSES)
// ============================================================

export interface IncomeCategory {
  id: string;
  name: string;
  parentId?: string;
  color?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  color?: string;
}



export type ExpenseCategoryKey = "materials" | "labor" | "overhead" | "taxes" | "other";

export interface ProjectExpense {
  id: number;
  projectId: number;
  stageId?: number;
  contractorId?: number;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  category?: string;
  categoryId?: string;
  categoryName?: string;
  vatRate?: number;
  vatAmount?: number;
  plannedDate: string;
  actualDate?: string;
  invoiceId?: number;
  paymentId?: number;
  status: RevenueStatus;
  overdueSince?: string;
  isTaxable: boolean;
  isApproved?: boolean;
  isPaid?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProjectExpenseDTO {
  name: string;
  description?: string;
  amount: number;
  currency?: string;
  category?: string;
  categoryId?: string;
  vatRate?: number;
  plannedDate: string;
  stageId?: number;
  contractorId?: number;
  isTaxable?: boolean;
}

export interface UpdateProjectExpenseDTO {
  name?: string;
  description?: string;
  amount?: number;
  currency?: string;
  category?: string;
  categoryId?: string;
  vatRate?: number;
  plannedDate?: string;
  actualDate?: string;
  stageId?: number;
  isTaxable?: boolean;
  isApproved?: boolean;
  isPaid?: boolean;
}

export interface ProjectExpensesSummary {
  totalExpenses: number;
  plannedAmount: number;
  actualAmount: number;
  overdueAmount: number;
  overdueCount: number;
  totalAmount?: number;
  approvedAmount?: number;
  pendingAmount?: number;
}
