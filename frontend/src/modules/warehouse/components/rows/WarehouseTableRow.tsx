import React from 'react';
import { Warehouse } from '../../api/warehouseApi';
import { TableRow, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusBadge } from '@/components/ui/status-system';
import { Tag } from '@/components/ui/status-system/Tag';
import { useTranslation } from '@/lib/i18n';
import { QuickActionsMenu, QuickActionMenuOption } from '@/components/ui/QuickActionsMenu';
import { useSettings } from '@/hooks/use-settings';
import { useModuleActions } from '@/modules/registry/hooks/useModuleActions';

interface WarehouseTableRowProps {
  warehouse: Warehouse;
  isSelected: boolean;
  visibleColumns: Record<string, boolean>;
  columnOrder: string[];
  onToggleSelection: (id: number) => void;
  onQuickAction?: (action: string, id: number) => Promise<void>;
  showQuickActions?: boolean;
  showTags?: boolean;
}

export function WarehouseTableRow({
  warehouse,
  isSelected,
  visibleColumns,
  columnOrder,
  onToggleSelection,
  onQuickAction,
  showQuickActions = true,
  showTags = true,
}: WarehouseTableRowProps) {
  const { t } = useTranslation();
  const { getQuickActionsByModule, getTagsByModule } = useSettings();
  const warehouseActions = useModuleActions("warehouse");

  const availableTags = getTagsByModule('warehouse');

  // Системные действия через ActionRegistry
  const systemActions: QuickActionMenuOption[] = warehouseActions.map((a: any) => ({
    label: a.labelKey.includes('.') ? t(a.labelKey) : a.labelKey,
    action: a.id,
    icon: a.icon as any,
    isQuickAction: a.defaultOrder < 50,
    variant: a.id === 'delete' ? 'destructive' : undefined,
  }));

  // Кастомные быстрые действия
  const customQuickActions: QuickActionMenuOption[] = getQuickActionsByModule('warehouse').map((a: any) => ({
    label: a.name,
    action: a.action,
    icon: a.icon,
    isQuickAction: true,
  }));

  const allOptions = [...customQuickActions, ...systemActions];

  return (
    <TableRow data-state={isSelected ? 'selected' : undefined}>
      <TableCell className="w-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(warehouse.id)}
        />
      </TableCell>
      {columnOrder.filter(key => visibleColumns[key]).map((key) => {
        switch (key) {
          case 'name':
            return <TableCell key={key} className="font-medium">{warehouse.name}</TableCell>;
          case 'type':
            return <TableCell key={key}>{warehouse.type}</TableCell>;
          case 'address':
            return <TableCell key={key}>{warehouse.address || '-'}</TableCell>;
          case 'status':
            return (
              <TableCell key={key}>
                {warehouse.status ? (
                  <StatusBadge statusId={warehouse.status} />
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
            );
          case 'tags':
            return (
              <TableCell key={key}>
                <div className="flex gap-1.5 flex-wrap">
                  {showTags && warehouse.tags && warehouse.tags.length > 0 ? (
                    warehouse.tags.slice(0, 3).map((tagId) => {
                      const tagConfig = availableTags.find(t => String(t.id) === String(tagId) || t.name === tagId);
                      return (
                        <Tag
                          key={String(tagId)}
                          tagId={String(tagId)}
                          name={tagConfig?.name || String(tagId)}
                          color={tagConfig?.color}
                          size="sm"
                        />
                      );
                    })
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                  {showTags && warehouse.tags && warehouse.tags.length > 3 && (
                    <Tag name={`+${warehouse.tags.length - 3}`} variant="outline" size="sm" />
                  )}
                </div>
              </TableCell>
            );
          default:
            return <TableCell key={key}>-</TableCell>;
        }
      })}
      <TableCell className="text-right w-[60px]" onClick={(e) => e.stopPropagation()}>
        {showQuickActions && onQuickAction && allOptions.length > 0 && (
          <QuickActionsMenu
            itemId={warehouse.id}
            options={allOptions}
            onAction={(action) => onQuickAction(action, warehouse.id)}
          />
        )}
      </TableCell>
    </TableRow>
  );
}
