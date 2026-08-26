// Types
export type {
  Contractor,
  LegalForm,
  BankAccount,
  ContactPerson,
  ReferenceData,
} from "./types/contractor.types";

export type {
  GetContractorsResponse,
  GetContractorResponse,
  CreateContractorRequest,
  UpdateContractorRequest,
} from "./types/api.types";

// API
export { contractorService, contractorsApi, ENDPOINTS } from "./api";

// Hooks
export {
  useContractors,
  useContractorReferences,
  useContractorMutations,
  CONTRACTOR_KEYS,
  useContractorForm,
  useContractorFilters,
  /** @deprecated Используйте useContractors() + useContractorMutations() напрямую для новых компонентов */
  useContractorsList,
  useContractorActions,
  useSheetManagement,
  useContractorsPage,
} from "./hooks";


// Components
export { ContractorSheet, ContractorCreateSheet, LegalFormBadge } from "./components";
export {
  ContractorOverviewTab,
  ContractorContactsTab,
  ContractorRequisitesTab,
  ContractorStats,
  ContractorTableRow,
  ContractorToolbar,
} from "./components";

// Pages
export { default as ContractorsPage } from "./pages/ContractorsPage";
