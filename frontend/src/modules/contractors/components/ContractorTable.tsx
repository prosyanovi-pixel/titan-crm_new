import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge, StatusDot } from "@/components/ui/status-system";
import { Tag } from "@/components/ui/status-system/Tag";
import { Badge } from "@/components/ui/badge";
import { QuickActionsMenu, QuickActionMenuOption } from "@/components/ui/QuickActionsMenu";
import { useSettings } from "@/hooks/use-settings";
import { useTranslation } from "@/lib/i18n";
import { useModuleActions } from "@/modules/registry/hooks/useModuleActions";
import { Contractor } from "../types/contractor.types";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { LegalFormBadge } from "./LegalFormBadge";

interface ContractorTableProps {
  contractors: Contractor[];
  selectedIds: Set<number>;
  visibleColumns: Record<string, boolean>;
  columnOrder?: string[];
  onToggleSelection: (id: number) => void;
  onToggleAllSelection: (contractors: Contractor[]) => void;
  onRowClick: (contractor: Contractor) => void;
  onQuickAction: (action: string, id: number | string) => Promise<void>;
  loading: boolean;
  relationshipTypes?: Array<{ id: string; name: string; color?: string }>;
  columnWidths?: Record<string, number>;
}

export function ContractorTable({
  contractors,
  selectedIds,
  visibleColumns,
  columnOrder,
  onToggleSelection,
  onToggleAllSelection,
  onRowClick,
  onQuickAction,
  loading,
  relationshipTypes = [],
  columnWidths,
}: ContractorTableProps) {
  const { t } = useTranslation();
  const { getQuickActionsByModule } = useSettings();
  const contractorActions = getQuickActionsByModule('contractors');
  const contractorRelTypes = relationshipTypes;
  const moduleActions = useModuleActions("contractors");

  const systemActions: QuickActionMenuOption[] = moduleActions.map((a: any) => ({
    label: a.labelKey.includes('.') ? t(a.labelKey) : a.labelKey,
    action: a.id,
    icon: a.icon as any,
    isQuickAction: a.defaultOrder < 50,
    variant: a.id === 'delete' ? 'destructive' : undefined,
  }));

  // Combine quick actions with regular actions
  const allActions: QuickActionMenuOption[] = [
    // Quick actions from DB (sorted by displayorder)
    ...contractorActions.map(a => ({
      label: a.name,
      action: a.action,
      icon: a.icon,
      isQuickAction: true,
    })),
    // Separator will be added in QuickActionsMenu
    // Regular actions
    ...systemActions
  ];

  const isAllSelected = contractors.length > 0 && selectedIds && selectedIds.size === contractors.length;
  const isIndeterminate = selectedIds && selectedIds.size > 0 && selectedIds.size < contractors.length;

  if (contractors.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
          {loading ? t('common.loading') : t('common.no_data')}
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {contractors.map((contractor) => (
        <TableRow
          key={contractor.id}
          className={`hover:bg-muted/50 cursor-pointer ${selectedIds && selectedIds.has(contractor.id) ? "bg-muted" : ""}`}
          onClick={() => onRowClick(contractor)}
        >
          <TableCell onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={selectedIds && selectedIds.has(contractor.id)}
              onCheckedChange={() => onToggleSelection(contractor.id)}
            />
          </TableCell>
          {(columnOrder ?? ['name', 'tags', 'type', 'status', 'phone', 'manager']).filter(key => visibleColumns[key]).map(key => {
            switch (key) {
              case 'name': return (
                <TableCell key="name" style={{ width: columnWidths?.['name'] }}>
                  <div className="flex items-center gap-2">
                    <StatusDot statusId={contractor.status} title={contractor.statusName} size="sm" />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{contractor.name}</span>
                        {contractor.isEmployee && (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{t('generated.sotrudnik')}</Badge>
                        )}
                      </div>
                      {contractor.inn && <span className="text-[10px] text-muted-foreground">{t('contractor_sheet.field.inn')} {contractor.inn}</span>}
                    </div>
                  </div>
                </TableCell>
              );
              case 'tags': return (
                <TableCell key="tags" style={{ width: columnWidths?.['tags'] }}>
                  <div className="flex gap-1.5 flex-wrap gap-y-2">
                    {contractor.tags && contractor.tags.length > 0 ? (
                      <>
                        {contractor.tags.slice(0, 3).map((tagId) => (
                          <Tag key={tagId} tagId={tagId} />
                        ))}
                        {contractor.tags.length > 3 && (
                          <Tag name={`+${contractor.tags.length - 3}`} variant="soft" />
                        )}
                      </>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </div>
                </TableCell>
              );
              case 'type': return (
                <TableCell key="type" style={{ width: columnWidths?.['type'] }}>
                  {(() => {
                    const rt = contractorRelTypes.find(r => r.id === contractor.type);
                    if (!rt) return contractor.type || <span className="text-muted-foreground text-xs">—</span>;
                    return <Tag name={rt.name} color={rt.color} variant="solid" rounded="sm" />;
                  })()}
                </TableCell>
              );
              case 'status': return (
                <TableCell key="status" style={{ width: columnWidths?.['status'] }}>
                  <StatusBadge
                    statusId={contractor.status}
                    name={contractor.statusName}
                    icon={<span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 shrink-0" />}
                  />
                </TableCell>
              );
              case 'phone': return (
                <TableCell key="phone" className="text-muted-foreground whitespace-nowrap" style={{ width: columnWidths?.['phone'] }}>
                  {contractor.phone}
                </TableCell>
              );
              case 'manager': return (
                <TableCell key="manager" className="text-foreground" style={{ width: columnWidths?.['manager'] }}>
                  {contractor.manager}
                </TableCell>
              );
              default: return null;
            }
          })}
          <TableCell onClick={(e) => e.stopPropagation()} className="w-[40px] max-w-[40px] min-w-[40px] p-0">
            <div className="relative flex items-center justify-center" style={{ width: '40px', height: '48px' }}>
              <QuickActionsMenu
                itemId={contractor.id}
                itemName={contractor.name}
                options={allActions}
                onAction={async (actionType, itemId) => await onQuickAction(actionType, itemId)}
              />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}