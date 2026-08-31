import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { QuickActionsMenu, QuickActionMenuOption } from "@/components/ui/QuickActionsMenu";
import { useTranslation } from "@/lib/i18n";
import { useSettings } from "@/hooks/use-settings";
import { useModuleActions } from "@/modules/registry/hooks/useModuleActions";
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
  const { getQuickActionsByModule } = useSettings();
  const isSelected = selectedIds.has(priceList.id);
  const rawActions: QuickActionMenuOption[] = [
    ...getQuickActionsByModule('price_lists').map((a: any) => ({
      label: a.name,
      action: a.action,
      icon: a.icon,
      isQuickAction: true,
    })),
    ...useModuleActions("price_lists")
      .filter((a: any) => {
        if (a.id === 'activate' && priceList.isActive) return false;
        if (a.id === 'deactivate' && !priceList.isActive) return false;
        if (a.id === 'make_default' && priceList.isDefault) return false;
        return true;
      })
      .map((a: any) => ({
        label: a.labelKey.includes('.') ? t(a.labelKey) : a.labelKey,
        action: a.id,
        icon: a.icon as any,
        isQuickAction: a.defaultOrder < 50,
        variant: a.id === 'delete' ? 'destructive' : undefined,
      }))
  ];

  // Deduplicate by action to avoid React key warnings
  const allActions = Array.from(new Map(rawActions.map(a => [a.action, a])).values());

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
          options={allActions}
          onAction={async (actionType, itemId) => await onQuickAction(actionType, itemId)}
        />
      </TableCell>
    </TableRow>
  );
}
