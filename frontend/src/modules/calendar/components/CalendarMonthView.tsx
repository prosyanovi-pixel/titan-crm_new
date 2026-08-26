// frontend/src/modules/calendar/components/CalendarMonthView.tsx
import React from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek } from "date-fns";
import { ru } from "date-fns/locale";
import { Plus } from "lucide-react";
import { useTranslation } from '@/lib/i18n';
import { calendar } from '../i18n/ru/calendar';
import type { CalendarEventType, EventType } from "@/modules/calendar";

interface Props {
  currentDate: Date;
  selectedDate: Date | null;
  getDayEvents: (date: Date) => CalendarEventType[];
  getEventColor: (type: EventType) => string;
  getEventIcon: (type: EventType) => React.JSX.Element;
  onDateClick: (date: Date) => void;
  onEventClick: (e: React.MouseEvent, event: CalendarEventType) => void;
}

export function CalendarMonthView({
  currentDate,
  selectedDate,
  getDayEvents,
  getEventColor,
  getEventIcon,
  onDateClick,
  onEventClick,
}: Props) {
  const { t } = useTranslation();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { locale: ru });
  const calendarEnd = endOfWeek(monthEnd, { locale: ru });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekdays = calendar.weekdays.short;

  return (
    <div className="grid grid-cols-7 grid-rows-[auto_1fr] h-full">
      {weekdays.map((day: string) => (
        <div
          key={day}
          className="p-2 text-right text-xs font-medium text-muted-foreground border-b border-r last:border-r-0 bg-background"
        >
          {day}
        </div>
      ))}

      <div className="col-span-7 grid grid-cols-7 auto-rows-fr overflow-y-auto bg-background">
        {calendarDays.map((day, idx) => {
          const dayEvents = getDayEvents(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          return (
            <div
              key={day.toString()}
              className={[
                "min-h-[120px] p-2 border-b border-r relative group transition-colors hover:bg-muted/10",
                idx % 7 === 6 ? "border-r-0" : "",
                !isSameMonth(day, currentDate) ? "text-muted-foreground/30" : "text-foreground",
                isSelected ? "bg-accent/10" : "",
              ].join(" ")}
              onClick={() => onDateClick(day)}
            >
              <div className="flex justify-end items-start mb-1">
                <span
                  className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday(day) ? "bg-primary text-primary-foreground" : ""
                  }`}
                >
                  {format(day, "d")}
                </span>
              </div>

              <div className="space-y-1">
                {dayEvents.slice(0, 4).map((event) => (
                  <div
                    key={event.id}
                    className={`text-[10px] px-1.5 py-0.5 rounded border truncate cursor-pointer flex items-center gap-1.5 ${getEventColor(event.type)}`}
                    onClick={(e) => onEventClick(e, event)}
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
                  onDateClick(day);
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
