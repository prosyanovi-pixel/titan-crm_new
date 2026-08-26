// frontend/src/modules/projects/hooks/useProjectRevenues.ts
import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import { api } from '@/lib/api';
import type {
  ProjectRevenue,
  CreateProjectRevenueDTO,
  UpdateProjectRevenueDTO,
  ProjectRevenuesSummary,
  IncomeCategory,
} from '../types';
import {
  useProjectRevenues as useProjectRevenuesQuery,
  useProjectRevenueMutations,
} from './useProjectQueries';
import { projectsApi } from '../api/projects.api';

interface UseProjectRevenuesOptions {
  projectId?: number;
  enabled?: boolean;
}

interface UseProjectRevenuesReturn {
  // Данные
  revenues: ProjectRevenue[];
  summary: ProjectRevenuesSummary | null;
  categories: IncomeCategory[];
  isLoading: boolean;
  isError: boolean;
  
  // CRUD операции
  createRevenue: (data: CreateProjectRevenueDTO) => Promise<ProjectRevenue | null>;
  updateRevenue: (revenueId: number, data: UpdateProjectRevenueDTO) => Promise<ProjectRevenue | null>;
  deleteRevenue: (revenueId: number) => Promise<boolean>;
  markAsReceived: (revenueId: number, actualDate?: string) => Promise<ProjectRevenue | null>;
  
  // Состояния
  refresh: () => void;
}

/**
 * Хук для управления доходами проекта с использованием TanStack Query
 */
export function useProjectRevenues(options: UseProjectRevenuesOptions = {}): UseProjectRevenuesReturn {
  const { projectId, enabled = true } = options;
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  // Используем TanStack Query для загрузки доходов
  const { data: revenues = [], isLoading, isError, refetch } = useProjectRevenuesQuery(
    enabled && projectId !== undefined ? projectId : null
  );
  
  // Загружаем сводку отдельно
  const { data: summary = null, refetch: refetchSummary } = useQuery<ProjectRevenuesSummary | null>({
    queryKey: ['projects', projectId, 'revenues', 'summary'],
    queryFn: async (): Promise<ProjectRevenuesSummary | null> => {
      if (!projectId) return null;
      return projectsApi.getRevenuesSummary(projectId);
    },
    enabled: enabled && projectId !== undefined,
  });

  // Загружаем категории доходов
  const { data: categories = [], refetch: refetchCategories } = useQuery<IncomeCategory[]>({
    queryKey: ['finance', 'income-categories'],
    queryFn: async () => {
      const response = await api.get('/finance/income-categories');
      return response;
    },
    enabled,
  });
  
  // Мутации
  const {
    createRevenue: createMutation,
    updateRevenue: updateMutation,
    deleteRevenue: deleteMutation,
  } = useProjectRevenueMutations(projectId || 0);

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    refetchSummary();
  }, [queryClient, projectId, refetchSummary]);

  /**
   * Создать доход
   */
  const createRevenue = useCallback(async (
    data: CreateProjectRevenueDTO
  ): Promise<ProjectRevenue | null> => {
    try {
      const newRevenue = await createMutation(data);
      invalidateAll();
      return newRevenue as ProjectRevenue;
    } catch (error) {
      console.error('Failed to create revenue:', error);
      return null;
    }
  }, [createMutation, invalidateAll]);

  /**
   * Обновить доход
   */
  const updateRevenue = useCallback(async (
    revenueId: number,
    data: UpdateProjectRevenueDTO
  ): Promise<ProjectRevenue | null> => {
    try {
      const updatedRevenue = await updateMutation({ revenueId, data });
      invalidateAll();
      return updatedRevenue as ProjectRevenue;
    } catch (error) {
      console.error('Failed to update revenue:', error);
      return null;
    }
  }, [updateMutation, invalidateAll]);

  /**
   * Удалить доход
   */
  const deleteRevenue = useCallback(async (revenueId: number): Promise<boolean> => {
    try {
      await deleteMutation(revenueId);
      invalidateAll();
      return true;
    } catch (error) {
      console.error('Failed to delete revenue:', error);
      return false;
    }
  }, [deleteMutation, invalidateAll]);

  /**
   * Отметить доход как полученный
   */
  const markAsReceived = useCallback(async (
    revenueId: number,
    actualDate?: string
  ): Promise<ProjectRevenue | null> => {
    if (!projectId) return null;

    try {
      const result = await projectsApi.markAsReceived(projectId, revenueId, actualDate);
      toast.success(t('projects.revenues.received_success'));
      refetch();
      invalidateAll();
      return result;
    } catch (error) {
      console.error('Failed to mark revenue as received:', error);
      toast.error(t('projects.revenues.received_error'));
      return null;
    }
  }, [projectId, t, refetch, invalidateAll]);

  /**
   * Принудительное обновление
   */
  const refresh = useCallback(() => {
    refetch();
    refetchSummary();
  }, [refetch, refetchSummary]);

  return {
    // Данные
    revenues,
    summary,
    categories,
    isLoading,
    isError,
    
    // CRUD операции
    createRevenue,
    updateRevenue,
    deleteRevenue,
    markAsReceived,
    
    // Состояния
    refresh,
  };
}
