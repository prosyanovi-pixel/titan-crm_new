import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { ResizableSheet } from '@/components/shared';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Info, Calendar, DollarSign, ListChecks } from 'lucide-react';
import type { ProjectExpense, ProjectStage, ExpenseCategory, CreateProjectExpenseDTO, ExpenseCategoryKey } from '../../../types';

interface ProjectExpensesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingExpense: ProjectExpense | null;
  formData: CreateProjectExpenseDTO;
  setFormData: (data: CreateProjectExpenseDTO) => void;
  handleSave: () => void;
  categories: ExpenseCategory[];
  stages: ProjectStage[];
  vatRateOptions: number[];
}

export function ProjectExpensesSheet({
  open,
  onOpenChange,
  editingExpense,
  formData,
  setFormData,
  handleSave,
  categories,
  stages,
  vatRateOptions,
}: ProjectExpensesSheetProps) {
  const { t } = useTranslation();

  return (
    <ResizableSheet
      open={open}
      onOpenChange={onOpenChange}
      onSave={handleSave}
      saveDisabled={!formData.name || !formData.amount || !formData.plannedDate}
      moduleKey="project-expense-sheet"
      title={editingExpense 
        ? t('projects.expenses.edit_title', { name: editingExpense.name })
        : t('projects.expenses.create_title')}
      description={t('projects.expenses.description')}
    >
      <div className="space-y-6 py-4">
        {/* Основная информация */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Info className="w-4 h-4" />
            {t('common.basic_info')}
          </div>
          
          <div className="space-y-2">
            <Label>{t('projects.expenses.field.name')} *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('projects.expenses.placeholder.name')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('projects.expenses.table.category')} *</Label>
              <Select
                value={formData.categoryId || formData.category || 'none'}
                onValueChange={(v) => setFormData({ ...formData, categoryId: v === 'none' ? undefined : v, category: v === 'none' ? undefined : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('common.not_selected')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('common.not_selected')}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('projects.expenses.table.amount')} *</Label>
              <MoneyInput
                value={formData.amount}
                onValueChange={(v) => setFormData({ ...formData, amount: v })}
              />
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
                  value={String(formData.vatRate || 0)}
                  onValueChange={(v) => setFormData({ ...formData, vatRate: parseFloat(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">{t('lost.bez_nds')}</SelectItem>
                    {vatRateOptions.filter(rate => rate > 0).map(rate => (
                      <SelectItem key={rate} value={String(rate)}>{rate}%</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Привязка к этапу */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <ListChecks className="w-4 h-4" />
            {t('projects.stages.title')}
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
                <SelectItem value="none">{t('common.not_selected')}</SelectItem>
                {stages.map(stage => (
                  <SelectItem key={stage.id} value={String(stage.id)}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Дата */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Calendar className="w-4 h-4" />
            {t('common.date')}
          </div>
          
          <div className="space-y-2">
            <Label>{t('projects.expenses.field.planned_date')} *</Label>
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
