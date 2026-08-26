import React from 'react';
import { StatsCard } from '@/components/ui';
import { Users, TrendingUp, DollarSign } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface Project {
  id: number;
  name: string;
  status: string;
  priority: string;
  deadline: string;
  budget: number;
  manager: string;
  client?: string;
}

interface StatsSectionProps {
  projects: Project[];
}

export function StatsSection({ projects }: StatsSectionProps) {
  const { t } = useTranslation();

  // Calculate stats
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <StatsCard
        title={t('common.total')}
        value={totalProjects}
        icon={Users}
      />
      <StatsCard
        title={t('common.active')}
        value={activeProjects}
        icon={TrendingUp}
      />
      <StatsCard
        title={t('contractors.stats.turnover')}
        value={`${totalBudget.toLocaleString('ru-RU')} ₽`}
        icon={DollarSign}
      />
    </div>
  );
}