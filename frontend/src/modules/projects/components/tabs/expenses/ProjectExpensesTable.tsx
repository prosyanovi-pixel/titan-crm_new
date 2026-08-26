import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { SortableTableHead } from '@/components/shared/SortableTableHead';
import { InlineEditCell } from '@/components/shared/InlineEditCell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { MoreVertical, Edit2, FileCheck, Trash2, DollarSign, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate, formatMoney } from '../utils';
import type { ProjectExpense, ProjectStage, ExpenseCategory, ExpenseCategoryKey, UpdateProjectExpenseDTO, CreateProjectExpenseDTO } from '../../../types';

interface ProjectExpensesTableProps {
  expenses: ProjectExpense[];
  stages: ProjectStage[];
  categories: ExpenseCategory[];
  createExpense: (data: CreateProjectExpenseDTO) => Promise<ProjectExpense | null>;
  updateExpense: (id: number, data: UpdateProjectExpenseDTO) => Promise<ProjectExpense | null>;
  deleteExpense: (id: number) => Promise<boolean>;
  approveExpense: (id: number) => Promise<ProjectExpense | null>;
  markAsPaid: (id: number, paymentId?: number, actualDate?: string) => Promise<ProjectExpense | null>;
  onEdit: (expense: ProjectExpense) => void;
  onCreate: () => void;
  columnWidths?: Record<string, number>;
  onColumnResize?: (key: string, width: number) => void;
}

export const ProjectExpensesTable = ({
  expenses,
  stages,
  categories,
  createExpense,
  updateExpense,
  deleteExpense,
  approveExpense,
  markAsPaid,
  onEdit,
  onCreate,
  columnWidths,
  onColumnResize,
}: ProjectExpensesTableProps) => {
  const { t } = useTranslation();

  // Получение названия и цвета категории
  const getCategoryName = (categoryId?: string | null, legacyCategory?: string | null) => {
    if (categoryId) {
      const cat = categories.find(c => c.id === categoryId);
      if (cat) return cat.name;
    }
    if (!legacyCategory) return '—';
    return t(`projects.expenses.categories.${legacyCategory}`);
  };

  const getCategoryColor = (categoryId?: string | null, legacyCategory?: string | null) => {
    if (categoryId) {
      const cat = categories.find(c => c.id === categoryId);
      if (cat?.color) return cat.color;
    }
    const colors: Record<string, string> = {
      materials: '#f59e0b',
      labor: '#3b82f6',
      overhead: '#8b5cf6',
      taxes: '#ef4444',
      other: '#6b7280',
    };
    return legacyCategory ? colors[legacyCategory] || colors.other : colors.other;
  };

  // Статус расхода
  const getStatusBadge = (expense: ProjectExpense) => {
    if (expense.isPaid) {
      return (
        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
          {t('projects.expenses.status.paid')}
        </Badge>
      );
    }
    if (expense.isApproved) {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          {t('projects.expenses.status.approved')}
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        {t('projects.expenses.status.pending')}
      </Badge>
    );
  };

  return (
    <>
      <div className="border rounded-lg overflow-hidden bg-background">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[60px] text-center font-bold">№</TableHead>
              <SortableTableHead
                label={t('projects.stages.title')}
                width={columnWidths?.stageId}
                onResize={(w) => onColumnResize?.('stageId', w)}
                className="w-[150px]"
                onSort={() => {}}
                direction={null}
              />
              <SortableTableHead
                label={t('projects.expenses.field.name')}
                width={columnWidths?.name}
                onResize={(w) => onColumnResize?.('name', w)}
                className="min-w-[200px]"
                onSort={() => {}}
                direction={null}
              />
              <SortableTableHead
                label={t('projects.expenses.table.category')}
                width={columnWidths?.category}
                onResize={(w) => onColumnResize?.('category', w)}
                className="w-[180px]"
                onSort={() => {}}
                direction={null}
              />
              <SortableTableHead
                label={t('projects.revenues.field.vat_rate')}
                width={columnWidths?.vat}
                onResize={(w) => onColumnResize?.('vat', w)}
                className="w-[100px]"
                onSort={() => {}}
                direction={null}
              />
              <SortableTableHead
                label={t('projects.expenses.table.amount')}
                width={columnWidths?.amount}
                onResize={(w) => onColumnResize?.('amount', w)}
                className="w-[140px]"
                onSort={() => {}}
                direction={null}
              />
              <SortableTableHead
                label={t('projects.expenses.field.planned_date')}
                width={columnWidths?.plannedDate}
                onResize={(w) => onColumnResize?.('plannedDate', w)}
                className="w-[150px]"
                onSort={() => {}}
                direction={null}
              />
              <SortableTableHead
                label={t('projects.expenses.table.status')}
                width={columnWidths?.status}
                onResize={(w) => onColumnResize?.('status', w)}
                className="w-[120px]"
                onSort={() => {}}
                direction={null}
              />
              <TableHead className="w-[80px] text-right font-bold pr-6">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p>{t('projects.expenses.empty')}</p>
                    <Button variant="outline" size="sm" onClick={onCreate} className="mt-2">
                      <Plus className="w-4 h-4 mr-2" />
                      {t('projects.expenses.add')}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense, index) => {
                const stage = stages.find(s => s.id === expense.stageId);
                
                return (
                  <TableRow
                    key={expense.id}
                    className={cn(
                      "hover:bg-muted/50 transition-colors",
                      expense.isPaid && 'bg-green-50/30 dark:bg-green-950/10',
                      expense.isApproved && !expense.isPaid && 'bg-blue-50/30 dark:bg-blue-950/10'
                    )}
                  >
                    <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                    
                    <TableCell>
                      <InlineEditCell
                        value={expense.stageId || null}
                        inputType="select"
                        options={[
                          { label: t('common.not_selected'), value: 'none' },
                          ...stages.map(s => ({ label: s.name, value: String(s.id) }))
                        ]}
                        onSave={(val) => updateExpense(expense.id, { stageId: val === 'none' ? undefined : parseInt(val) })}
                      />
                    </TableCell>

                    <TableCell className="font-semibold text-sm">
                      <InlineEditCell
                        value={expense.name}
                        inputType="text"
                        onSave={(val) => updateExpense(expense.id, { name: val })}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getCategoryColor(expense.categoryId, expense.category) }} />
                        <InlineEditCell
                          value={expense.categoryId || expense.category || null}
                          inputType="select"
                          options={[
                            { label: t('common.not_selected'), value: 'none' },
                            ...categories.map(c => ({ label: c.name, value: c.id }))
                          ]}
                          onSave={(val) => updateExpense(expense.id, { categoryId: val === 'none' ? undefined : val, category: val === 'none' ? undefined : val })}
                        />
                      </div>
                    </TableCell>

                    <TableCell>
                      {expense.isTaxable && expense.vatRate ? (
                        <Badge variant="secondary" className="font-medium bg-blue-100/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {expense.vatRate}%
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground uppercase">{t('lost.bez_nds')}</span>
                      )}
                    </TableCell>
                    
                    <TableCell className="font-mono font-bold">
                      <InlineEditCell
                        value={expense.amount}
                        inputType="money"
                        onSave={(val) => updateExpense(expense.id, { amount: val })}
                      />
                    </TableCell>
                    
                    <TableCell className="text-xs">
                      <InlineEditCell
                        value={expense.plannedDate ? expense.plannedDate.split('.').reverse().join('-') : null}
                        inputType="date"
                        onSave={(val) => {
                          if (val) {
                            const date = new Date(val);
                            updateExpense(expense.id, { plannedDate: format(date, 'dd.MM.yyyy') });
                          }
                        }}
                      />
                      {expense.actualDate && (
                        <div className="text-[10px] text-green-600 dark:text-green-500 font-medium mt-0.5">
                           ✓ {formatDate(expense.actualDate)}
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <InlineEditCell
                        value={expense.isPaid ? 'paid' : expense.isApproved ? 'approved' : 'pending'}
                        inputType="select"
                        options={[
                          { label: t('projects.expenses.status.pending'), value: 'pending' },
                          { label: t('projects.expenses.status.approved'), value: 'approved' },
                          { label: t('projects.expenses.status.paid'), value: 'paid' },
                        ]}
                        onSave={(val) => {
                          if (val === 'pending') {
                            updateExpense(expense.id, { isApproved: false, isPaid: false });
                          } else if (val === 'approved') {
                            approveExpense(expense.id);
                          } else if (val === 'paid') {
                            markAsPaid(expense.id);
                          }
                        }}
                      />
                    </TableCell>
                    
                    <TableCell className="pr-6" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => onEdit(expense)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            {!expense.isPaid && (
                               <>
                                {!expense.isApproved && (
                                  <DropdownMenuItem onClick={() => approveExpense(expense.id)}>
                                    <FileCheck className="w-4 h-4 mr-2" />
                                    {t('projects.expenses.actions.approve')}
                                  </DropdownMenuItem>
                                )}
                                {expense.isApproved && (
                                  <DropdownMenuItem onClick={() => markAsPaid(expense.id)}>
                                    <DollarSign className="w-4 h-4 mr-2" />
                                    {t('projects.expenses.actions.mark_paid')}
                                  </DropdownMenuItem>
                                )}
                               </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => deleteExpense(expense.id)}
                              className="text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {t('projects.expenses.actions.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
          {expenses.length > 0 && (
            <TableFooter>
              <TableRow className="bg-muted/20 font-bold">
                <TableCell colSpan={5} className="text-right uppercase tracking-wider text-[10px] text-muted-foreground">
                  {t('common.total')}
                </TableCell>
                <TableCell className="font-mono text-base">
                  {formatMoney(expenses.reduce((sum, e) => sum + (parseFloat(String(e.amount)) || 0), 0))}
                </TableCell>
                <TableCell colSpan={3}></TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={onCreate} className="gap-2 shadow-sm">
          <Plus className="w-4 h-4" />
          {t('projects.expenses.add')}
        </Button>
      </div>
    </>
  );
};
