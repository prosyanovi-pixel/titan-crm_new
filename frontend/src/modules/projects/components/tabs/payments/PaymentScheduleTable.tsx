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
} from '@/components/ui/table';
import { SortableTableHead } from '@/components/shared/SortableTableHead';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate, formatMoney } from '../utils';
import type { PaymentScheduleItem } from '../../../types';

interface PaymentScheduleTableProps {
  payments: PaymentScheduleItem[];
  onOpenPaid: (payment: PaymentScheduleItem) => void;
  onOpenEdit: (payment: PaymentScheduleItem) => void;
  onDelete: (payment: PaymentScheduleItem) => void;
  columnWidths?: Record<string, number>;
  onColumnResize?: (key: string, width: number) => void;
}

export const PaymentScheduleTable = ({ 
  payments, 
  onOpenPaid, 
  onOpenEdit, 
  onDelete,
  columnWidths,
  onColumnResize,
}: PaymentScheduleTableProps) => {
  const { t } = useTranslation();

  const getStatusBadge = (payment: PaymentScheduleItem) => {
    const statusConfig = {
      paid: { label: t('projects.payments.status.paid'), className: 'bg-green-600' },
      partial: { label: t('projects.payments.status.partial'), className: 'bg-blue-100 text-blue-800' },
      overdue: { label: t('projects.payments.status.overdue'), className: 'bg-red-600' },
      pending: { label: t('projects.payments.status.pending'), className: '' },
      cancelled: { label: t('projects.payments.status.cancelled'), className: 'bg-gray-400' },
    };
    const config = statusConfig[payment.status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge variant={payment.status === 'paid' ? 'default' : 'outline'} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead
                label={t('projects.payments.table.name')}
                width={columnWidths?.name}
                onResize={(w) => onColumnResize?.('name', w)}
                className="min-w-[200px]"
                onSort={() => {}}
                direction={null}
              />
              <SortableTableHead
                label={t('projects.payments.table.amount')}
                width={columnWidths?.amount}
                onResize={(w) => onColumnResize?.('amount', w)}
                className="w-[120px]"
                onSort={() => {}}
                direction={null}
              />
              <SortableTableHead
                label={t('projects.payments.table.paid')}
                width={columnWidths?.paid}
                onResize={(w) => onColumnResize?.('paid', w)}
                className="w-[120px]"
                onSort={() => {}}
                direction={null}
              />
              <SortableTableHead
                label={t('projects.payments.table.due_date')}
                width={columnWidths?.dueDate}
                onResize={(w) => onColumnResize?.('dueDate', w)}
                className="w-[150px]"
                onSort={() => {}}
                direction={null}
              />
              <SortableTableHead
                label={t('projects.payments.table.status')}
                width={columnWidths?.status}
                onResize={(w) => onColumnResize?.('status', w)}
                className="w-[120px]"
                onSort={() => {}}
                direction={null}
              />
              <TableHead className="w-[60px] text-right">№</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  {t('projects.payments.empty')}
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow 
                  key={payment.id} 
                  className={cn(
                    payment.status === 'overdue' && 'bg-red-50',
                    payment.status === 'paid' && 'bg-green-50'
                  )}
                >
                  <TableCell className="py-2" style={{ width: columnWidths?.name }}>
                    <div>
                      {payment.name}
                      {payment.description && (
                        <p className="text-xs text-muted-foreground mt-1">{payment.description}</p>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="py-2 font-medium" style={{ width: columnWidths?.amount }}>
                    {formatMoney(payment.amount)}
                  </TableCell>
                  
                  <TableCell className="py-2" style={{ width: columnWidths?.paid }}>
                    {payment.paidAmount > 0 ? (
                      <div>
                        {formatMoney(payment.paidAmount)}
                        {payment.status === 'partial' && (
                          <p className="text-xs text-amber-600">
                            {t('projects.payments.partial', { 
                              remaining: formatMoney(payment.amount - payment.paidAmount) 
                            })}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  
                  <TableCell className="py-2" style={{ width: columnWidths?.dueDate }}>
                    <div className={cn(
                      payment.status === 'overdue' && 'text-red-600 font-medium',
                      payment.status === 'paid' && 'text-green-600'
                    )}>
                      {formatDate(payment.dueDate)}
                    </div>
                  </TableCell>
                  
                  <TableCell className="py-2" style={{ width: columnWidths?.status }}>
                    {getStatusBadge(payment)}
                  </TableCell>
                  
                  <TableCell className="py-2">
                    <div className="flex items-center justify-end gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {payment.status !== 'paid' && payment.status !== 'cancelled' && (
                            <DropdownMenuItem onClick={() => onOpenPaid(payment)}>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              {t('projects.payments.actions.mark_paid')}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onOpenEdit(payment)}>
                            <Edit className="w-4 h-4 mr-2" />
                            {t('common.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => onDelete(payment)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {t('common.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
