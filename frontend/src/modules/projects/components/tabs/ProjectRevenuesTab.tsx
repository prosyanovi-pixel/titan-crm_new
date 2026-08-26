import React, { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/lib/i18n';
import { useProjectRevenues } from '../../hooks/useProjectRevenues';
import { useProjectStages } from '../../hooks/useProjectStages';
import { useContractorsList } from '@/modules/contractors';
import { useProjectConfirmations } from '../../hooks/useProjectConfirmations';
import { EmptyState } from '@/components/ui/empty-state';
import type {
  ProjectRevenue,
  CreateProjectRevenueDTO,
  UpdateProjectRevenueDTO,
} from '../../types';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Wallet, Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectRevenuesTable } from './revenues/ProjectRevenuesTable';
import { ProjectRevenuesSheet } from './revenues/ProjectRevenuesSheet';
import { ProjectRevenuesSummary } from './revenues/ProjectRevenuesSummary';
import { format } from 'date-fns';
import { api } from '@/lib/api';

const DEFAULT_FORM: CreateProjectRevenueDTO = {
  name: '',
  description: '',
  amount: 0,
  currency: 'RUB',
  plannedDate: format(new Date(), 'dd.MM.yyyy'),
  vatRate: 0,
  isTaxable: false,
};

/**
 * Вкладка доходов проекта.
 */
export function ProjectRevenuesTab({ projectId }: { projectId: number }) {
  const { t } = useTranslation();
  const { confirmDeleteRevenue } = useProjectConfirmations();

  const {
    revenues,
    summary,
    isLoading,
    createRevenue,
    updateRevenue,
    deleteRevenue,
    markAsReceived,
    categories,
  } = useProjectRevenues({ projectId });

  const { stages } = useProjectStages({ projectId });
  const { contractors } = useContractorsList();
  // Загружаем глобальные ставки налогов
  const { data: vatRates = [0, 10, 20] } = useQuery({
    queryKey: ['finance-tax-rates'],
    queryFn: async () => {
      const rates = await api.get('/finance/settings/tax-rates');
      if (Array.isArray(rates)) {
        const activeVatRates = rates
          .filter(r => r.taxType === 'vat' && r.isActive)
          .map(r => Number(r.rate));
        
        if (activeVatRates.length > 0) {
          return Array.from(new Set([0, ...activeVatRates])).sort((a, b) => a - b);
        }
      }
      return [0, 10, 20];
    },
    staleTime: 24 * 60 * 60 * 1000,
  });

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<ProjectRevenue | null>(null);
  const [formData, setFormData] = useState<CreateProjectRevenueDTO>(DEFAULT_FORM);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  /** Открыть sheet для добавления нового дохода */
  const handleOpenCreate = useCallback(() => {
    setEditingRevenue(null);
    setFormData(DEFAULT_FORM);
    setIsSheetOpen(true);
  }, []);

  /** Открыть sheet для редактирования */
  const handleOpenEdit = useCallback((revenue: ProjectRevenue) => {
    setEditingRevenue(revenue);
    setFormData({
      name: revenue.name,
      description: revenue.description ?? '',
      amount: revenue.amount,
      currency: revenue.currency,
      plannedDate: revenue.plannedDate,
      vatRate: revenue.vatRate ?? 0,
      isTaxable: revenue.isTaxable || false,
      stageId: revenue.stageId,
      contractorId: revenue.contractorId,
      incomeCategoryId: revenue.incomeCategoryId,
    });
    setIsSheetOpen(true);
  }, []);

  /** Сохранить создание или редактирование */
  const handleSave = async () => {
    if (editingRevenue) {
      await updateRevenue(editingRevenue.id, formData as UpdateProjectRevenueDTO);
    } else {
      await createRevenue({ ...formData, projectId } as CreateProjectRevenueDTO);
    }
    setIsSheetOpen(false);
  };

  /** Обновить поле дохода (например, stageId из таблицы) */
  const handleUpdateRevenue = async (id: number, data: Partial<ProjectRevenue>) => {
    await updateRevenue(id, data as UpdateProjectRevenueDTO);
  };

  /** Отметить доход как полученный */
  const handleMarkAsReceived = async (revenue: ProjectRevenue) => {
    await markAsReceived(revenue.id);
  };

  /** Удалить доход с подтверждением */
  const handleDelete = async (revenue: ProjectRevenue) => {
    const ok = await confirmDeleteRevenue(revenue);
    if (!ok) return;
    
    await deleteRevenue(revenue.id);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  const filteredRevenues = revenues.filter(revenue => {
    if (categoryFilter !== 'all' && revenue.incomeCategoryId !== categoryFilter) {
      return false;
    }
    return true;
  });

  if (revenues.length === 0) {
    return (
      <>
        <EmptyState
          icon={<Wallet className="w-12 h-12" />}
          title={t('projects.revenues.empty')}
          description={t('projects.revenues.description')}
          action={
            <Button size="sm" className="gap-2" onClick={handleOpenCreate}>
              <Plus className="w-4 h-4" />
              {t('projects.revenues.add')}
            </Button>
          }
          minHeight="h-64"
        />

        <ProjectRevenuesSheet
          open={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          editingRevenue={editingRevenue}
          formData={formData}
          setFormData={setFormData}
          handleSave={handleSave}
          vatRateOptions={vatRates}
          stages={stages}
          contractors={contractors}
          categories={categories}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">{t('projects.tabs.revenues')}</h3>
          <p className="text-xs text-muted-foreground">{t('projects.revenues.description')}</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px] h-9">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder={t('common.filter')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="gap-2" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4" />
            {t('projects.revenues.add')}
          </Button>
        </div>
      </div>

      <ProjectRevenuesSummary summary={summary} />

      <ProjectRevenuesTable
        revenues={filteredRevenues}
        stages={stages}
        categories={categories}
        onUpdateRevenue={handleUpdateRevenue}
        onMarkAsReceived={handleMarkAsReceived}
        onOpenEdit={handleOpenEdit}
        onDelete={handleDelete}
      />

      <ProjectRevenuesSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        editingRevenue={editingRevenue}
        formData={formData}
        setFormData={setFormData}
        handleSave={handleSave}
        vatRateOptions={vatRates}
        stages={stages}
        contractors={contractors}
        categories={categories}
      />
    </div>
  );
}
