import React from 'react';
import { useTranslation } from '@/lib/i18n';

interface Project {
  id: number;
  name: string;
  deadline: string;
}

interface UpcomingDeadlinesProps {
  projects: Project[];
  onProjectClick: (id: number) => void;
}

// Parse deadline from various formats (DD.MM.YYYY, YYYY-MM-DD, etc)
const parseDeadline = (str: string | undefined): Date | null => {
  if (!str) return null;
  
  // First try to parse as DD.MM.YYYY format (with dots, dashes, or slashes)
  const parts = str.split(/[./-]/);
  if (parts.length >= 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    const dt = new Date(y, m, d);
    if (!isNaN(dt.getTime())) return dt;
  }
  
  // Fall back to JavaScript's default parsing (YYYY-MM-DD, ISO format, etc)
  const d1 = new Date(str);
  if (!isNaN(d1.getTime())) return d1;
  
  return null;
};

export function UpcomingDeadlines({ projects, onProjectClick }: UpcomingDeadlinesProps) {
  const { t } = useTranslation();

  // Get upcoming deadlines (including overdue) - next 7 days + past
  const upcomingDeadlines = projects
    .filter(p => {
      const deadline = parseDeadline(p.deadline);
      // Show overdue (deadline < now) AND upcoming (deadline <= nextWeek)
      if (!deadline) return false;
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return deadline <= nextWeek;
    })
    .sort((a, b) => {
      const deadlineA = parseDeadline(a.deadline)!.getTime();
      const deadlineB = parseDeadline(b.deadline)!.getTime();
      // Overdue first (smaller dates), then upcoming
      return deadlineA - deadlineB;
    })
    .slice(0, 5);

  return (
    <div className="titan-card p-6">
      <h3 className="font-semibold mb-2">{t('modules.dashboard.upcoming_deadlines') || t('dashboard.fallbacks.upcoming_deadlines')}</h3>
      <div className="space-y-2">
        {upcomingDeadlines.map(p => (
          <div key={p.id} className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{p.name}</div>
              <div className="text-xs text-muted-foreground">
                {parseDeadline(p.deadline)?.toLocaleDateString('ru-RU')}
              </div>
            </div>
            <button 
              className="text-sm text-primary" 
              onClick={() => onProjectClick(p.id)}
            >
              {t('generated.otkryt')}
            </button>
          </div>
        ))}
        {upcomingDeadlines.length === 0 && (
          <div className="text-sm text-muted-foreground">
            {t('generated.net_predstoyaschih_dedlaynov')}
          </div>
        )}
      </div>
    </div>
  );
}