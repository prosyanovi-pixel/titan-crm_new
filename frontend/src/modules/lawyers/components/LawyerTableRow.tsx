// frontend/src/modules/lawyers/components/LawyerTableRow.tsx
import { Lawyer } from "../types";
import { useTranslation } from "@/lib/i18n";
import { TableCell, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-system";
import { QuickActionsMenu, QuickActionMenuOption } from "@/components/ui/QuickActionsMenu";
import { useSettings } from "@/hooks/use-settings";
import { useModuleActions } from "@/modules/registry/hooks/useModuleActions";

interface LawyerTableRowProps {
  lawyer: Lawyer;
  visibleColumns: Record<string, boolean>;
  columnOrder: string[];
  onEdit: (lawyer: Lawyer) => void;
  onAction?: (action: string, id: string | number) => void;
}

export function LawyerTableRow({ 
  lawyer, 
  visibleColumns, 
  columnOrder, 
  onEdit,
  onAction,
}: LawyerTableRowProps) {
  const { t } = useTranslation();
  const { getQuickActionsByModule } = useSettings();
  const lawyerActions = useModuleActions("lawyers");

  // Системные действия через ActionRegistry
  const systemActions: QuickActionMenuOption[] = lawyerActions.map((a: any) => ({
    label: a.labelKey.includes('.') ? t(a.labelKey) : a.labelKey,
    action: a.id,
    icon: a.icon as any,
    isQuickAction: a.defaultOrder < 50,
    variant: a.id === 'delete' ? 'destructive' : undefined,
  }));

  // Кастомные быстрые действия
  const customQuickActions: QuickActionMenuOption[] = getQuickActionsByModule('lawyers').map((a: any) => ({
    label: a.name,
    action: a.action,
    icon: a.icon,
    isQuickAction: true,
  }));

  const allActions = [...customQuickActions, ...systemActions];

  return (
    <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => onEdit(lawyer)}>
      <TableCell className="w-10" />
      {columnOrder.filter(key => visibleColumns[key]).map(key => {
        switch (key) {
          case 'name': return (
            <TableCell key="name">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={lawyer.avatar || ''} alt={lawyer.name} />
                  <AvatarFallback className="bg-primary/10 text-primary uppercase text-[10px]">
                    {lawyer.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{lawyer.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate opacity-70">{lawyer.email}</p>
                </div>
              </div>
            </TableCell>
          );
          case 'specialization': return (
            <TableCell key="specialization">
              <div className="flex flex-wrap gap-1">
                {(Array.isArray(lawyer.specializations) ? lawyer.specializations : []).map(spec => (
                  <Badge key={spec} variant="secondary" className="text-[10px] h-4 px-1.5 font-normal">
                    {t(`lawyers.specialization.${spec}`)}
                  </Badge>
                ))}
              </div>
            </TableCell>
          );
          case 'rating': return (
            <TableCell key="rating">
              <div className="flex items-center gap-1 font-bold text-sm">
                <span className="text-amber-500 text-xs">★</span> {lawyer.rating}
              </div>
            </TableCell>
          );
          case 'caseload': return (
            <TableCell key="caseload">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm">{lawyer.activeCasesCount}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-tight">{t('generated.del')}</span>
              </div>
            </TableCell>
          );
          case 'status': return (
            <TableCell key="status">
              <StatusBadge statusId={lawyer.status} />
            </TableCell>
          );
          default: return null;
        }
      })}
      <TableCell className="w-10" onClick={e => e.stopPropagation()}>
        <QuickActionsMenu
          itemId={lawyer.id}
          itemName={lawyer.name}
          options={allActions}
          onAction={onAction ?? (() => {})}
        />
      </TableCell>
    </TableRow>
  );
}
