// frontend/src/modules/calendar/components/CalendarViewSwitcher.tsx
import React from "react";
import { useTranslation } from "@/lib/i18n";
import type { ViewMode } from "../types/calendar.types";

interface Props {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export function CalendarViewSwitcher({ viewMode, setViewMode }: Props) {
  const { t } = useTranslation();

  const modes: ViewMode[] = ["day", "month", "year"];
  const keys: Record<ViewMode, string> = {
    day:   "common.view_mode.day",
    month: "common.view_mode.month",
    year:  "common.view_mode.year",
  };

  return (
    <div className="flex bg-muted/20 p-1 rounded-md border border-border/50">
      {modes.map((mode) => (
        <button
          key={mode}
          onClick={() => setViewMode(mode)}
          className={`px-3 py-1 text-sm rounded-sm transition-all ${
            viewMode === mode
              ? "bg-background shadow-sm text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t(keys[mode])}
        </button>
      ))}
    </div>
  );
}
