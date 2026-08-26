import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { StatusBadge } from '@/components/ui/status-system';

interface Activity {
  id: string;
  title: string;
  time: string;
  status: string;
  type: 'project' | 'task';
}

interface RecentActivitiesProps {
  activities: Activity[];
  onProjectClick: (id: number) => void;
}

export function RecentActivities({ activities, onProjectClick }: RecentActivitiesProps) {
  const { t } = useTranslation();

  return (
    <div className="titan-card p-6">
      <h2 className="text-lg font-semibold mb-3">{t('modules.dashboard.recent_activity') || t('dashboard.fallbacks.recent_activity')}</h2>
      <div className="space-y-3">
        {activities.map(act => (
          <div 
            key={act.id} 
            className="flex items-center justify-between" 
            onClick={() => { 
              if (act.type === 'project') {
                const id = parseInt(act.id.split('-')[1] || '0', 10);
                onProjectClick(id);
              }
            }} 
            style={{ cursor: act.type === 'project' ? 'pointer' : 'default' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <div>
                <div className="text-sm font-medium">{act.title}</div>
                <div className="text-xs text-muted-foreground">{act.time}</div>
              </div>
            </div>
            {(() => {
              return (
                <StatusBadge statusId={act.status} />
              );
            })()}
          </div>
        ))}
      </div>
    </div>
  );
}