import React from "react";
import { Service } from "../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-system";
import { Tag } from "@/components/ui/status-system/Tag";
import { useTranslation } from "@/lib/i18n";
import { QuickActionsMenu, QuickActionMenuOption } from "@/components/ui/QuickActionsMenu";
import { useSettings } from "@/hooks/use-settings";

interface ServicesTableProps {
  services: Service[];
  isLoading: boolean;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
  onQuickAction?: (action: string, id: number) => Promise<void>;
  showQuickActions?: boolean;
  showTags?: boolean;
  selectedIds?: Set<number>;
  onToggleSelection?: (id: number) => void;
  onToggleAll?: () => void;
}

export function ServicesTable({
  services,
  isLoading,
  onEdit,
  onDelete,
  onQuickAction,
  showQuickActions = true,
  showTags = true,
  selectedIds = new Set(),
  onToggleSelection,
  onToggleAll,
}: ServicesTableProps) {
  const { t } = useTranslation();
  const { getQuickActionsByModule, getTagsByModule } = useSettings();

  const quickActions = getQuickActionsByModule('services');
  const availableTags = getTagsByModule('services');

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="w-full h-10" />
        <Skeleton className="w-full h-10" />
        <Skeleton className="w-full h-10" />
      </div>
    );
  }



  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'pnr': return t('services.types.pnr');
      case 'installation': return t('services.types.installation');
      case 'delivery': return t('services.types.delivery');
      case 'consulting': return t('services.types.consulting');
      case 'maintenance': return t('services.types.maintenance');
      default: return type;
    }
  };

  const getCostTypeLabel = (type: string) => {
    switch (type) {
      case 'fixed': return t('services.cost_types.fixed');
      case 'hourly': return t('services.cost_types.hourly');
      case 'percentage': return t('services.cost_types.percentage');
      default: return type;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('services.service.name')}</TableHead>
          <TableHead>{t('services.service.type')}</TableHead>
          <TableHead>{t('services.service.category')}</TableHead>
          <TableHead>{t('services.service.cost')}</TableHead>
          <TableHead>{t('services.service.cost_type')}</TableHead>
          <TableHead>{t('services.service.status')}</TableHead>
          <TableHead>{t('services.service.tags')}</TableHead>
          <TableHead className="text-right w-[60px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {services.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
              {t('services.table.empty_message')}
            </TableCell>
          </TableRow>
        ) : (
          services.map((service) => {
            const options: QuickActionMenuOption[] = [
            ...quickActions.map(a => ({
              label: a.name,
              action: a.action,
              icon: a.icon,
              isQuickAction: true,
            })),
            { label: t('common.edit'), action: 'edit', icon: 'Pencil', isQuickAction: false },
            { label: t('common.delete'), action: 'delete', icon: 'Trash2', isQuickAction: false, variant: 'destructive' as const },
          ];

          return (
            <TableRow key={service.id}>
              <TableCell className="font-medium">{service.name}</TableCell>
              <TableCell>{getTypeLabel(service.type)}</TableCell>
              <TableCell>{service.categoryName || "-"}</TableCell>
              <TableCell>
                {service.costType === 'percentage'
                  ? `${service.baseCost}%`
                  : Number(service.baseCost).toLocaleString("ru-RU", { style: "currency", currency: "RUB" })
                }
              </TableCell>
              <TableCell>{getCostTypeLabel(service.costType)}</TableCell>
              <TableCell>
                {service.status ? (
                  <StatusBadge statusId={service.status} module="services" />
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-1.5 flex-wrap">
                  {showTags && service.tags && service.tags.length > 0 ? (
                    service.tags.slice(0, 3).map((tagId) => {
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
                  {showTags && service.tags && service.tags.length > 3 && (
                    <Tag name={`+${service.tags.length - 3}`} variant="outline" size="sm" />
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right w-[60px]" onClick={(e) => e.stopPropagation()}>
                {showQuickActions && options.length > 0 && (
                  <QuickActionsMenu
                    itemId={service.id}
                    options={options}
                    onAction={async (action) => {
                      if (action === 'edit') {
                        onEdit(service);
                      } else if (action === 'delete') {
                        onDelete(service);
                      } else if (onQuickAction) {
                        await onQuickAction(action, service.id);
                      }
                    }}
                  />
                )}
              </TableCell>
            </TableRow>
          );
          })
        )}
      </TableBody>
    </Table>
  );
}
