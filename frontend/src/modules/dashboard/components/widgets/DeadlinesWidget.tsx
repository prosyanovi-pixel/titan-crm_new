import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { DashboardWidget } from '../DashboardWidget';
import { parseDeadline } from '../../utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Project } from '../../types';

interface DeadlinesWidgetProps {
  limit?: number;
  compact?: boolean;
  commonProps: any;
  refreshInterval?: number;
}

export function DeadlinesWidget({ limit, compact, commonProps, refreshInterval }: DeadlinesWidgetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // eslint-disable-next-line react-hooks/purity
  const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects'),
    refetchInterval: refreshInterval || false,
  });

  const upcoming = (projects || []).filter((p) => { 
    const d = parseDeadline(p.deadline); 
    return d && d <= weekFromNow;
  }).slice(0, 10);

  return (
    <DashboardWidget {...commonProps}>
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/30" />
        </div>
      ) : (
        <div className="space-y-4">
          {(upcoming.slice(0, limit || (compact ? 3 : 6))).map((p) => (
            <div 
              key={p.id} 
              className="flex items-start gap-3 group/row cursor-pointer" 
              onClick={() => navigate(`/projects?edit=${p.id}`)}
            >
              <div className="mt-1.5 w-2 h-2 rounded-full bg-destructive shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground group-hover/row:text-primary transition-colors line-clamp-1">
                  {p.name}
                </p>
                <p className="text-[11px] text-destructive mt-0.5 font-medium">
                  {parseDeadline(p.deadline)?.toLocaleDateString('ru-RU')}
                </p>
              </div>
              <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover/row:opacity-100 transition-opacity self-center" />
            </div>
          ))}
          {upcoming.length === 0 && (
            <div className="flex-1 flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground text-center">
                {t('dashboard.no_deadlines')}
              </p>
            </div>
          )}
        </div>
      )}
    </DashboardWidget>
  );
}
