import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { FolderKanban, TrendingUp, CheckSquare, CheckCircle, Loader2 } from 'lucide-react';
import { StatsCard } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface StatsWidgetProps {
  compact?: boolean;
  widthClass: string;
  refreshInterval?: number;
}

export function StatsWidget({ compact, widthClass, refreshInterval }: StatsWidgetProps) {
  const { t } = useTranslation();

  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.get('/dashboard/stats'),
    refetchInterval: refreshInterval || false,
  });

  if (isLoading) {
    return (
      <div className={cn(widthClass, "w-full h-[100px] flex items-center justify-center bg-muted/20 rounded-xl animate-pulse")}>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !stats) return null;

  return (
    <div className={cn(widthClass, "w-full h-full min-w-0")}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 h-full">
        <StatsCard 
          title={t('dashboard.stats.total_projects')} 
          value={stats.totalProjects || 0} 
          icon={FolderKanban} 
          compact={compact} 
          trend="+12%" 
          trendUp={true} 
          trendLabel={t('dashboard.quick_stats.vs_last_month')}
        />
        <StatsCard 
          title={t('dashboard.stats.active_projects')} 
          value={stats.activeProjects || 0} 
          icon={TrendingUp} 
          iconColor="text-emerald-500 bg-emerald-50 dark:bg-emerald-950" 
          compact={compact} 
          trend="+5%" 
          trendUp={true} 
          trendLabel={t('dashboard.quick_stats.vs_last_month')}
        />
        <StatsCard 
          title={t('dashboard.stats.total_tasks')} 
          value={stats.totalTasks || 0} 
          icon={CheckSquare} 
          iconColor="text-blue-500 bg-blue-50 dark:bg-blue-950" 
          compact={compact} 
          trend="-2%" 
          trendUp={false} 
          trendLabel={t('dashboard.quick_stats.vs_last_month')}
        />
        <StatsCard 
          title={t('dashboard.stats.tasks_completion')} 
          value={`${stats.taskCompletion || 0}%`} 
          icon={CheckCircle} 
          iconColor="text-violet-500 bg-violet-50 dark:bg-violet-950" 
          compact={compact} 
          trend="+8%" 
          trendUp={true} 
          trendLabel={t('dashboard.quick_stats.vs_last_month')}
        />
      </div>
    </div>
  );
}
