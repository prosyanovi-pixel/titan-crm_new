import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { useNavigate } from 'react-router-dom';
import { DashboardWidget } from '../DashboardWidget';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

import { Project } from '../../types';

interface ActivityWidgetProps {
  limit?: number;
  compact?: boolean;
  commonProps: any; // Keep this as any for now as it contains many dashboard-specific props
  refreshInterval?: number;
}

export function ActivityWidget({ limit, compact, commonProps, refreshInterval }: ActivityWidgetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: projects, isLoading } = useQuery<Project[]>({
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
        <div className="space-y-6">
          {(projects || []).slice(0, limit || (compact ? 3 : 6)).map((act, idx: number) => (
            <div 
              key={act.id} 
              className="flex items-start gap-4 group/item cursor-pointer" 
              onClick={() => navigate(`/projects?edit=${act.id}`)}
            >
              <div className={cn(
                "mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 shadow-sm",
                idx % 3 === 0 ? "bg-blue-500 shadow-blue-200" : idx % 3 === 1 ? "bg-emerald-500 shadow-emerald-200" : "bg-orange-500 shadow-orange-200"
              )} />
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-foreground/90 group-hover/item:text-primary transition-colors line-clamp-2 leading-snug">
                  {act.name}
                </p>
                <p className="text-xs font-medium text-muted-foreground/50 mt-1">
                  {act.deadline ? new Date(act.deadline).toLocaleDateString('ru-RU') : 'Без срока'}
                </p>
              </div>
            </div>
          ))}
          {(!projects || projects.length === 0) && (
            <div className="flex-1 flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground text-center">
                {t('dashboard.no_activity')}
              </p>
            </div>
          )}
        </div>
      )}
    </DashboardWidget>
  );
}
