import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Service } from "../types";
import { StatusBadge } from "@/components/ui/status-system";
import { useTranslation } from "@/lib/i18n";
import { Tag } from "@/components/ui/status-system/Tag";
import { QuickActionsMenu, QuickActionMenuOption } from "@/components/ui/QuickActionsMenu";
import { useModuleSettings } from "@/modules/settings/hooks/useModuleSettings";
import { useSettings } from "@/hooks/use-settings";
import { useModuleActions } from "@/modules/registry/hooks/useModuleActions";

interface ServiceTableRowProps {
  service: Service;
  selectedIds: Set<number>;
  visibleColumns: Record<string, boolean>;
  columnOrder?: string[];
  onToggleSelection: (id: number) => void;
  onRowClick: (service: Service) => void;
  onQuickAction?: (action: string, id: number | string) => Promise<void>;
}

export function ServiceTableRow({
  service,
  selectedIds,
  visibleColumns,
  columnOrder = ['name', 'category', 'type', 'base_cost', 'status'],
  onToggleSelection,
  onRowClick,
  onQuickAction,
}: ServiceTableRowProps) {
  const { t } = useTranslation();
  const { settings } = useModuleSettings('services');
  const { getQuickActionsByModule } = useSettings();
  const serviceActions = useModuleActions("services");
  const types = (settings?.types || []) as {id: string, name: string}[];

  // Системные действия через ActionRegistry
  const systemActions: QuickActionMenuOption[] = serviceActions.map((a: any) => ({
    label: a.labelKey.includes('.') ? t(a.labelKey) : a.labelKey,
    action: a.id,
    icon: a.icon as any,
    isQuickAction: a.defaultOrder < 50,
    variant: a.id === 'delete' ? 'destructive' : undefined,
  }));

  // Кастомные быстрые действия
  const customQuickActions: QuickActionMenuOption[] = getQuickActionsByModule('services').map((a: any) => ({
    label: a.name,
    action: a.action,
    icon: a.icon,
    isQuickAction: true,
  }));

  const allActions = [...customQuickActions, ...systemActions];

  return (
    <TableRow
      className={`hover:bg-muted/50 cursor-pointer ${selectedIds.has(service.id) ? "bg-muted" : ""}`}
      onClick={() => onRowClick(service)}
    >
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={selectedIds.has(service.id)}
          onCheckedChange={() => onToggleSelection(service.id)}
        />
      </TableCell>
      {columnOrder.filter(key => visibleColumns[key]).map(key => {
        switch (key) {
          case 'name': return (
            <TableCell key="name">
              <span className="font-medium text-foreground">{service.name}</span>
            </TableCell>
          );
          case 'category': return (
            <TableCell key="category" className="text-muted-foreground">
              {service.categoryName || "-"}
            </TableCell>
          );
          case 'type': {
            const typeObj = types.find(t => t.id === service.type);
            const typeName = typeObj ? typeObj.name : service.type;
            return (
              <TableCell key="type">
                {service.type ? <Tag name={typeName} variant="soft" /> : <span className="text-muted-foreground">—</span>}
              </TableCell>
            );
          }
          case 'base_cost': return (
            <TableCell key="base_cost" className="text-muted-foreground">
              {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(Number(service.baseCost) || 0)}
            </TableCell>
          );
          case 'status': return (
            <TableCell key="status">
              <StatusBadge
                statusId={service.status ?? 'active'}
                module="services"
                icon={<span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 shrink-0" />}
              />
            </TableCell>
          );
          case 'tags': return (
            <TableCell key="tags">
              <div className="flex flex-wrap gap-1">
                {(service.tags || []).slice(0, 2).map((tag, i) => (
                  <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                    {tag}
                  </span>
                ))}
                {(service.tags || []).length > 2 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                    +{(service.tags || []).length - 2}
                  </span>
                )}
                {!(service.tags || []).length && <span className="text-muted-foreground">—</span>}
              </div>
            </TableCell>
          );
          default: return null;
        }
      })}
      <TableCell onClick={(e) => e.stopPropagation()} className="w-10">
        <QuickActionsMenu
          itemId={service.id}
          itemName={service.name}
          options={allActions}
          onAction={async (actionType, itemId) => {
            if (onQuickAction) {
              await onQuickAction(actionType, itemId);
            }
          }}
        />
      </TableCell>
    </TableRow>
  );
}
