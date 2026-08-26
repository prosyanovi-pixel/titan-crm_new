// frontend/src/modules/finance/components/PeriodFilterBar.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarRange, Calendar as CalendarIcon, Filter } from "lucide-react";
import React from 'react';
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type PeriodPreset = "month" | "quarter" | "year" | "all" | "custom";

interface PeriodFilterBarProps {
  preset: PeriodPreset;
  onPresetChange: (preset: PeriodPreset) => void;
  customFrom: string;
  onCustomFromChange: (v: string) => void;
  customTo: string;
  onCustomToChange: (v: string) => void;
  periodRange: { from: string; to: string };
  minimal?: boolean;
}

const PRESETS: { key: PeriodPreset, label: string, short: string }[] = [
  { key: "month", label: "Месяц", short: "М" },
  { key: "quarter", label: "Квартал", short: "К" },
  { key: "year", label: "Год", short: "Г" },
  { key: "all", label: "Всё", short: "∞" },
  { key: "custom", label: "Период...", short: "..." },
];

export function PeriodFilterBar({
  preset,
  onPresetChange,
  customFrom,
  onCustomFromChange,
  customTo,
  onCustomToChange,
  periodRange,
  minimal = false,
}: PeriodFilterBarProps) {
  const activePreset = PRESETS.find(p => p.key === preset);
  const activeLabel = activePreset ? activePreset.label : 'Период';
  const activeShort = activePreset ? activePreset.short : 'П';

  const content = (
    <div className={cn(
      "flex flex-wrap items-center gap-2",
      !minimal && "mb-4 p-2 sm:p-3 bg-muted/40 rounded-xl border"
    )}>
      <div className="flex items-center bg-muted/50 p-1 rounded-lg border shadow-sm">
        {PRESETS.map(({ key, label, short }) => (
          <Button
            key={key}
            variant={preset === key ? "secondary" : "ghost"}
            size="sm"
            className={cn(
              "h-8 px-2 sm:px-3 text-[10px] sm:text-[11px] uppercase tracking-wider font-bold transition-all",
              preset === key ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => onPresetChange(key)}
          >
            <span className="hidden xs:inline">{label}</span>
            <span className="xs:hidden">{short}</span>
          </Button>
        ))}
      </div>
      
      {preset === "custom" && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 sm:flex-none min-w-[240px]">
          <div className="relative flex-1">
            <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              type="date"
              value={customFrom}
              onChange={(e) => onCustomFromChange(e.target.value)}
              className="h-9 pl-8 pr-2 text-xs w-full bg-background"
            />
          </div>
          <span className="hidden sm:inline text-muted-foreground text-xs">—</span>
          <div className="relative flex-1">
            <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              type="date"
              value={customTo}
              onChange={(e) => onCustomToChange(e.target.value)}
              className="h-9 pl-8 pr-2 text-xs w-full bg-background"
            />
          </div>
        </div>
      )}
      
      {periodRange.from && preset !== "custom" && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-background border border-dashed rounded-lg shadow-sm">
          <CalendarRange className="w-3.5 h-3.5 text-primary/70" />
          <span className="text-[11px] font-bold text-foreground whitespace-nowrap">
            {periodRange.from} — {periodRange.to}
          </span>
        </div>
      )}
    </div>
  );

  if (minimal) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-2 px-3 shrink-0 rounded-lg">
            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-xs hidden sm:inline">{activeLabel}</span>
            <span className="font-medium text-xs sm:hidden">{activeShort}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="end">
          {content}
        </PopoverContent>
      </Popover>
    );
  }

  return content;
}
