import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { TabConfig } from "@/hooks/useDataTable";
import { useTabDrag } from "@/hooks/useTabDrag";

interface SortableTabsListProps {
  /** Конфигурация вкладок из useDataTable */
  tabsConfig: TabConfig[];
  /** Callback смены порядка — вызывается при завершении drag */
  onReorder: (fromId: string, toId: string) => void;
  /** Функция перевода i18n */
  t: (key: string) => string;
  /** className для TabsList */
  className?: string;
  /** className для каждого TabsTrigger */
  triggerClassName?: string;
  /** className для иконки самой вкладки (по умолчанию "w-4 h-4") */
  iconClassName?: string;
  /** Опциональная функция для рендера бейджа (счетчика) вкладки */
  renderBadge?: (tabId: string) => React.ReactNode;
}

/**
 * Компонент списка вкладок с поддержкой drag-to-reorder.
 *
 * Использование:
 * ```tsx
 * <SortableTabsList
 *   tabsConfig={tabsConfig}
 *   onReorder={moveTab}
 *   t={t}
 * />
 * ```
 *
 * Для перетаскивания нужно зажать иконку ≡ (grip) на вкладке ≥ 400 мс,
 * затем навести на целевую вкладку и отпустить.
 */
export function SortableTabsList({
  tabsConfig,
  onReorder,
  t,
  className,
  triggerClassName,
  iconClassName = "w-4 h-4",
  renderBadge,
}: SortableTabsListProps) {
  const { dragging, dragOver, onTabMouseDown, onTabMouseEnter } = useTabDrag(onReorder);

  // При быстром движении мыши onMouseEnter может не сработать —
  // дополнительно обновляем цель через onMouseMove на контейнере.
  const handleContainerMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!dragging) return;
    const el = (e.target as HTMLElement).closest('[data-tab-id]') as HTMLElement | null;
    if (el?.dataset.tabId) onTabMouseEnter(el.dataset.tabId);
  };

  const visibleTabs = tabsConfig.filter((tab) => tab.visible);

  if (visibleTabs.length <= 1) {
    return null;
  }

  return (
    <TabsList
      className={cn(dragging && "cursor-grabbing select-none", className)}
      onMouseMove={handleContainerMouseMove}
    >
      {tabsConfig.map((tab) => {
        if (!tab.visible) return null;
        const Icon = tab.icon;
        return (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            data-tab-id={tab.id}
            className={cn(
              "gap-2 group",
              dragging === tab.id && "opacity-40",
              dragOver === tab.id && "ring-1 ring-inset ring-primary bg-primary/10",
              triggerClassName,
            )}
          >
            <GripVertical
              className="w-3 h-3 opacity-0 group-hover:opacity-40 shrink-0 -ml-1 cursor-grab transition-opacity"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTabMouseDown(tab.id);
              }}
            />
            <Icon className={iconClassName} />
            {t(tab.label)}
            {renderBadge && renderBadge(tab.id)}
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}
