import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { StatusBadge } from '@/components/ui/status-system';

interface Project {
  id: number;
  name: string;
  status: string;
}

interface ProjectsListProps {
  projects: Project[];
  onProjectClick: (id: number) => void;
}

export function ProjectsList({ projects, onProjectClick }: ProjectsListProps) {
  const { t } = useTranslation();

  return (
    <div className="titan-card p-6 mt-4">
      <h3 className="font-semibold mb-3">{t('generated.proekty')}</h3>
      <div className="space-y-2">
        {projects.slice(0, 5).map(p => (
          <div 
            key={p.id} 
            className="flex items-center justify-between" 
            onClick={() => onProjectClick(p.id)} 
            style={{ cursor: 'pointer' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="truncate max-w-[160px]">{p.name}</span>
            </div>
            {(() => {
              return (
                <StatusBadge statusId={p.status} />
              );
            })()}
          </div>
        ))}
        {projects.length === 0 && (
          <div className="text-sm text-muted-foreground">
            {t('generated.net_proektov')}
          </div>
        )}
      </div>
    </div>
  );
}