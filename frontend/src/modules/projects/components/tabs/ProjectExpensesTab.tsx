import { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/lib/i18n';
import { useProjectStages } from '../../hooks/useProjectStages';
import { useProjectExpenses } from '../../hooks/useProjectExpenses';
import { useProjectConfirmations } from '../../hooks/useProjectConfirmations';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useDataTable } from '@/hooks/useDataTable';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Receipt, Filter } from 'lucide-react';
import { ProjectExpensesTable } from './expenses/ProjectExpensesTable';
import { ProjectExpensesSheet } from './expenses/ProjectExpensesSheet';
import { ProjectExpensesSummary } from './expenses/ProjectExpensesSummary';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import type { ProjectExpense, CreateProjectExpenseDTO } from '../../types';

interface ProjectExpensesTabProps {
  projectId?: number;
}

export function ProjectExpensesTab({ projectId }: ProjectExpensesTabProps) {
  const { t } = useTranslation();
  const { confirmDeleteExpense } = useProjectConfirmations();

  const table = useDataTable<ProjectExpense>({
    initialData: [],
    initialColumns: {
      name: true,
      category: true,
      amount: true,
      plannedDate: true,
      status: true,
    },
    storageKey: `project-expenses-table-${projectId}`,
  });

  const {
    expenses,
    categories,
    summary,
    isLoading,
    createExpense,
    updateExpense,
    deleteExpense,
    approveExpense,
    markAsPaid,
    loadCategories,
    refresh,
  } = useProjectExpenses({ projectId });

  const { stages } = useProjectStages({ projectId });
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
    staleTime: 24 * 60 * 60 * 1000, // Редко меняются
  });

  // Загружаем категории при монтировании
  useEffect(() => {
    if (projectId) {
      loadCategories();
    }
  }, [projectId, loadCategories]);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ProjectExpense | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [formData, setFormData] = useState<CreateProjectExpenseDTO>({
    name: '',
    amount: 0,
    categoryId: 'materials',
    plannedDate: format(new Date(), 'dd.MM.yyyy'),
    vatRate: 0,
    isTaxable: false,
  });

  const handleOpenCreate = useCallback(() => {
    setEditingExpense(null);
    setFormData({
      name: '',
      amount: 0,
      categoryId: undefined,
      plannedDate: format(new Date(), 'dd.MM.yyyy'),
      vatRate: 0,
      isTaxable: false,
    });
    setIsSheetOpen(true);
  }, []);

  const handleOpenEdit = useCallback((expense: ProjectExpense) => {
    setEditingExpense(expense);
    setFormData({
      name: expense.name,
      amount: expense.amount,
      categoryId: expense.categoryId || undefined,
      plannedDate: expense.plannedDate,
      stageId: expense.stageId,
      vatRate: expense.vatRate || 0,
      isTaxable: expense.isTaxable || false,
    });
    setIsSheetOpen(true);
  }, []);

  const handleSave = async () => {
    if (editingExpense) {
      await updateExpense(editingExpense.id, formData);
    } else {
      await createExpense(formData);
    }
    setIsSheetOpen(false);
  };

  const handleDeleteExpense = async (id: number): Promise<boolean> => {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return false;
    
    const ok = await confirmDeleteExpense(expense);
    if (!ok) return false;
    
    await deleteExpense(id);
    return true;
  };

  const filteredExpenses = expenses.filter(expense => {
    if (categoryFilter !== 'all' && expense.categoryId !== categoryFilter) {
      return false;
    }
    return true;
  });

  if (!projectId) {
    return (
      <EmptyState
        icon={<Receipt className="w-12 h-12" />}
        title={t('projects.expenses.no_project_selected')}
        description={t('projects.expenses.empty')}
        minHeight="h-64"
      />
    );
  }

  if (isLoading && expenses.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <>
        <EmptyState
          icon={<Receipt className="w-12 h-12" />}
          title={t('projects.expenses.empty')}
          description={t('projects.expenses.description')}
          action={
            <Button size="sm" className="gap-2" onClick={handleOpenCreate}>
              <Plus className="w-4 h-4" />
              {t('projects.expenses.add')}
            </Button>
          }
          minHeight="h-64"
        />
        <ProjectExpensesSheet
          open={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          editingExpense={editingExpense}
          formData={formData}
          setFormData={setFormData}
          handleSave={handleSave}
          categories={categories}
          stages={stages}
          vatRateOptions={vatRates}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">{t('projects.tabs.expenses')}</h3>
          <p className="text-xs text-muted-foreground">{t('projects.expenses.description')}</p>
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
            {t('projects.expenses.add')}
          </Button>
        </div>
      </div>

      <ProjectExpensesSummary summary={summary} />

      <ProjectExpensesTable
        expenses={filteredExpenses}
        stages={stages}
        categories={categories}
        createExpense={createExpense}
        updateExpense={updateExpense}
        deleteExpense={handleDeleteExpense}
        approveExpense={approveExpense}
        markAsPaid={markAsPaid}
        onEdit={handleOpenEdit}
        onCreate={handleOpenCreate}
        columnWidths={table.columnWidths}
        onColumnResize={table.setColumnWidth}
      />
      <ProjectExpensesSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        editingExpense={editingExpense}
        formData={formData}
        setFormData={setFormData}
        handleSave={handleSave}
        categories={categories}
        stages={stages}
        vatRateOptions={vatRates}
      />
    </div>
  );
}
