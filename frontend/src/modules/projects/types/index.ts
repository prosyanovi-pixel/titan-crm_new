// ============================================================
// ЭКСПОРТ ТИПОВ МОДУЛЯ PROJECTS
// ============================================================

export type {
  // Основные типы
  Project,
  ProjectStatus,
  ProjectCompletionStage,
  ProjectPriority,
  ProjectFilters,
  ProjectStats,

  // Этапы проекта
  ProjectStage,
  ProjectStageWithTasks,
  CreateProjectStageDTO,
  UpdateProjectStageDTO,

  // Доходы проекта
  ProjectRevenue,
  RevenueStatus,
  CreateProjectRevenueDTO,
  UpdateProjectRevenueDTO,

  // Расходы проекта
  ProjectExpense,
  IncomeCategory,
  ExpenseCategory,
  ExpenseCategoryKey,
  CreateProjectExpenseDTO,
  UpdateProjectExpenseDTO,

  // График платежей
  PaymentScheduleItem,
  PaymentStatus,
  PaymentMethod,
  CreatePaymentScheduleItemDTO,
  UpdatePaymentScheduleItemDTO,

  // Сводные данные
  ProjectStagesSummary,
  ProjectRevenuesSummary,
  ProjectExpensesSummary,
  ProjectPaymentScheduleSummary,
} from "./project.types";

export type {
  ProjectTask,
  ProjectSubTask,
  ProjectTaskPriority,
  ProjectTaskStatus,
  OpenProjectTaskSheetRequest,
} from "./project-task.types";

export type {
  GetProjectsResponse,
  GetProjectResponse,
  CreateProjectRequest,
  UpdateProjectRequest,
} from "./api.types";
