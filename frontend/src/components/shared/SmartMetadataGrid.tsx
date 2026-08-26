import React, { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export interface MetadataItem {
  id: string;
  value: ReactNode;
  label: string;
  icon?: ReactNode;
  isCritical?: boolean;
  onClick?: () => void;
  onClickPlaceholder?: () => void;
  renderCustomBadge?: () => ReactNode;
}

interface SmartMetadataGridProps {
  items: MetadataItem[];
}

export function SmartMetadataGrid({ items }: SmartMetadataGridProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => {
        if (item.value === null || item.value === undefined || item.value === "") {
          return (
            <div key={item.id} className="inline-flex items-center">
              {item.renderCustomBadge && item.renderCustomBadge() ? (
                 item.renderCustomBadge()
              ) : (
                <Badge
                  variant="outline"
                  className="cursor-pointer border-dashed text-muted-foreground hover:bg-muted/50"
                  onClick={item.onClickPlaceholder || item.onClick}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {item.label}
                </Badge>
              )}
            </div>
          );
        }

        if (item.value === "__editing__") {
          return (
            <div key={item.id} className="inline-flex items-center">
               {item.renderCustomBadge?.()}
            </div>
          );
        }

        return (
          <Badge
            key={item.id}
            variant={item.isCritical ? "default" : "secondary"}
            className="cursor-pointer transition-colors hover:bg-primary/10 dark:hover:bg-primary/20 flex items-center gap-1.5 py-1 px-2 font-normal"
            onClick={item.onClick}
          >
            {item.icon}
            <span className="text-muted-foreground mr-1">{item.label}:</span>
            <span className="font-medium">{item.value}</span>
          </Badge>
        );
      })}
    </div>
  );
}
