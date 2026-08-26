import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '@/components/ui/status-system';
import { DashboardWidget } from '../DashboardWidget';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface ProjectsListWidgetProps {
  limit?: number;
  compact?: boolean;
  commonProps: any;
  refreshInterval?: number;
}

export function ProjectsListWidget({ limit, compact, commonProps, refreshInterval }: ProjectsListWidgetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects'),
    refetchInterval: refreshInterval || false,
  });

  return (
    <DashboardWidget {...commonProps} showAllHref="/projects">
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/30" />
        </div>
      ) : (
        <div className="space-y-4">
          {(projects || []).slice(0, limit || (compact ? 3 : 6)).map((p: any) => (
            <div 
              key={p.id} 
              className="flex items-start gap-3 cursor-pointer group/proj" 
              onClick={() => navigate(`/projects?edit=${p.id}`)}
            >
              <div className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
              <div className="min-w-0 flex-1 mr-2">
                <span className="text-sm text-foreground font-medium group-hover/proj:text-primary transition-colors line-clamp-1">
                  {p.name}
                </span>
              </div>
              <StatusBadge statusId={p.status} className="scale-75 origin-right" />
            </div>
          ))}
          {(!projects || projects.length === 0) && (
            <div className="flex-1 flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground text-center">
                {t('dashboard.no_projects')}
              </p>
            </div>
          )}
        </div>
      )}
    </DashboardWidget>
  );
}
