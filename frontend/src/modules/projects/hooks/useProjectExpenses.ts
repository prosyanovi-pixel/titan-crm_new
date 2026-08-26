// frontend/src/modules/projects/hooks/useProjectExpenses.ts
import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import { api } from '@/lib/api';
import type {
  ProjectExpense,
  CreateProjectExpenseDTO,
  UpdateProjectExpenseDTO,
  ProjectExpensesSummary,
  ExpenseCategory,
} from '../types';
import {
  useProjectExpenses as useProjectExpensesQuery,
  useProjectExpenseMutations,
} from './useProjectQueries';
import { projectsApi } from '../api/projects.api';

interface UseProjectExpensesOptions {
  projectId?: number;
  enabled?: boolean;
}

interface UseProjectExpensesReturn {
  // Данные
  expenses: ProjectExpense[];
  categories: ExpenseCategory[];
  summary: ProjectExpensesSummary | null;
  isLoading: boolean;
  isError: boolean;
  
  // CRUD операции
  loadCategories: () => Promise<void>;
  createExpense: (data: CreateProjectExpenseDTO) => Promise<ProjectExpense | null>;
  updateExpense: (expenseId: number, data: UpdateProjectExpenseDTO) => Promise<ProjectExpense | null>;
  deleteExpense: (expenseId: number) => Promise<boolean>;
  approveExpense: (expenseId: number) => Promise<ProjectExpense | null>;
  markAsPaid: (expenseId: number, paymentId?: number, actualDate?: string) => Promise<ProjectExpense | null>;
  
  // Состояния
  refresh: () => void;
}

/**
 * Хук для управления расходами проекта с использованием TanStack Query
 */
export function useProjectExpenses(options: UseProjectExpensesOptions = {}): UseProjectExpensesReturn {
  const { projectId, enabled = true } = options;
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  // Используем TanStack Query для загрузки расходов
  const { data: expenses = [], isLoading, isError, refetch } = useProjectExpensesQuery(
    enabled && projectId !== undefined ? projectId : null
  );
  
  // Загружаем категории отдельно
  const { data: categories = [] } = useQuery<ExpenseCategory[]>({
    queryKey: ['finance', 'expense-categories'],
    queryFn: async () => {
      const response = await api.get('/finance/categories?kind=expense');
      return Array.isArray(response) ? response : (response.data || []);
    },
  });
  
  // Загружаем сводку отдельно
  const { data: summary = null, refetch: refetchSummary } = useQuery<ProjectExpensesSummary | null>({
    queryKey: ['projects', projectId, 'expenses', 'summary'],
    queryFn: async (): Promise<ProjectExpensesSummary | null> => {
      if (!projectId) return null;
      return projectsApi.getProjectExpensesSummary(projectId);
    },
    enabled: enabled && projectId !== undefined,
  });
  
  // Мутации
  const {
    createExpense: createMutation,
    updateExpense: updateMutation,
    deleteExpense: deleteMutation,
  } = useProjectExpenseMutations(projectId || 0);

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    refetchSummary();
  }, [queryClient, projectId, refetchSummary]);

  /**
   * Загрузить категории расходов из Finance
   */
  const loadCategories = useCallback(async () => {
    // Категории загружаются через useQuery автоматически
  }, []);

  /**
   * Создать расход
   */
  const createExpense = useCallback(async (
    data: CreateProjectExpenseDTO
  ): Promise<ProjectExpense | null> => {
    try {
      const newExpense = await createMutation(data);
      invalidateAll();
      return newExpense as ProjectExpense;
    } catch (error) {
      console.error('Failed to create expense:', error);
      return null;
    }
  }, [createMutation, invalidateAll]);

  /**
   * Обновить расход
   */
  const updateExpense = useCallback(async (
    expenseId: number,
    data: UpdateProjectExpenseDTO
  ): Promise<ProjectExpense | null> => {
    try {
      const updatedExpense = await updateMutation({ expenseId, data });
      invalidateAll();
      return updatedExpense as ProjectExpense;
    } catch (error) {
      console.error('Failed to update expense:', error);
      return null;
    }
  }, [updateMutation, invalidateAll]);

  /**
   * Удалить расход
   */
  const deleteExpense = useCallback(async (expenseId: number): Promise<boolean> => {
    try {
      await deleteMutation(expenseId);
      invalidateAll();
      return true;
    } catch (error) {
      console.error('Failed to delete expense:', error);
      return false;
    }
  }, [deleteMutation, invalidateAll]);

  /**
   * Утвердить расход
   */
  const approveExpense = useCallback(async (
    expenseId: number
  ): Promise<ProjectExpense | null> => {
    if (!projectId) return null;

    try {
      const result = await projectsApi.approveExpense(projectId, expenseId);
      toast.success(t('projects.expenses.approve_success'));
      refetch();
      invalidateAll();
      return result;
    } catch (error) {
      console.error('Failed to approve expense:', error);
      toast.error(t('projects.expenses.approve_error'));
      return null;
    }
  }, [projectId, t, refetch, invalidateAll]);

  /**
   * Отметить расход как оплаченный
   */
  const markAsPaid = useCallback(async (
    expenseId: number,
    paymentId?: number,
    actualDate?: string
  ): Promise<ProjectExpense | null> => {
    if (!projectId) return null;

    try {
      const result = await projectsApi.markExpensePaid(projectId, expenseId, paymentId, actualDate);
      toast.success(t('projects.expenses.paid_success'));
      refetch();
      invalidateAll();
      return result;
    } catch (error) {
      console.error('Failed to mark expense as paid:', error);
      toast.error(t('projects.expenses.paid_error'));
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
    expenses,
    categories,
    summary,
    isLoading,
    isError,
    
    // CRUD операции
    loadCategories,
    createExpense,
    updateExpense,
    deleteExpense,
    approveExpense,
    markAsPaid,
    
    // Состояния
    refresh,
  };
}
