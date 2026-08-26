import { api } from "@/lib/api";
import type { EventType, CalendarEvent, CalendarEventInput } from "../types/calendar.types";

export const calendarService = {
  // Get all calendar events
  getAll: async (): Promise<CalendarEvent[]> => {
    try {
      const response = await api.get("/calendar/events");
      return (response as CalendarEvent[]).map((ev: CalendarEvent) => ({
        ...ev,
        date: new Date(ev.date),
      }));
    } catch (error) {
      console.error("Ошибка при получении событий календаря:", error);
      throw error;
    }
  },

  // Get calendar event by ID
  getById: async (id: string): Promise<CalendarEvent> => {
    try {
      // Не загружаем локально сгенерированные события дней рождения
      if (id.startsWith('birthday-') || id.startsWith('contractor-anniversary-') || id.startsWith('hire-anniversary-') || id.startsWith('evt-')) {
        throw new Error(`Event ${id} is locally generated and cannot be loaded from server`);
      }
      const response = await api.get(`/calendar/events/${id}`);
      return {
        ...response,
        date: new Date(response.date),
      };
    } catch (error) {
      console.error(`Ошибка при получении события с ID ${id}:`, error);
      throw error;
    }
  },

  // Create new calendar event
  create: async (event: CalendarEventInput): Promise<CalendarEvent> => {
    try {
      const response = await api.post("/calendar/events", event);
      return {
        ...response,
        date: new Date(response.date),
      };
    } catch (error) {
      console.error("Ошибка при создании события:", error);
      throw error;
    }
  },

  // Update calendar event
  update: async (id: string, event: Partial<CalendarEventInput>): Promise<CalendarEvent> => {
    try {
      const response = await api.put(`/calendar/events/${id}`, event);
      return {
        ...response,
        date: new Date(response.date),
      };
    } catch (error) {
      console.error(`Ошибка при обновлении события с ID ${id}:`, error);
      throw error;
    }
  },

  // Delete calendar event
  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/calendar/events/${id}`);
    } catch (error) {
      console.error(`Ошибка при удалении события с ID ${id}:`, error);
      throw error;
    }
  },
};
