import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, CheckCircle2, TrendingUp, DollarSign } from 'lucide-react';
import { formatMoney } from '../utils';

interface ProjectStagesSummaryProps {
  summary: {
    totalStages?: number;
    completedStages?: number;
    avgProgress?: number;
    totalBudgetUsed?: number;
  } | null;
}

export const ProjectStagesSummary = ({ summary }: ProjectStagesSummaryProps) => {
  const { t } = useTranslation();

  if (!summary || summary.totalStages <= 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t('projects.stages.summary.total')}</p>
              <p className="text-lg font-semibold">{summary.totalStages}</p>
            </div>
          </div>
        </CardContent>
      </Card>
          
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">{t('projects.stages.summary.completed')}</p>
              <p className="text-lg font-semibold">{summary.completedStages}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground">{t('projects.stages.summary.progress')}</p>
              <p className="text-lg font-semibold">{Math.round(summary.avgProgress)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
          
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-600" />
            <div>
              <p className="text-xs text-muted-foreground">{t('projects.stages.summary.budget')}</p>
              <p className="text-lg font-semibold">{formatMoney(summary.totalBudgetUsed)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
