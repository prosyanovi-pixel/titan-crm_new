import { useState, useEffect } from 'react';
import { CalendarSettings, DEFAULT_CALENDAR_SETTINGS } from '../types/settings.types';

const STORAGE_KEY = 'calendar-settings';

export function useCalendarSettings() {
  const [settings, setSettings] = useState<CalendarSettings>(DEFAULT_CALENDAR_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Загрузить из localStorage при монтировании
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSettings({
          ...DEFAULT_CALENDAR_SETTINGS,
          ...parsed,
          birthdays: {
            ...DEFAULT_CALENDAR_SETTINGS.birthdays,
            ...parsed.birthdays,
          },
        });
      } catch (error) {
        console.error('Failed to parse calendar settings:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  const updateSettings = (newSettings: Partial<CalendarSettings>) => {
    const updated = {
      ...settings,
      birthdays: {
        ...settings.birthdays,
        ...newSettings.birthdays,
      },
    };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const updateBirthdaySettings = (
    updates: Partial<CalendarSettings['birthdays']>
  ) => {
    updateSettings({
      birthdays: {
        ...settings.birthdays,
        ...updates,
      },
    });
  };

  return {
    settings,
    isLoaded,
    updateSettings,
    updateBirthdaySettings,
  };
}
