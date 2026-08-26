// frontend/src/modules/calendar/components/CalendarYearView.tsx
import React from "react";
import {
  format,
  startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday,
  startOfWeek, endOfWeek, eachMonthOfInterval, startOfYear, endOfYear,
} from "date-fns";
import { ru } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from '@/lib/i18n';
import { calendar } from '../i18n/ru/calendar';
import type { CalendarEventType, ViewMode } from "@/modules/calendar";

interface Props {
  currentDate: Date;
  getDayEvents: (date: Date) => CalendarEventType[];
  setCurrentDate: (date: Date) => void;
  setViewMode: (mode: ViewMode) => void;
}

export function CalendarYearView({
  currentDate,
  getDayEvents,
  setCurrentDate,
  setViewMode,
}: Props) {
  const { t } = useTranslation();
  const months = eachMonthOfInterval({
    start: startOfYear(currentDate),
    end: endOfYear(currentDate),
  });

  const weekdayInitials = calendar.weekdays.initials;

  return (
    <ScrollArea className="h-full">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
        {months.map((month) => {
          const daysInMonth = eachDayOfInterval({
            start: startOfWeek(startOfMonth(month), { locale: ru }),
            end: endOfWeek(endOfMonth(month), { locale: ru }),
          });

          return (
            <div
              key={month.toString()}
              className="cursor-pointer group"
              onClick={() => { setCurrentDate(month); setViewMode("month"); }}
            >
              <div className="font-semibold mb-3 text-lg text-red-500 capitalize">
                {format(month, "LLLL", { locale: ru })}
              </div>
              <div className="grid grid-cols-7 text-[10px] gap-y-2 text-center">
                {weekdayInitials.map((d: string, i: number) => (
                  <div key={`${d}-${i}`} className="text-muted-foreground font-medium">{d}</div>
                ))}
                {daysInMonth.map((day) => {
                  const hasEvents = getDayEvents(day).length > 0;
                  const isCurrentMonth = isSameMonth(day, month);
                  return (
                    <div
                      key={day.toString()}
                      className={[
                        "aspect-square flex items-center justify-center rounded-full relative text-sm",
                        !isCurrentMonth ? "invisible" : "",
                        isToday(day) ? "bg-red-500 text-white font-bold" : "group-hover:text-foreground",
                      ].join(" ")}
                    >
                      {format(day, "d")}
                      {hasEvents && isCurrentMonth && !isToday(day) && (
                        <div className="absolute bottom-0 w-1 h-1 rounded-full bg-muted-foreground" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
