
import React from "react";
import { cn } from "@/lib/utils";
import { getContrastColor, withAlpha } from "@/lib/color";

type StatusVariant = "active" | "pending" | "vip" | "paused" | "finished" | "default";

interface StatusBadgeProps {
  variant?: StatusVariant;
  color?: string;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  active: "bg-status-active text-status-active-foreground",
  pending: "bg-status-pending text-status-pending-foreground",
  vip: "bg-status-vip text-status-vip-foreground",
  paused: "bg-status-paused text-status-paused-foreground",
  finished: "bg-status-finished text-status-finished-foreground",
  default: "bg-muted text-muted-foreground",
};

export function StatusBadge({ variant = "default", color, children, className }: StatusBadgeProps) {
  // Если передан color: полупрозрачный фон + цветной текст + рамка
  // Иначе: используем предопределенные variant styles
  const badgeStyle = color
    ? {
        backgroundColor: withAlpha(color, 0.2),
        color: getContrastColor(color),
        borderColor: withAlpha(color, 0.3),
      }
    : undefined;
  
  const badgeClass = cn(
    "inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-nowrap shrink-0",
    color ? "border px-2 py-0.5 text-xs" : variantStyles[variant] + " px-2.5 py-0.5 text-xs uppercase tracking-wide", // базовые цвета только если нет custom color
    className
  );

  return (
    <span
      className={badgeClass}
      style={badgeStyle}
    >
      {children}
    </span>
  );
}
