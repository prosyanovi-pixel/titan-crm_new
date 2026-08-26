// frontend/src/modules/projects/components/tabs/PaymentScheduleTab.tsx
import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { usePaymentSchedule } from '../../hooks/usePaymentSchedule';
import { useProjectStages } from '../../hooks/useProjectStages';
import { useProjectConfirmations } from '../../hooks/useProjectConfirmations';
import { EmptyState } from '@/components/ui/empty-state';
import type {
  PaymentScheduleItem,
  CreatePaymentScheduleItemDTO,
} from '../../types';
import { Button } from '@/components/ui/button';
import { Plus, CalendarClock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PaymentScheduleTable } from './payments/PaymentScheduleTable';
import { PaymentScheduleDialogs } from './payments/PaymentScheduleDialogs';

const DEFAULT_FORM: CreatePaymentScheduleItemDTO = {
  name: '',
  description: '',
  amount: 0,
  currency: 'RUB',
  dueDate: '',
  paymentMethod: 'bank',
};

const DEFAULT_PAID = {
  paidAmount: 0,
  paymentDate: '',
  paymentReference: '',
};

/**
 * Вкладка графика платежей проекта.
 */
export function PaymentScheduleTab({ projectId }: { projectId: number }) {
  const { t } = useTranslation();
  const { confirmDeletePayment } = useProjectConfirmations();

  const {
    payments,
    isLoading,
    createPayment,
    updatePayment,
    deletePayment,
    markAsPaid,
  } = usePaymentSchedule({ projectId });

  const { stages } = useProjectStages({ projectId });

  // --- Диалог создания / редактирования ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentScheduleItem | null>(null);
  const [formData, setFormData] = useState<CreatePaymentScheduleItemDTO>(DEFAULT_FORM);

  // --- Диалог «Отметить как оплачено» ---
  const [isPaidDialogOpen, setIsPaidDialogOpen] = useState(false);
  const [paidTarget, setPaidTarget] = useState<PaymentScheduleItem | null>(null);
  const [paidData, setPaidData] = useState(DEFAULT_PAID);

  /** Открыть диалог для добавления нового платежа */
  const handleAdd = () => {
    setEditingPayment(null);
    setFormData(DEFAULT_FORM);
    setIsDialogOpen(true);
  };

  /** Открыть диалог для редактирования существующего */
  const handleOpenEdit = (payment: PaymentScheduleItem) => {
    setEditingPayment(payment);
    setFormData({
      name: payment.name,
      description: payment.description ?? '',
      amount: payment.amount,
      currency: payment.currency,
      dueDate: payment.dueDate,
      paymentMethod: payment.paymentMethod,
    });
    setIsDialogOpen(true);
  };

  /** Открыть диалог «Отметить как оплачено» */
  const handleOpenPaid = (payment: PaymentScheduleItem) => {
    setPaidTarget(payment);
    setPaidData({ paidAmount: payment.amount, paymentDate: '', paymentReference: '' });
    setIsPaidDialogOpen(true);
  };

  /** Сохранить создание или редактирование */
  const handleSave = async () => {
    if (editingPayment) {
      await updatePayment(editingPayment.id, formData);
    } else {
      await createPayment({ ...formData, projectId } as CreatePaymentScheduleItemDTO);
    }
    setIsDialogOpen(false);
  };

  /** Подтвердить оплату */
  const handleMarkAsPaid = async () => {
    if (!paidTarget) return;
    await markAsPaid(paidTarget.id, {
      paidAmount: paidData.paidAmount,
      paymentDate: paidData.paymentDate,
      paymentReference: paidData.paymentReference,
    });
    setIsPaidDialogOpen(false);
  };

  /** Удалить платёж с подтверждением */
  const handleDelete = async (payment: PaymentScheduleItem) => {
    const ok = await confirmDeletePayment(payment);
    if (!ok) return;
    
    await deletePayment(payment.id);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <EmptyState
        icon={<CalendarClock className="w-12 h-12" />}
        title={t('projects.payments.empty')}
        description={t('projects.payments.description')}
        action={
          <Button size="sm" className="gap-2" onClick={handleAdd}>
            <Plus className="w-4 h-4" />
            {t('projects.payments.add')}
          </Button>
        }
        minHeight="h-64"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">{t('projects.tabs.payments')}</h3>
          <p className="text-xs text-muted-foreground">{t('projects.payments.description')}</p>
        </div>
        <Button size="sm" className="gap-2" onClick={handleAdd}>
          <Plus className="w-4 h-4" />
          {t('projects.payments.add')}
        </Button>
      </div>

      <PaymentScheduleTable
        payments={payments}
        onOpenEdit={handleOpenEdit}
        onOpenPaid={handleOpenPaid}
        onDelete={handleDelete}
      />

      <PaymentScheduleDialogs
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        editingPayment={editingPayment}
        formData={formData}
        setFormData={setFormData}
        handleSave={handleSave}
        isPaidDialogOpen={isPaidDialogOpen}
        setIsPaidDialogOpen={setIsPaidDialogOpen}
        paidData={paidData}
        setPaidData={setPaidData}
        handleMarkAsPaid={handleMarkAsPaid}
        stages={stages}
      />
    </div>
  );
}
