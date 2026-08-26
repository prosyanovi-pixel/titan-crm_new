import { useSettingsContext } from '@/context/useSettingsContext';

/**
 * Хук useSettings теперь является прокси к SettingsContext.
 * Это позволяет использовать настройки во всем приложении с мгновенной синхронизацией.
 */
export function useSettings() {
  const context = useSettingsContext();
  
  // Возвращаем все поля из контекста для обратной совместимости
  return {
    ...context,
    // Алиасы для совместимости со старым кодом, если они нужны
    refreshSettings: context.refresh,
    saveQuickActions: async (actions: { id: string | number }[]) => {
        // Логика сохранения быстрых действий остается (можно перенести в контекст позже)
        const { api } = await import('@/lib/api');
        const reorderPayload = actions.map((item, index) => ({
            id: item.id,
            displayOrder: index + 1
        }));
        await api.post('/quick-actions/reorder', { items: reorderPayload });
        await context.refresh();
    }
  };
}
