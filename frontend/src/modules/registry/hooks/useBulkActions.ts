import { useMemo } from "react";
import { ActionRegistry, ActionDefinition } from "../ActionRegistry";
import { useModuleSettings } from "@/modules/settings/hooks/useModuleSettings";
import { usePermission } from "@/hooks/usePermission";

/**
 * Хук для получения массовых действий (Bulk Actions) для модуля с учетом настроек пользователя и прав доступа.
 */
export function useBulkActions<TData = any>(moduleId: string, localActions: ActionDefinition<TData[]>[] = []): ActionDefinition<TData[]>[] {
  const { settings } = useModuleSettings(moduleId);
  const { hasPermission } = usePermission();

  const actions = useMemo(() => {
    // Получаем массовые действия из глобального реестра
    const registryActions = ActionRegistry.getActionsForModule(moduleId, "bulk");
    
    // Объединяем локальные действия (определенные внутри модуля) с глобальными
    const allActions = [...localActions, ...registryActions as unknown as ActionDefinition<TData[]>[]];

    // Удаляем дубликаты по id (локальные имеют приоритет)
    const uniqueActions = Array.from(new Map(allActions.map((a) => [a.id, a])).values());

    return uniqueActions.filter((action) => {
      // 1. Проверяем права пользователя
      if (action.permission && !hasPermission(action.permission)) {
        return false;
      }
      
      // 2. Проверяем настройки (если настройка false - скрываем)
      const actionSettings = settings?.bulkActions || {};
      if (actionSettings[action.id] === false) {
        return false;
      }

      return true;
    }).sort((a, b) => (a.defaultOrder || 99) - (b.defaultOrder || 99));
  }, [moduleId, localActions, settings, hasPermission]);

  return actions;
}
