// frontend/src/modules/calendar/hooks/useCalendarPage.tsx
import React, { useState, useEffect, JSX } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CheckSquare, Briefcase, Scale, Clock, Phone, User, Bell,
} from "lucide-react";
import {
  addMonths, subMonths, addDays, subDays, addYears, subYears,
  isSameDay, parse,
} from "date-fns";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { useCalendarSettings } from "./useCalendarSettings";
import { transformBirthdaysToEvents } from "../utils/birthdayUtils";
import type { CalendarEventType, EventType, CalendarNotification, ViewMode } from "@/modules/calendar";

export interface CalendarTaskSource {
  id: string;
  title: string;
  dueDate?: string;
  status?: string;
  project?: string;
  assignee?: string;
}

export interface CalendarProjectSource {
  id: string;
  name: string;
  deadline?: string;
  status?: string;
  manager?: string;
  budget?: string | number;
}

export interface CaseEventSource {
  id: string;
  title: string;
  date: string;
  description?: string;
}

export interface CalendarCaseSource {
  id: string;
  title: string;
  deadline?: string;
  status?: string;
  courtName?: string;
  events?: CaseEventSource[];
}

export interface CalendarStoredEventSource extends Omit<CalendarEventType, "date"> {
  date: string;
}

export function useCalendarPage() {
  const { t } = useTranslation();
  const { settings: calendarSettings, isLoaded: settingsLoaded } = useCalendarSettings();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [events, setEvents] = useState<CalendarEventType[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventType | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const action = searchParams.get('action');
    console.log('[CalendarPage] useSearchParams effect - action:', action, 'settingsLoaded:', settingsLoaded);
    
    if (action === 'create' && settingsLoaded) {
      const contractorId = searchParams.get('contractorId');
      const projectId = searchParams.get('projectId');
      const assignee = searchParams.get('assignee');
      const name = searchParams.get('name');
      const description = searchParams.get('description');
      const location = searchParams.get('location');
      
      console.log('[CalendarPage] Create event params:', { contractorId, projectId, assignee, name, description, location });
      
      // Собираем данные для предзаполнения события
      const eventData: any = {};
      
      if (contractorId) eventData.contractorId = String(contractorId);
      if (projectId) eventData.projectId = String(projectId);
      if (assignee) eventData.assignee = String(assignee);
      if (name) eventData.title = String(name);
      if (description) eventData.description = String(description);
      if (location) eventData.location = String(location);
      
      console.log('[CalendarPage] eventData to set:', JSON.stringify(eventData));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedEvent(eventData as any);
       
      setSelectedDate(new Date());
       
      setIsSheetOpen(true);
      
      console.log('[CalendarPage] Selected event set, checking:', {
        contractorId: eventData.contractorId,
        assignee: eventData.assignee,
        title: eventData.title
      });
      
      // Очищаем параметры, чтобы при обновлении страницы окно не открывалось снова
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, settingsLoaded]);

  useEffect(() => {
    const fetchAll = async () => {
      if (!settingsLoaded) return;

      try {
        const [tasksData, projectsData, casesData, calendarEventsData, contractorsData, employeesData] = await Promise.all([
          api.get("/tasks"),
          api.get("/projects"),
          api.get("/legal-cases"),
          api.get("/calendar/events"),
          api.get("/contractors?all=true"),
          api.get("/employees"),
        ]) as [CalendarTaskSource[], CalendarProjectSource[], CalendarCaseSource[], CalendarStoredEventSource[], any[], any[]];

        const allEvents: CalendarEventType[] = [];

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
            date,
            type: "task",
            status: task.status,
            description: `${t('calendar.event_descriptions.project', { project: task.project ?? '' })}\n${t('calendar.event_descriptions.executor', { assignee: task.assignee ?? '' })}`,
            time: "10:00",
            notifications: [] as CalendarNotification[],
          });
        });

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
                notifications: [] as CalendarNotification[],
              });
            }
          }
        });

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
                notifications: [] as CalendarNotification[],
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
                notifications: [] as CalendarNotification[],
              });
            }
          });
        });

        calendarEventsData.forEach((ev) => {
          allEvents.push({ ...ev, date: new Date(ev.date) });
        });

        // Добавляем события дней рождения
        const birthdayEvents = transformBirthdaysToEvents(
          contractorsData || [],
          employeesData || [],
          calendarSettings,
          currentDate
        );
        allEvents.push(...birthdayEvents);

        setEvents(allEvents);
      } catch (err) {
        console.error("Failed to fetch calendar data", err);
        toast.error(t("general.toast.error.calendar_load"));
      }
    };
    fetchAll();
  }, [t, settingsLoaded, calendarSettings, currentDate]);

  const handlePrev = () => {
    if (viewMode === "day") setCurrentDate((d) => subDays(d, 1));
    else if (viewMode === "month") setCurrentDate((d) => subMonths(d, 1));
    else setCurrentDate((d) => subYears(d, 1));
  };

  const handleNext = () => {
    if (viewMode === "day") setCurrentDate((d) => addDays(d, 1));
    else if (viewMode === "month") setCurrentDate((d) => addMonths(d, 1));
    else setCurrentDate((d) => addYears(d, 1));
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
        toast.info(t("general.toast.info.system_event_cannot_delete"));
        return;
      }

      // Проверяем, является ли событие projected (не хранится в БД календаря)
      const isProjected = savedEvent.id && (
        savedEvent.id.startsWith("task-") ||
        savedEvent.id.startsWith("proj-") ||
        savedEvent.id.startsWith("case-") ||
        savedEvent.id.startsWith("ev-") && !savedEvent.id.startsWith("evt-")
      );
      if (isProjected) {
        toast.info(t("general.toast.info.system_event_cannot_delete"));
        return;
      }
      
      if (selectedEvent && selectedEvent.id) {
        const res = await api.put(`/calendar/events/${savedEvent.id}`, savedEvent);
        setEvents((prev) =>
          prev.map((e) => (e.id === savedEvent.id ? { ...res, date: new Date(res.date) } : e))
        );
        toast.success(t("general.toast.success.event_updated"));
      } else {
        const res = await api.post("/calendar/events", savedEvent);
        setEvents((prev) => [...prev, { ...res, date: new Date(res.date) }]);
        toast.success(t("general.toast.success.event_created"));

        if (savedEvent.createFollowUpTask) {
          await api.post("/tasks", {
            title: t('calendar.event_descriptions.contact_client', { client: savedEvent.client ?? '' }),
            project: "General",
            assignee: "1",
            priority: "Medium",
            status: "To Do",
            dueDate: t('calendar.relative_dates.tomorrow'),
          });
          toast.info(
            t("general.toast.info.task_created_for_client").replace("{client}", savedEvent.client ?? '')
          );
        }
      }
    } catch {
      toast.error(t("general.toast.error.event_save"));
    }
  };

  const handleDeleteEvent = async (id: string) => {
    console.log(`[Calendar] Delete event with ID: ${id}`);
    // Реальные события календаря имеют префикс evt-
    if (id.startsWith("evt-")) {
      try {
        console.log(`[Calendar] Sending DELETE request to /calendar/events/${id}`);
        await api.delete(`/calendar/events/${id}`);
        setEvents((prev) => prev.filter((e) => e.id !== id));
        toast.success(t("general.toast.success.event_deleted"));
        console.log(`[Calendar] Event ${id} deleted successfully`);
      } catch (error) {
        console.error(`[Calendar] Failed to delete event ${id}:`, error);
        toast.error(t("general.toast.error.event_delete"));
      }
    } else {
      // Projected события (задачи, проекты, дела, дни рождения и т.д.) нельзя удалять через календарь
      console.log(`[Calendar] Event ${id} is projected, skipping API call`);
      toast.info(t("general.toast.info.system_event_cannot_delete"));
    }
  };

  const getDayEvents = (date: Date) => events.filter((e) => isSameDay(e.date, date));

  const getEventColor = (type: EventType) => {
    switch (type) {
      case "task":     return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
      case "project":  return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800";
      case "court":    return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
      case "call":     return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800";
      case "meeting":  return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
      case "reminder": return "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800";
      case "personal": return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
      default:         return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    }
  };

  const getEventIcon = (type: EventType): JSX.Element => {
    switch (type) {
      case "task":    return <CheckSquare className="w-3 h-3" />;
      case "project": return <Briefcase className="w-3 h-3" />;
      case "court":   return <Scale className="w-3 h-3" />;
      case "call":    return <Phone className="w-3 h-3" />;
      case "reminder":return <Bell className="w-3 h-3" />;
      case "personal":return <User className="w-3 h-3" />;
      default:        return <Clock className="w-3 h-3" />;
    }
  };

  // Quick actions handler
  const handleQuickAction = (actionType: string) => {
    switch (actionType) {
      case 'create_event':
      case 'schedule_meeting':
      case 'set_reminder':
        setSelectedDate(new Date());
        setSelectedEvent(null);
        setIsSheetOpen(true);
        break;
      default:
        toast.info(t('settings.action_not_implemented'));
    }
  };

  return {
    currentDate, setCurrentDate,
    viewMode, setViewMode,
    events, setEvents,
    selectedDate, setSelectedDate,
    selectedEvent, setSelectedEvent,
    isSheetOpen, setIsSheetOpen,
    searchQuery, setSearchQuery,
    handlePrev, handleNext, handleToday,
    handleDateClick, handleEventClick,
    handleSaveEvent, handleDeleteEvent,
    getDayEvents, getEventColor, getEventIcon,
    handleQuickAction,
  };
}
