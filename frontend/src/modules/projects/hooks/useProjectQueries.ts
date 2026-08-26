// frontend/src/modules/projects/hooks/useProjectQueries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import { projectsApi } from '../api/projects.api';
import type {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectStage,
  CreateProjectStageDTO,
  UpdateProjectStageDTO,
  ProjectRevenue,
  CreateProjectRevenueDTO,
  UpdateProjectRevenueDTO,
  ProjectExpense,
  CreateProjectExpenseDTO,
  UpdateProjectExpenseDTO,
  PaymentScheduleItem,
  CreatePaymentScheduleItemDTO,
  UpdatePaymentScheduleItemDTO,
} from '../types';

/**
 * Вспомогательная функция для показа toast уведомлений
 */
function showToast(
  t: ReturnType<typeof useTranslation>['t'],
  type: 'success' | 'error',
  entity: 'project' | 'stage' | 'revenue' | 'expense' | 'payment' | 'task',
  action: 'created' | 'updated' | 'deleted' | 'saved' | 'create' | 'update' | 'delete'
) {
  const entityKey = t(`projects.toasts.entities.${entity}`);
  const message = t(`projects.toasts.${type}.${action}`, { entity: entityKey });
  
  if (type === 'success') {
    toast.success(message);
  } else {
    toast.error(message);
  }
}

/**
 * Хук для получения списка всех проектов
 * 
 * @example
 * ```typescript
 * const { data: projects, isLoading, error } = useProjectsList();
 * ```
 */
export function useProjectsList() {
  const { t } = useTranslation();
  
  return useQuery<Project[]>({
    queryKey: ['projects', 'list'],
    queryFn: async () => {
      const response = await projectsApi.getAll();
      return response as Project[];
    },
    staleTime: 5 * 60 * 1000, // 5 минут
    retry: 2,
  });
}

/**
 * Хук для получения проекта по ID
 * 
 * @param projectId - ID проекта
 * @param enabled - Флаг включения запроса (по умолчанию true)
 * 
 * @example
 * ```typescript
 * const { data: project, isLoading } = useProjectById(123);
 * ```
 */
export function useProjectById(projectId: number | null, enabled: boolean = true) {
  return useQuery<Project | null>({
    queryKey: ['projects', 'byId', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const response = await projectsApi.getById(projectId);
      return response as Project;
    },
    enabled: enabled && projectId !== null,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Хук для мутаций проектов (создание, обновление, удаление)
 * 
 * @example
 * ```typescript
 * const { createProject, updateProject, deleteProject } = useProjectMutations();
 * 
 * // Создать проект
 * await createProject(projectData);
 * 
 * // Обновить проект
 * await updateProject({ id: 123, ...updates });
 * 
 * // Удалить проект
 * await deleteProject(123);
 * ```
 */
export function useProjectMutations() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateProjectRequest) => projectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast(t, 'success', 'project', 'created');
    },
    onError: () => {
      showToast(t, 'error', 'project', 'create');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProjectRequest }) =>
      projectsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast(t, 'success', 'project', 'updated');
    },
    onError: () => {
      showToast(t, 'error', 'project', 'update');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => projectsApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      const entityKey = t('projects.toasts.entities.project');
      const message = t('projects.toasts.success.deleted', { entity: entityKey });
      
      toast.success(message, {
        action: {
          label: t('common.actions.undo'),
          onClick: () => {
            // Restore item
            fetch(`/api/trash/projects/${id}/restore`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'x-user-id': localStorage.getItem('user_id') || ''
              }
            }).then(() => {
              queryClient.invalidateQueries({ queryKey: ['projects'] });
              toast.success(t('common.messages.restored'));
            }).catch(() => {
              toast.error(t('common.errors.general'));
            });
          }
        }
      });
    },
    onError: () => {
      showToast(t, 'error', 'project', 'delete');
    },
  });

  return {
    createProject: createMutation.mutateAsync,
    updateProject: updateMutation.mutateAsync,
    deleteProject: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Хук для получения этапов проекта
 * 
 * @param projectId - ID проекта
 * 
 * @example
 * ```typescript
 * const { data: stages, isLoading } = useProjectStages(projectId);
 * ```
 */
export function useProjectStages(projectId: number | null) {
  return useQuery<ProjectStage[]>({
    queryKey: ['projects', projectId, 'stages'],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await projectsApi.getStages(projectId);
      return response as ProjectStage[];
    },
    enabled: projectId !== null,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Хук для мутаций этапов проекта
 */
export function useProjectStageMutations(projectId: number) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateProjectStageDTO) =>
      projectsApi.createStage(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'stages'] });
      showToast(t, 'success', 'stage', 'created');
    },
    onError: () => {
      showToast(t, 'error', 'stage', 'create');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ stageId, data }: { stageId: number; data: UpdateProjectStageDTO }) =>
      projectsApi.updateStage(projectId, stageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'stages'] });
      showToast(t, 'success', 'stage', 'updated');
    },
    onError: () => {
      showToast(t, 'error', 'stage', 'update');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (stageId: number) =>
      projectsApi.deleteStage(projectId, stageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'stages'] });
      showToast(t, 'success', 'stage', 'deleted');
    },
    onError: () => {
      showToast(t, 'error', 'stage', 'delete');
    },
  });

  return {
    createStage: createMutation.mutateAsync,
    updateStage: updateMutation.mutateAsync,
    deleteStage: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Хук для получения доходов проекта
 */
export function useProjectRevenues(projectId: number | null) {
  return useQuery<ProjectRevenue[]>({
    queryKey: ['projects', projectId, 'revenues'],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await projectsApi.getRevenues(projectId);
      return response as ProjectRevenue[];
    },
    enabled: projectId !== null,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Хук для получения P&L отчёта проекта
 */
export function useProjectPnL(projectId: number | null) {
  return useQuery({
    queryKey: ['projects', projectId, 'pnl'],
    queryFn: async () => {
      if (!projectId) return null;
      const response = await projectsApi.getPnL(projectId);
      console.log('getPnL response:', response);
      if (response === undefined) {
          console.error('getPnL returned undefined!');
          return null;
      }
      return response;
    },
    enabled: projectId !== null,
    staleTime: 60 * 1000, // 1 минута
  });
}

/**
 * Хук для мутаций доходов проекта
 */
export function useProjectRevenueMutations(projectId: number) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateProjectRevenueDTO) =>
      projectsApi.createRevenue(projectId, data),
    onSuccess: () => {
      invalidate();
      showToast(t, 'success', 'revenue', 'created');
    },
    onError: () => {
      showToast(t, 'error', 'revenue', 'create');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ revenueId, data }: { revenueId: number; data: UpdateProjectRevenueDTO }) =>
      projectsApi.updateRevenue(projectId, revenueId, data),
    onSuccess: () => {
      invalidate();
      showToast(t, 'success', 'revenue', 'updated');
    },
    onError: () => {
      showToast(t, 'error', 'revenue', 'update');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (revenueId: number) =>
      projectsApi.deleteRevenue(projectId, revenueId),
    onSuccess: () => {
      invalidate();
      showToast(t, 'success', 'revenue', 'deleted');
    },
    onError: () => {
      showToast(t, 'error', 'revenue', 'delete');
    },
  });

  return {
    createRevenue: createMutation.mutateAsync,
    updateRevenue: updateMutation.mutateAsync,
    deleteRevenue: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Хук для получения расходов проекта
 */
export function useProjectExpenses(projectId: number | null) {
  return useQuery<ProjectExpense[]>({
    queryKey: ['projects', projectId, 'expenses'],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await projectsApi.getProjectExpenses(projectId);
      return response as ProjectExpense[];
    },
    enabled: projectId !== null,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Хук для получения данных для графика расходов
 */
export function useProjectExpensesChart(projectId: number | null) {
  return useQuery<{ name: string; value: number }[]>({
    queryKey: ['projects', projectId, 'expenses', 'chart'],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await projectsApi.getProjectExpensesChart(projectId);
      return response as { name: string; value: number }[];
    },
    enabled: projectId !== null,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Хук для мутаций расходов проекта
 */
export function useProjectExpenseMutations(projectId: number) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateProjectExpenseDTO) =>
      projectsApi.createExpense(projectId, data),
    onSuccess: () => {
      invalidate();
      showToast(t, 'success', 'expense', 'created');
    },
    onError: () => {
      showToast(t, 'error', 'expense', 'create');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ expenseId, data }: { expenseId: number; data: UpdateProjectExpenseDTO }) =>
      projectsApi.updateExpense(projectId, expenseId, data),
    onSuccess: () => {
      invalidate();
      showToast(t, 'success', 'expense', 'updated');
    },
    onError: () => {
      showToast(t, 'error', 'expense', 'update');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (expenseId: number) =>
      projectsApi.deleteExpense(projectId, expenseId),
    onSuccess: () => {
      invalidate();
      showToast(t, 'success', 'expense', 'deleted');
    },
    onError: () => {
      showToast(t, 'error', 'expense', 'delete');
    },
  });

  return {
    createExpense: createMutation.mutateAsync,
    updateExpense: updateMutation.mutateAsync,
    deleteExpense: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Хук для получения графика платежей проекта
 */
export function useProjectPaymentSchedule(projectId: number | null) {
  return useQuery<PaymentScheduleItem[]>({
    queryKey: ['projects', projectId, 'payments'],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await projectsApi.getPaymentSchedule(projectId);
      return response as PaymentScheduleItem[];
    },
    enabled: projectId !== null,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Хук для мутаций графика платежей проекта
 */
export function useProjectPaymentMutations(projectId: number) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreatePaymentScheduleItemDTO) =>
      projectsApi.createPayment(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'payments'] });
      showToast(t, 'success', 'payment', 'created');
    },
    onError: () => {
      showToast(t, 'error', 'payment', 'create');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ paymentId, data }: { paymentId: number; data: UpdatePaymentScheduleItemDTO }) =>
      projectsApi.updatePayment(projectId, paymentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'payments'] });
      showToast(t, 'success', 'payment', 'updated');
    },
    onError: () => {
      showToast(t, 'error', 'payment', 'update');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (paymentId: number) =>
      projectsApi.deletePayment(projectId, paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'payments'] });
      showToast(t, 'success', 'payment', 'deleted');
    },
    onError: () => {
      showToast(t, 'error', 'payment', 'delete');
    },
  });

  return {
    createPayment: createMutation.mutateAsync,
    updatePayment: updateMutation.mutateAsync,
    deletePayment: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
