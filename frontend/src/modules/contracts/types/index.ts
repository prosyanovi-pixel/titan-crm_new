/**
 * Contract API Response Types
 */

import type {
  Contract,
  ContractTemplate,
  ContractVersion,
  ContractApproval,
  ContractFile,
  ContractCase,
  GetContractsResponse,
  CreateContractRequest,
  UpdateContractRequest,
} from './contract.types';

// API Response wrappers
export type GetContractResponse = Contract & {
  versions: ContractVersion[];
  approvals: ContractApproval[];
  files: ContractFile[];
  cases: ContractCase[];
};

export type { GetContractsResponse };

// API errors
export interface ApiError {
  error: string;
  statusCode?: number;
}

// File upload response
export interface FileUploadResponse {
  id: string;
  contractId: string;
  originalName: string;
  storedFilename: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: string;
  createdAt: string;
}

// Approval workflow response
export interface ApprovalResponse {
  success: boolean;
  newStatus?: string;
  message?: string;
}

// Version revert response
export interface RevertVersionResponse {
  success: boolean;
  newVersion: number;
}

// Link case response
export interface LinkCaseResponse {
  id: string;
  contractId: string;
  caseId: string;
  linkedBy: string;
  createdAt: string;
}

export type {
  CreateContractRequest,
  UpdateContractRequest,
};
