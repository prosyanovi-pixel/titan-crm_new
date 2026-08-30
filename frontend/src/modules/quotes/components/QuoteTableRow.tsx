import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { QuickActionsMenu, QuickActionMenuOption } from "@/components/ui/QuickActionsMenu";
import { useTranslation } from "@/lib/i18n";
import { Quote } from "../types";

interface QuoteTableRowProps {
  quote: Quote;
  selectedIds: Set<string | number>;
  visibleColumns: Record<string, boolean>;
  columnOrder: string[];
  onToggleSelection: (id: string | number) => void;
  onRowClick: (quote: Quote) => void;
  onQuickAction: (action: string, id: number | string) => Promise<void>;
}

/** Возвращает бейдж статуса КП по его коду. */
const getStatusBadge = (status: string, t: (key: string) => string) => {
  switch (status) {
    case 'accepted': return <Badge className="bg-green-500">{t('quotes.statuses.accepted')}</Badge>;
    case 'rejected': return <Badge variant="destructive">{t('quotes.statuses.rejected')}</Badge>;
    case 'sent': return <Badge variant="secondary" className="bg-blue-100 text-blue-800">{t('quotes.statuses.sent')}</Badge>;
    default: return <Badge variant="outline">{t('quotes.statuses.draft')}</Badge>;
  }
};

/** Строка таблицы КП: чекбокс выбора + ячейки в соответствии с настройкой колонок. */
export function QuoteTableRow({
  quote,
  selectedIds,
  visibleColumns,
  columnOrder,
  onToggleSelection,
  onRowClick,
  onQuickAction,
}: QuoteTableRowProps) {
  const { t } = useTranslation();

  const allActions: QuickActionMenuOption[] = [
    { label: t('common.view'), action: 'view', icon: 'Eye', isQuickAction: false },
    { label: t('common.edit'), action: 'edit', icon: 'Pencil', isQuickAction: false },
    { label: t('common.delete'), action: 'delete', icon: 'Trash2', isQuickAction: false, variant: 'destructive' as const },
  ];

  const isSelected = selectedIds.has(quote.id);

  return (
    <TableRow
      key={quote.id}
      className={`hover:bg-muted/50 cursor-pointer ${isSelected ? "bg-muted" : ""}`}
      onClick={() => onRowClick(quote)}
    >
      <TableCell onClick={(e) => e.stopPropagation()} className="w-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(quote.id)}
        />
      </TableCell>
      {columnOrder.filter(key => visibleColumns[key]).map(key => {
        switch (key) {
          case 'number': return (
            <TableCell key="number">
              <span className="font-semibold text-foreground truncate">{quote.number}</span>
            </TableCell>
          );
          case 'date': return (
            <TableCell key="date">
              <span className="text-muted-foreground" style={{ fontSize: 'var(--table-font-meta)' }}>
                {new Date(quote.date).toLocaleDateString()}
              </span>
            </TableCell>
          );
          case 'contractor': return (
            <TableCell key="contractor">
              <div className="flex flex-col min-w-0">
                <span className="truncate">{quote.contractorName || '—'}</span>
                {quote.projectName && (
                  <span className="text-[10px] text-muted-foreground truncate">{quote.projectName}</span>
                )}
              </div>
            </TableCell>
          );
          case 'status': return (
            <TableCell key="status">
              {getStatusBadge(quote.status, t)}
            </TableCell>
          );
          case 'total': return (
            <TableCell key="total" className="text-right">
              <span className="font-medium whitespace-nowrap" style={{ fontSize: 'var(--table-font-meta)' }}>
                {Number(quote.totalAmount).toLocaleString()} ₽
              </span>
            </TableCell>
          );
          default: return null;
        }
      })}
      <TableCell className="w-10 text-right" onClick={(e) => e.stopPropagation()}>
        <QuickActionsMenu
          itemId={quote.id}
          itemName={quote.number}
          options={allActions}
          onAction={async (actionType, itemId) => await onQuickAction(actionType, itemId)}
        />
      </TableCell>
    </TableRow>
  );
}
