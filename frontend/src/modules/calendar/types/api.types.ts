import { CalendarEvent, CalendarEventInput } from "./calendar.types";

export interface GetEventsResponse {
  data: CalendarEvent[];
}

export interface GetEventResponse {
  data: CalendarEvent;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  date: string;
  type: string;
  start?: string;
  end?: string;
  location?: string;
  attendees?: string[];
  notifications?: string[];
  allDay?: boolean;
}

export interface UpdateEventRequest {
  id: string;
  title?: string;
  description?: string;
  date?: string;
  type?: string;
  start?: string;
  end?: string;
  location?: string;
  attendees?: string[];
  notifications?: string[];
  allDay?: boolean;
}

export interface DeleteEventResponse {
  success: boolean;
}
