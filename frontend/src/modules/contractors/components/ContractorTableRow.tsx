import {
  TableCell,
  TableRow
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge, StatusDot } from "@/components/ui/status-system";
import { Tag } from "@/components/ui/status-system/Tag";
import { Badge } from "@/components/ui/badge";
import { QuickActionsMenu, QuickActionMenuOption } from "@/components/ui/QuickActionsMenu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSettings } from "@/hooks/use-settings";
import { useTranslation } from "@/lib/i18n";
import { useModuleSettings } from "@/modules/settings/hooks/useModuleSettings";
import { Contractor } from "../types/contractor.types";

interface ContractorTableRowProps {
  contractor: Contractor;
  selectedIds: Set<string | number>;
  visibleColumns: Record<string, boolean>;
  columnOrder: string[];
  onToggleSelection: (id: string | number) => void;
  onRowClick: (contractor: Contractor) => void;
  onQuickAction: (action: string, id: number | string) => Promise<void>;
  relationshipTypes: Array<{ id: string; name: string; color?: string }>;
}

export function ContractorTableRow({
  contractor,
  selectedIds,
  visibleColumns,
  columnOrder,
  onToggleSelection,
  onRowClick,
  onQuickAction,
  relationshipTypes = [],
}: ContractorTableRowProps) {
  const { getQuickActionsByModule, getTagsByModule } = useSettings();
  const { t } = useTranslation();
  const { settings } = useModuleSettings("contractors");
  const contractorActions = getQuickActionsByModule('contractors');
  const availableTags = getTagsByModule('contractors');

  const showQuickActions = settings.features?.enableQuickActions !== false;
  const showTags = settings.features?.enableTags !== false;

  const allActions: QuickActionMenuOption[] = [
    ...contractorActions.map(a => ({
      label: a.name,
      action: a.action,
      icon: a.icon,
      isQuickAction: true,
    })),
    { label: t('common.view'), action: 'view', icon: 'Eye', isQuickAction: false },
    { label: t('common.edit'), action: 'edit', icon: 'Pencil', isQuickAction: false },
    { label: t('common.delete'), action: 'delete', icon: 'Trash2', isQuickAction: false, variant: 'destructive' as const },
  ];

  const isSelected = selectedIds.has(contractor.id);

  return (
    <TableRow
      key={contractor.id}
      className={`hover:bg-muted/50 cursor-pointer ${isSelected ? "bg-muted" : ""}`}
      onClick={() => onRowClick(contractor)}
    >
      <TableCell onClick={(e) => e.stopPropagation()} className="w-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(contractor.id)}
        />
      </TableCell>
      {columnOrder.filter(key => visibleColumns[key]).map(key => {
        switch (key) {
          case 'name': return (
            <TableCell key="name">
              <div className="flex items-center gap-2">
                <StatusDot statusId={contractor.status} title={contractor.statusName} size="sm" />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground truncate">{contractor.name}</span>
                    {contractor.isEmployee && (
                      <Badge variant="secondary" className="h-4 px-1.5 shrink-0" style={{ fontSize: 'var(--table-font-meta)' }}>{t('common.employee')}</Badge>
                    )}
                  </div>
                  {contractor.inn && (
                    <span className="text-[10px] text-muted-foreground truncate">{t('contractor_sheet.field.inn')} {contractor.inn}</span>
                  )}
                </div>
              </div>
            </TableCell>
          );
          case 'tags': return (
            <TableCell key="tags">
              <div className="flex gap-1.5 flex-wrap">
                {showTags && contractor.tags && contractor.tags.length > 0 ? (
                  <>
                    {contractor.tags.slice(0, 5).map((tagId) => {
                      const tagConfig = availableTags.find(t => String(t.id) === String(tagId) || t.name === tagId);
                      return (
                        <Tag 
                          key={tagId} 
                          tagId={tagId} 
                          name={tagConfig?.name} 
                          color={tagConfig?.color} 
                        />
                      );
                    })}
                    {contractor.tags.length > 5 && (
                      <Tag name={`+${contractor.tags.length - 5}`} variant="soft" />
                    )}
                  </>
                ) : <span className="text-muted-foreground" style={{ fontSize: 'var(--table-font-meta)' }}>—</span>}
              </div>
            </TableCell>
          );
          case 'type': return (
            <TableCell key="type">
              {(() => {
                const rt = relationshipTypes.find(r => r.id === contractor.type);
                if (!rt) return <span className="truncate" style={{ fontSize: 'var(--table-font-meta)' }}>{contractor.type || t('common.no_data')}</span>;
                return <Tag name={rt.name} color={rt.color} variant="solid" rounded="sm" />;
              })()}
            </TableCell>
          );
          case 'status': return (
            <TableCell key="status">
              <StatusBadge
                statusId={contractor.status}
                name={contractor.statusName}
                icon={<span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 shrink-0" />}
              />
            </TableCell>
          );
          case 'phone': return (
            <TableCell key="phone" className="text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontSize: 'var(--table-font-meta)' }}>
              {contractor.phone}
            </TableCell>
          );
          case 'manager': return (
            <TableCell key="manager" style={{ fontSize: 'var(--table-font-meta)' }}>
              {contractor.manager ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarImage src={contractor.managerAvatar || ''} alt={contractor.manager} />
                    <AvatarFallback className="bg-primary/10 text-primary uppercase" style={{ fontSize: 'var(--table-font-meta)' }}>
                      {contractor.manager.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{contractor.manager}</span>
                </div>
              ) : null}
            </TableCell>
          );
          default: return null;
        }
      })}
      <TableCell onClick={(e) => e.stopPropagation()} className="w-10">
        {showQuickActions && (
          <QuickActionsMenu
            itemId={contractor.id}
            itemName={contractor.name}
            options={allActions}
            onAction={async (actionType, itemId) => await onQuickAction(actionType, itemId)}
          />
        )}
      </TableCell>
    </TableRow>
  );
}
