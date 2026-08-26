import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: string;
  className?: string;
  compact?: boolean;
  trend?: string;
  trendUp?: boolean;
  trendLabel?: string;
  valueColor?: string;
}

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  iconColor, 
  valueColor,
  className, 
  compact,
  trend,
  trendUp = true,
  trendLabel
}: StatsCardProps) {
  const { t } = useTranslation();
  return (
    <div className={cn(
      "w-full min-w-0 bg-card rounded-2xl border border-border/40 shadow-sm h-full flex flex-col justify-between transition-all hover:shadow-md hover:-translate-y-0.5 duration-300",
      compact ? "p-4" : "p-6",
      className
    )}>
      <div className="flex flex-row items-center justify-between pb-2 gap-4">
        <p className={cn(
          "font-semibold text-muted-foreground/80 truncate tracking-tight uppercase",
          compact ? "text-[10px]" : "text-xs"
        )} title={title}>
          {title}
        </p>
        {Icon && (
          <div className={cn(
            "rounded-lg flex items-center justify-center shrink-0",
            compact ? "h-8 w-8" : "h-10 w-10",
            iconColor || "text-primary bg-primary/10"
          )}>
            <Icon className={compact ? "w-4 h-4" : "w-5 h-5"} />
          </div>
        )}
      </div>
      
      <div>
        <p className={cn(
          "font-extrabold tracking-tight truncate",
          compact ? "text-2xl" : "text-3xl",
          valueColor || "text-foreground"
        )} title={String(value)}>
          {value}
        </p>
 
      {(trend || !compact) && (
        <div className="flex items-center gap-1.5 mt-2 min-w-0">
          {trend ? (
            <>
              <div className={cn(
                "flex items-center gap-0.5 font-bold text-xs",
                trendUp ? "text-emerald-500" : "text-destructive"
              )}>
                {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{trend}</span>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground/60 truncate" title={trendLabel || t("common.stats.vs_last_month")}>
                {trendLabel || t("common.stats.vs_last_month")}
              </span>
            </>
          ) : (
            <div className="h-4" /> 
          )}
        </div>
      )}
      </div>
    </div>
  );
}
