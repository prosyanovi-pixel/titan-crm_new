import { Payment } from '../types/finance.types';
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
import { ArrowUpDown, Download, Upload, Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QuickActionsMenu } from '@/components/ui/QuickActionsMenu';
import { QuickAction } from '@/lib/settings-data';
import { SortableTableHead, TableHeaderCheckbox } from '@/components/shared';
import { useColumnDrag } from '@/hooks/useColumnDrag';
import { useCallback } from 'react';

interface PaymentsTableProps {
  payments: Payment[];
  visibleColumns: Record<string, boolean>;
  columnOrder?: string[];
  onReorderColumn?: (fromKey: string, toKey: string) => void;
  selectedIds: Set<string | number>;
  toggleSelection: (id: string | number) => void;
  toggleAllSelection: () => void;
  onEdit: (payment: Payment) => void;
  quickActions: QuickAction[];
  onQuickAction: (actionType: string, id: string | number) => Promise<void>;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  onSort: (key: string) => void;
  columnWidths?: Record<string, number>;
  onColumnResize?: (key: string, width: number) => void;
}

export function PaymentsTable({
  payments,
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
  columnWidths,
  onColumnResize,
}: PaymentsTableProps) {
  const { t } = useTranslation();

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
                isCurrentPageSelected={payments.length > 0 && selectedIds.size === payments.length}
                onToggleCurrentPage={() => toggleAllSelection()}
              />
            </TableHead>
            {orderedKeys.map(key => {
              if (!visibleColumns[key]) return null;
              switch (key) {
                case 'kind':              return <SortHeader key={key} colKey={key} label={t('finance.table.kind')} sortKey="kind" />;
                case 'description':       return <SortHeader key={key} colKey={key} label={t('finance.table.description')} sortKey="description" />;
                case 'amount':            return <SortHeader key={key} colKey={key} label={t('finance.table.amount')} sortKey="amount" />;
                case 'invoiceIdentifier': return <SortHeader key={key} colKey={key} label={t('finance.table.invoice')} sortKey="invoiceIdentifier" />;
                case 'contractorName':    return <SortHeader key={key} colKey={key} label={t('finance.table.payer')} sortKey="contractorName" />;
                case 'projectName':       return <SortHeader key={key} colKey={key} label={t('finance.table.project')} sortKey="projectName" />;
                case 'taskTitle':         return <SortHeader key={key} colKey={key} label={t('finance.table.task')} sortKey="taskTitle" />;
                case 'paymentDate':       return <SortHeader key={key} colKey={key} label={t('finance.table.payment_date')} sortKey="paymentDate" />;
                case 'paymentNumber':     return <SortHeader key={key} colKey={key} label={t('finance.table.payment_number')} sortKey="paymentNumber" />;
                case 'paymentMethod':     return <SortHeader key={key} colKey={key} label={t('finance.table.payment_method')} sortKey="paymentMethod" />;
                default:                  return null;
              }
            })}
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
        {payments.length === 0 ? (
          <TableRow>
            <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length + 2} className="text-center py-8 text-muted-foreground">
              {t('finance.no_payments')}
            </TableCell>
          </TableRow>
        ) : (
          payments.map((payment) => (
            <TableRow key={payment.id} className="cursor-pointer hover:bg-muted/50">
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedIds.has(payment.id)}
                  onCheckedChange={() => toggleSelection(payment.id)}
                />
              </TableCell>
              {orderedKeys.map(key => {

                  if (!visibleColumns[key]) return null;
                  switch (key) {
                    case 'kind': return (
                      <TableCell key={key} onClick={() => onEdit(payment)}>
                        <Badge variant={payment.kind === 'income' ? 'default' : 'secondary'} className="gap-1">
                          {payment.kind === 'income' ? <Download className="w-3 h-3" /> : <Upload className="w-3 h-3" />}
                          {t(`finance.payment_kind.${payment.kind}`)}
                        </Badge>
                      </TableCell>
                    );
                    case 'description': return (
                      <TableCell key={key} onClick={() => onEdit(payment)}>
                        {payment.comment || payment.description || t('common.no_data')}
                      </TableCell>
                    );
                    case 'amount': return (
                      <TableCell key={key} onClick={() => onEdit(payment)} className="font-medium">
                        {(() => {
                          const amount = parseAmount(payment.amount);
                          if (!Number.isFinite(amount)) return '—';
                          return new Intl.NumberFormat('ru-RU', {
                            style: 'currency',
                            currency: 'RUB',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(amount);
                        })()}
                      </TableCell>
                    );
                    case 'invoiceIdentifier': return (
                      <TableCell key={key} onClick={() => onEdit(payment)}>
                        {payment.invoiceIdentifier || t('common.no_data')}
                      </TableCell>
                    );
                    case 'contractorName': return (
                      <TableCell key={key} onClick={() => onEdit(payment)}>
                        {(payment as any).contractorName || t('common.no_data')}
                      </TableCell>
                    );
                    case 'projectName': return (
                      <TableCell key={key} onClick={() => onEdit(payment)}>
                        {payment.projectName || t('common.no_data')}
                      </TableCell>
                    );
                    case 'taskTitle': return (
                      <TableCell key={key} onClick={() => onEdit(payment)}>
                        {payment.taskTitle || t('common.no_data')}
                      </TableCell>
                    );
                    case 'paymentDate': return (
                      <TableCell key={key} onClick={() => onEdit(payment)}>
                        {new Date(payment.paymentDate).toLocaleDateString('ru-RU')}
                      </TableCell>
                    );
                    case 'paymentNumber': return (
                      <TableCell key={key} onClick={() => onEdit(payment)}>
                        {payment.paymentNumber || t('common.no_data')}
                      </TableCell>
                    );
                    case 'paymentMethod': return (
                      <TableCell key={key} onClick={() => onEdit(payment)}>
                        {payment.paymentMethod || t('common.no_data')}
                      </TableCell>
                    );
                    default: return null;
                  }
                })}
                <TableCell onClick={(e) => e.stopPropagation()} className="w-[40px] shrink-0">
                  <QuickActionsMenu
                    itemId={payment.id}
                    itemName={payment.invoiceIdentifier || String(payment.id)}
                    options={[
                      ...quickActions.map(a => ({
                        label: a.name, action: a.action, icon: a.icon, isQuickAction: true,
                      })),
                      { label: 'Просмотреть', action: 'view', icon: 'Eye', isQuickAction: false },
                      { label: 'Редактировать', action: 'edit', icon: 'Pencil', isQuickAction: false },
                      { label: 'Удалить', action: 'delete', icon: 'Trash2', isQuickAction: false, variant: 'destructive' as const },
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