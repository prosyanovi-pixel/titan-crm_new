/**
 * Contract API Service Layer
 * Handles all API communication with backend
 */

import { api } from '@/lib/api';
import type {
  Contract,
  ContractTemplate,
  ContractApproval,
  ContractVersion,
  ContractFile,
  ContractCase,
  ContractListFilters,
  ContractTemplateFilters,
  CreateContractRequest,
  UpdateContractRequest,
  CreateContractTemplateRequest,
  SendForApprovalRequest,
  CreateVersionRequest,
  GetContractsResponse,
  GetContractResponse,
  GetContractTemplatesResponse,
} from '../types/contract.types';

const BASE_URL = 'contracts';

export class ContractService {
  /**
   * Get all contracts with pagination and filtering
   */
  async getContracts(filters: ContractListFilters = {}): Promise<GetContractsResponse> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.status) params.append('status', filters.status);
    if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);
    if (filters.search) params.append('search', filters.search);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.projectId) params.append('projectId', String(filters.projectId));
    if (filters.expiresWithinDays) params.append('expiresWithinDays', filters.expiresWithinDays.toString());

    const response = await api.get(`${BASE_URL}?${params.toString()}`);
    return response?.data || response;
  }

  /**
   * Create new contract
   */
  async createContract(data: CreateContractRequest): Promise<Contract> {
    const response = await api.post(BASE_URL, data);
    return response?.data || response;
  }

  /**
   * Get single contract with all related data
   */
  async getContract(contractId: string): Promise<GetContractResponse> {
    const response = await api.get(`${BASE_URL}/${contractId}`);
    return response?.data || response;
  }

  /**
   * Update contract
   */
  async updateContract(contractId: string, data: UpdateContractRequest): Promise<Contract> {
    const response = await api.put(`${BASE_URL}/${contractId}`, data);
    return response?.data || response;
  }

  /**
   * Delete contract
   */
  async deleteContract(contractId: string): Promise<{ success: boolean }> {
    const response = await api.delete(`${BASE_URL}/${contractId}`);
    return response?.data || response;
  }

  /**
   * Get contract templates
   */
  async getTemplates(filters: ContractTemplateFilters = {}): Promise<GetContractTemplatesResponse> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.category) params.append('category', filters.category);
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters.search) params.append('search', filters.search);

    const response = await api.get(`${BASE_URL}/templates/list?${params.toString()}`);
    return response?.data || response;
  }

  /**
   * Create template
   */
  async createTemplate(data: CreateContractTemplateRequest): Promise<ContractTemplate> {
    const response = await api.post(`${BASE_URL}/templates`, data);
    return response?.data || response;
  }

  /**
   * Update template
   */
  async updateTemplate(templateId: string, data: Partial<CreateContractTemplateRequest> & { isActive?: boolean }): Promise<ContractTemplate> {
    const response = await api.put(`${BASE_URL}/templates/${templateId}`, data);
    return response?.data || response;
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string): Promise<{ success: boolean }> {
    const response = await api.delete(`${BASE_URL}/templates/${templateId}`);
    return response?.data || response;
  }

  /**
   * Send contract for approval
   */
  async sendForApproval(contractId: string, data: SendForApprovalRequest): Promise<{ success: boolean }> {
    const response = await api.post(`${BASE_URL}/${contractId}/send-for-approval`, data);
    return response?.data || response;
  }

  /**
   * Cancel approval process
   */
  async cancelApproval(contractId: string): Promise<{ success: boolean }> {
    const response = await api.post(`${BASE_URL}/${contractId}/approvals/cancel`);
    return response?.data || response;
  }

  /**
   * Approve contract at specific step
   */
  async approveContract(contractId: string, stepNumber: number): Promise<ContractApproval> {
    const response = await api.post(`${BASE_URL}/${contractId}/approve/${stepNumber}`, {});
    return response?.data || response;
  }

  /**
   * Reject contract at specific step
   */
  async rejectContract(contractId: string, stepNumber: number, reason?: string): Promise<ContractApproval> {
    const response = await api.post(`${BASE_URL}/${contractId}/reject/${stepNumber}`, { reason });
    return response?.data || response;
  }

  /**
   * Get approval history
   */
  async getApprovalHistory(contractId: string): Promise<ContractApproval[]> {
    const response = await api.get(`${BASE_URL}/${contractId}/approval-history`);
    return response?.data || response;
  }

  /**
   * Create new version
   */
  async createVersion(contractId: string, data: CreateVersionRequest): Promise<ContractVersion> {
    const response = await api.post(`${BASE_URL}/${contractId}/create-version`, data);
    return response?.data || response;
  }

  /**
   * Get versions for contract
   */
  async getVersions(contractId: string): Promise<ContractVersion[]> {
    const response = await api.get(`${BASE_URL}/${contractId}/versions`);
    return response?.data || response;
  }

  /**
   * Revert to specific version
   */
  async revertToVersion(contractId: string, versionId: string): Promise<{ success: boolean; newVersion: number }> {
    const response = await api.post(`${BASE_URL}/${contractId}/revert-to-version/${versionId}`, {});
    return response?.data || response;
  }

  /**
   * Delete version
   */
  async deleteVersion(contractId: string, versionId: string): Promise<{ success: boolean }> {
    const response = await api.delete(`${BASE_URL}/${contractId}/versions/${versionId}`);
    return response?.data || response;
  }

  /**
   * Upload files to contract
   */
  async uploadFiles(contractId: string, files: File[]): Promise<ContractFile[]> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const response = await api.post(`${BASE_URL}/${contractId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response?.data || response;
  }

  /**
   * Get contract files
   */
  async getFiles(contractId: string): Promise<ContractFile[]> {
    const response = await api.get(`${BASE_URL}/${contractId}/files`);
    return response?.data || response;
  }

  /**
   * Delete file from contract
   */
  async deleteFile(contractId: string, fileId: string): Promise<{ success: boolean }> {
    const response = await api.delete(`${BASE_URL}/${contractId}/files/${fileId}`);
    return response?.data || response;
  }

  /**
   * Link contract to legal case
   */
  async linkCase(contractId: string, caseId: string): Promise<ContractCase> {
    const response = await api.post(`${BASE_URL}/${contractId}/link-case/${caseId}`, {});
    return response?.data || response;
  }

  /**
   * Unlink contract from legal case
   */
  async unlinkCase(contractId: string, caseId: string): Promise<{ success: boolean }> {
    const response = await api.delete(`${BASE_URL}/${contractId}/unlink-case/${caseId}`);
    return response?.data || response;
  }

  /**
   * Get contracts for a legal case
   */
  async getContractsForCase(caseId: string, page = 1, limit = 20): Promise<GetContractsResponse> {
    const response = await api.get(`${BASE_URL}/case/${caseId}?page=${page}&limit=${limit}`);
    return response?.data || response;
  }

  /**
   * Get contract metrics for dashboard
   */
  async getMetrics(): Promise<{ pendingApprovalsCount: number; expiringSoonCount: number }> {
    const response = await api.get(`${BASE_URL}/metrics`);
    return response?.data || response;
  }

  /**
   * Bulk delete contracts
   */
  async bulkDelete(contractIds: string[]): Promise<{ success: boolean }> {
    const response = await api.post(`${BASE_URL}/bulk-delete`, { contractIds });
    return response?.data || response;
  }

  /**
   * Bulk update contracts status
   */
  async bulkUpdateStatus(contractIds: string[], newStatus: string): Promise<{ success: boolean }> {
    const response = await api.post(`${BASE_URL}/bulk-update-status`, { contractIds, newStatus });
    return response?.data || response;
  }
}

export const contractService = new ContractService();
