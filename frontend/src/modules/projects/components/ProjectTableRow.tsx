// frontend/src/modules/projects/components/ProjectTableRow.tsx
import { useCallback } from "react";
import { Project } from "../types";
import { useTranslation } from "@/lib/i18n";
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { StatusBadge, PriorityBadge, Tag, Badge, BadgeVariant } from "@/components/ui/status-system";
import { Button } from "@/components/ui/button";
import { QuickActionsMenu } from "@/components/ui/QuickActionsMenu";
import { ChevronRight, ChevronDown } from "lucide-react";
import { QuickAction } from "@/lib/settings-data";
import { useSettings } from "@/hooks/use-settings";

interface ProjectTableRowProps {
  project: Project;
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  visibleColumns: Record<string, boolean>;
  columnOrder: string[];
  onToggleSelection: (id: number) => void;
  onEdit: (project: Project) => void;
  onAction: (action: string, project: Project) => void;
  onExpandChange: (id: number, expanded: boolean) => void;
  quickActions: QuickAction[];
}

export function ProjectTableRow({
  project,
  level = 0,
  isExpanded,
  isSelected,
  visibleColumns,
  columnOrder,
  onToggleSelection,
  onEdit,
  onAction,
  onExpandChange,
  quickActions,
}: ProjectTableRowProps) {
  const { t } = useTranslation();
  const { getTagsByModule, getProjectStages } = useSettings();
  const hasSubProjects = project.subProjects && project.subProjects.length > 0;
  
  // Получаем конфигурацию стадии из справочника
  const stageConfig = getProjectStages().find((stage) => stage.id === project.stage);
  const stageLabel = stageConfig?.name || project.stage || t('common.no_data');

  const handleExpandClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onExpandChange(project.id, !isExpanded);
  }, [project.id, isExpanded, onExpandChange]);

  const handleRowClick = useCallback(() => {
    onEdit(project);
  }, [project, onEdit]);

  const handleStopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const allActions = [
    ...quickActions.map(a => ({
      label: a.name,
      action: a.action,
      icon: a.icon,
    })),
    { label: t('common.edit'), action: 'edit', icon: 'Pencil' },
    { label: t('common.delete'), action: 'delete', icon: 'Trash2', variant: 'destructive' as const },
  ];

  return (
    <TableRow
      className="cursor-pointer"
      onClick={handleRowClick}
      data-state={isSelected ? "selected" : undefined}
    >
      <TableCell onClick={handleStopPropagation} className="w-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(project.id)}
        />
      </TableCell>

      {columnOrder.filter(key => visibleColumns[key]).map((key) => {
        switch (key) {
          case 'name':
            return (
              <TableCell key="name">
                <div style={{ paddingLeft: `${level * 24}px` }} className="flex items-center gap-2">
                  {hasSubProjects && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 p-0 hover:bg-muted"
                      onClick={handleExpandClick}
                    >
                      {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                  {!hasSubProjects && level > 0 && (
                    <div className="w-5 h-5 shrink-0" /> // Placeholder for alignment
                  )}
                  <span className="font-semibold truncate">{project.name}</span>
                </div>
              </TableCell>
            );
          case 'client':
            return (
              <TableCell key="client" className="text-muted-foreground truncate">
                {project.client || t('common.no_data')}
              </TableCell>
            );
          case 'manager':
            return (
              <TableCell key="manager">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarImage src={project.managerAvatar || ''} alt={project.manager} />
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {project.manager?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs truncate">{project.manager}</span>
                </div>
              </TableCell>
            );
          case 'status':
            return (
              <TableCell key="status">
                <StatusBadge statusId={project.status} />
              </TableCell>
            );
          case 'stage':
            return (
              <TableCell key="stage">
                {stageConfig ? (
                  <Badge 
                    id={project.stage} 
                    name={stageLabel} 
                    color={stageConfig.color} 
                    variant={stageConfig.variant as BadgeVariant}
                    size="sm"
                  />
                ) : (
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                    {stageLabel}
                  </span>
                )}
              </TableCell>
            );
          case 'priority':
            return (
              <TableCell key="priority">
                <PriorityBadge priorityId={project.priority} />
              </TableCell>
            );
          case 'tags':
            return (
              <TableCell key="tags">
                <div className="flex gap-1 flex-wrap">
                  {project.tags && project.tags.length > 0 ? (
                    project.tags.map(tagId => {
                      const tagConfig = getTagsByModule('projects').find(t => String(t.id) === String(tagId) || t.name === tagId);
                      return (
                        <Tag 
                          key={tagId} 
                          tagId={tagId} 
                          name={tagConfig?.name} 
                          color={tagConfig?.color} 
                          variant="soft"
                          size="sm"
                        />
                      );
                    })
                  ) : <span className="text-muted-foreground text-[10px]">@{t('common.no_tags')}</span>}
                </div>
              </TableCell>
            );
          case 'budget':
            return (
              <TableCell key="budget">
                <div className="flex items-center gap-2 min-w-[120px]">
                  <Progress value={project.budgetUsedPercent ?? 0} className="h-1.5 flex-1" />
                  <span className="text-[10px] font-bold text-muted-foreground w-8">
                    {project.budgetUsedPercent ?? 0}%
                  </span>
                </div>
              </TableCell>
            );
          default:
            return null;
        }
      })}

      <TableCell onClick={handleStopPropagation} className="w-10">
        <QuickActionsMenu
          itemId={project.id}
          itemName={project.name}
          options={allActions}
          onAction={(action) => onAction(action, project)}
        />
      </TableCell>
    </TableRow>
  );
}
