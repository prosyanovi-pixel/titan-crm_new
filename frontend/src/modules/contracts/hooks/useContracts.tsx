import { ToastAction } from "@/components/ui/toast";
import React from "react";
/**
 * Contracts Hooks
 * Custom React hooks for contract management using TanStack Query
 */

import { useCallback, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/ui/use-toast';
import { contractService } from '../api';
import type {
  Contract,
  ContractListFilters,
  ContractTemplateFilters,
  GetContractsResponse,
  GetContractResponse,
  CreateContractRequest,
  UpdateContractRequest,
  CreateContractTemplateRequest,
  CreateVersionRequest,
} from '../types/contract.types';

const QUERY_KEYS = {
  CONTRACTS: ['contracts'],
  CONTRACT: (id: string) => ['contracts', id],
  TEMPLATES: ['contract-templates'],
  VERSIONS: (id: string) => ['contract-versions', id],
  APPROVALS: (id: string) => ['contract-approvals', id],
  FILES: (id: string) => ['contract-files', id],
};

interface ApiError {
  statusCode?: number;
  status?: number;
  message: string;
}

/**
 * Hook for fetching contracts list
 */
export function useContracts(filters: ContractListFilters = {}) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: [...QUERY_KEYS.CONTRACTS, filters],
    queryFn: () => contractService.getContracts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const error = query.error as ApiError | null;
  
  useEffect(() => {
    if (error?.statusCode === 401) {
      toast({
        title: t('general.error'),
        description: t('auth.unauthorized'),
        variant: 'destructive',
      });
    }
  }, [error, t, toast]);

  return {
    ...query,
    data: query.data as GetContractsResponse | undefined,
  };
}

/**
 * Hook for fetching single contract
 */
export function useContract(contractId: string | null) {
  return useQuery({
    queryKey: contractId ? QUERY_KEYS.CONTRACT(contractId) : ['contract-null'],
    queryFn: () => {
      if (!contractId) throw new Error('Contract ID is required');
      return contractService.getContract(contractId);
    },
    enabled: !!contractId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for creating contract
 */
export function useCreateContract() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateContractRequest) => contractService.createContract(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACTS });
      toast({
        title: t('general.success'),
        description: t('contracts.messages.created'),
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: t('general.error'),
        description: error?.message || t('contracts.errors.create_error'),
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for updating contract
 */
export function useUpdateContract(contractId: string) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateContractRequest) => contractService.updateContract(contractId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACT(contractId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACTS });
      toast({
        title: t('general.success'),
        description: t('contracts.messages.updated'),
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: t('general.error'),
        description: error?.message || t('contracts.errors.update_error'),
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for deleting contract
 */
export function useDeleteContract() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contractId: string) => contractService.deleteContract(contractId),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACTS });
      toast({
        title: t('general.success'),
        description: t('contracts.messages.deleted'),
        action: (
          <ToastAction
            altText={t('common.actions.undo')}
            onClick={() => {
              fetch(`/api/trash/contracts/${id}/restore`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                  'x-user-id': localStorage.getItem('user_id') || ''
                }
              }).then(() => {
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACTS });
                // @ts-expect-error - window.sonnerToast is dynamically added
                window.sonnerToast?.success(t('common.messages.restored'));
              });
            }}
          >
            {t('common.actions.undo')}
          </ToastAction>
        )
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: t('general.error'),
        description: error?.message || t('contracts.errors.delete_error'),
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for bulk deleting contracts
 */
export function useBulkDeleteContracts() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contractIds: string[]) => contractService.bulkDelete(contractIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACTS });
      toast({ title: t('general.success'), description: t('contracts.messages.deleted') });
    },
    onError: (error: ApiError) => {
      toast({ title: t('general.error'), description: error?.message || t('contracts.errors.delete_error'), variant: 'destructive' });
    },
  });
}

/**
 * Hook for bulk updating contract status
 */
export function useBulkUpdateContractStatus() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contractIds, newStatus }: { contractIds: string[]; newStatus: string }) =>
      contractService.bulkUpdateStatus(contractIds, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACTS });
      toast({ title: t('general.success'), description: t('contracts.messages.updated') });
    },
    onError: (error: ApiError) => {
      toast({ title: t('general.error'), description: error?.message || t('contracts.errors.update_error'), variant: 'destructive' });
    },
  });
}

/**
 * Hook for fetching contract templates
 */
export function useContractTemplates(filters: ContractTemplateFilters = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.TEMPLATES, filters],
    queryFn: () => contractService.getTemplates(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for creating template
 */
export function useCreateContractTemplate() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateContractTemplateRequest) => contractService.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TEMPLATES });
      toast({
        title: t('general.success'),
        description: t('contracts.templates.create'), // Best matching key
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: t('general.error'),
        description: error?.message || t('contracts.errors.create_error'),
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for deleting template
 */
export function useDeleteContractTemplate() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => contractService.deleteTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TEMPLATES });
      toast({
        title: t('general.success'),
        description: t('contracts.messages.deleted'),
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: t('general.error'),
        description: error?.message || t('contracts.errors.delete_error'),
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for contract approval workflow
 */
export function useContractApprovals(contractId: string | null) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const approvalQuery = useQuery({
    queryKey: contractId ? QUERY_KEYS.APPROVALS(contractId) : ['approvals-null'],
    queryFn: () => {
      if (!contractId) throw new Error('Contract ID is required');
      return contractService.getApprovalHistory(contractId);
    },
    enabled: !!contractId,
  });

  const approveMutation = useMutation({
    mutationFn: ({ stepNumber }: { stepNumber: number }) =>
      contractService.approveContract(contractId!, stepNumber),
    onSuccess: () => {
      if (contractId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.APPROVALS(contractId) });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACT(contractId) });
      }
      toast({
        title: t('general.success'),
        description: t('contracts.messages.approved'),
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: t('general.error'),
        description: error?.message || t('contracts.errors.approve_error'),
        variant: 'destructive',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ stepNumber, reason }: { stepNumber: number; reason?: string }) =>
      contractService.rejectContract(contractId!, stepNumber, reason),
    onSuccess: () => {
      if (contractId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.APPROVALS(contractId) });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACT(contractId) });
      }
      toast({
        title: t('general.success'),
        description: t('contracts.messages.rejected'),
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: t('general.error'),
        description: error?.message || t('contracts.errors.reject_error'),
        variant: 'destructive',
      });
    },
  });

  return {
    approvals: approvalQuery.data || [],
    isLoading: approvalQuery.isLoading,
    error: approvalQuery.error,
    approve: approveMutation.mutate,
    isApproving: approveMutation.isPending,
    reject: rejectMutation.mutate,
    isRejecting: rejectMutation.isPending,
  };
}

/**
 * Hook for sending contract for approval
 */
export function useSendForApproval(contractId: string) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { approvers: string[], deadlineDate?: string, versionId?: string }) =>
      contractService.sendForApproval(contractId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.APPROVALS(contractId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACT(contractId) });
      toast({
        title: t('general.success'),
        description: t('contracts.approvals.messages.sent'),
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: t('general.error'),
        description: error?.message || t('contracts.approvals.errors.send_error'),
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for cancelling approval
 */
export function useCancelApproval(contractId: string) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => contractService.cancelApproval(contractId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.APPROVALS(contractId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACT(contractId) });
      toast({
        title: t('general.success'),
        description: t('contracts.approvals.messages.cancelled'), /* Согласование отменено */
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: t('general.error'),
        description: error?.message || t('general.error_message'),
        variant: 'destructive',
      });
    },
  });
}
/**
 * Hook for contract versioning
 */
export function useContractVersions(contractId: string | null) {
  return useQuery({
    queryKey: contractId ? QUERY_KEYS.VERSIONS(contractId) : ['versions-null'],
    queryFn: () => {
      if (!contractId) throw new Error('Contract ID is required');
      return contractService.getVersions(contractId);
    },
    enabled: !!contractId,
  });
}

/**
 * Hook for creating new version
 */
export function useCreateContractVersion(contractId: string) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVersionRequest) =>
      contractService.createVersion(contractId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VERSIONS(contractId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACT(contractId) });
      toast({
        title: t('general.success'),
        description: t('contracts.versions.messages.created'),
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: t('general.error'),
        description: error?.message || t('contracts.versions.errors.create_error'),
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for deleting a version
 */
export function useDeleteContractVersion(contractId: string) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (versionId: string) => contractService.deleteVersion(contractId, versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VERSIONS(contractId) });
      toast({
        title: t('general.success'),
        description: 'Версия успешно удалена',
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: t('general.error'),
        description: error?.message || 'Ошибка при удалении версии',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for reverting version
 */
export function useRevertVersion(contractId: string) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (versionId: string) => contractService.revertToVersion(contractId, versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VERSIONS(contractId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACT(contractId) });
      toast({
        title: t('general.success'),
        description: t('contracts.messages.reverted'),
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: t('general.error'),
        description: error?.message || t('contracts.errors.revert_error'),
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for contract files
 */
export function useContractFiles(contractId: string | null) {
  return useQuery({
    queryKey: contractId ? QUERY_KEYS.FILES(contractId) : ['files-null'],
    queryFn: () => {
      if (!contractId) throw new Error('Contract ID is required');
      return contractService.getFiles(contractId);
    },
    enabled: !!contractId,
  });
}

/**
 * Hook for uploading files
 */
export function useUploadContractFiles(contractId: string) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (files: File[]) => contractService.uploadFiles(contractId, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FILES(contractId) });
      toast({
        title: t('general.success'),
        description: t('contracts.messages.files_uploaded'),
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: t('general.error'),
        description: error?.message || t('contracts.errors.upload_error'),
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for deleting file
 */
export function useDeleteContractFile(contractId: string) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileId: string) => contractService.deleteFile(contractId, fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FILES(contractId) });
      toast({
        title: t('general.success'),
        description: t('contracts.messages.file_deleted'),
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: t('general.error'),
        description: error?.message || t('contracts.errors.delete_file_error'),
        variant: 'destructive',
      });
    },
  });
}
