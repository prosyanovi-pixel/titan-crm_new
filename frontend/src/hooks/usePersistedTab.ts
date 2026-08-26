import { useState, useCallback } from "react";

/**
 * Аналог useState, но сохраняет значение активной вкладки в localStorage.
 * При следующем открытии модуля восстанавливает последнюю активную вкладку.
 *
 * @param storageKey  — уникальный ключ в localStorage (например 'tab:finance')
 * @param defaultTab  — вкладка по умолчанию, если в хранилище ничего нет
 */
export function usePersistedTab<T extends string>(
  storageKey: string,
  defaultTab: T
): [T, (tab: T) => void] {
  const [activeTab, setActiveTabState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return (stored as T) || defaultTab;
    } catch {
      return defaultTab;
    }
  });

  const setActiveTab = useCallback(
    (tab: T) => {
      try {
        localStorage.setItem(storageKey, tab);
      } catch {
        // ignore storage errors (private mode, quota exceeded etc.)
      }
      setActiveTabState(tab);
    },
    [storageKey]
  );

  return [activeTab, setActiveTab];
}
