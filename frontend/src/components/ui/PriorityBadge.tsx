import React from "react";
import { cn } from "@/lib/utils";

export interface PriorityBadgeProps {
  color?: string;
  children: React.ReactNode;
  className?: string;
}

export function PriorityBadge({ color, children, className }: PriorityBadgeProps) {
  const badgeStyle = color
    ? { 
        color: color,
        borderColor: color,
        backgroundColor: color + "15", // еще более прозрачный фон (8.5%)
      }
    : undefined;
  
  const badgeClass = cn(
    "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-nowrap shrink-0",
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
