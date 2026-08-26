import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/lib/i18n';
import { 
  TrendingUp, 
  Clock, 
  CalendarDays, 
  AlertCircle, 
  FolderKanban,
  Layout,
  Layers,
  List,
  RefreshCw
} from 'lucide-react';
import {
  Select as UISelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { DashboardConfig, Project, Task, DashboardStats } from '../types';
import { usePermission } from '@/hooks/usePermission';
import { PERMISSIONS } from '@/constants/permissions';

// New Modular Widgets
import { StatsWidget } from './widgets/StatsWidget';
import { AnalyticsWidget } from './widgets/AnalyticsWidget';
import { ActivityWidget } from './widgets/ActivityWidget';
import { DeadlinesWidget } from './widgets/DeadlinesWidget';
import { OverdueTasksWidget } from './widgets/OverdueTasksWidget';
import { CalendarDashboardWidget } from './widgets/CalendarWidget';
import { ProjectsListWidget } from './widgets/ProjectsListWidget';
import { ContractsWidget } from './contractswidget';

interface WidgetRendererProps {
  id: string;
  config: DashboardConfig;
  navigate: ReturnType<typeof useNavigate>;
  onUpdateSetting: (block: string, key: string, value: any) => void;
}

const WIDGET_PERMISSIONS: Record<string, string[]> = {
  stats: [PERMISSIONS.projects.read, PERMISSIONS.tasks.read],
  analytics: [PERMISSIONS.projects.read],
  activity: [PERMISSIONS.projects.read],
  deadlines: [PERMISSIONS.projects.read],
  overdue: [PERMISSIONS.tasks.read],
  calendar: [PERMISSIONS.calendar.read],
  projects: [PERMISSIONS.projects.read],
};

export function WidgetRenderer({ id, config, navigate, onUpdateSetting }: WidgetRendererProps) {
  const { t } = useTranslation();
  const { hasAnyPermission } = usePermission();
  
  // Permission check
  const requiredPermissions = WIDGET_PERMISSIONS[id] || [];
  const canView = requiredPermissions.length === 0 || hasAnyPermission(requiredPermissions);

  if (!config.visible[id] || !canView) return null;

  const settings = (config.settings[id] || { size: '1/3', compact: false, view: 'default', limit: 5 }) as any;
  
  const widthClass = {
    '1/3': 'md:col-span-1 xl:col-span-4',
    '1/2': 'md:col-span-2 xl:col-span-6',
    '2/3': 'md:col-span-2 xl:col-span-8',
    'full': 'md:col-span-2 xl:col-span-12'
  }[settings.size as '1/3' | '1/2' | '2/3' | 'full'] || 'w-full';

  const renderSettings = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Size Setting */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <Layout className="w-3 h-3" /> {t('settings.badge_editor.size')}
          </label>
          <UISelect value={settings.size} onValueChange={(v) => onUpdateSetting(id, 'size', v)}>
            <SelectTrigger className="h-9 text-xs font-bold bg-background border-border/50">
              <SelectValue placeholder={t('settings.badge_editor.size')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1/3">{t('dashboard.settings.size.1/3')}</SelectItem>
              <SelectItem value="1/2">{t('dashboard.settings.size.1/2')}</SelectItem>
              <SelectItem value="2/3">{t('dashboard.settings.size.2/3')}</SelectItem>
              <SelectItem value="full">{t('dashboard.settings.size.full')}</SelectItem>
            </SelectContent>
          </UISelect>
        </div>

        {/* Update Frequency */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3" /> {t('settings.appearance')}
          </label>
          <UISelect value={settings.refresh || 'never'} onValueChange={(v) => onUpdateSetting(id, 'refresh', v)}>
            <SelectTrigger className="h-9 text-xs font-bold bg-background border-border/50">
              <SelectValue placeholder={t('dashboard.settings.refresh.title')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="never">{t('dashboard.settings.refresh.never')}</SelectItem>
              <SelectItem value="1">{t('dashboard.settings.refresh.m1')}</SelectItem>
              <SelectItem value="5">{t('dashboard.settings.refresh.m5')}</SelectItem>
              <SelectItem value="15">{t('dashboard.settings.refresh.m15')}</SelectItem>
            </SelectContent>
          </UISelect>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* View/Display Setting */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <Layers className="w-3 h-3" /> {t('settings.badge_editor.compact')}
          </label>
          <div className="flex items-center justify-between h-9 px-3 rounded-md bg-background border border-border/50">
            <span className="text-xs font-bold text-muted-foreground">{settings.compact ? 'ON' : 'OFF'}</span>
            <button
              onClick={() => onUpdateSetting(id, 'compact', !settings.compact)}
              className={cn(
                "w-8 h-4 rounded-full transition-colors relative",
                settings.compact ? "bg-primary" : "bg-muted"
              )}
            >
              <div className={cn(
                "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all",
                settings.compact ? "right-0.5" : "left-0.5"
              )} />
            </button>
          </div>
        </div>

        {/* Item Limit / Range Setting */}
        {(['activity', 'deadlines', 'overdue', 'projects'].includes(id) || id === 'calendar') && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              {id === 'calendar' ? <Clock className="w-3 h-3" /> : <List className="w-3 h-3" />}
              {id === 'calendar' ? t('dashboard.calendar.range') : t('settings.badge_editor.limit')}
            </label>
            <UISelect 
              value={String(settings.limit || (id === 'calendar' ? 3 : 5))} 
              onValueChange={(v) => onUpdateSetting(id, 'limit', Number(v))}
            >
              <SelectTrigger className="h-9 text-xs font-bold bg-background border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {id === 'calendar' ? (
                  [1, 3, 7, 14, 30].map(v => (
                    <SelectItem key={v} value={String(v)}>
                      {v === 1 ? t('dashboard.calendar.today') : `${v} ${t('common.days')}`}
                    </SelectItem>
                  ))
                ) : (
                  [3, 5, 10, 15, 20].map(v => (
                    <SelectItem key={v} value={String(v)}>{v} {t('dashboard.settings.items')}</SelectItem>
                  ))
                )}
              </SelectContent>
            </UISelect>
          </div>
        )}
      </div>

      {/* Analytics Period */}
      {id === 'analytics' && (
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" /> {t('dashboard.settings.period.title')}
          </label>
          <UISelect value={settings.period || 'week'} onValueChange={(v) => onUpdateSetting(id, 'period', v)}>
            <SelectTrigger className="h-9 text-xs font-bold bg-background border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">{t('dashboard.settings.period.week')}</SelectItem>
              <SelectItem value="month">{t('dashboard.settings.period.month')}</SelectItem>
              <SelectItem value="quarter">{t('dashboard.settings.period.quarter')}</SelectItem>
            </SelectContent>
          </UISelect>
        </div>
      )}
    </div>
  );

  const commonProps = {
    id,
    className: widthClass,
    title: t(`dashboard.blocks.${id}`),
    compact: settings.compact,
    settingsContent: renderSettings(),
    icon: ({ stats: TrendingUp, analytics: TrendingUp, activity: Clock, deadlines: CalendarDays, overdue: AlertCircle, calendar: CalendarDays, projects: FolderKanban } as any)[id]
  };

  const refreshInterval = settings.refresh && settings.refresh !== 'never' ? parseInt(settings.refresh) * 60000 : 0;

  switch (id) {
    case 'stats':
      return <StatsWidget compact={settings.compact} widthClass={widthClass} refreshInterval={refreshInterval} />;
    case 'analytics':
      return <AnalyticsWidget compact={settings.compact} commonProps={commonProps} refreshInterval={refreshInterval} />;
    case 'activity':
      return <ActivityWidget limit={settings.limit} compact={settings.compact} commonProps={commonProps} refreshInterval={refreshInterval} />;
    case 'deadlines':
      return <DeadlinesWidget limit={settings.limit} compact={settings.compact} commonProps={commonProps} refreshInterval={refreshInterval} />;
    case 'overdue':
      return <OverdueTasksWidget limit={settings.limit} compact={settings.compact} commonProps={commonProps} refreshInterval={refreshInterval} />;
    case 'calendar':
      return <CalendarDashboardWidget daysRange={settings.limit || 3} compact={settings.compact} commonProps={commonProps} refreshInterval={refreshInterval} />;
    case 'projects':
      return <ProjectsListWidget limit={settings.limit} compact={settings.compact} commonProps={commonProps} refreshInterval={refreshInterval} />;
    case 'contracts':
      return <ContractsWidget />;
    default:
      return null;
  }
}
