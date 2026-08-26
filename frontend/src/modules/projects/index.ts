// ============================================================
// ЭКСПОРТ МОДУЛЯ PROJECTS
// ============================================================

// Types - основные
export type {
  Project,
  ProjectStatus,
  ProjectCompletionStage,
  ProjectPriority,
  ProjectFilters,
  ProjectStats,
} from "./types";

// Types - этапы проекта
export type {
  ProjectStage,
  CreateProjectStageDTO,
  UpdateProjectStageDTO,
  ProjectStagesSummary,
} from "./types";

// Types - доходы проекта
export type {
  ProjectRevenue,
  RevenueStatus,
  CreateProjectRevenueDTO,
  UpdateProjectRevenueDTO,
  ProjectRevenuesSummary,
} from "./types";

// Types - график платежей
export type {
  PaymentScheduleItem,
  PaymentStatus,
  PaymentMethod,
  CreatePaymentScheduleItemDTO,
  UpdatePaymentScheduleItemDTO,
  ProjectPaymentScheduleSummary,
} from "./types";

// Types - задачи проекта
export type {
  ProjectTask,
  ProjectSubTask,
  ProjectTaskPriority,
  ProjectTaskStatus,
  OpenProjectTaskSheetRequest,
} from "./types";

// Types - API запросы/ответы
export type {
  GetProjectsResponse,
  GetProjectResponse,
  CreateProjectRequest,
  UpdateProjectRequest,
} from "./types";

// Types - справочные данные
export type { ReferenceData } from "./hooks/useProjectsPage.types";

// API
export { projectsApi, ENDPOINTS } from "./api";

// Hooks
export { useProjects, useProjectsPage } from "./hooks";

// Components
export {
  ProjectSheet,
  ProjectList,
  ProjectBoard,
  ProjectGantt,
  ProjectResources,
  ProjectBulkEditDialog,
  ProjectGeneralTab,
  ProjectTasksTab,
} from "./components";

// Pages
export { default as ProjectsPage } from "./pages/ProjectsPage";
