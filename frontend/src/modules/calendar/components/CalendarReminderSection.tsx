// frontend/src/modules/calendar/components/CalendarReminderSection.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DatePicker } from "@/components/ui/date-picker";
import { Bell, Plus, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import type { CalendarNotification, ReminderUnit } from "../types";
import {
  setCustomReminderOpen, setCustomField,
  addPresetReminder as addPresetAction,
  addCustomReminder as addCustomAction,
  removeReminder as removeAction,
} from "../store/calendarEventSlice";
import type { Dispatch } from "react";

interface Props {
  notifications: CalendarNotification[];
  isCustomReminderOpen: boolean;
  customReminderType: "relative" | "absolute";
  customVal: string;
  customUnit: ReminderUnit;
  customDate: string;
  customTime: string;
  formatNotification: (n: CalendarNotification) => string;
  dispatch: Dispatch<any>;
}

export function CalendarReminderSection({
  notifications,
  isCustomReminderOpen,
  customReminderType,
  customVal,
  customUnit,
  customDate,
  customTime,
  formatNotification,
  dispatch,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex items-start gap-4">
      <Bell className="w-5 h-5 text-muted-foreground mt-2" />
      <div className="flex-1 space-y-2">
        {notifications?.map((n) => (
          <div key={n.id} className="flex items-center justify-between bg-muted/40 px-3 py-2 rounded-md text-sm">
            <span>{formatNotification(n)}</span>
            <button onClick={() => dispatch(removeAction(n.id))} className="text-muted-foreground hover:text-destructive">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        <Popover
          open={isCustomReminderOpen}
          onOpenChange={(v) => dispatch(setCustomReminderOpen(v))}
        >
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-start text-muted-foreground font-normal h-9">
              <Plus className="w-4 h-4 mr-2" />
              {t("calendar.reminder_for_me")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <div className="space-y-1">
              {["15min", "1hour", "1day"].map((preset) => (
                <Button
                  key={preset}
                  variant="ghost" size="sm"
                  className="w-full justify-start font-normal"
                  onClick={() => dispatch(addPresetAction(preset))}
                >
                  {preset === "15min" ? t("calendar.in_15_minutes") : preset === "1hour" ? t("calendar.in_1_hour") : t("calendar.in_1_day")}
                </Button>
              ))}

              <div className="border-t my-1" />
              <div className="p-2 space-y-3">
                <div className="flex gap-1 bg-muted rounded p-0.5">
                  {(["relative", "absolute"] as const).map((type) => (
                    <button
                      key={type}
                      className={`flex-1 text-xs py-1 rounded ${customReminderType === type ? "bg-background shadow-sm" : ""}`}
                      onClick={() => dispatch(setCustomField({ name: "customReminderType", value: type }))}
                    >
                      {type === "relative" ? t("calendar.timer") : t("calendar.date_time")}"
                    </button>
                  ))}
                </div>

                {customReminderType === "relative" ? (
                  <div className="flex gap-2">
                    <Input
                      className="w-16 h-8" type="number" min="1"
                      value={customVal}
                      onChange={(e) => dispatch(setCustomField({ name: "customVal", value: e.target.value }))}
                    />
                    <Select value={customUnit} onValueChange={(v: any) => dispatch(setCustomField({ name: "customUnit", value: v }))}>
                      <SelectTrigger className="flex items-center justify-between rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground px-3 py-2 h-8 text-sm font-normal flex-1 ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"><SelectValue placeholder={t("calendar.timer")} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minutes">{t("calendar.minutes")}</SelectItem>
                        <SelectItem value="hours">{t("calendar.hour")}</SelectItem>
                        <SelectItem value="days">{t("calendar.days")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <DatePicker
                      value={customDate}
                      onChange={(v) => dispatch(setCustomField({ name: "customDate", value: v }))}
                      placeholder={t("calendar.date_time")}
                    />
                    <Input
                      type="time" className="h-8"
                      value={customTime}
                      onChange={(e) => dispatch(setCustomField({ name: "customTime", value: e.target.value }))}
                    />
                  </div>
                )}

                <Button size="sm" className="w-full" onClick={() => dispatch(addCustomAction())}>
                  {t("calendar.add_reminder")}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
