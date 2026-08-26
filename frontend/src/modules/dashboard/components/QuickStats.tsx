import { useTranslation } from '@/lib/i18n';
import { TrendingUp, Users, CheckSquare } from 'lucide-react';
import { StatsCard } from '@/components/ui';

interface QuickStatsProps {
  taskCompletion: string;
}

export function QuickStats({ taskCompletion }: QuickStatsProps) {
  const { t } = useTranslation();

  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatsCard 
        title={t('dashboard.quick_stats.revenue_growth')}
        value="+0%"
        icon={TrendingUp}
        iconColor="text-status-active bg-status-active/10"
        trendLabel={t('dashboard.quick_stats.vs_last_month')}
        trend="+0%"
        trendUp={true}
      />
      <StatsCard 
        title={t('dashboard.quick_stats.new_clients')}
        value="0"
        icon={Users}
        iconColor="text-primary bg-primary/10"
        trendLabel={t('dashboard.quick_stats.last_30_days')}
        trend="+0"
        trendUp={true}
      />
      <StatsCard 
        title={t('dashboard.quick_stats.completed_tasks')}
        value={taskCompletion}
        icon={CheckSquare}
        iconColor="text-status-pending bg-status-pending/10"
        trendLabel={t('dashboard.quick_stats.team_efficiency')}
        trend={taskCompletion}
        trendUp={true}
      />
    </div>
  );
}