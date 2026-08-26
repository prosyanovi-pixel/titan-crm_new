import { useMemo } from 'react';
import { useTranslation } from '@/lib/i18n';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts';
import { formatMoney } from '@/lib/formatters';
import { Project } from '@/modules/projects/types';

interface ProjectAnalyticsProps {
  projects: Project[];
  compact?: boolean;
}

interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  t: (key: string) => string;
}

const CustomTooltip = ({ active, payload, label, t }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border/50 shadow-xl rounded-xl p-3">
        <p className="text-xs font-bold text-muted-foreground mb-1">{label}</p>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{t('finance.payment.kind.income')}</p>
          <p className="text-sm font-bold text-primary">{formatMoney(payload[0].value)}</p>
        </div>
      </div>
    );
  }
  return null;
};

export function ProjectAnalytics({ projects, compact }: ProjectAnalyticsProps) {
  const { t } = useTranslation();

  // Mock revenue data for the beautiful area chart as seen in the sample
  const revenueData = useMemo(() => [
    { name: t('dashboard.weekdays.short_0'), value: 3800 },
    { name: t('dashboard.weekdays.short_1'), value: 2200 },
    { name: t('dashboard.weekdays.short_2'), value: 2400 },
    { name: t('dashboard.weekdays.short_3'), value: 2800 },
    { name: t('dashboard.weekdays.short_4'), value: 1800 },
    { name: t('dashboard.weekdays.short_5'), value: 2200 },
    { name: t('dashboard.weekdays.short_6'), value: 3500 },
  ], [t]);

  const profitabilityData = useMemo(() => {
    return projects
      .filter(p => p.budget > 0)
      .map(p => ({
        name: p.name.length > 10 ? p.name.substring(0, 8) + '...' : p.name,
        budget: p.budget,
        used: p.budgetUsed || 0,
      }))
      .sort((a, b) => b.budget - a.budget)
      .slice(0, 6);
  }, [projects]);

  return (
    <div className="flex flex-col h-full space-y-8">
      {/* Main Revenue Chart (Area Chart) */}
      <div className="flex-1 min-h-[300px] w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.2} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fontWeight: 500, fill: 'hsl(var(--muted-foreground))' }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fontWeight: 500, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(val) => `$${val}`}
            />
            <Tooltip content={<CustomTooltip t={t} />} cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#3b82f6" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorValue)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {!compact && (
        <div className="pt-4 border-t border-border/20">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
            {t('dashboard.analytics.profitability')}
          </p>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitabilityData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(val) => `${val/1000}k`}
                />
                <Tooltip 
                  formatter={(value: number) => formatMoney(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar name={t('common.budget')} dataKey="budget" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar name={t('projects.stages.used')} dataKey="used" fill="hsl(var(--muted-foreground))" opacity={0.2} radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
