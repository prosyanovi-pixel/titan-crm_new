// Types
export type {
  Lawyer,
  LegalCase,
  LawyerStatus,
  Specialization,
  CaseStatus,
  Currency,
  CaseType,
  MoneyAmount,
  TimelineEvent,
  DocumentComment,
  CaseDocument,
  CaseNote,
  ThirdParty,
  Court,
  Judge,
  CaseFilters,
  LawyerFilters,
  RecoveredItem,
  ExpenseItem,
  CaseOutcome,
} from "./types";

export type {
  GetLawyersResponse,
  GetLawyerResponse,
  GetCasesResponse,
  GetCaseResponse,
  CreateLawyerRequest,
  UpdateLawyerRequest,
  CreateCaseRequest,
  UpdateCaseRequest,
} from "./types";

// API
export { lawyerService, lawyersApi, ENDPOINTS } from "./api";

// Hooks
export { useLawyers, useCases } from "./hooks";

// Components
export {
  CaseSheet,
  CasesList,
  ClaimSheet,
  LawyerSheet,
  LawyersList,
  CourtsJudgesTab,
  CaseAnalyticsTab,
  CaseDocumentsTab,
  CaseFinanceTab,
  CaseGeneralTab,
  CaseNotesTab,
  CaseTimelineTab,
} from "./components";

// Pages
export { default as LawyersPage } from "./pages/LawyersPage";
