import React from 'react';
import { ProjectAnalytics } from '../ProjectAnalytics';
import { DashboardWidget } from '../DashboardWidget';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface AnalyticsWidgetProps {
  compact?: boolean;
  commonProps: any;
  refreshInterval?: number;
}

export function AnalyticsWidget({ compact, commonProps, refreshInterval }: AnalyticsWidgetProps) {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects'),
    refetchInterval: refreshInterval || false,
  });

  return (
    <DashboardWidget {...commonProps} noPadding>
      {isLoading ? (
        <div className="flex-1 min-h-[300px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary/20" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <ProjectAnalytics projects={projects || []} compact={compact} />
        </div>
      )}
    </DashboardWidget>
  );
}
