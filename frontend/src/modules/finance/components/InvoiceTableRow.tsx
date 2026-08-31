// frontend/src/modules/finance/components/InvoiceTableRow.tsx
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/lib/i18n";
import { Invoice, InvoiceStatusType } from "../types/finance.types";
import { formatMoney, cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { financeApi } from '../api/finance.api';
import { toast } from "sonner";
import { InlineEditCell } from "@/components/shared/InlineEditCell";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { StatusBadge } from "@/components/ui/status-system";
import { QuickActionsMenu, QuickActionMenuOption } from "@/components/ui/QuickActionsMenu";
import { Badge } from "@/components/ui/badge";
import { LegalFormBadge } from "@/modules/contractors";
import React from 'react';
import { useSettings } from "@/hooks/use-settings";
import { useModuleActions } from "@/modules/registry/hooks/useModuleActions";

interface InvoiceTableRowProps {
  invoice: Invoice;
  selectedIds: Set<string | number>;
  visibleColumns: Record<string, boolean>;
  columnOrder: string[];
  columnWidths?: Record<string, number>;
  invoiceStatuses: { id: string; label: string; color: string }[];
  onToggleSelection: (id: string | number) => void;
  onRowClick: (invoice: Invoice) => void;
  onQuickAction: (action: string, id: string | number) => void;
}

export function InvoiceTableRow({
  invoice,
  selectedIds,
  visibleColumns,
  columnOrder,
  columnWidths,
  invoiceStatuses,
  onToggleSelection,
  onRowClick,
  onQuickAction,
}: InvoiceTableRowProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isSelected = selectedIds.has(invoice.id);

  const statusOptions = invoiceStatuses.map(s => ({ label: s.label, value: s.id }));

  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Invoice> }) => financeApi.updateInvoice(id, data),
    onSuccess: (updatedInvoice) => {
      queryClient.setQueryData(['invoices'], (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            items: page.items.map((i: Invoice) => i.id === updatedInvoice.id ? updatedInvoice : i),
          })),
        }
      });
      toast.success(t('finance.messages.invoice_updated_success'));
    },
    onError: (error) => {
      toast.error(t('finance.messages.invoice_update_error'), {
        description: error.message,
      });
    },
  });

  const handleCellSave = (field: keyof Invoice, value: any) => {
    if (invoice[field] === value) return;
    const updatedInvoice = { ...invoice, [field]: value };
    updateInvoiceMutation.mutate({ id: invoice.id, data: updatedInvoice });
  };

  const financeActions = useModuleActions("finance");
  const { getQuickActionsByModule } = useSettings();

  const allActions = (() => {
    const systemActions: QuickActionMenuOption[] = financeActions.map((a: any) => ({
      label: a.labelKey.includes('.') ? t(a.labelKey) : a.labelKey,
      action: a.id,
      icon: a.icon as any,
      isQuickAction: a.defaultOrder < 50,
      variant: a.id === 'delete' ? 'destructive' : undefined,
    }));

    const customQuickActions: QuickActionMenuOption[] = getQuickActionsByModule('finance').map((a: any) => ({
      label: a.name,
      action: a.action,
      icon: a.icon,
      isQuickAction: true,
    }));

    return [...customQuickActions, ...systemActions];
  })();

  return (
    <TableRow
        className="cursor-pointer"
        data-state={isSelected ? "selected" : undefined}
    >
      <TableCell onClick={(e) => e.stopPropagation()} className="w-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(invoice.id)}
        />
      </TableCell>

      {columnOrder.map((key) => {
        if (!visibleColumns[key]) return null;

        const style: React.CSSProperties = { 
          width: columnWidths?.[key] ? `${columnWidths[key]}px` : undefined,
        };

        const cellProps = {
          key: key,
          style: style,
          onClick: () => onRowClick(invoice)
        }

        switch (key) {
          case 'identifier':
            return (
              <TableCell {...cellProps} className="font-medium">
                {invoice.identifier}
              </TableCell>
            );
          case 'issueDate':
            return (
              <TableCell {...cellProps} className="text-muted-foreground">
                {invoice.issueDate ? format(new Date(invoice.issueDate), 'dd.MM.yyyy', { locale: ru }) : '—'}
              </TableCell>
            );
          case 'dueDate':
            return (
              <TableCell {...cellProps} className="text-muted-foreground">
                {invoice.dueDate ? format(new Date(invoice.dueDate), 'dd.MM.yyyy', { locale: ru }) : '—'}
              </TableCell>
            );
          case 'contractor':
            return (
              <TableCell {...cellProps} className="truncate">
                <div className="flex flex-col">
                  <span className="font-medium">{invoice.contractorName || t('common.no_data')}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {invoice.contractorLegalForm && (
                      <LegalFormBadge code={invoice.contractorLegalForm} className="h-3.5 text-[9px] px-1" />
                    )}
                    {invoice.taxRegimeName && (
                      <span className="text-[9px] text-muted-foreground uppercase bg-muted px-1 rounded">
                        {invoice.taxRegimeName}
                      </span>
                    )}
                  </div>
                </div>
              </TableCell>
            );
          case 'project':
            return (
              <TableCell {...cellProps} className="truncate text-muted-foreground">
                {invoice.projectName || t('common.no_data')}
              </TableCell>
            );
          case 'amountTotal':
            return (
              <TableCell {...cellProps} className="font-semibold text-right">
                {formatMoney(invoice.amountTotal)}
              </TableCell>
            );
          case 'vat':
            return (
              <TableCell {...cellProps} className="text-right whitespace-nowrap">
                {invoice.isTaxable ? (
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium">{formatMoney(invoice.vatAmount)}</span>
                    <span className="text-[10px] text-muted-foreground">{invoice.vatRate}%</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>
            );
          case 'status':
            return (
              <TableCell key={key} style={style}>
                 <InlineEditCell
                  value={invoice.status}
                  onSave={(newStatus) => handleCellSave('status', newStatus)}
                  inputType="select"
                  options={statusOptions}
                  placeholder={t('common.not_set')}
                />
              </TableCell>
            );
          default:
            return <TableCell {...cellProps} >{(invoice as any)[key] ?? '—'}</TableCell>;
        }
      })}

      <TableCell onClick={(e) => e.stopPropagation()} className="w-10">
        <QuickActionsMenu
          itemId={invoice.id}
          itemName={invoice.identifier}
          options={allActions}
          onAction={(action) => onQuickAction(action, invoice.id)}
        />
      </TableCell>
    </TableRow>
  );
}
