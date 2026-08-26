import React from "react";
import { Project } from "../../types";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { PriorityBadge } from "@/components/ui/status-system";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, CalendarDays, Paperclip, Edit2, Trash2, Archive, Copy } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

export interface KanbanCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete?: (projectId: number) => void;
  onArchive?: (projectId: number) => void;
  onDuplicate?: (projectId: number) => void;
  parentProjectName?: string;
  isOverlay?: boolean;
}

export const ProjectKanbanCard = ({ project, onEdit, onDelete, onArchive, onDuplicate, parentProjectName, isOverlay }: KanbanCardProps) => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: project.id.toString(),
    data: { project },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : undefined,
    zIndex: isDragging ? 50 : undefined,
    ...(isOverlay ? {
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      cursor: "grabbing",
      transform: "scale(1.02)",
      opacity: 1,
    } : {})
  };

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow border-l-4 border-l-primary/50 hover:border-l-primary ${isOverlay ? 'border-primary' : ''}`}
      onClick={() => onEdit(project)}
    >
      <CardHeader className="p-3 pb-2 space-y-0">
        {parentProjectName && (
          <div className="mb-2 inline-block">
            <span className="inline-flex items-center px-2 py-1 text-[10px] font-semibold text-muted-foreground bg-muted rounded-md truncate max-w-full">
              ↳ {parentProjectName}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center mb-2">
          <PriorityBadge 
            priorityId={project.priority}
            className="truncate max-w-[80%]"
          />
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 -mr-2 shrink-0"
                onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
                onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onEdit(project);
                setIsMenuOpen(false);
              }}>
                <Edit2 className="w-4 h-4 mr-2" />
                {t('general.actions.edit')}
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                if (onDuplicate) onDuplicate(project.id);
                setIsMenuOpen(false);
              }}>
                <Copy className="w-4 h-4 mr-2" />
                {t('general.actions.duplicate') || 'Дублировать'}
              </DropdownMenuItem>
              
              {(onArchive || onDelete) && <DropdownMenuSeparator />}
              
              {onArchive && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onArchive(project.id);
                  setIsMenuOpen(false);
                }}>
                  <Archive className="w-4 h-4 mr-2" />
                  {t('general.actions.archive') || 'Архивировать'}
                </DropdownMenuItem>
              )}
              
              {onDelete && (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(project.id);
                    setIsMenuOpen(false);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('general.actions.delete')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardTitle className="text-sm font-medium leading-snug line-clamp-2">
          {project.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
          <Avatar className="h-5 w-5 shrink-0">
            <AvatarImage src={project.managerAvatar || ''} alt={project.manager} />
            <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
              {project.manager.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{project.client}</span>
        </div>
        
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t('projects.stats.budget')}</span>
            <span>{project.budgetUsed}%</span>
          </div>
          <Progress value={project.budgetUsed} className="h-1.5" />
        </div>
      </CardContent>
      <CardFooter className="p-3 pt-0 flex justify-between text-xs text-muted-foreground border-t bg-muted/20 mt-1">
        <div className="flex items-center gap-1 mt-2">
          <CalendarDays className="w-3.5 h-3.5" />
          {project.deadline}
        </div>
        <div className="flex items-center gap-1 mt-2">
          <Paperclip className="w-3.5 h-3.5" />
          {project.completedTasks}/{project.tasksCount}
        </div>
      </CardFooter>
    </Card>
  );
};
