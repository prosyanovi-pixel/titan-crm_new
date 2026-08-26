import React from "react";
import { cn } from "@/lib/utils";
import { getContrastColor, withAlpha } from "@/lib/color";

type TagVariant = "default" | "vip" | "production" | "government" | "custom" | "active" | "paused" | "done";

interface TagProps {
  variant?: TagVariant;
  color?: string;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md";
  rounded?: "none" | "sm" | "md" | "full";
  style?: React.CSSProperties;
  onClick?: () => void;
  clickable?: boolean;
}

const variantStyles: Record<TagVariant, string> = {
  default: "bg-secondary text-secondary-foreground border-border",
  vip: "bg-status-vip/20 text-status-vip-foreground border-status-vip/30",
  production: "bg-status-pending/20 text-status-pending-foreground border-status-pending/30",
  government: "bg-status-active/20 text-status-active-foreground border-status-active/30",
  active: "bg-status-active/20 text-status-active-foreground border-status-active/30",
  paused: "bg-status-paused/20 text-status-paused-foreground border-status-paused/30",
  done: "bg-muted text-muted-foreground border-border",
  custom: "",
};

export function Tag({
  variant = "default",
  color,
  children,
  className,
  size = "sm",
  rounded = "sm",
  style,
  onClick,
  clickable = false
}: TagProps) {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm"
  };

  const roundedStyles = {
    none: "rounded-none",
    sm: "rounded",
    md: "rounded-md",
    full: "rounded-full"
  };

  // Если передан color, вычисляем стили для фона, текста и рамки
  const customStyles = color
    ? {
        backgroundColor: withAlpha(color, 0.2),
        color: getContrastColor(color),
        borderColor: withAlpha(color, 0.3),
      }
    : {};

  const tagStyle = {
    ...customStyles,
    ...style,
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }
  };

  const isInteractive = clickable || !!onClick;
  
  // Если есть цвет, используем variant "custom" чтобы не применять стандартные стили фона/текста
  const effectiveVariant = color ? "custom" : variant;
  
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium border whitespace-nowrap shrink-0",
        sizeStyles[size],
        roundedStyles[rounded],
        variantStyles[effectiveVariant], // применяем стили варианта (для custom пусто)
        isInteractive && "cursor-pointer transition-colors",
        isInteractive && "hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
        className
      )}
      style={tagStyle}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
    >
      {children}
    </span>
  );
}