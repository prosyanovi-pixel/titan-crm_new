
/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-nowrap shrink-0",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        success: "border-transparent bg-green-500 text-white hover:bg-green-600",
        outline: "text-foreground",
        custom: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  variant?: "default" | "secondary" | "destructive" | "success" | "outline" | "custom" | null;
  color?: string;
  size?: "sm" | "md" | null;
  className?: string;
}

function Badge({ className, variant, color, size, style, ...props }: BadgeProps) {
  const customStyle = variant === "custom" && color 
    ? { 
        backgroundColor: color + "20", 
        color: color,
        borderColor: color,
        ...style 
      }
    : style;

  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "";
  
  return <div 
    className={cn(badgeVariants({ variant }), className, sizeClass)} 
    style={customStyle} 
    {...props} 
  />;
}

export { Badge, badgeVariants };
