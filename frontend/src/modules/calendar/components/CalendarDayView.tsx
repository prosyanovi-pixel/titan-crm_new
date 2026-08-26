// frontend/src/modules/calendar/components/CalendarDayView.tsx
import React from "react";
import { isToday } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CalendarEventType, EventType } from "@/modules/calendar";

interface Props {
  currentDate: Date;
  getDayEvents: (date: Date) => CalendarEventType[];
  getEventColor: (type: EventType) => string;
  getEventIcon: (type: EventType) => React.JSX.Element;
  onEventClick: (e: React.MouseEvent, event: CalendarEventType) => void;
}

export function CalendarDayView({
  currentDate,
  getDayEvents,
  getEventColor,
  getEventIcon,
  onEventClick,
}: Props) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const daysEvents = getDayEvents(currentDate);

  return (
    <ScrollArea className="h-full">
      <div className="relative min-h-[1440px] border-l ml-12">
        {hours.map((hour) => (
          <div
            key={hour}
            className="absolute w-full h-[60px] border-b border-border/50"
            style={{ top: hour * 60 }}
          >
            <span className="absolute -left-12 -top-3 text-xs text-muted-foreground w-10 text-right">
              {hour}:00
            </span>
          </div>
        ))}

        {daysEvents.map((event: CalendarEventType) => {
          let startHour = 0;
          if (event.time) {
            const [h, m] = event.time.split(":").map(Number);
            startHour = h + m / 60;
          }
          return (
            <div
              key={event.id}
              className={`absolute left-2 right-2 rounded p-2 text-sm border cursor-pointer hover:shadow-md transition-all ${getEventColor(event.type)}`}
              style={{ top: `${startHour * 60}px`, height: "50px" }}
              onClick={(e) => onEventClick(e, event)}
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
            style={{ top: new Date().getHours() * 60 + new Date().getMinutes() }}
          >
            <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full" />
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
