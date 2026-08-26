export const ENDPOINTS = {
  EVENTS: '/calendar/events',
  EVENT_BY_ID: (id: string) => `/calendar/events/${id}`,
} as const;
