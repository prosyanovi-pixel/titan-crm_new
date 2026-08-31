import { Invoice } from '../types/finance.types';
import { useTranslation } from '@/lib/i18n';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuickActionsMenu } from '@/components/ui/QuickActionsMenu';
import { QuickAction } from '@/lib/settings-data';
import { SortableTableHead, TableHeaderCheckbox } from '@/components/shared';
import { useColumnDrag } from '@/hooks/useColumnDrag';
import { useCallback } from 'react';
import { useModuleActions } from '@/modules/registry/hooks/useModuleActions';

interface InvoicesTableProps {
  invoices: Invoice[];
  visibleColumns: Record<string, boolean>;
  columnOrder?: string[];
  onReorderColumn?: (fromKey: string, toKey: string) => void;
  selectedIds: Set<string | number>;
  toggleSelection: (id: string | number) => void;
  toggleAllSelection: () => void;
  onEdit: (invoice: Invoice) => void;
  quickActions: QuickAction[];
  onQuickAction: (actionType: string, id: string | number) => Promise<void>;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  onSort: (key: string) => void;
  statuses: Array<{ id: string; name: string; color?: string }>;
  columnWidths?: Record<string, number>;
  onColumnResize?: (key: string, width: number) => void;
}

export function InvoicesTable({
  invoices,
  visibleColumns,
  columnOrder,
  onReorderColumn,
  selectedIds,
  toggleSelection,
  toggleAllSelection,
  onEdit,
  quickActions,
  onQuickAction,
  sortConfig,
  onSort,
  statuses,
  columnWidths,
  onColumnResize,
}: InvoicesTableProps) {
  const { t } = useTranslation();
  const moduleActions = useModuleActions("finance");

  const handleReorder = useCallback((from: string, to: string) => {
    onReorderColumn?.(from, to);
  }, [onReorderColumn]);
  const { dragging, dragOver, onColumnMouseDown, onColumnMouseEnter } = useColumnDrag(handleReorder);

  const parseAmount = (value: unknown): number => {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return NaN;
    const normalized = value.replace(/\s/g, '').replace(',', '.');
    return Number(normalized);
  };

  const statusMap = statuses.reduce((acc, status) => {
    acc[status.id] = status;
    return acc;
  }, {} as Record<string, { id: string; name: string; color?: string }>);

  const SortHeader = ({ colKey, label, sortKey }: { colKey: string; label: string; sortKey: string }) => (
    <SortableTableHead
      columnKey={colKey}
      label={label}
      onSort={() => onSort(sortKey)}
      direction={sortConfig?.key === sortKey ? sortConfig.direction : null}
      isDragging={dragging === colKey}
      isDragOver={dragOver === colKey}
      onColumnMouseDown={onColumnMouseDown}
      onColumnMouseEnter={onColumnMouseEnter}
      width={columnWidths?.[colKey]}
      onResize={onColumnResize ? (w) => onColumnResize(colKey, w) : undefined}
    />
  );

  const orderedKeys = columnOrder ?? Object.keys(visibleColumns);

  return (
    <div className="titan-card">
      <Table>
        <TableHeader>
          <TableRow>
          <TableHead>
            <TableHeaderCheckbox
              isCurrentPageSelected={invoices.length > 0 && selectedIds.size === invoices.length}
              onToggleCurrentPage={() => toggleAllSelection()}
            />
          </TableHead>
          {orderedKeys.map(key => {

              if (!visibleColumns[key]) return null;
              switch (key) {
                case 'identifier': return <SortHeader key={key} colKey={key} label={t('finance.table.identifier')} sortKey="identifier" />;
                case 'contractor': return <SortHeader key={key} colKey={key} label={t('finance.table.contractor')} sortKey="contractorName" />;
                case 'project':    return <SortHeader key={key} colKey={key} label={t('finance.table.project')} sortKey="projectName" />;
                case 'amount':     return <SortHeader key={key} colKey={key} label={t('finance.table.amount')} sortKey="amount" />;
                case 'status':     return <SortHeader key={key} colKey={key} label={t('finance.table.status')} sortKey="status" />;
                case 'issueDate':  return <SortHeader key={key} colKey={key} label={t('finance.table.issue_date')} sortKey="issueDate" />;
                case 'dueDate':    return <SortHeader key={key} colKey={key} label={t('finance.table.due_date')} sortKey="dueDate" />;
                default:           return null;
              }
            })}
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length + 2} className="text-center py-8 text-muted-foreground">
                {t('finance.no_invoices')}
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => (
              <TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(invoice.id)}
                    onCheckedChange={() => toggleSelection(invoice.id)}
                  />
                </TableCell>
                {orderedKeys.map(key => {
                  if (!visibleColumns[key]) return null;
                  switch (key) {
                    case 'identifier': return (
                      <TableCell key={key} onClick={() => onEdit(invoice)} className="font-semibold">
                        {invoice.identifier}
                      </TableCell>
                    );
                    case 'contractor': return (
                      <TableCell key={key} onClick={() => onEdit(invoice)}>
                        {invoice.contractorName}
                      </TableCell>
                    );
                    case 'project': return (
                      <TableCell key={key} onClick={() => onEdit(invoice)}>
                        {invoice.projectName || t('common.no_data')}
                      </TableCell>
                    );
                    case 'amount': return (
                      <TableCell key={key} onClick={() => onEdit(invoice)} className="font-medium">
                        {(() => {
                          const amount = parseAmount((invoice as any).amount ?? invoice.amountTotal);
                          if (!Number.isFinite(amount)) return '—';
                          const currency = (invoice as any).currency || 'RUB';
                          return new Intl.NumberFormat('ru-RU', {
                            style: 'currency',
                            currency: currency,
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(amount);
                        })()}
                      </TableCell>
                    );
                    case 'status': return (
                      <TableCell key={key} onClick={() => onEdit(invoice)}>
                        <Badge variant="outline">
                          {statusMap[invoice.status]?.name || t(`finance.invoice.status.${invoice.status}`) || invoice.status}
                        </Badge>
                      </TableCell>
                    );
                    case 'issueDate': return (
                      <TableCell key={key} onClick={() => onEdit(invoice)}>
                        {new Date(invoice.issueDate).toLocaleDateString('ru-RU')}
                      </TableCell>
                    );
                    case 'dueDate': return (
                      <TableCell key={key} onClick={() => onEdit(invoice)}>
                        <div className="flex flex-col">
                          <span>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('ru-RU') : '—'}</span>
                          {invoice.status === 'overdue' && invoice.overdueSince && (
                            <span className="text-xs text-destructive">
                              Просрочен с {new Date(invoice.overdueSince).toLocaleDateString('ru-RU')}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    );
                    default: return null;
                  }
                })}
                <TableCell onClick={(e) => e.stopPropagation()} className="w-[40px] shrink-0">
                  <QuickActionsMenu
                    itemId={invoice.id}
                    itemName={invoice.identifier}
                    options={[
                      ...quickActions.map(a => ({
                        label: a.name, action: a.action, icon: a.icon, isQuickAction: true,
                      })),
                      ...moduleActions.map((a: any) => ({
                        label: a.labelKey.includes('.') ? t(a.labelKey) : a.labelKey,
                        action: a.id,
                        icon: a.icon as any,
                        isQuickAction: a.defaultOrder < 50,
                        variant: (a.id === 'delete' ? 'destructive' : undefined) as "default" | "destructive" | undefined,
                      })),
                    ]}
                    onAction={(actionType, itemId) => void onQuickAction(actionType, itemId)}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
