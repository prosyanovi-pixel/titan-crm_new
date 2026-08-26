import React from 'react';
import { useTranslation } from "@/lib/i18n";
import { Project, ProjectStage } from "../../types";
import { ChevronRight } from "lucide-react";
import { parseDate, getStatusColor } from "./useProjectGantt";
import { differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

interface ProjectGanttRowProps {
  project: Project;
  stages: ProjectStage[];
  months: Date[];
  minDate: Date;
  totalDays: number;
  onEdit: (project: Project) => void;
  onEditStage?: (stage: ProjectStage) => void;
  level?: number;
  isExpanded?: boolean;
  onToggleExpand?: (id: number) => void;
}

export const ProjectGanttRow = ({ project, stages, months, minDate, totalDays, onEdit, onEditStage, level = 0, isExpanded = false, onToggleExpand }: ProjectGanttRowProps) => {
  const { t } = useTranslation();
  const getPosition = (project: Project) => {
    const startDate = project.startDate ? parseDate(project.startDate) : null;
    const endDate = project.endDate ? parseDate(project.endDate) : project.deadline ? parseDate(project.deadline) : null;
    
    if (!endDate) {
      return { left: '0%', width: '100%' };
    }

    const effectiveStart = startDate || (() => {
      const d = new Date(endDate);
      d.setMonth(d.getMonth() - 2);
      return d;
    })();

    let daysFromStart = differenceInDays(effectiveStart, minDate);
    let duration = differenceInDays(endDate, effectiveStart);

    if (daysFromStart < 0) {
      duration += daysFromStart;
      daysFromStart = 0;
    }

    if (daysFromStart + duration > totalDays) {
      duration = totalDays - daysFromStart;
    }

    const left = (daysFromStart / totalDays) * 100;
    const width = Math.max((duration / totalDays) * 100, 2);

    return { left: `${left}%`, width: `${width}%` };
  };

  const getStagePosition = (stage: ProjectStage) => {
    const startDate = parseDate(stage.startDate);
    const endDate = parseDate(stage.endDate);

    let daysFromStart = differenceInDays(startDate, minDate);
    let duration = differenceInDays(endDate, startDate);

    if (daysFromStart < 0) {
      duration += daysFromStart;
      daysFromStart = 0;
    }

    if (daysFromStart + duration > totalDays) {
      duration = totalDays - daysFromStart;
    }

    const left = (daysFromStart / totalDays) * 100;
    const width = Math.max((duration / totalDays) * 100, 1);

    return { left: `${left}%`, width: `${width}%` };
  };

  const pos = getPosition(project);

  return (
    <div className="flex items-center hover:bg-muted/30 py-1 rounded relative group">
      <div 
        className="w-1/4 text-sm font-medium pl-2 truncate pr-4 shrink-0 z-10 flex items-center gap-1"
        style={{ paddingLeft: `${8 + level * 16}px` }}
      >
        {project.subProjects && project.subProjects.length > 0 && (
          <button
            onClick={() => onToggleExpand?.(project.id)}
            className="flex items-center justify-center w-4 h-4 hover:bg-muted rounded cursor-pointer transition-colors"
          >
            <ChevronRight className={cn("w-3 h-3 text-muted-foreground/50 transition-transform", isExpanded && "rotate-90")} />
          </button>
        )}
        {project.name}
      </div>
      <div className="flex-1 relative h-12">
        {/* Background Grid Lines */}
        <div className="absolute inset-0 flex pointer-events-none">
          {months.map(m => (
            <div 
              key={m.toString()} 
              className="flex-1 border-l border-dashed border-border/30 h-full"
            />
          ))}
        </div>

        {/* Бар проекта */}
        <div
          className={`absolute top-1 bottom-1 rounded-md px-2 text-xs text-white flex items-center shadow-sm cursor-pointer transition-all hover:opacity-90 hover:shadow-md z-10 ${getStatusColor(project.status)}`}
          style={{ left: pos.left, width: pos.width }}
          onClick={() => onEdit(project)}
          title={`${project.name} (${t(`projects.status.${project.status}`, { defaultValue: project.status })})`}
        >
          <span className="truncate w-full">{t(`projects.status.${project.status}`, { defaultValue: project.status })}</span>
        </div>

        {/* Бары этапов (поверх бара проекта) */}
        {stages.map(stage => {
          const stagePos = getStagePosition(stage);
          return (
            <div
              key={stage.id}
              className={cn(
                "absolute top-2 h-4 rounded px-1 text-[10px] text-white flex items-center shadow-sm cursor-pointer transition-all hover:opacity-90 hover:shadow-md z-20",
                !stage.color && (stage.isCompleted ? 'bg-green-500' : 'bg-blue-400'),
                stage.color && !stage.color.startsWith('#') && stage.color
              )}
              style={{ 
                left: stagePos.left, 
                width: stagePos.width,
                backgroundColor: stage.color?.startsWith('#') ? stage.color : undefined
              }}
              onClick={(e) => {
                e.stopPropagation();
                onEditStage?.(stage);
              }}
              title={`${stage.name} (${stage.progress}%)`}
            >
              {stage.progress > 20 && <span className="truncate w-full">{stage.progress}%</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};
