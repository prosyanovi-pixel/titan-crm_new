// frontend/src/modules/projects/hooks/useProjectStages.ts
import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import { projectsApi } from '../api';
import type {
  ProjectStage,
  CreateProjectStageDTO,
  UpdateProjectStageDTO,
  ProjectStagesSummary,
} from '../types';
import {
  useProjectStages as useProjectStagesQuery,
  useProjectStageMutations,
} from './useProjectQueries';

interface UseProjectStagesOptions {
  projectId?: number;
  enabled?: boolean; // Автозагрузка при монтировании
}

interface UseProjectStagesReturn {
  // Данные
  stages: ProjectStage[];
  summary: ProjectStagesSummary | null;
  isLoading: boolean;
  isError: boolean;
  
  // CRUD операции
  createStage: (data: CreateProjectStageDTO) => Promise<ProjectStage | null>;
  updateStage: (stageId: number, data: UpdateProjectStageDTO) => Promise<ProjectStage | null>;
  deleteStage: (stageId: number) => Promise<boolean>;
  completeStage: (stageId: number, progress?: number) => Promise<ProjectStage | null>;
  reorderStage: (stageId: number, orderIndex: number) => Promise<ProjectStage | null>;
  
  // Загрузка данных (для совместимости)
  loadStages: () => Promise<void>;
  loadSummary: () => Promise<void>;
  
  // Состояния
  refresh: () => void;
}

/**
 * Хук для управления этапами проекта с использованием TanStack Query
 * 
 * @param options - Опции хука (projectId, enabled)
 * @returns Объект с данными, мутациями и состояниями
 * 
 * @example
 * ```typescript
 * const { stages, createStage, updateStage, deleteStage } = useProjectStages({ projectId });
 * ```
 */
export function useProjectStages(options: UseProjectStagesOptions = {}): UseProjectStagesReturn {
  const { projectId, enabled = true } = options;
  const { t } = useTranslation();
  
  // Используем TanStack Query для загрузки этапов
  const { data: stages = [], isLoading, isError, refetch } = useProjectStagesQuery(
    enabled && projectId !== undefined ? projectId : null
  );
  
  // Загружаем сводку отдельно
  const { data: summary = null, refetch: refetchSummary } = useQuery<ProjectStagesSummary | null>({
    queryKey: ['projects', projectId, 'stages', 'summary'],
    queryFn: async (): Promise<ProjectStagesSummary | null> => {
      if (!projectId) return null;
      return projectsApi.getStagesSummary(projectId);
    },
    enabled: enabled && projectId !== undefined,
  });
  
  // Мутации
  const {
    createStage: createMutation,
    updateStage: updateMutation,
    deleteStage: deleteMutation,
    isCreating,
    isUpdating,
    isDeleting,
  } = useProjectStageMutations(projectId || 0);

  /**
   * Создать новый этап
   */
  const createStage = useCallback(async (
    data: CreateProjectStageDTO
  ): Promise<ProjectStage | null> => {
    try {
      const newStage = await createMutation(data);
      refetchSummary();
      return newStage as ProjectStage;
    } catch (error) {
      console.error('Failed to create stage:', error);
      return null;
    }
  }, [createMutation, refetchSummary]);

  /**
   * Обновить этап
   */
  const updateStage = useCallback(async (
    stageId: number,
    data: UpdateProjectStageDTO
  ): Promise<ProjectStage | null> => {
    try {
      const updatedStage = await updateMutation({ stageId, data });
      refetchSummary();
      return updatedStage as ProjectStage;
    } catch (error) {
      console.error('Failed to update stage:', error);
      return null;
    }
  }, [updateMutation, refetchSummary]);

  /**
   * Удалить этап
   */
  const deleteStage = useCallback(async (stageId: number): Promise<boolean> => {
    try {
      await deleteMutation(stageId);
      refetchSummary();
      return true;
    } catch (error) {
      console.error('Failed to delete stage:', error);
      return false;
    }
  }, [deleteMutation, refetchSummary]);

  /**
   * Завершить этап
   */
  const completeStage = useCallback(async (
    stageId: number,
    progress?: number
  ): Promise<ProjectStage | null> => {
    if (!projectId) return null;

    try {
      const stage = await projectsApi.completeStage(projectId, stageId, progress);
      refetch();
      refetchSummary();
      return stage;
    } catch (error) {
      console.error('Failed to complete stage:', error);
      return null;
    }
  }, [projectId, refetch, refetchSummary]);

  /**
   * Переместить этап (изменить порядок)
   */
  const reorderStage = useCallback(async (
    stageId: number,
    orderIndex: number
  ): Promise<ProjectStage | null> => {
    if (!projectId) return null;

    try {
      const stage = await projectsApi.reorderStage(projectId, stageId, orderIndex);
      refetch();
      return stage;
    } catch (error) {
      console.error('Failed to reorder stage:', error);
      return null;
    }
  }, [projectId, refetch]);

  /**
   * Принудительное обновление данных
   */
  const refresh = useCallback(() => {
    refetch();
    refetchSummary();
  }, [refetch, refetchSummary]);

  /**
   * Загрузить этапы (для совместимости)
   */
  const loadStages = useCallback(async (): Promise<void> => {
    refetch();
  }, [refetch]);

  /**
   * Загрузить сводку (для совместимости)
   */
  const loadSummary = useCallback(async (): Promise<void> => {
    refetchSummary();
  }, [refetchSummary]);

  return {
    // Данные
    stages,
    summary: summary as ProjectStagesSummary | null,
    isLoading,
    isError,
    
    // CRUD операции
    createStage,
    updateStage,
    deleteStage,
    completeStage,
    reorderStage,
    
    // Загрузка данных
    loadStages,
    loadSummary,
    
    // Состояния
    refresh,
  };
}
