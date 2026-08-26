import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { MoneyInput } from '@/components/ui/MoneyInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCurrencies } from '@/hooks/useCurrencies';
import { CheckCircle2 } from 'lucide-react';
import type { PaymentScheduleItem, CreatePaymentScheduleItemDTO, PaymentMethod, ProjectStage } from '../../../types';

interface PaymentScheduleDialogsProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (v: boolean) => void;
  editingPayment: PaymentScheduleItem | null;
  formData: CreatePaymentScheduleItemDTO;
  setFormData: (data: CreatePaymentScheduleItemDTO) => void;
  handleSave: () => void;
  
  isPaidDialogOpen: boolean;
  setIsPaidDialogOpen: (v: boolean) => void;
  paidData: { paidAmount: number; paymentDate: string; paymentReference: string };
  setPaidData: (data: { paidAmount: number; paymentDate: string; paymentReference: string }) => void;
  handleMarkAsPaid: () => void;
  stages?: ProjectStage[];
}

export const PaymentScheduleDialogs = ({
  isDialogOpen,
  setIsDialogOpen,
  editingPayment,
  formData,
  setFormData,
  handleSave,
  isPaidDialogOpen,
  setIsPaidDialogOpen,
  paidData,
  setPaidData,
  handleMarkAsPaid,
  stages = [],
}: PaymentScheduleDialogsProps) => {
  const { t } = useTranslation();
  const { data: currencies = [] } = useCurrencies();

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPayment 
                ? t('projects.payments.edit_title', { name: editingPayment.name })
                : t('projects.payments.create_title')}
            </DialogTitle>
            <DialogDescription>
              {t('projects.payments.description')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>{t('projects.payments.field.name')} *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('projects.payments.placeholder.name')}
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t('projects.payments.field.description')}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('projects.payments.placeholder.description')}
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('projects.payments.field.amount')} *</Label>
                <MoneyInput
                  value={formData.amount || 0}
                  onValueChange={(v) => setFormData({ ...formData, amount: v })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>{t('projects.payments.field.currency')}</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(v) => setFormData({ ...formData, currency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                  {currencies.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.id}</SelectItem>
                  ))}
                </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('projects.payments.field.due_date')} *</Label>
                <DatePicker
                  value={formData.dueDate}
                  onChange={(v) => setFormData({ ...formData, dueDate: v })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>{t('projects.payments.field.payment_method')}</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(v) => setFormData({ ...formData, paymentMethod: v as PaymentMethod })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">{t('projects.payments.method.bank')}</SelectItem>
                    <SelectItem value="cash">{t('projects.payments.method.cash')}</SelectItem>
                    <SelectItem value="card">{t('projects.payments.method.card')}</SelectItem>
                    <SelectItem value="other">{t('projects.payments.method.other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('projects.stages.title')}</Label>
              <Select
                value={formData.stageId ? String(formData.stageId) : 'none'}
                onValueChange={(v) => setFormData({ ...formData, stageId: v === 'none' ? undefined : parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('projects.stages.no_project_selected')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('lost.bez_etapa')}</SelectItem>
                  {stages.map(stage => (
                    <SelectItem key={stage.id} value={String(stage.id)}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={!formData.name || !formData.amount || !formData.dueDate}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaidDialogOpen} onOpenChange={setIsPaidDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('projects.payments.mark_as_paid')}</DialogTitle>
            <DialogDescription>
              {t('projects.payments.mark_paid_description')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>{t('projects.payments.field.paid_amount')}</Label>
              <MoneyInput
                value={paidData.paidAmount || 0}
                onValueChange={(v) => setPaidData({ ...paidData, paidAmount: v })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t('projects.payments.field.payment_date')}</Label>
              <DatePicker
                value={paidData.paymentDate}
                onChange={(v) => setPaidData({ ...paidData, paymentDate: v })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t('projects.payments.field.payment_reference')}</Label>
              <Input
                value={paidData.paymentReference}
                onChange={(e) => setPaidData({ ...paidData, paymentReference: e.target.value })}
                placeholder={t('projects.payments.placeholder.payment_reference')}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaidDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleMarkAsPaid}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {t('projects.payments.mark_as_paid')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
