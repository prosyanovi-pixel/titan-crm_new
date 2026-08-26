// frontend/src/modules/finance/components/PaymentTableRow.tsx
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/lib/i18n";
import { Payment, ExpenseCategory } from "../types/finance.types";
import { formatMoney, cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financeApi } from '../api/finance.api';
import { toast } from "sonner";
import { InlineEditCell } from "@/components/shared/InlineEditCell";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { QuickActionsMenu } from "@/components/ui/QuickActionsMenu";
import { Badge } from "@/components/ui/badge";
import { Download, Upload } from 'lucide-react';
import React from 'react';


interface PaymentTableRowProps {
  payment: Payment;
  selectedIds: Set<string | number>;
  visibleColumns: Record<string, boolean>;
  columnOrder: string[];
  columnWidths?: Record<string, number>;
  onToggleSelection: (id: string | number) => void;
  onRowClick: (payment: Payment) => void;
  onQuickAction: (action: string, id: string | number) => void;
}

export function PaymentTableRow({
  payment,
  selectedIds,
  visibleColumns,
  columnOrder,
  columnWidths,
  onToggleSelection,
  onRowClick,
  onQuickAction,
}: PaymentTableRowProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isSelected = selectedIds.has(payment.id);

  const { data: categories = [] } = useQuery<ExpenseCategory[]> ({
    queryKey: ['expense_categories', payment.kind],
    queryFn: () => financeApi.getCategories(payment.kind),
  });

  const categoryOptions = categories.map(c => ({ label: c.name, value: c.id }));

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Payment> }) => financeApi.updatePayment(id, data),
    onSuccess: (updatedPayment) => {
      queryClient.setQueryData(['payments'], (oldData: any) => ({
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          items: page.items.map((p: Payment) => p.id === updatedPayment.id ? updatedPayment : p),
        })),
      }));
      toast.success(t('finance.messages.payment_updated_success'));
    },
    onError: (error) => {
      toast.error(t('finance.messages.payment_update_error'), {
        description: error.message,
      });
    },
  });

  const handleCellSave = (field: keyof Payment, value: any) => {
    if (payment[field] === value) return;
    const updatedPayment = { ...payment, [field]: value };
    updatePaymentMutation.mutate({ id: payment.id, data: updatedPayment });
  };
  
  const allActions = [
    { label: t('generated.prosmotret'), action: 'view', icon: 'Eye' },
    { label: t('generated.redaktirovat'), action: 'edit', icon: 'Pencil' },
    { label: t('generated.udalit'), action: 'delete', icon: 'Trash2', variant: 'destructive' as const },
  ];

  return (
    <TableRow data-state={isSelected ? "selected" : undefined}>
      <TableCell onClick={(e) => e.stopPropagation()} className="w-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(payment.id)}
        />
      </TableCell>

      {columnOrder.map((key) => {
        if (!visibleColumns[key]) return null;

        const style: React.CSSProperties = { 
          width: columnWidths?.[key] ? `${columnWidths[key]}px` : undefined,
        };

        switch (key) {
          case 'paymentDate':
            return (
              <TableCell key={key} style={style}>
                <InlineEditCell
                  value={payment.paymentDate}
                  onSave={(newDate) => handleCellSave('paymentDate', newDate)}
                  inputType="date"
                  placeholder={t('common.no_date')}
                />
              </TableCell>
            );
          case 'kind':
             return (
              <TableCell key={key} onClick={() => onRowClick(payment)} className="cursor-pointer" style={style}>
                <Badge variant={payment.kind === 'income' ? 'success' : 'destructive'} className="gap-1">
                  {payment.kind === 'income' ? <Download className="w-3 h-3" /> : <Upload className="w-3 h-3" />}
                  {t(`finance.payment.kind.${payment.kind}`)}
                </Badge>
              </TableCell>
            );
          case 'contractorName':
            return (
              <TableCell key={key} className="truncate cursor-pointer" style={style} onClick={() => onRowClick(payment)}>
                {payment.contractorName || t('common.no_data')}
              </TableCell>
            );
          case 'categoryName':
            return (
              <TableCell key={key} style={style}>
                <InlineEditCell
                  value={payment.categoryId}
                  onSave={(newCategoryId) => handleCellSave('categoryId', newCategoryId)}
                  inputType="select"
                  options={categoryOptions}
                  placeholder={t('common.not_set')}
                />
              </TableCell>
            );
          case 'amount':
            return (
              <TableCell key={key} className="font-semibold text-right cursor-pointer" style={style} onClick={() => onRowClick(payment)}>
                {formatMoney(payment.amount)}
              </TableCell>
            );
          case 'projectName':
            return (
              <TableCell key={key} className="truncate text-muted-foreground cursor-pointer" style={style} onClick={() => onRowClick(payment)}>
                {payment.projectName || t('common.no_data')}
              </TableCell>
            );
          case 'invoiceIdentifier':
            return (
              <TableCell key={key} className="text-muted-foreground cursor-pointer" style={style} onClick={() => onRowClick(payment)}>
                {payment.invoiceIdentifier || t('common.no_data')}
              </TableCell>
            );
          case 'description':
            return (
              <TableCell key={key} className="truncate text-muted-foreground cursor-pointer" style={style} onClick={() => onRowClick(payment)}>
                {payment.description || t('common.no_data')}
              </TableCell>
            );
          case 'paymentNumber':
            return (
              <TableCell key={key} className="font-mono text-xs cursor-pointer" style={style} onClick={() => onRowClick(payment)}>
                {payment.paymentNumber || t('common.no_data')}
              </TableCell>
            );
          case 'paymentMethod':
            return (
              <TableCell key={key} className="cursor-pointer" style={style} onClick={() => onRowClick(payment)}>
                {payment.paymentMethod || t('common.no_data')}
              </TableCell>
            );
          default:
            return <TableCell key={key} style={style} onClick={() => onRowClick(payment)}>{(payment as any)[key] ?? '—'}</TableCell>;
        }
      })}

      <TableCell onClick={(e) => e.stopPropagation()} className="w-10">
        <QuickActionsMenu
          itemId={payment.id}
          itemName={t(`finance.payment.kind.${payment.kind}`)}
          options={allActions}
          onAction={(action) => onQuickAction(action, payment.id)}
        />
      </TableCell>
    </TableRow>
  );
}

