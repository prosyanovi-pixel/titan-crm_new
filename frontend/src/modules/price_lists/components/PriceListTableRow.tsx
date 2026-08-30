import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { QuickActionsMenu } from "@/components/ui/QuickActionsMenu";
import { useTranslation } from "@/lib/i18n";
import { PriceList } from "../types";

interface PriceListTableRowProps {
  priceList: PriceList;
  selectedIds: Set<string | number>;
  visibleColumns: Record<string, boolean>;
  columnOrder: string[];
  onToggleSelection: (id: string | number) => void;
  onRowClick: (priceList: PriceList) => void;
  onQuickAction: (action: string, id: number | string) => Promise<void>;
}

/** Строка таблицы прайс-листов: чекбокс выбора + ячейки по настройке колонок. */
export function PriceListTableRow({
  priceList,
  selectedIds,
  visibleColumns,
  columnOrder,
  onToggleSelection,
  onRowClick,
  onQuickAction,
}: PriceListTableRowProps) {
  const { t } = useTranslation();
  const isSelected = selectedIds.has(priceList.id);

  return (
    <TableRow
      key={priceList.id}
      className={`hover:bg-muted/50 cursor-pointer ${isSelected ? "bg-muted" : ""}`}
      onClick={() => onRowClick(priceList)}
    >
      <TableCell onClick={(e) => e.stopPropagation()} className="w-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(priceList.id)}
        />
      </TableCell>
      {columnOrder.filter(key => visibleColumns[key]).map(key => {
        switch (key) {
          case 'name': return (
            <TableCell key="name">
              <span className="font-semibold text-foreground truncate">{priceList.name}</span>
            </TableCell>
          );
          case 'currency': return (
            <TableCell key="currency">
              <span className="text-muted-foreground" style={{ fontSize: 'var(--table-font-meta)' }}>
                {priceList.currency}
              </span>
            </TableCell>
          );
          case 'isActive': return (
            <TableCell key="isActive">
              <Badge variant={priceList.isActive ? 'default' : 'secondary'}>
                {priceList.isActive ? t('common.active') : t('common.inactive')}
              </Badge>
            </TableCell>
          );
          case 'isDefault': return (
            <TableCell key="isDefault">
              {priceList.isDefault && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  {t('common.yes')}
                </Badge>
              )}
            </TableCell>
          );
          default: return null;
        }
      })}
      <TableCell className="w-10 text-right" onClick={(e) => e.stopPropagation()}>
        <QuickActionsMenu
          itemId={priceList.id}
          itemName={priceList.name}
          options={[
            { label: t('common.view'), action: 'view', icon: 'Eye', isQuickAction: false },
            { label: t('common.edit'), action: 'edit', icon: 'Pencil', isQuickAction: false },
            { label: t('common.delete'), action: 'delete', icon: 'Trash2', isQuickAction: false, variant: 'destructive' as const },
          ]}
          onAction={async (actionType, itemId) => await onQuickAction(actionType, itemId)}
        />
      </TableCell>
    </TableRow>
  );
}
