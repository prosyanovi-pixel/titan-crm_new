import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import { CalendarEvent, CalendarEventInput, EventType } from "../types/calendar.types";
import { calendarService } from "../api/calendarService";

interface UseCalendarReturn {
  events: CalendarEvent[];
  loading: boolean;
  error: Error | null;
  fetchEvents: () => Promise<void>;
  createEvent: (data: CalendarEventInput) => Promise<CalendarEvent | null>;
  updateEvent: (id: string, data: Partial<CalendarEventInput>) => Promise<CalendarEvent | null>;
  deleteEvent: (id: string) => Promise<boolean>;
}

export function useCalendar(): UseCalendarReturn {
  const { t } = useTranslation();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await calendarService.getAll();
      setEvents(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      toast.error(t("general.toast.error.calendar_load"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const createEvent = useCallback(
    async (data: CalendarEventInput): Promise<CalendarEvent | null> => {
      try {
        const newEvent = await calendarService.create(data);
        setEvents((prev) => [...prev, newEvent]);
        toast.success(t("general.toast.success.event_created"));
        return newEvent;
      } catch (err) {
        toast.error(t("general.toast.error.event_save"));
        return null;
      }
    },
    [t]
  );

  const updateEvent = useCallback(
    async (id: string, data: Partial<CalendarEventInput>): Promise<CalendarEvent | null> => {
      try {
        const updatedEvent = await calendarService.update(id, data);
        setEvents((prev) =>
          prev.map((e) => (e.id === id ? updatedEvent : e))
        );
        toast.success(t("general.toast.success.event_updated"));
        return updatedEvent;
      } catch (err) {
        toast.error(t("general.toast.error.event_save"));
        return null;
      }
    },
    [t]
  );

  const deleteEvent = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await calendarService.delete(id);
        setEvents((prev) => prev.filter((e) => e.id !== id));
        toast.success(t("general.toast.success.event_deleted"));
        return true;
      } catch (err) {
        toast.error(t("general.toast.error.event_delete"));
        return false;
      }
    },
    [t]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
