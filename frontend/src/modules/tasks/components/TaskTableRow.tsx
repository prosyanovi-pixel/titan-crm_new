// frontend/src/modules/tasks/components/TaskTableRow.tsx
import { useCallback } from "react";
import { Task } from "../types";
import { useTranslation } from "@/lib/i18n";
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge, PriorityBadge } from "@/components/ui/status-system";
import { Button } from "@/components/ui/button";
import { QuickActionsMenu, QuickActionMenuOption } from "@/components/ui/QuickActionsMenu";
import { ChevronRight, ChevronDown, Calendar, CheckSquare } from "lucide-react";
import React from 'react';
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/use-settings";
import { useModuleActions } from "@/modules/registry/hooks/useModuleActions";

interface TaskTableRowProps {
  task: Task;
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  visibleColumns: Record<string, boolean>;
  columnOrder: string[];
  onToggleSelection: (id: string) => void;
  onEdit: (task: Task) => void;
  onAction: (action: string, itemId: string | number) => void;
  onExpandChange: (id: string, expanded: boolean) => void;
}

export function TaskTableRow({
  task,
  level = 0,
  isExpanded,
  isSelected,
  visibleColumns,
  columnOrder,
  onToggleSelection,
  onEdit,
  onAction,
  onExpandChange,
}: TaskTableRowProps) {
  const { t } = useTranslation();
  const { getQuickActionsByModule } = useSettings();
  const taskActions = useModuleActions("tasks");
  const hasSubTasks = task.subTasks && task.subTasks.length > 0;

  const handleExpandClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onExpandChange(task.id, !isExpanded);
  }, [task.id, isExpanded, onExpandChange]);

  const handleRowClick = useCallback(() => {
    onEdit(task);
  }, [task, onEdit]);

  const handleStopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // Системные действия через ActionRegistry
  const systemActions: QuickActionMenuOption[] = taskActions.map((a: any) => ({
    label: a.labelKey.includes('.') ? t(a.labelKey) : a.labelKey,
    action: a.id,
    icon: a.icon as any,
    isQuickAction: a.defaultOrder < 50,
    variant: a.id === 'delete' ? 'destructive' : undefined,
  }));

  // Кастомные быстрые действия
  const customQuickActions: QuickActionMenuOption[] = getQuickActionsByModule('tasks').map((a: any) => ({
    label: a.name,
    action: a.action,
    icon: a.icon,
    isQuickAction: true,
  }));

  const allActions = [...customQuickActions, ...systemActions];

  const mainRowContent = (
    <>
      <TableCell onClick={handleStopPropagation} className="w-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(task.id)}
        />
      </TableCell>

      {columnOrder.filter(key => visibleColumns[key]).map((key) => {
        switch (key) {
          case 'id':
            return (
              <TableCell key="id" className="font-mono text-muted-foreground" style={{ fontSize: 'var(--table-font-meta)' }} onClick={handleRowClick}>
                {task.identifier}
              </TableCell>
            );
          case 'title':
            return (
              <TableCell key="title" onClick={handleRowClick}>
                <div style={{ paddingLeft: `${level * 24}px` }} className="flex items-center gap-2">
                  {hasSubTasks && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 p-0 hover:bg-muted"
                      onClick={handleExpandClick}
                    >
                      {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                  {!hasSubTasks && level > 0 && (
                    <div className="w-5 h-5 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className={cn(
                      "font-semibold text-sm truncate",
                      task.status === "Done" && "line-through opacity-50"
                    )}>
                      {task.title}
                    </p>
                    <p className="text-muted-foreground truncate opacity-70" style={{ fontSize: 'var(--table-font-meta)' }}>
                      {task.project || t('tasks.general_project')}
                    </p>
                  </div>
                </div>
              </TableCell>
            );
          case 'status':
            return (
              <TableCell key="status" onClick={handleRowClick}>
                <StatusBadge statusId={task.status} />
              </TableCell>
            );
          case 'priority':
            return (
              <TableCell key="priority" onClick={handleRowClick}>
                <PriorityBadge priorityId={task.priority} />
              </TableCell>
            );
          case 'assignee':
            return (
              <TableCell key="assignee" onClick={handleRowClick}>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarImage src={task.assigneeAvatar || ''} alt={task.assignee} />
                    <AvatarFallback className="bg-primary/10 text-primary uppercase" style={{ fontSize: 'var(--table-font-meta)' }}>
                      {task.assigneeInitials || (typeof task.assignee === 'string' ? task.assignee.substring(0, 2) : '?')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate" style={{ fontSize: 'var(--table-font-meta)' }}>
                    {task.assignee}
                  </span>
                </div>
              </TableCell>
            );
          case 'dueDate':
            return (
              <TableCell key="dueDate" onClick={handleRowClick}>
                <div className="flex items-center gap-1.5 text-muted-foreground whitespace-nowrap" style={{ fontSize: 'var(--table-font-meta)' }}>
                  <Calendar className="w-3 h-3" />
                  {task.dueDate}
                </div>
              </TableCell>
            );
          default:
            return null;
        }
      })}

      <TableCell onClick={handleStopPropagation} className="w-10">
        <QuickActionsMenu
          itemId={task.id}
          itemName={task.title}
          options={allActions}
          onAction={(action) => onAction(action, task.id)}
        />
      </TableCell>
    </>
  );

  const subRows = isExpanded && task.subTasks?.map((sub) => (
    <TableRow key={sub.id} className="bg-muted/5 border-l-2 border-l-muted/30">
        <TableCell />
        <TableCell colSpan={columnOrder.filter(k => visibleColumns[k]).length}>
        <div style={{ paddingLeft: `${(level + 1) * 24}px` }} className="flex items-center gap-2 py-1">
            <CheckSquare className={cn("w-3.5 h-3.5", sub.completed ? "text-green-500" : "text-muted-foreground/40")} />
            <span className={cn(sub.completed ? "line-through text-muted-foreground" : "text-foreground")} style={{ fontSize: 'var(--table-font-meta)' }}>
            {sub.title}
            </span>
        </div>
        </TableCell>
        <TableCell />
    </TableRow>
  ));

  return (
    <>
        <TableRow className="cursor-pointer" data-state={isSelected ? "selected" : undefined}>
            {mainRowContent}
        </TableRow>
        {subRows}
    </>
  );
}
