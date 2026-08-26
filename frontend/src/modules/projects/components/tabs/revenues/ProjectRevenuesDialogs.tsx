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
import type { ProjectRevenue, CreateProjectRevenueDTO, ProjectStage } from '../../../types';

interface ProjectRevenuesDialogsProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  editingRevenue: ProjectRevenue | null;
  formData: CreateProjectRevenueDTO;
  setFormData: (data: CreateProjectRevenueDTO) => void;
  handleSave: () => void;
  vatRateOptions: number[];
  stages?: ProjectStage[];
}

export const ProjectRevenuesDialogs = ({
  isDialogOpen,
  setIsDialogOpen,
  editingRevenue,
  formData,
  setFormData,
  handleSave,
  vatRateOptions,
  stages = [],
}: ProjectRevenuesDialogsProps) => {
  const { t } = useTranslation();
  const { data: currencies = [] } = useCurrencies();

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingRevenue 
              ? t('projects.revenues.edit_title', { name: editingRevenue.name })
              : t('projects.revenues.create_title')}
          </DialogTitle>
          <DialogDescription>
            {t('projects.revenues.description')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>{t('projects.revenues.field.name')} *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('projects.revenues.placeholder.name')}
            />
          </div>
          
          <div className="space-y-2">
            <Label>{t('projects.revenues.field.description')}</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('projects.revenues.placeholder.description')}
              rows={2}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t('projects.revenues.field.amount')} *</Label>
              <MoneyInput
                value={formData.amount || 0}
                onValueChange={(v) => setFormData({ ...formData, amount: v })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t('projects.revenues.field.currency')}</Label>
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
            
            <div className="space-y-2">
              <Label>{t('projects.revenues.field.is_taxable')}</Label>
              <Select
                value={formData.isTaxable ? 'yes' : 'no'}
                onValueChange={(v) => setFormData({ ...formData, isTaxable: v === 'yes' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">{t('common.yes')}</SelectItem>
                  <SelectItem value="no">{t('common.no')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {formData.isTaxable && (
            <div className="space-y-2">
              <Label>{t('projects.revenues.field.vat_rate')}</Label>
              <Select
                value={String(formData.vatRate)}
                onValueChange={(v) => setFormData({ ...formData, vatRate: parseFloat(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Без НДС</SelectItem>
                  {vatRateOptions.filter(r => r > 0).map(rate => (
                    <SelectItem key={rate} value={String(rate)}>{rate}%</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="space-y-2">
            <Label>{t('projects.revenues.field.planned_date')} *</Label>
            <DatePicker
              value={formData.plannedDate}
              onChange={(v) => setFormData({ ...formData, plannedDate: v })}
            />
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
          <Button onClick={handleSave} disabled={!formData.name || !formData.amount || !formData.plannedDate}>
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
