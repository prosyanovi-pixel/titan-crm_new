import { Contractor, ContractorStatusEnum, LegalForm, LegalEntityType, BankAccount, ContactPerson } from "./contractor.types";

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string>;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface GetContractorsResponse {
  data: Contractor[];
}

export interface GetContractorResponse {
  data: Contractor;
}

export interface BulkActionResponse {
  success: boolean;
  message?: string;
  deletedCount?: number;
  deletedIds?: number[];
}

// ============================================================================
// REQUEST PAYLOADS
// ============================================================================

export interface CreateContractorRequest {
  name: string;
  fullName?: string;
  status?: typeof ContractorStatusEnum[keyof typeof ContractorStatusEnum];
  type?: string;
  legalForm?: LegalForm;
  legalEntityType?: LegalEntityType;
  taxRegimeId?: number | null;
  manager?: string;
  phone?: string;
  email?: string;
  inn?: string;
  kpp?: string;
  ogrn?: string;
  registrationDate?: string;
  director?: string;
  directorPosition?: string;
  legalAddress?: string;
  notes?: string;
  tags?: string[];
  bankAccounts?: BankAccount[];
  contacts?: ContactPerson[];
  website?: string;
  okved?: string;
  okvedName?: string;
  authorizedCapital?: number | null;
  isActive?: boolean | null;
  gender?: "male" | "female";
  passportSeries?: string;
  passportNumber?: string;
  passportIssuedBy?: string;
  passportIssuedDate?: string;
  passportUnitCode?: string;
  registrationAddress?: string;
  okpo?: string;
  okato?: string;
}

export interface UpdateContractorRequest extends Partial<CreateContractorRequest> {
  id?: number;  // Optional, usually taken from URL
}

export interface BulkUpdateContractorsRequest {
  ids: number[];
  updates: Partial<CreateContractorRequest>;
}

export interface BulkDeleteContractorsRequest {
  ids: number[];
}

export interface DeleteContractorResponse {
  success: boolean;
}
