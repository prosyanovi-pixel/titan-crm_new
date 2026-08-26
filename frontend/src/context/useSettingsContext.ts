import { createContext, useContext } from 'react';
import { SettingsContextType } from './SettingsContext.types';

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettingsContext must be used within SettingsProvider');
  return context;
};
