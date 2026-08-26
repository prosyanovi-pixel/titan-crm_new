/**
 * Contract Domain Types
 */

// Status constants
export const CONTRACT_STATUS = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ARCHIVED: 'archived'
} as const;

export type ContractStatus = typeof CONTRACT_STATUS[keyof typeof CONTRACT_STATUS];

export const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const;

export type ApprovalStatus = typeof APPROVAL_STATUS[keyof typeof APPROVAL_STATUS];

// Core Contract interface
export interface Contract {
  id: string;
  name: string;
  contractNumber?: string | null;
  description?: string | null;
  status: ContractStatus;
  assignedTo?: string | null;
  assignedToName?: string;
  templateId?: string | null;
  createdBy: string;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  versions?: ContractVersion[];
  approvals?: ContractApproval[];
  files?: ContractFile[];
  cases?: ContractCase[];
  contractorId?: number | null;
  contractorName?: string | null;
  type: string;
  amount?: number | null;
  currency: string;
  paymentStatus: string;
  tags?: string[];
  projectId?: number | null;
  projectName?: string;
  startDate?: string | null;
  endDate?: string | null;
}

// Contract Template interface
export interface ContractTemplate {
  id: string;
  name: string;
  description?: string | null;
  content: string;
  category?: string | null;
  isActive: boolean;
  createdBy: string;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Contract Version interface
export interface ContractVersion {
  id: string;
  fileId?: string;
  fileName?: string;
  contractId: string;
  versionNumber: number;
  name: string;
  description?: string | null;
  content: string;
  changes?: Record<string, unknown>;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  status?: 'draft' | 'pending_approval' | 'approved' | 'rejected';
}

// Contract Approval interface
export interface ContractApproval {
  id: string;
  contractId: string;
  versionId?: string | null;
  versionNumber?: number;
  stepNumber: number;
  status: ApprovalStatus;
  assignedTo?: string | null;
  assignedToName?: string;
  approvedBy?: string | null;
  approverName?: string;
  rejectionReason?: string;
  approvalDate?: string;
  deadlineDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Contract File interface
export interface ContractFile {
  id: string;
  contractId: string;
  originalName: string;
  storedFilename: string;
  filePath: string;
  mimeType?: string;
  fileSize?: number;
  fileHash?: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

// Contract-Case linking
export interface ContractCase {
  id: string;
  contractId: string;
  caseId: string;
  linkedBy: string;
  createdAt: string;
  updatedAt: string;
}

// Form types
export interface CreateContractRequest {
  name: string;
  contractNumber?: string;
  description?: string;
  assignedTo?: string;
  templateId?: string;
  contractorId?: number;
  projectId?: number;
  type?: string;
  amount?: number;
  currency?: string;
  paymentStatus?: string;
  status?: ContractStatus;
  tags?: string[];
  startDate?: string;
  endDate?: string;
}

export interface UpdateContractRequest {
  name?: string;
  contractNumber?: string;
  description?: string;
  assignedTo?: string;
  projectId?: number | null;
  status?: ContractStatus;
  templateId?: string | null;
  contractorId?: number | null;
  type?: string;
  amount?: number | null;
  currency?: string;
  paymentStatus?: string;
  tags?: string[];
  startDate?: string | null;
  endDate?: string | null;
}

export interface CreateContractTemplateRequest {
  name: string;
  description?: string;
  content: string;
  category?: string;
}

export interface SendForApprovalRequest {
  approvers: string[]; // Array of user IDs
  deadlineDate?: string;
  versionId?: string;
}

export interface CreateVersionRequest {
  fileId?: string;
  name: string;
  content: string;
  changes?: Record<string, unknown>;
}

// Response types
export interface GetContractsResponse {
  contracts: Contract[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

import { Invoice, Payment } from '@/modules/finance/types/finance.types';

// ... (rest of the file)

export interface GetContractResponse {
  id: string;
  name: string;
  contractNumber?: string | null;
  description?: string;
  status: ContractStatus;
  assignedTo?: string | null;
  assignedToName?: string;
  templateId?: string | null;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  versions: ContractVersion[];
  approvals: ContractApproval[];
  files: ContractFile[];
  cases: ContractCase[];
  contractorId?: number | null;
  contractorName?: string | null;
  projectId?: number | null;
  type: string;
  amount?: number | null;
  currency: string;
  paymentStatus: string;
  tags?: string[];
  invoices: Invoice[];
  payments: Payment[];
  financeSummary: {
    totalInvoiced: number;
    totalPaid: number;
  };
}

export interface GetContractTemplatesResponse {
  templates: ContractTemplate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// Filter/Query options
export interface ContractListFilters {
  page?: number;
  limit?: number;
  status?: ContractStatus | null;
  assignedTo?: string | null;
  search?: string;
  sortBy?: 'created_at' | 'name' | 'status' | 'assigned_to' | 'amount' | 'expiration_date';
  sortOrder?: 'ASC' | 'DESC';
  projectId?: number;
  // Extended filters
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  contractorId?: number | string | null;
  expiresWithinDays?: number;
}

export interface CreateVersionRequest {
  fileId?: string;
  name: string;
  content: string;
  changes?: Record<string, unknown>;
}

export interface ContractTemplateFilters {
  page?: number;
  limit?: number;
  category?: string | null;
  isActive?: boolean;
  search?: string;
}
