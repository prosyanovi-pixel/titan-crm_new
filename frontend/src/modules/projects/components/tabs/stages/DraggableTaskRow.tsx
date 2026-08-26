import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Flag, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { formatDate } from '../utils';
import type { ProjectTask } from '../../../types';

interface DraggableTaskRowProps {
  task: ProjectTask;
  stageId: number;
  onEdit: (task: ProjectTask) => void;
  onDelete: (task: ProjectTask) => void;
  /** When true, renders as the drag overlay ghost (no real position) */
  isOverlay?: boolean;
}

const PRIORITY_COLORS: Record<string, string> = {
  High: 'text-red-500',
  Medium: 'text-amber-500',
  Low: 'text-green-500',
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  'To Do': 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'Review': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  'Done': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
};

/**
 * A draggable task row for use inside ProjectStagesTable.
 * Uses @dnd-kit/core useDraggable to enable cross-stage drag-and-drop.
 */
export function DraggableTaskRow({
  task,
  stageId,
  onEdit,
  onDelete,
  isOverlay = false,
}: DraggableTaskRowProps) {
  const { t } = useTranslation();

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(task.id),
    data: { task, stageId },
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center justify-between p-2 bg-background rounded-lg border',
        'hover:bg-muted/40 transition-all duration-150 group',
        isDragging && 'opacity-40 scale-95 border-dashed border-primary/50',
        isOverlay && 'shadow-xl ring-2 ring-primary/30 scale-[1.02] opacity-100 cursor-grabbing',
        !isOverlay && !isDragging && 'cursor-default',
      )}
    >
      {/* Drag Handle */}
      <button
        {...listeners}
        {...attributes}
        className={cn(
          'flex-shrink-0 p-0.5 rounded mr-1',
          'text-muted-foreground/30 hover:text-muted-foreground/80',
          'cursor-grab active:cursor-grabbing',
          'focus:outline-none focus-visible:ring-1 focus-visible:ring-primary',
          'transition-colors duration-100',
        )}
        onClick={(e) => e.stopPropagation()}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Content */}
      <div
        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
        onClick={() => onEdit(task)}
      >
        {/* Priority Icon */}
        <Flag className={cn('w-3.5 h-3.5 flex-shrink-0', PRIORITY_COLORS[task.priority] ?? 'text-muted-foreground')} />

        {/* Title */}
        <span className={cn(
          'text-sm font-medium truncate',
          task.status === 'Done' && 'line-through text-muted-foreground',
        )}>
          {task.title}
        </span>

        {/* Assignee */}
        {task.assignee && (
          <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
            <Users className="w-3 h-3" />
            {task.assignee}
          </span>
        )}
      </div>

      {/* Right side meta */}
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        {task.dueDate && (
          <span className="text-xs text-muted-foreground hidden md:block">
            {formatDate(task.dueDate)}
          </span>
        )}
        <Badge
          variant="secondary"
          className={cn('text-xs px-1.5 py-0.5', STATUS_BADGE_CLASSES[task.status] ?? '')}
        >
          {t(`projects.stages.task_status.${task.status}`) || task.status}
        </Badge>

        {/* Actions (hidden when overlay) */}
        {!isOverlay && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
                <Edit className="w-3 h-3 mr-2" />
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDelete(task); }}
                className="text-destructive"
              >
                <Trash2 className="w-3 h-3 mr-2" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
