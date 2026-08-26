import React from 'react';
import { Project, ProjectStage } from "../types";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { useProjectGantt } from "./gantt/useProjectGantt";
import { ProjectGanttTimeline } from "./gantt/ProjectGanttTimeline";
import { ProjectGanttRow } from "./gantt/ProjectGanttRow";

interface ProjectGanttProps {
  projects: Project[];
  stages?: ProjectStage[];
  onEdit: (project: Project) => void;
  onEditStage?: (stage: ProjectStage) => void;
}

export function ProjectGantt({ projects, stages, onEdit, onEditStage }: ProjectGanttProps) {
  const { t } = useTranslation();
  const { minDate, months, totalDays } = useProjectGantt(projects);
  
  // Display only root projects (without parent) on the Gantt
  const displayProjects = projects.filter(p => !p.parentId);
  
  // Expand/collapse state for nested projects
  const [expandedIds, setExpandedIds] = React.useState<Set<number>>(new Set());
  
  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  
  const flattenedProjects = React.useMemo(() => {
    const result: { project: Project; level: number }[] = [];
    const flatten = (items: Project[], level: number) => {
      items.forEach(p => {
        result.push({ project: p, level });
        if (expandedIds.has(p.id) && p.subProjects && p.subProjects.length > 0) {
          flatten(p.subProjects, level + 1);
        }
      });
    };
    flatten(displayProjects, 0);
    return result;
  }, [displayProjects, expandedIds]);

  return (
    <div className="titan-card p-6 overflow-x-auto">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium">{t('projects.gantt.timeline')}</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">{t('projects.gantt.month')}</Button>
        </div>
      </div>
      
      <div className="min-w-[800px] relative">
        <ProjectGanttTimeline months={months} />

        <div className="space-y-4">
          {flattenedProjects.map(({ project, level }) => {
            const projectStages = stages?.filter(s => s.projectId === project.id) || [];
            return (
              <ProjectGanttRow 
                key={project.id} 
                project={project} 
                stages={projectStages} 
                months={months} 
                minDate={minDate} 
                totalDays={totalDays} 
                onEdit={onEdit} 
                onEditStage={onEditStage} 
                level={level}
                isExpanded={expandedIds.has(project.id)}
                onToggleExpand={toggleExpand}
              />
            );
          })}
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary" />
          <span>{t('projects.status.active')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500" />
          <span>{t('projects.status.pending')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-600" />
          <span>{t('projects.status.finished')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-400" />
          <span>{t('projects.stage')}</span>
        </div>
      </div>
    </div>
  );
}