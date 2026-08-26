import React from 'react';
import { DashboardWidget } from '../DashboardWidget';
import { CalendarWidget as UICalendarWidget } from '@/components/ui/CalendarWidget';
import { cn } from '@/lib/utils';

interface CalendarWidgetProps {
  daysRange: number;
  compact?: boolean;
  commonProps: any;
  refreshInterval?: number;
}

export function CalendarDashboardWidget({ daysRange, compact, commonProps, refreshInterval }: CalendarWidgetProps) {
  return (
    <DashboardWidget {...commonProps} noPadding>
      <div className={cn("flex-1 flex flex-col", compact ? "scale-90 origin-top" : "")}>
        <UICalendarWidget daysRange={daysRange} refreshInterval={refreshInterval} />
      </div>
    </DashboardWidget>
  );
}
