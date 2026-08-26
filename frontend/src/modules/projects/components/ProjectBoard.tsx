import React, { useState } from "react";
import { Project } from "../types";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";
import { ProjectKanbanCard } from "./board/ProjectKanbanCard";
import { useSettings } from "@/hooks/use-settings";
import { Badge, BadgeVariant } from "@/components/ui/status-system";
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent, 
  DragStartEvent,
  useDroppable 
} from "@dnd-kit/core";
import { createPortal } from "react-dom";

interface ProjectBoardProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete?: (projectId: number) => void;
  onArchive?: (projectId: number) => void;
  onDuplicate?: (projectId: number) => void;
  onStageChange?: (projectId: number, newStage: string) => void;
}

interface DroppableColumnProps {
  column: {
    id: string;
    title: string;
    color: string;
    variant: BadgeVariant;
  };
  projects: Project[];
  uniqueProjects: Project[];
  projectsMap: Map<number, Project>;
  onEdit: (project: Project) => void;
  onDelete?: (projectId: number) => void;
  onArchive?: (projectId: number) => void;
  onDuplicate?: (projectId: number) => void;
  t: (key: string) => string;
}

// Droppable Column Component
function DroppableColumn({ 
  column, 
  projects, 
  uniqueProjects, 
  projectsMap,
  onEdit, 
  onDelete, 
  onArchive, 
  onDuplicate,
  t
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`w-80 shrink-0 flex flex-col h-full rounded-lg border transition-colors ${isOver ? 'bg-primary/5 border-primary/50' : 'border-transparent bg-transparent'}`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Badge 
            id={column.id} 
            name={column.title} 
            color={column.color} 
            variant={column.variant}
          />
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            {uniqueProjects.filter((p) => p.stage === column.id).length}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
      
      <div className="flex flex-col gap-2 rounded-lg p-2 min-h-[500px] bg-muted/30">
        {uniqueProjects
          .filter((project) => project.stage === column.id)
          .map((project) => {
            const parent = project.parentId ? projectsMap.get(project.parentId) : undefined;
            return (
              <ProjectKanbanCard 
                key={project.id} 
                project={project} 
                onEdit={onEdit}
                onDelete={onDelete}
                onArchive={onArchive}
                onDuplicate={onDuplicate}
                parentProjectName={parent?.name}
              />
            );
          })
        }
        {projects.filter((project) => project.stage === column.id).length === 0 && (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center opacity-50">
            <p className="text-xs text-muted-foreground">{t('projects.empty')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProjectBoard({ projects, onEdit, onDelete, onArchive, onDuplicate, onStageChange }: ProjectBoardProps) {
  const { t } = useTranslation();
  const { getProjectStages } = useSettings();
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Start drag after moving 5px
      },
    }),
    useSensor(KeyboardSensor)
  );

  const defaultStages = React.useMemo(() => ([
    { id: "todo", name: t('projects.columns.todo'), color: '#94A3B8', variant: 'soft' as const },
    { id: "in_progress", name: t('projects.columns.in_progress'), color: '#3B82F6', variant: 'soft' as const },
    { id: "review", name: t('projects.columns.review'), color: '#F59E0B', variant: 'soft' as const },
    { id: "done", name: t('projects.columns.done'), color: '#10B981', variant: 'soft' as const },
  ]), [t]);

  const projectStages = React.useMemo(() => {
    const stages = getProjectStages();
    return stages.length > 0
      ? [...stages].sort((a, b) => Number(a.displayorder ?? 0) - Number(b.displayorder ?? 0))
      : defaultStages;
  }, [defaultStages, getProjectStages]);

  const kanbanColumns = projectStages.map((stage) => ({
    id: stage.id,
    title: stage.name,
    color: stage.color || '#94A3B8',
    variant: stage.variant || 'soft' as const,
  }));

  // Flatten projects to show all including nested
  const flattenedProjects = React.useMemo(() => {
    const result: Project[] = [];
    const flatten = (items: Project[]) => {
      items.forEach(p => {
        result.push(p);
        if (p.subProjects && p.subProjects.length > 0) {
          flatten(p.subProjects);
        }
      });
    };
    flatten(projects);
    return result;
  }, [projects]);

  // Deduplicate by `id`
  const uniqueProjects = React.useMemo(() => {
    const map = new Map<number, Project>();
    flattenedProjects.forEach(p => {
      const existing = map.get(p.id);
      if (!existing) {
        map.set(p.id, p);
      }
    });
    return Array.from(map.values());
  }, [flattenedProjects]);

  // Create map for quick parent lookup
  const projectsMap = React.useMemo(() => {
    const map = new Map<number, Project>();
    const addToMap = (items: Project[]) => {
      items.forEach(p => {
        map.set(p.id, p);
        if (p.subProjects && p.subProjects.length > 0) {
          addToMap(p.subProjects);
        }
      });
    };
    addToMap(projects);
    return map;
  }, [projects]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const project = uniqueProjects.find((p) => p.id.toString() === active.id);
    if (project) {
      setActiveProject(project);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveProject(null);

    if (over && active.id !== over.id) {
      if (onStageChange) {
        onStageChange(Number(active.id), over.id as string);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveProject(null);
  };

  const parentProjectForOverlay = activeProject && activeProject.parentId ? projectsMap.get(activeProject.parentId)?.name : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <ScrollArea className="h-full w-full whitespace-nowrap rounded-md border bg-muted/10 p-4">
        <div className="flex space-x-4 pb-4">
          {kanbanColumns.map((column) => (
            <DroppableColumn 
              key={column.id}
              column={column}
              projects={flattenedProjects}
              uniqueProjects={uniqueProjects}
              projectsMap={projectsMap}
              onEdit={onEdit}
              onDelete={onDelete}
              onArchive={onArchive}
              onDuplicate={onDuplicate}
              t={t}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      {createPortal(
        <DragOverlay>
          {activeProject ? (
            <ProjectKanbanCard 
              project={activeProject} 
              onEdit={onEdit}
              parentProjectName={parentProjectForOverlay}
              isOverlay
            />
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}
