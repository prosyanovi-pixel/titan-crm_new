import React from 'react';
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useTranslation } from "@/lib/i18n";

interface ProjectGanttTimelineProps {
  months: Date[];
}

export const ProjectGanttTimeline = ({ months }: ProjectGanttTimelineProps) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex border-b border-border pb-2 mb-4">
      <div className="w-1/4 font-medium text-sm text-muted-foreground pl-2 shrink-0">
        {t('projects.table.name')}
      </div>
      <div className="flex-1 flex">
        {months.map(m => (
          <div 
            key={m.toString()} 
            className="flex-1 font-medium text-xs text-muted-foreground text-center border-l border-dashed border-border/50"
          >
            {format(m, 'MMM yyyy', { locale: ru })}
          </div>
        ))}
      </div>
    </div>
  );
};
