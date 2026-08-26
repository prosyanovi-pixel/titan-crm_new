import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { ResizableSheet, EntityCombobox } from '@/components/shared';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCurrencies } from '@/hooks/useCurrencies';
import { Info, Calendar, DollarSign, ListChecks, Users } from 'lucide-react';
import { api } from '@/lib/api';
import type { ProjectRevenue, ProjectStage, CreateProjectRevenueDTO, IncomeCategory } from '../../../types';
import type { Contractor } from '@/modules/contractors/types';

interface ProjectRevenuesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRevenue: ProjectRevenue | null;
  formData: CreateProjectRevenueDTO;
  setFormData: (data: CreateProjectRevenueDTO) => void;
  handleSave: () => void;
  vatRateOptions: number[];
  stages: ProjectStage[];
  contractors: Contractor[];
  categories: IncomeCategory[];
}

export function ProjectRevenuesSheet({
  open,
  onOpenChange,
  editingRevenue,
  formData,
  setFormData,
  handleSave,
  vatRateOptions,
  stages,
  contractors,
  categories,
}: ProjectRevenuesSheetProps) {
  const { t } = useTranslation();
  const { data: currencies = [] } = useCurrencies();

  const handleContractorChange = async (contractorId: string | number | undefined) => {
    const id = contractorId ? Number(contractorId) : undefined;
    const update: Partial<CreateProjectRevenueDTO> = { contractorId: id };
    
    if (id) {
      const contractor = contractors.find(c => c.id === id);
      if (contractor) {
        // Логика автоматического определения НДС на основе контрагента
        if (contractor.taxRegimeId) {
          try {
            const regime = await api.get(`/finance/settings/tax-regimes/${contractor.taxRegimeId}`);
            if (regime) {
              update.isTaxable = regime.hasVat;
              update.vatRate = regime.defaultVatRate;
            }
          } catch (e) {
            console.warn('Failed to fetch contractor tax regime details');
          }
        } else {
          // Эвристика на основе правовой формы
          const isIndividual = contractor.legalForm === 'private' || contractor.legalForm === 'self';
          if (isIndividual) {
            update.isTaxable = false;
            update.vatRate = 0;
          } else {
            // По умолчанию для ЮЛ - ОСН (НДС 20%)
            update.isTaxable = true;
            update.vatRate = 20;
          }
        }
      }
    }
    
    setFormData({ ...formData, ...update });
  };

  return (
    <ResizableSheet
      open={open}
      onOpenChange={onOpenChange}
      onSave={handleSave}
      saveDisabled={!formData.name || !formData.amount || !formData.plannedDate}
      moduleKey="projects"
      title={editingRevenue 
        ? t('projects.revenues.edit_title', { name: editingRevenue.name })
        : t('projects.revenues.create_title')}
      description={t('projects.revenues.description')}
    >
      <div className="space-y-6 py-4">
        {/* Основная информация */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Info className="w-4 h-4" />
            {t('common.basic_info')}
          </div>
          
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
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('projects.sheet.contractor_label')}</Label>
            <EntityCombobox
              value={formData.contractorId ? String(formData.contractorId) : ''}
              onChange={handleContractorChange}
              options={contractors.map(c => ({ id: String(c.id), label: c.name }))}
              placeholder={t('lost.vyberite_kontragenta')}
              icon={Users}
            />
          </div>
        </div>

        {/* Сумма и НДС */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <DollarSign className="w-4 h-4" />
            {t('common.finance_and_status')}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('projects.revenues.field.amount')} *</Label>
              <MoneyInput
                value={formData.amount}
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
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>
        </div>

        {/* Привязка к этапу и категории */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <ListChecks className="w-4 h-4" />
            {t('projects.stages.title')} / {t('projects.finance.category')}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
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
                  <SelectItem value="none">{t('common.not_selected')}</SelectItem>
                  {stages.map(stage => (
                    <SelectItem key={stage.id} value={String(stage.id)}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>{t('projects.finance.category')}</Label>
              <Select
                value={formData.incomeCategoryId || 'none'}
                onValueChange={(v) => setFormData({ ...formData, incomeCategoryId: v === 'none' ? undefined : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('common.not_selected')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('common.not_selected')}</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Дата */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Calendar className="w-4 h-4" />
            {t('common.date')}
          </div>
          
          <div className="space-y-2">
            <Label>{t('projects.revenues.field.planned_date')} *</Label>
            <DatePicker
              value={formData.plannedDate}
              onChange={(v) => setFormData({ ...formData, plannedDate: v })}
            />
          </div>
        </div>
      </div>
    </ResizableSheet>
  );
}
