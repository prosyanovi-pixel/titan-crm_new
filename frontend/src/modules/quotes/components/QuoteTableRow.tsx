import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { QuickActionsMenu, QuickActionMenuOption } from "@/components/ui/QuickActionsMenu";
import { StatusBadge, TagList } from "@/components/ui/status-system";
import { useTranslation } from "@/lib/i18n";
import { Quote } from "../types";
import { useSettings } from "@/hooks/use-settings";
import { useModuleActions } from "@/modules/registry/hooks/useModuleActions";

interface QuoteTableRowProps {
  quote: Quote;
  selectedIds: Set<string | number>;
  visibleColumns: Record<string, boolean>;
  columnOrder: string[];
  onToggleSelection: (id: string | number) => void;
  onRowClick: (quote: Quote) => void;
  onQuickAction: (action: string, id: number | string) => Promise<void>;
}



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
  const { getQuickActionsByModule } = useSettings();
  
  const rawActions: QuickActionMenuOption[] = [
    ...getQuickActionsByModule('quotes').map((a) => ({
      label: a.name,
      action: a.action,
      icon: a.icon,
      isQuickAction: true,
    })),
    ...useModuleActions("quotes").map((a) => ({
      label: (a.labelKey as string).includes('.') ? t(a.labelKey as string) : a.labelKey as string,
      action: a.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      icon: a.icon as any,
      isQuickAction: (a.defaultOrder as number) < 50,
      variant: (a.id === 'delete' ? 'destructive' : undefined) as 'destructive' | 'default' | undefined,
    }))
  ];

  const allActions = Array.from(new Map(rawActions.map(a => [a.action, a])).values());

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
                {quote.tags && quote.tags.length > 0 && (
                  <div className="mt-1">
                    <TagList tags={quote.tags.map(tag => typeof tag === 'string' ? { id: tag, name: tag } : tag)} module="quotes" maxVisible={3} />
                  </div>
                )}
              </div>
            </TableCell>
          );
          case 'status': return (
            <TableCell key="status">
              <StatusBadge module="quotes" statusId={quote.statusId} />
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
