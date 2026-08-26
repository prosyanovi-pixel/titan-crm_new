// frontend/src/hooks/useSheetWidth.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export type SheetWidthPreset = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface SheetWidthConfig {
  preset: SheetWidthPreset;
  customWidth?: number;
}

const WIDTH_PRESETS: Record<SheetWidthPreset, string> = {
  sm: 'max-w-xl',      // 672px
  md: 'max-w-3xl',     // 768px
  lg: 'max-w-4xl',     // 896px
  xl: 'max-w-5xl',     // 1024px
  '2xl': 'max-w-7xl',  // 1280px
};

const WIDTH_VALUES: Record<SheetWidthPreset, number> = {
  sm: 672,
  md: 768,
  lg: 896,
  xl: 1024,
  '2xl': 1280,
};

interface UseSheetWidthReturn {
  width: SheetWidthConfig;
  setWidth: (width: SheetWidthConfig) => void;
  setCustomWidth: (width: number) => void;
  setPreset: (preset: SheetWidthPreset) => void;
  increaseWidth: () => void;
  decreaseWidth: () => void;
  getWidthClass: () => string;
  getWidthValue: (preset?: SheetWidthPreset) => number;
  isLoading: boolean;
}

/**
 * Универсальный hook для управления шириной Sheet с сохранением в настройках пользователя
 * @param moduleKey - Ключ модуля для сохранения настроек (например: 'project-sheet', 'lawyer-sheet')
 * @param defaultPreset - Предустановка по умолчанию (по умолчанию 'lg')
 */
export function useSheetWidth(
  moduleKey: string,
  defaultPreset: SheetWidthPreset = 'lg'
): UseSheetWidthReturn {
  const [width, setWidthState] = useState<SheetWidthConfig>({ preset: defaultPreset });
  const [isLoading, setIsLoading] = useState(true);

  const dbKey = `${moduleKey}_width`;
  const storageKey = `sheet-width:${moduleKey}`;

  // Загрузка настроек при монтировании
  useEffect(() => {
    const loadWidth = async () => {
      try {
        // Пробуем загрузить из БД
        const saved = await api.get(`/user-settings/${dbKey}`);
        
        if (saved && typeof saved === 'object') {
          const config = saved as SheetWidthConfig;
          setWidthState(config);
        } else {
          // Пробуем загрузить из localStorage
          const local = localStorage.getItem(storageKey);
          if (local) {
            setWidthState(JSON.parse(local));
          }
        }
      } catch (error) {
        console.debug(`[useSheetWidth] Failed to load ${moduleKey} width from DB:`, error);
        // Try localStorage as fallback
        const local = localStorage.getItem(storageKey);
        if (local) {
          try {
            setWidthState(JSON.parse(local));
          } catch (parseError) {
            console.debug(`[useSheetWidth] Failed to parse localStorage for ${moduleKey}:`, parseError);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadWidth();
  }, [moduleKey, storageKey, dbKey]);

  // Сохранение настроек при изменении
  useEffect(() => {
    if (isLoading) return;

    // Сохраняем в localStorage
    localStorage.setItem(storageKey, JSON.stringify(width));

    // Сохраняем в БД (асинхронно, без дебаунса для простоты)
    api.post('/user-settings', {
      key: dbKey,
      value: width
    }).catch(err => {
      console.warn(`[useSheetWidth] Failed to save ${moduleKey} width:`, err);
    });
  }, [width, isLoading, storageKey, dbKey, moduleKey]);

  const setCustomWidth = useCallback((newWidth: number) => {
    setWidthState({ preset: 'lg', customWidth: newWidth });
  }, []);

  const setPreset = useCallback((preset: SheetWidthPreset) => {
    setWidthState({ preset, customWidth: undefined });
  }, []);

  const increaseWidth = useCallback(() => {
    setWidthState(prev => {
      const presets: SheetWidthPreset[] = ['sm', 'md', 'lg', 'xl', '2xl'];
      const currentIndex = presets.indexOf(prev.preset);
      const nextIndex = Math.min(currentIndex + 1, presets.length - 1);
      return { preset: presets[nextIndex] };
    });
  }, []);

  const decreaseWidth = useCallback(() => {
    setWidthState(prev => {
      const presets: SheetWidthPreset[] = ['sm', 'md', 'lg', 'xl', '2xl'];
      const currentIndex = presets.indexOf(prev.preset);
      const prevIndex = Math.max(currentIndex - 1, 0);
      return { preset: presets[prevIndex] };
    });
  }, []);

  const getWidthClass = useCallback(() => {
    if (width.customWidth) {
      return '';
    }
    return WIDTH_PRESETS[width.preset];
  }, [width]);

  const getWidthValue = useCallback((preset?: SheetWidthPreset) => {
    if (preset) {
      return WIDTH_VALUES[preset];
    }
    if (width.customWidth) {
      return width.customWidth;
    }
    return WIDTH_VALUES[width.preset];
  }, [width]);

  return {
    width,
    setWidth: setWidthState,
    setCustomWidth,
    setPreset,
    increaseWidth,
    decreaseWidth,
    getWidthClass,
    getWidthValue,
    isLoading,
  };
}

// Хук для обратной совместимости с ProjectSheet
export function useProjectSheetWidth() {
  return useSheetWidth('project-sheet', 'lg');
}
