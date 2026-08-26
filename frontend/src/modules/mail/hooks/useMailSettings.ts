import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface UseMailSettingsReturn {
  mailListWidth: number;
  setMailListWidth: (width: number) => void;
  saveMailListWidth: (width: number) => Promise<void>;
}

/**
 * Хук для управления настройками почты
 */
export const useMailSettings = (): UseMailSettingsReturn => {
  const [mailListWidth, setMailListWidth] = useState<number>(400);

  // Загрузка ширины списка писем из настроек пользователя
  useEffect(() => {
    const loadMailListWidth = async () => {
      try {
        // Сначала пробуем загрузить из localStorage (быстрее)
        const savedWidth = localStorage.getItem('mail-list-width');
        if (savedWidth) {
          const parsedWidth = parseInt(savedWidth, 10);
          if (!isNaN(parsedWidth) && parsedWidth >= 250 && parsedWidth <= 800) {
            setMailListWidth(parsedWidth);
            console.log(`[Mail] Loaded width from localStorage: ${parsedWidth}px`);
            return;
          }
        }
        
        // Если нет в localStorage, загружаем из БД
        try {
          const response = await api.get('/user-settings/mail-list-width');
          if (response && typeof response === 'string') {
            const dbWidth = parseInt(response, 10);
            if (!isNaN(dbWidth) && dbWidth >= 250 && dbWidth <= 800) {
              setMailListWidth(dbWidth);
              console.log(`[Mail] Loaded width from DB: ${dbWidth}px`);
              // Сохраняем в localStorage для следующей загрузки
              localStorage.setItem('mail-list-width', dbWidth.toString());
            }
          }
        } catch (dbError) {
          console.log('[Mail] No width setting in DB, using default');
        }
      } catch (error) {
        console.error('[Mail] Error loading mail list width:', error);
      }
    };
    loadMailListWidth();
  }, []);

  // Сохранение ширины списка писем в настройках пользователя
  const saveMailListWidth = useCallback(async (width: number) => {
    try {
      // Валидация ширины
      const validatedWidth = Math.max(250, Math.min(800, width));
      
      // Сохраняем в localStorage для быстрой загрузки
      localStorage.setItem('mail-list-width', validatedWidth.toString());
      
      // Сохраняем в БД
      await api.post('/user-settings', { 
        key: 'mail-list-width', 
        value: validatedWidth.toString() 
      });
      
      setMailListWidth(validatedWidth);
      console.log(`[Mail] Saved mail list width: ${validatedWidth}px`);
    } catch (error) {
      console.error('Failed to save mail list width:', error);
    }
  }, []);

  const handleSetMailListWidth = useCallback((width: number) => {
    const validatedWidth = Math.max(250, Math.min(800, width));
    setMailListWidth(validatedWidth);
    // Автосохранение при изменении (можно добавить дебаунс при необходимости)
    saveMailListWidth(validatedWidth);
  }, [saveMailListWidth]);

  return {
    mailListWidth,
    setMailListWidth: handleSetMailListWidth,
    saveMailListWidth,
  };
};