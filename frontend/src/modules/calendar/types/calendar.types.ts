export type EventType = "meeting" | "call" | "task" | "reminder" | "project" | "court" | "personal" | "birthday" | "hire-anniversary" | "contractor-anniversary";

export type ReminderUnit = "minutes" | "hours" | "days" | "weeks";
export type NotifyChannel = "email" | "sms" | "whatsapp" | "app";

export interface CalendarNotification {
  id: string;
  type: "relative" | "absolute";
  value: number | string;
  unit?: ReminderUnit;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  start?: string;
  end?: string;
  type: EventType;
  status?: string;
  time?: string;
  endTime?: string;
  location?: string;
  attendees?: string[];
  notifications?: CalendarNotification[];
  allDay?: boolean;
  // Extended properties for UI
  createFollowUpTask?: boolean;
  client?: string;
  contractorId?: string | null;
  assignee?: string;
  projectId?: string | null;
  endDate?: Date;
  startDate?: Date;
  // Notifications
  notifyClient?: boolean;
  clientNotifyChannel?: NotifyChannel;
  clientNotifyTarget?: string;
  notifyAssignee?: boolean;
  assigneeNotifyChannel?: NotifyChannel;
  assigneeNotifyTarget?: string;
}

export interface CalendarEventInput {
  title: string;
  description?: string;
  date: string;
  start?: string;
  end?: string;
  type: EventType;
  location?: string;
  attendees?: string[];
  notifications?: string[];
  allDay?: boolean;
}

export type ViewMode = "day" | "month" | "year";

export interface CalendarFilters {
  type?: EventType;
  searchQuery?: string;
  dateFrom?: Date;
  dateTo?: Date;
}
