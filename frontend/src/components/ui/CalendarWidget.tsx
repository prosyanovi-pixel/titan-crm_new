import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/lib/i18n';
import { api } from '@/lib/api';
import { Settings, Check, ChevronLeft, ChevronRight, ExternalLink, Clock, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

const parseDate = (dateStr: string | undefined | null) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
};

interface CalendarTask {
  id: string;
  title: string;
  dueDate?: string;
  deletedAt?: string | null;
}

interface CalendarEventItem {
  id: string;
  title: string;
  startDate?: string;
  date?: string;
}

interface CalendarDay {
  day: number;
  date: Date;
  isMuted?: boolean;
  isToday?: boolean;
  isSelected?: boolean;
  hasActivity?: boolean;
}

interface CalendarActivity {
  id: string;
  title: string;
  type: 'TASK' | 'EVENT';
  sortDate: Date;
}

interface CalendarWidgetProps {
  daysRange?: number;
  onRangeChange?: (range: number) => void;
  hideHeader?: boolean;
  refreshInterval?: number;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ 
  daysRange = 3, 
  onRangeChange,
  hideHeader = true,
  refreshInterval = 0
}) => {
  const navigate = useNavigate();
  const { t, locale } = useTranslation();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: tasksRes, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.get('/tasks'),
    refetchInterval: refreshInterval || false,
  });

  const { data: eventsRes, isLoading: eventsLoading } = useQuery({
    queryKey: ['calendar', 'events'],
    queryFn: () => api.get('/calendar/events'),
    refetchInterval: refreshInterval || false,
  });

  const tasks = useMemo(() => (tasksRes as CalendarTask[]) || [], [tasksRes]);
  const events = useMemo(() => (eventsRes as CalendarEventItem[]) || [], [eventsRes]);
  const isLoading = tasksLoading || eventsLoading;

  const calendarDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: CalendarDay[] = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    for (let i = offset; i > 0; i--) {
      days.push({ day: prevMonthLastDay - i + 1, date: new Date(year, month - 1, prevMonthLastDay - i + 1), isMuted: true });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const isToday = date.getTime() === today.getTime();
      const sel = new Date(selectedDate);
      sel.setHours(0,0,0,0);
      const isSelected = date.getTime() === sel.getTime();

      const hasSomething = (tasks || []).some(task => !task.deletedAt && task.dueDate && parseDate(task.dueDate)?.toDateString() === date.toDateString())
        || (events || []).some(ev => {
          const eventDate = ev.date || ev.startDate;
          return eventDate && parseDate(eventDate)?.toDateString() === date.toDateString();
        });

      days.push({ day: i, date, isToday, isSelected, hasActivity: hasSomething });
    }
    return days;
  }, [currentMonth, selectedDate, tasks, events]);

  const groupedActivities = useMemo(() => {
    const groups: Record<string, CalendarActivity[]> = {};
    const startDate = new Date(selectedDate);
    startDate.setHours(0,0,0,0);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + daysRange);
    const allInRange: CalendarActivity[] = [];

    (tasks || []).filter((t) => !t.deletedAt && t.dueDate).forEach((t) => {
      const d = parseDate(t.dueDate);
      if (d) {
        d.setHours(0,0,0,0);
        if (d >= startDate && d < endDate) allInRange.push({ ...t, type: 'TASK', sortDate: d });
      }
    });
    (events || []).forEach((e) => {
      const eventDate = e.date || e.startDate;
      if (!eventDate) return;
      const d = parseDate(eventDate);
      if (d) {
        d.setHours(0,0,0,0);
        if (d >= startDate && d < endDate) allInRange.push({ ...e, type: 'EVENT', sortDate: d });
      }
    });

    allInRange.sort((a,b) => a.sortDate.getTime() - b.sortDate.getTime());
    allInRange.forEach(item => {
      const dateLabelPattern = item.sortDate.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long' });
      if (!groups[dateLabelPattern]) groups[dateLabelPattern] = [];
      groups[dateLabelPattern].push(item);
    });
    return Object.entries(groups);
  }, [selectedDate, tasks, events, daysRange, locale]);

  const activitiesCount = useMemo(
    () => groupedActivities.reduce((count, [, items]) => count + items.length, 0),
    [groupedActivities]
  );

  const shouldLimitActivityList = activitiesCount > 7;

  return (
    <div className="flex flex-col h-full w-full bg-transparent overflow-hidden">
      {!hideHeader && (
        <div className="px-6 py-4 border-b border-border/10 flex justify-between items-center bg-card z-20">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('modules.dashboard.calendar.title')}</h3>
          </div>
          <div className="px-2.5 py-1 bg-blue-50 rounded-full text-[9px] font-black text-blue-500 uppercase tracking-tighter">{t('common.calendar.days_range', { count: daysRange })}</div>
        </div>
      )}

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <div className="w-full md:w-[240px] p-5 border-r border-border/10 bg-muted/5 shrink-0">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth()-1, 1))} className="p-1 text-slate-400 hover:text-blue-600 transition-colors"><ChevronLeft size={16} /></button>
            <span className="text-[10px] font-black text-slate-800 uppercase tracking-tighter">{currentMonth.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', { month: 'long', year: 'numeric' })}</span>
            <button onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth()+1, 1))} className="p-1 text-slate-400 hover:text-blue-600 transition-colors"><ChevronRight size={16} /></button>
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {[
              t('common.calendar.weekdays.mon'),
              t('common.calendar.weekdays.tue'),
              t('common.calendar.weekdays.wed'),
              t('common.calendar.weekdays.thu'),
              t('common.calendar.weekdays.fri'),
              t('common.calendar.weekdays.sat'),
              t('common.calendar.weekdays.sun')
            ].map(d => (<span key={d} className="text-[8px] font-black text-slate-300 uppercase mb-2">{d}</span>))}
            {calendarDays.map((d,i) => (
              <div key={i} onClick={() => setSelectedDate(d.date)} className={`aspect-square flex flex-col items-center justify-center text-[10px] font-black rounded-lg cursor-pointer transition-all relative ${d.isMuted ? 'text-muted-foreground opacity-30 font-medium' : 'text-foreground/70 hover:bg-muted hover:shadow-md'} ${d.isSelected ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 z-10 scale-105' : ''} ${d.isToday && !d.isSelected ? 'bg-background border border-primary text-primary' : ''}`}>
                {d.day}
                {d.hasActivity && (<div className={`w-1 h-1 rounded-full absolute bottom-1 ${d.isSelected ? 'bg-background' : 'bg-orange-400'}`} />)}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-transparent overflow-hidden relative min-h-0">
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-50 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary/30" />
            </div>
          )}
          <div className={cn(
            "flex-1 min-h-0 p-4 custom-scrollbar bg-background",
            shouldLimitActivityList ? "max-h-[340px] overflow-y-auto pr-2" : "overflow-y-visible"
          )}>
            {groupedActivities.length > 0 ? groupedActivities.map(([dateLabel, items]) => (
              <div key={dateLabel} className="mb-4 last:mb-0">
                <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-1 mb-1.5 flex items-center gap-2">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{dateLabel}</h4>
                  <div className="h-px bg-slate-50 dark:bg-slate-900 flex-1"></div>
                </div>
                <div className="space-y-1">
                  {items.map(activity => (
                    <div key={activity.id} className="flex items-center gap-2 group cursor-pointer py-1.5 px-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all" onClick={() => navigate(activity.type === 'TASK' ? '/tasks' : '/calendar')}>
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${activity.type === 'TASK' ? 'bg-blue-500' : 'bg-orange-500'}`} />
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className={`text-[7px] font-black uppercase tracking-tighter shrink-0 max-w-12 line-clamp-2 leading-tight ${activity.type === 'TASK' ? 'text-blue-500/60' : 'text-orange-500/60'}`}>{activity.type === 'TASK' ? t('modules.tasks.title') : activity.sortDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate group-hover:text-blue-600 transition-colors">{activity.title}</span>
                        </div>
                        <ExternalLink size={10} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <Clock size={32} className="text-slate-200 mb-3" />
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{t('modules.dashboard.calendar.no_plans')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarWidget;
