import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckSquare,
  Briefcase,
  Scale,
  Clock,
  Phone,
  User,
  Search,
  Cake
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  startOfWeek,
  endOfWeek,
  parse,
  addDays,
  subDays,
  addYears,
  subYears,
  eachMonthOfInterval,
  startOfYear,
  endOfYear
} from "date-fns";
import { ru } from "date-fns/locale";
import { useTranslation } from "@/lib/i18n";
import { calendar } from "../i18n/ru/calendar";
import { useModuleSettings } from "@/modules/settings/hooks/useModuleSettings";
import { toast } from "sonner";
import { CalendarEvent as CalendarEventSheet } from "../components/CalendarEvent";
import { CalendarVisibilityPanel } from "../components/CalendarVisibilityPanel";
import type { CalendarEvent as CalendarEventType, EventType } from "../types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/api";

type ViewMode = "day" | "month" | "year";

interface CalendarTaskSource {
    id: string;
    title: string;
    dueDate?: string;
    status?: string;
    project?: string;
    assignee?: string;
}

interface CalendarProjectSource {
    id: string;
    name: string;
    deadline?: string;
    status?: string;
    manager?: string;
    budget?: string | number;
}

interface CaseEventSource {
    id: string;
    title: string;
    date: string;
    description?: string;
}

interface CalendarCaseSource {
    id: string;
    title: string;
    deadline?: string;
    status?: string;
    courtName?: string;
    events?: CaseEventSource[];
}

interface CalendarStoredEventSource extends Omit<CalendarEventType, "date"> {
    date: string;
}

interface CalendarViewProps {
  currentDate: Date;
  selectedDate: Date | null;
  events: CalendarEventType[];
  t: any;
  calendar: any;
  getDayEvents: (date: Date) => CalendarEventType[];
  getEventColor: (type: EventType) => string;
  getEventIcon: (type: EventType) => React.ReactNode;
  handleDateClick: (date: Date) => void;
  handleEventClick: (e: React.MouseEvent, event: CalendarEventType) => void;
  setCurrentDate: (date: Date) => void;
  setViewMode: (mode: ViewMode) => void;
}

function DayView({ currentDate, getDayEvents, getEventColor, getEventIcon, handleEventClick }: CalendarViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const daysEvents = getDayEvents(currentDate);

  return (
    <ScrollArea className="h-full">
      <div className="relative min-h-[1440px] border-l ml-12">
        {hours.map(hour => (
          <div key={hour} className="absolute w-full h-[60px] border-b border-border/50" style={{ top: hour * 60 }}>
            <span className="absolute -left-12 -top-3 text-xs text-muted-foreground w-10 text-right">
              {hour}:00
            </span>
          </div>
        ))}
        {daysEvents.map(event => {
          let startHour = 0;
          if (event.time) {
            const [h, m] = event.time.split(':').map(Number);
            startHour = h + (m / 60);
          }
          const top = startHour * 60;
          const height = 50;

          return (
            <div
              key={event.id}
              className={`absolute left-2 right-2 rounded p-2 text-sm border cursor-pointer hover:shadow-md transition-all ${getEventColor(event.type)}`}
              style={{ top: `${top}px`, height: `${height}px` }}
              onClick={(e) => handleEventClick(e, event)}
            >
              <div className="flex items-center gap-2 font-medium">
                {getEventIcon(event.type)}
                {event.time} - {event.title}
              </div>
              {event.description && (
                <div className="text-xs opacity-80 truncate">{event.description}</div>
              )}
            </div>
          );
        })}
        {isToday(currentDate) && (
          <div
            className="absolute w-full border-t-2 border-red-500 z-10 pointer-events-none"
            style={{ top: (new Date().getHours() * 60) + new Date().getMinutes() }}
          >
            <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

function MonthView({ currentDate, selectedDate, getDayEvents, getEventColor, getEventIcon, handleDateClick, handleEventClick, calendar, t }: CalendarViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { locale: ru });
  const calendarEnd = endOfWeek(monthEnd, { locale: ru });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekdays = calendar.weekdays.short;

  return (
    <div className="grid grid-cols-7 grid-rows-[auto_1fr] h-full">
      {weekdays.map((day: string) => (
        <div key={day} className="p-2 text-right text-xs font-medium text-muted-foreground border-b border-r last:border-r-0 bg-background">
          {day}
        </div>
      ))}
      <div className="col-span-7 grid grid-cols-7 auto-rows-fr overflow-y-auto custom-scrollbar bg-background">
        {calendarDays.map((day, idx) => {
          const dayEvents = getDayEvents(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          return (
            <div
              key={day.toString()}
              className={`
                min-h-[120px] p-2 border-b border-r relative group transition-colors hover:bg-muted/10
                ${idx % 7 === 6 ? 'border-r-0' : ''}
                ${!isSameMonth(day, currentDate) ? 'text-muted-foreground/30' : 'text-foreground'}
                ${isSelected ? 'bg-accent/10' : ''}
              `}
              onClick={() => handleDateClick(day)}
            >
              <div className="flex justify-end items-start mb-1">
                <span className={`
                  text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                  ${isToday(day) ? 'bg-primary text-primary-foreground' : ''}
                `}>
                  {format(day, 'd')}
                </span>
              </div>

              <div className="space-y-1">
                {dayEvents.slice(0, 4).map(event => (
                  <div
                    key={event.id}
                    className={`
                      text-[10px] px-1.5 py-0.5 rounded border truncate cursor-pointer flex items-center gap-1.5
                      ${getEventColor(event.type)}
                    `}
                    onClick={(e) => handleEventClick(e, event)}
                  >
                    {getEventIcon(event.type)}
                    <span className="truncate">{event.title}</span>
                  </div>
                ))}
                {dayEvents.length > 4 && (
                  <div className="text-[10px] text-muted-foreground pl-1">
                    Еще {dayEvents.length - 4}...
                  </div>
                )}
              </div>

              <button
                className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted text-muted-foreground transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDateClick(day);
                }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function YearView({ currentDate, getDayEvents, getEventIcon, setCurrentDate, setViewMode, calendar, t }: CalendarViewProps) {
  const yearStart = startOfYear(currentDate);
  const yearEnd = endOfYear(currentDate);
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  return (
    <ScrollArea className="h-full">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
        {months.map(month => {
          const daysInMonth = eachDayOfInterval({
            start: startOfWeek(startOfMonth(month), { locale: ru }),
            end: endOfWeek(endOfMonth(month), { locale: ru })
          });

          return (
            <div key={month.toString()} className="cursor-pointer group" onClick={() => { setCurrentDate(month); setViewMode('month'); }}>
              <div className="font-semibold mb-3 text-lg text-red-500 capitalize">{format(month, 'LLLL', { locale: ru })}</div>
              <div className="grid grid-cols-7 text-[10px] gap-y-2 text-center">
                {calendar.weekdays.initials.map((d: string) => (
                  <div key={d} className="text-muted-foreground font-medium">{d}</div>
                ))}
                {daysInMonth.map(day => {
                  const hasEvents = getDayEvents(day).length > 0;
                  const isCurrentMonth = isSameMonth(day, month);
                  return (
                    <div
                      key={day.toString()}
                      className={`
                        aspect-square flex items-center justify-center rounded-full relative text-sm
                        ${!isCurrentMonth ? 'invisible' : ''}
                        ${isToday(day) ? 'bg-red-500 text-white font-bold' : 'group-hover:text-foreground'}
                      `}
                    >
                      {format(day, 'd')}
                      {hasEvents && isCurrentMonth && !isToday(day) && (
                        <div className="absolute bottom-0 w-1 h-1 rounded-full bg-muted-foreground" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

function ViewSwitcher({ viewMode, setViewMode, t }: { viewMode: ViewMode; setViewMode: (mode: ViewMode) => void; t: any }) {
  return (
    <div className="flex bg-muted/20 p-1 rounded-md border border-border/50">
      <button
        onClick={() => setViewMode('day')}
        className={`px-3 py-1 text-sm rounded-sm transition-all ${viewMode === 'day' ? 'bg-background shadow-sm text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
      >
        {t('common.view_mode.day')}
      </button>
      <button
        onClick={() => setViewMode('month')}
        className={`px-3 py-1 text-sm rounded-sm transition-all ${viewMode === 'month' ? 'bg-background shadow-sm text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
      >
        {t('common.view_mode.month')}
      </button>
      <button
        onClick={() => setViewMode('year')}
        className={`px-3 py-1 text-sm rounded-sm transition-all ${viewMode === 'year' ? 'bg-background shadow-sm text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
      >
        {t('common.view_mode.year')}
      </button>
    </div>
  );
}

export default function Calendar() {
  const { t } = useTranslation();
  const { settings } = useModuleSettings("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  
  // State for events
  const [events, setEvents] = useState<CalendarEventType[]>([]);
  
  // Sheet State
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventType | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Fetch and Aggregation Data
  useEffect(() => {
    const fetchAll = async () => {
        try {
            // Parallel Fetching
            const [tasksData, projectsData, casesData, calendarEventsData] = await Promise.all([
                api.get('/tasks'),
                api.get('/projects'),
                api.get('/legal-cases'),
                api.get('/calendar/events')
            ]) as [CalendarTaskSource[], CalendarProjectSource[], CalendarCaseSource[], CalendarStoredEventSource[]];

            const allEvents: CalendarEventType[] = [];

            // 1. Process Tasks
            tasksData.forEach((task) => {
                let date = new Date();
                if (task.dueDate === t('calendar.relative_dates.tomorrow')) date.setDate(date.getDate() + 1);
                else if (task.dueDate === t('calendar.relative_dates.yesterday')) date.setDate(date.getDate() - 1);
                else if (task.dueDate && task.dueDate.includes(".")) {
                    const parsed = parse(task.dueDate, "dd.MM.yyyy", new Date());
                    if (!isNaN(parsed.getTime())) date = parsed;
                }

                allEvents.push({
                    id: `task-${task.id}`,
                    title: task.title,
                    date: date,
                    type: "task",
                    status: task.status,
                    description: `${t('calendar.event_descriptions.project', { project: task.project ?? '' })}\n${t('calendar.event_descriptions.executor', { assignee: task.assignee ?? '' })}`,
                    time: "10:00",
                    notifications: []
                });
            });

            // 2. Process Projects
            projectsData.forEach((project) => {
                if (project.deadline) {
                    const parsed = parse(project.deadline, "dd.MM.yyyy", new Date());
                    if (!isNaN(parsed.getTime())) {
                        allEvents.push({
                            id: `proj-${project.id}`,
                            title: t('calendar.event_descriptions.deadline', { name: project.name }),
                            date: parsed,
                            type: "project",
                            status: project.status,
                            allDay: true,
                            description: `${t('calendar.event_descriptions.manager', { manager: project.manager ?? '' })}\n${t('calendar.event_descriptions.budget', { budget: project.budget ?? '' })}`,
                            notifications: []
                        });
                    }
                }
            });

            // 3. Process Legal Cases
            casesData.forEach((c) => {
                if (c.deadline) {
                    const parsed = parse(c.deadline, "dd.MM.yyyy", new Date());
                    if (!isNaN(parsed.getTime())) {
                        allEvents.push({
                            id: `case-${c.id}`,
                            title: c.title,
                            date: parsed,
                            type: "court",
                            status: c.status,
                            time: "14:00",
                            location: c.courtName || t('calendar.locations.court'),
                            notifications: []
                        });
                    }
                }
                c.events?.forEach((e) => {
                    const eParsed = parse(e.date, "dd.MM.yyyy", new Date());
                    if (!isNaN(eParsed.getTime())) {
                        // Избегаем дублирования префикса evt- если ID уже начинается с ev-
                        const eventId = e.id.startsWith('ev-') ? e.id : `evt-${e.id}`;
                        allEvents.push({
                            id: eventId,
                            title: e.title,
                            date: eParsed,
                            type: "meeting",
                            time: "10:00",
                            description: e.description,
                            notifications: []
                        });
                    }
                });
            });

            // 4. Process Calendar Events (Stored in DB)
            calendarEventsData.forEach((ev) => {
                allEvents.push({
                    ...ev,
                    date: new Date(ev.date) // Ensure date object
                });
            });

            setEvents(allEvents);

        } catch (err) {
            console.error("Failed to fetch calendar data", err);
            toast.error(t('general.toast.error.calendar_load'));
        }
    };

    fetchAll();
    }, [t]);

  const handlePrev = () => {
    if (viewMode === 'day') setCurrentDate(subDays(currentDate, 1));
    else if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'year') setCurrentDate(subYears(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1));
    else if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'year') setCurrentDate(addYears(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setIsSheetOpen(true);
  };

  const handleEventClick = (e: React.MouseEvent, event: CalendarEventType) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setSelectedDate(event.date);
    setIsSheetOpen(true);
  };

  const handleSaveEvent = async (savedEvent: CalendarEventType) => {
    try {
        // Не сохраняем локально сгенерированные события дней рождения
        if (savedEvent.id.startsWith("birthday-") || savedEvent.id.startsWith("contractor-anniversary-") || savedEvent.id.startsWith("hire-anniversary-")) {
            toast.info(t('general.toast.info.system_event_cannot_delete'));
            return;
        }
        
        if (selectedEvent && selectedEvent.id) {
            // Update existing
            const res = await api.put(`/calendar/events/${savedEvent.id}`, savedEvent);
            setEvents(prev => prev.map(e => e.id === savedEvent.id ? { ...res, date: new Date(res.date) } : e));
            toast.success(t('general.toast.success.event_updated'));
        } else {
            // Create new
            const res = await api.post('/calendar/events', savedEvent);
            setEvents(prev => [...prev, { ...res, date: new Date(res.date) }]);
            toast.success(t('general.toast.success.event_created'));
            
            if (savedEvent.createFollowUpTask) {
                // Logic to call task API if needed
                const newTask = {
                    title: t('calendar.event_descriptions.contact_client', { client: savedEvent.client ?? '' }),
                    project: "General",
                    assignee: "1", // Use a valid user ID instead of "Me"
                    priority: "Medium",
                    status: "To Do",
                    dueDate: t('calendar.relative_dates.tomorrow')
                };
                await api.post('/tasks', newTask);
                toast.info(t('general.toast.info.task_created_for_client').replace('{client}', savedEvent.client ?? ''), {
                    icon: <CheckSquare className="w-4 h-4 text-blue-500" />
                });
            }
        }
    } catch (e) {
        toast.error(t('general.toast.error.event_save'));
    }
  };

  const handleDeleteEvent = async (id: string) => {
    // Only delete real calendar events, ignore read-only projected ones
    if (!id.startsWith('evt-') && !id.startsWith('task-') && !id.startsWith('proj-') && !id.startsWith('case-') && !id.startsWith('birthday-') && !id.startsWith('contractor-anniversary-') && !id.startsWith('hire-anniversary-')) {
        // Assume default DB ID doesn't start with these prefixes
        try {
            await api.delete(`/calendar/events/${id}`);
            setEvents(prev => prev.filter(e => e.id !== id));
            toast.success(t('general.toast.success.event_deleted'));
        } catch (e) {
            toast.error(t('general.toast.error.event_delete'));
        }
    } else {
        toast.info(t('general.toast.info.system_event_cannot_delete'));
    }
  };

  const getDayEvents = (date: Date) => {
    return events.filter(e => isSameDay(e.date, date));
  };

  const getEventColor = (type: EventType) => {
      switch (type) {
          case 'task': return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
          case 'project': return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800";
          case 'court': return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
          case 'call': return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800";
          case 'meeting': return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
          case 'personal': return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
          default: return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
      }
  };

  const getEventIcon = (type: EventType) => {
      switch (type) {
          case 'task': return <CheckSquare className="w-3 h-3" />;
          case 'project': return <Briefcase className="w-3 h-3" />;
          case 'court': return <Scale className="w-3 h-3" />;
          case 'call': return <Phone className="w-3 h-3" />;
          case 'personal': return <User className="w-3 h-3" />;
          case 'birthday': return <Cake className="w-3 h-3" />;
          case 'contractor-anniversary': return <Cake className="w-3 h-3" />;
          case 'hire-anniversary': return <Cake className="w-3 h-3" />;
          default: return <Clock className="w-3 h-3" />;
      }
  };

  return (
    <AppLayout
      title={t('sidebar.calendar')}
      breadcrumbs={[{ label: t('sidebar.calendar') }]}
    >
      <div className="flex flex-col h-[calc(100vh-120px)] titan-card overflow-hidden bg-background">
        
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/60">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => { setSelectedEvent(null); setSelectedDate(new Date()); setIsSheetOpen(true); }}>
                    <Plus className="w-5 h-5 text-muted-foreground" />
                </Button>
            </div>

            <ViewSwitcher viewMode={viewMode} setViewMode={setViewMode} t={t} />

            <div className="flex items-center gap-2">
                <div className="w-64 relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder={t('calendar.search_events')} className="h-8 pl-9 bg-muted/20 border-transparent focus:bg-background transition-colors" />
                </div>
                <CalendarVisibilityPanel />
            </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-3xl font-bold capitalize text-foreground">
                {viewMode === 'day' 
                    ? format(currentDate, 'd MMMM yyyy', { locale: ru })
                    : viewMode === 'month' 
                        ? format(currentDate, 'LLLL yyyy', { locale: ru })
                        : format(currentDate, 'yyyy', { locale: ru })
                }
            </h2>

            <div className="flex items-center rounded-md border shadow-sm">
                <Button variant="ghost" size="icon" onClick={handlePrev} className="h-8 w-9 rounded-none rounded-l-md border-r">
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" onClick={handleToday} className="h-8 px-4 rounded-none font-normal text-sm">
                    {t('calendar.today_button')}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleNext} className="h-8 w-9 rounded-none rounded-r-md border-l">
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
        </div>

        <div className="flex-1 min-h-0 bg-background border-t">
            {viewMode === 'day' && <DayView currentDate={currentDate} selectedDate={selectedDate} events={events} t={t} calendar={calendar} getDayEvents={getDayEvents} getEventColor={getEventColor} getEventIcon={getEventIcon} handleDateClick={handleDateClick} handleEventClick={handleEventClick} setCurrentDate={setCurrentDate} setViewMode={setViewMode} />}
            {viewMode === 'month' && <MonthView currentDate={currentDate} selectedDate={selectedDate} events={events} t={t} calendar={calendar} getDayEvents={getDayEvents} getEventColor={getEventColor} getEventIcon={getEventIcon} handleDateClick={handleDateClick} handleEventClick={handleEventClick} setCurrentDate={setCurrentDate} setViewMode={setViewMode} />}
            {viewMode === 'year' && <YearView currentDate={currentDate} selectedDate={selectedDate} events={events} t={t} calendar={calendar} getDayEvents={getDayEvents} getEventColor={getEventColor} getEventIcon={getEventIcon} handleDateClick={handleDateClick} handleEventClick={handleEventClick} setCurrentDate={setCurrentDate} setViewMode={setViewMode} />}
        </div>
      </div>

      <CalendarEventSheet 
        open={isSheetOpen} 
        onOpenChange={setIsSheetOpen}
        initialDate={selectedDate || undefined}
        event={selectedEvent}
        onSave={handleSaveEvent}
        onDelete={(id) => handleDeleteEvent(String(id))}
      />
    </AppLayout>
  );
}