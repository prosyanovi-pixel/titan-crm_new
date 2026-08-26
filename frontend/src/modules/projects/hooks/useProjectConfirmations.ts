// frontend/src/modules/projects/hooks/useProjectConfirmations.ts
import { useTranslation } from '@/lib/i18n';
import { useConfirm } from '@/components/ui/confirm-dialog';
import type { ProjectStage, ProjectRevenue, ProjectExpense, PaymentScheduleItem } from '../types';

interface UseProjectConfirmationsReturn {
  confirmDeleteStage: (stage: ProjectStage) => Promise<boolean>;
  confirmDeleteRevenue: (revenue: ProjectRevenue) => Promise<boolean>;
  confirmDeleteExpense: (expense: ProjectExpense) => Promise<boolean>;
  confirmDeletePayment: (payment: PaymentScheduleItem) => Promise<boolean>;
  confirmCompleteStage: (stage: ProjectStage, unfinishedTasksCount?: number) => Promise<boolean>;
}

/**
 * Хук для confirm диалогов в модуле проектов
 * 
 * Предоставляет единообразные подтверждения для критических операций:
 * - Удаление этапа
 * - Удаление дохода
 * - Удаление расхода
 * - Удаление платежа
 * - Завершение этапа с незавершёнными задачами
 * 
 * @returns Объект с функциями подтверждения
 * 
 * @example
 * ```typescript
 * const { confirmDeleteStage, confirmDeleteRevenue } = useProjectConfirmations();
 * 
 * const handleDelete = async (stage: ProjectStage) => {
 *   const ok = await confirmDeleteStage(stage);
 *   if (!ok) return;
 *   await deleteStage(stage.id);
 * };
 * ```
 */
export function useProjectConfirmations(): UseProjectConfirmationsReturn {
  const { t } = useTranslation();
  const { confirm } = useConfirm();

  /**
   * Подтверждение удаления этапа
   */
  const confirmDeleteStage = async (stage: ProjectStage): Promise<boolean> => {
    const ok = await confirm({
      title: t('common.confirm_deletion'),
      description: t('projects.stages.confirm_delete', { name: stage.name }),
      variant: 'destructive',
    });
    return ok;
  };

  /**
   * Подтверждение удаления дохода
   */
  const confirmDeleteRevenue = async (revenue: ProjectRevenue): Promise<boolean> => {
    const ok = await confirm({
      title: t('common.confirm_deletion'),
      description: t('projects.revenues.confirm_delete', { name: revenue.name }),
      variant: 'destructive',
    });
    return ok;
  };

  /**
   * Подтверждение удаления расхода
   */
  const confirmDeleteExpense = async (expense: ProjectExpense): Promise<boolean> => {
    const ok = await confirm({
      title: t('common.confirm_deletion'),
      description: t('projects.expenses.confirm_delete', { name: expense.name }),
      variant: 'destructive',
    });
    return ok;
  };

  /**
   * Подтверждение удаления платежа
   */
  const confirmDeletePayment = async (payment: PaymentScheduleItem): Promise<boolean> => {
    const ok = await confirm({
      title: t('common.confirm_deletion'),
      description: t('projects.payments.confirm_delete', { name: payment.name }),
      variant: 'destructive',
    });
    return ok;
  };

  /**
   * Подтверждение завершения этапа с незавершёнными задачами
   */
  const confirmCompleteStage = async (
    stage: ProjectStage,
    unfinishedTasksCount?: number
  ): Promise<boolean> => {
    if (!unfinishedTasksCount || unfinishedTasksCount === 0) {
      return true;
    }

    const ok = await confirm({
      title: t('common.confirm_action'),
      description: t('projects.stages.error.unfinished_tasks', { count: unfinishedTasksCount }),
      variant: 'destructive',
    });
    return ok;
  };

  return {
    confirmDeleteStage,
    confirmDeleteRevenue,
    confirmDeleteExpense,
    confirmDeletePayment,
    confirmCompleteStage,
  };
}
