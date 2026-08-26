// frontend/src/modules/projects/hooks/usePaymentSchedule.ts
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import { projectsApi } from '../api';
import type {
  PaymentScheduleItem,
  CreatePaymentScheduleItemDTO,
  UpdatePaymentScheduleItemDTO,
  ProjectPaymentScheduleSummary,
} from '../types';

interface UsePaymentScheduleOptions {
  projectId?: number;
  enabled?: boolean;
}

interface UsePaymentScheduleReturn {
  // Данные
  payments: PaymentScheduleItem[];
  summary: ProjectPaymentScheduleSummary | null;
  isLoading: boolean;
  isError: boolean;
  
  // CRUD операции
  loadPayments: () => Promise<void>;
  loadSummary: () => Promise<void>;
  createPayment: (data: CreatePaymentScheduleItemDTO) => Promise<PaymentScheduleItem | null>;
  updatePayment: (paymentId: number, data: UpdatePaymentScheduleItemDTO) => Promise<PaymentScheduleItem | null>;
  deletePayment: (paymentId: number) => Promise<boolean>;
  markAsPaid: (paymentId: number, data?: { paidAmount?: number; paymentDate?: string; paymentReference?: string }) => Promise<PaymentScheduleItem | null>;
  
  // Состояния
  refresh: () => void;
}

/**
 * Хук для управления графиком платежей проекта
 */
export function usePaymentSchedule(options: UsePaymentScheduleOptions = {}): UsePaymentScheduleReturn {
  const { projectId, enabled = true } = options;
  const { t } = useTranslation();
  
  const [payments, setPayments] = useState<PaymentScheduleItem[]>([]);
  const [summary, setSummary] = useState<ProjectPaymentScheduleSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  /**
   * Загрузить все платежи
   */
  const loadPayments = useCallback(async () => {
    if (!projectId) return;

    setIsLoading(true);
    setIsError(false);

    try {
      const response = await projectsApi.getPaymentSchedule(projectId);
      setPayments(response || []);
    } catch (error) {
      console.error('Failed to load payment schedule:', error);
      setIsError(true);
      toast.error(t('projects.payments.error.load'));
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, t]);

  /**
   * Загрузить сводку
   */
  const loadSummary = useCallback(async () => {
    if (!projectId) return;

    try {
      const response = await projectsApi.getPaymentScheduleSummary(projectId);
      setSummary(response || null);
    } catch (error) {
      console.error('Failed to load payment schedule summary:', error);
    }
  }, [projectId]);

  /**
   * Создать платёж
   */
  const createPayment = useCallback(async (
    data: CreatePaymentScheduleItemDTO
  ): Promise<PaymentScheduleItem | null> => {
    if (!projectId) {
      toast.error(t('projects.payments.error.no_project'));
      return null;
    }

    try {
      const response = await projectsApi.createPayment(projectId, data);
      const newPayment = response.data;
      
      setPayments(prev => [...prev, newPayment]);
      loadSummary();
      
      toast.success(t('projects.payments.toast.created'));
      return newPayment;
    } catch (error) {
      console.error('Failed to create payment:', error);
      toast.error(t('projects.payments.error.create'));
      return null;
    }
  }, [projectId, t, loadSummary]);

  /**
   * Обновить платёж
   */
  const updatePayment = useCallback(async (
    paymentId: number,
    data: UpdatePaymentScheduleItemDTO
  ): Promise<PaymentScheduleItem | null> => {
    if (!projectId) return null;

    try {
      const response = await projectsApi.updatePayment(projectId, paymentId, data);
      const updatedPayment = response.data;
      
      setPayments(prev => prev.map(p => p.id === paymentId ? updatedPayment : p));
      loadSummary();
      
      toast.success(t('projects.payments.toast.updated'));
      return updatedPayment;
    } catch (error) {
      console.error('Failed to update payment:', error);
      toast.error(t('projects.payments.error.update'));
      return null;
    }
  }, [projectId, t, loadSummary]);

  /**
   * Удалить платёж
   */
  const deletePayment = useCallback(async (paymentId: number): Promise<boolean> => {
    if (!projectId) return false;

    try {
      await projectsApi.deletePayment(projectId, paymentId);
      setPayments(prev => prev.filter(p => p.id !== paymentId));
      loadSummary();
      
      toast.success(t('projects.payments.toast.deleted'));
      return true;
    } catch (error) {
      console.error('Failed to delete payment:', error);
      toast.error(t('projects.payments.error.delete'));
      return false;
    }
  }, [projectId, t, loadSummary]);

  /**
   * Отметить платёж как оплаченный
   */
  const markAsPaid = useCallback(async (
    paymentId: number,
    data?: { paidAmount?: number; paymentDate?: string; paymentReference?: string }
  ): Promise<PaymentScheduleItem | null> => {
    if (!projectId) return null;

    try {
      const response = await projectsApi.markAsPaid(projectId, paymentId, data);
      const paidPayment = response.data;
      
      setPayments(prev => prev.map(p => p.id === paymentId ? paidPayment : p));
      loadSummary();
      
      toast.success(t('projects.payments.toast.paid'));
      return paidPayment;
    } catch (error) {
      console.error('Failed to mark payment as paid:', error);
      toast.error(t('projects.payments.error.mark_paid'));
      return null;
    }
  }, [projectId, t, loadSummary]);

  /**
   * Принудительное обновление
   */
  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Автозагрузка
  useEffect(() => {
    if (enabled && projectId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadPayments();
      loadSummary();
    }
  }, [enabled, projectId, refreshKey, loadPayments, loadSummary]);

  return {
    // Данные
    payments,
    summary,
    isLoading,
    isError,
    
    // CRUD операции
    loadPayments,
    loadSummary,
    createPayment,
    updatePayment,
    deletePayment,
    markAsPaid,
    
    // Состояния
    refresh,
  };
}
