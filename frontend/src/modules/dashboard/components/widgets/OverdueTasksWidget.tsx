import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { DashboardWidget } from '../DashboardWidget';
import { parseDeadline } from '../../utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface OverdueTasksWidgetProps {
  limit?: number;
  compact?: boolean;
  commonProps: any;
  refreshInterval?: number;
}

export function OverdueTasksWidget({ limit, compact, commonProps, refreshInterval }: OverdueTasksWidgetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const now = new Date();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.get('/tasks'),
    refetchInterval: refreshInterval || false,
  });

  const overdue = (tasks || []).filter((task: any) => { 
    const d = parseDeadline(task.dueDate); 
    return d && d < now && task.status !== 'done';
  }).slice(0, 10);

  return (
    <DashboardWidget {...commonProps}>
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/30" />
        </div>
      ) : (
        <div className="space-y-4">
          {(overdue.slice(0, limit || (compact ? 3 : 6))).map((task: any) => (
            <div 
              key={task.id} 
              className="flex items-start gap-3 cursor-pointer group/task" 
              onClick={() => navigate('/tasks')}
            >
              <div className="mt-1.5 w-2 h-2 rounded-full bg-destructive shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground group-hover/task:text-primary transition-colors line-clamp-1">
                  {task.title}
                </p>
                <p className="text-[11px] text-destructive mt-0.5">
                  {parseDeadline(task.dueDate)?.toLocaleDateString('ru-RU')}
                </p>
              </div>
            </div>
          ))}
          {overdue.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-500/20 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">{t('dashboard.no_overdue')}</p>
            </div>
          )}
        </div>
      )}
    </DashboardWidget>
  );
}
