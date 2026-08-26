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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { MoreVertical, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate, formatMoney } from '../utils';
import type { ProjectRevenue, ProjectStage, UpdateProjectRevenueDTO, IncomeCategory } from '../../../types';

interface ProjectRevenuesTableProps {
  revenues: ProjectRevenue[];
  stages: ProjectStage[];
  categories: IncomeCategory[];
  onUpdateRevenue: (id: number, data: UpdateProjectRevenueDTO) => void;
  onMarkAsReceived: (revenue: ProjectRevenue) => void;
  onOpenEdit: (revenue: ProjectRevenue) => void;
  onDelete: (revenue: ProjectRevenue) => void;
  columnWidths?: Record<string, number>;
  onColumnResize?: (key: string, width: number) => void;
}

export const ProjectRevenuesTable = ({
  revenues,
  stages,
  categories,
  onUpdateRevenue,
  onMarkAsReceived,
  onOpenEdit,
  onDelete,
  columnWidths,
  onColumnResize,
}: ProjectRevenuesTableProps) => {
  const { t } = useTranslation();

  const getPaymentDelay = (plannedDate?: string, actualDate?: string) => {
    if (!plannedDate || !actualDate) return null;
    try {
      const [dayP, monthP, yearP] = plannedDate.split('.');
      const planned = new Date(parseInt(yearP), parseInt(monthP) - 1, parseInt(dayP));
      const [dayA, monthA, yearA] = actualDate.split('.');
      const actual = new Date(parseInt(yearA), parseInt(monthA) - 1, parseInt(dayA));
      const diffTime = actual.getTime() - planned.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : null;
    } catch {
      return null;
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[60px] text-center font-bold">№</TableHead>
              <SortableTableHead
                label={t('projects.stages.title')}
                width={columnWidths?.stage}
                onResize={(w) => onColumnResize?.('stage', w)}
                className="w-[150px]"
                onSort={() => {}}
                direction={null}
              />
              <SortableTableHead
                label={t('projects.revenues.field.name')}
                width={columnWidths?.invoice}
                onResize={(w) => onColumnResize?.('invoice', w)}
                className="min-w-[200px]"
                onSort={() => {}}
                direction={null}
              />
              <SortableTableHead
                label={t('projects.finance.category')}
                width={columnWidths?.category}
                onResize={(w) => onColumnResize?.('category', w)}
                className="w-[150px]"
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
                label={t('projects.revenues.table.amount')}
                width={columnWidths?.amount}
                onResize={(w) => onColumnResize?.('amount', w)}
                className="w-[140px]"
                onSort={() => {}}
                direction={null}
              />
              <SortableTableHead
                label={t('projects.revenues.field.planned_date')}
                width={columnWidths?.plannedDate}
                onResize={(w) => onColumnResize?.('plannedDate', w)}
                className="w-[140px]"
                onSort={() => {}}
                direction={null}
              />
              <SortableTableHead
                label={t('projects.revenues.table.status')}
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
            {revenues.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  {t('projects.revenues.empty')}
                </TableCell>
              </TableRow>
            ) : (
              revenues.filter((revenue): revenue is typeof revenue => revenue && revenue.id !== undefined).map((revenue, index) => {
                const stage = stages.find(s => s.id === revenue.stageId);
                const paymentDelay = getPaymentDelay(revenue?.plannedDate, revenue?.actualDate);
                const isOverdue = revenue.status === 'overdue';
                
                return (
                  <TableRow
                    key={revenue.id}
                    className={cn(
                      "hover:bg-muted/50 transition-colors",
                      revenue.status === 'overdue' && 'bg-red-50/30 dark:bg-red-950/10',
                      revenue.status === 'received' && 'bg-green-50/30 dark:bg-green-950/10'
                    )}
                  >
                    <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                    
                    <TableCell>
                      <InlineEditCell
                        value={revenue.stageId || null}
                        inputType="select"
                        options={[
                          { label: t('common.not_selected'), value: 'none' },
                          ...stages.map(s => ({ label: s.name, value: String(s.id) }))
                        ]}
                        onSave={(val) => onUpdateRevenue(revenue.id, { stageId: val === 'none' ? undefined : parseInt(val) })}
                      />
                    </TableCell>

                    <TableCell className="font-semibold text-sm">
                      <InlineEditCell
                        value={revenue.name}
                        inputType="text"
                        onSave={(val) => onUpdateRevenue(revenue.id, { name: val })}
                      />
                    </TableCell>

                    <TableCell>
                      <InlineEditCell
                        value={revenue.incomeCategoryId || null}
                        inputType="select"
                        options={[
                          { label: t('common.not_selected'), value: 'none' },
                          ...categories.map(c => ({ label: c.name, value: c.id }))
                        ]}
                        onSave={(val) => onUpdateRevenue(revenue.id, { incomeCategoryId: val === 'none' ? undefined : val })}
                      />
                    </TableCell>
 
                    <TableCell>
                      {revenue.isTaxable && revenue.vatRate ? (
                        <Badge variant="secondary" className="font-medium bg-blue-100/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {revenue.vatRate}%
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground uppercase">{t('lost.bez_nds')}</span>
                      )}
                    </TableCell>
 
                    <TableCell className="font-mono font-bold">
                      <InlineEditCell
                        value={revenue.amount}
                        inputType="money"
                        onSave={(val) => onUpdateRevenue(revenue.id, { amount: val })}
                      />
                    </TableCell>
 
                    <TableCell className="text-xs">
                      <InlineEditCell
                        value={revenue.plannedDate ? revenue.plannedDate.split('.').reverse().join('-') : null}
                        inputType="date"
                        onSave={(val) => {
                          if (val) {
                            const date = new Date(val);
                            onUpdateRevenue(revenue.id, { plannedDate: format(date, 'dd.MM.yyyy') });
                          }
                        }}
                      />
                      {revenue.actualDate && (
                        <div className="text-[10px] text-green-600 dark:text-green-500 font-medium mt-0.5">
                           ✓ {formatDate(revenue.actualDate, false)}
                        </div>
                      )}
                    </TableCell>
 
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <InlineEditCell
                          value={revenue.status}
                          inputType="select"
                          options={[
                            { label: t('projects.revenues.status.planned'), value: 'planned' },
                            { label: t('projects.revenues.status.invoiced'), value: 'invoiced' },
                            { label: t('projects.revenues.status.received'), value: 'received' },
                            { label: t('projects.revenues.status.overdue'), value: 'overdue' },
                            { label: t('projects.revenues.status.cancelled'), value: 'cancelled' },
                          ]}
                          onSave={(val) => onUpdateRevenue(revenue.id, { status: val })}
                        />
                        {paymentDelay && (
                          <span className="text-[9px] text-red-600 font-black uppercase text-center">
                            +{paymentDelay}д.
                          </span>
                        )}
                      </div>
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
                            <DropdownMenuItem onClick={() => onOpenEdit(revenue)}>
                              <Edit className="w-4 h-4 mr-2" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            {revenue.status !== 'received' && revenue.status !== 'cancelled' && (
                              <DropdownMenuItem onClick={() => onMarkAsReceived(revenue)}>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                {t('projects.revenues.actions.mark_received')}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(revenue)}
                              className="text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {t('common.delete')}
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
          {revenues.length > 0 && (
            <TableFooter>
              <TableRow className="bg-muted/20 font-bold">
                <TableCell colSpan={4} className="text-right uppercase tracking-wider text-[10px] text-muted-foreground">
                  {t('common.total')}
                </TableCell>
                <TableCell className="font-mono text-base">
                  {formatMoney(revenues.reduce((sum, r) => sum + (parseFloat(String(r.amount)) || 0), 0))}
                </TableCell>
                <TableCell colSpan={3}></TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
};
