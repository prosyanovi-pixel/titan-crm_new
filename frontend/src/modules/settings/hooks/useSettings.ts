import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import {
  StatusItem,
  TagItem,
  PriorityItem,
  QuickAction,
  RelationshipTypeItem,
  UserSettings,
  Theme,
} from "../types/settings.types";
import { settingsService } from "../api/settingsService";

const STORAGE_KEYS = {
  theme: 'titan_theme',
  accentColor: 'titan_accent_color',
  sidebarCollapsed: 'titan_sidebar_collapsed',
};

interface UseSettingsReturn {
  // Data
  statuses: StatusItem[];
  tags: TagItem[];
  priorities: PriorityItem[];
  quickActions: QuickAction[];
  relationshipTypes: RelationshipTypeItem[];
  
  // UI State
  theme: Theme;
  accentColor: string;
  sidebarCollapsed: boolean;
  
  // Loading
  loading: boolean;
  error: Error | null;
  
  // Actions
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  refreshData: () => Promise<void>;
}

export function useSettings(): UseSettingsReturn {
  const { t } = useTranslation();
  
  // Data states
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [priorities, setPriorities] = useState<PriorityItem[]>([]);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [relationshipTypes, setRelationshipTypes] = useState<RelationshipTypeItem[]>([]);
  
  // UI states from localStorage
  const [theme, setThemeState] = useState<Theme>(() => 
    (localStorage.getItem(STORAGE_KEYS.theme) as Theme) || 'light'
  );
  const [accentColor, setAccentColorState] = useState<string>(() => 
    localStorage.getItem(STORAGE_KEYS.accentColor) || 'blue'
  );
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.sidebarCollapsed);
    return saved === 'true';
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem(STORAGE_KEYS.theme, newTheme);
    settingsService.updateUserSetting(STORAGE_KEYS.theme, newTheme).catch(console.error);
  }, []);

  const setAccentColor = useCallback((newColor: string) => {
    setAccentColorState(newColor);
    localStorage.setItem(STORAGE_KEYS.accentColor, newColor);
    settingsService.updateUserSetting(STORAGE_KEYS.accentColor, newColor).catch(console.error);
  }, []);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    localStorage.setItem(STORAGE_KEYS.sidebarCollapsed, String(collapsed));
    settingsService.updateUserSetting(STORAGE_KEYS.sidebarCollapsed, collapsed).catch(console.error);
  }, []);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const [referenceData, quickActionsData, relationshipTypesData] = await Promise.all([
        settingsService.getReferenceData().catch(() => null),
        settingsService.getQuickActions(),
        settingsService.getRelationshipTypes(),
      ]);
      
      if (referenceData) {
        setStatuses(referenceData.statuses);
        setTags(referenceData.tags);
        setPriorities(referenceData.priorities);
        setRelationshipTypes(referenceData.relationshipTypes);
      } else {
        const [statusesData, tagsData, prioritiesData] = await Promise.all([
          settingsService.getStatuses(),
          settingsService.getTags(),
          settingsService.getPriorities(),
        ]);

        setStatuses(statusesData);
        setTags(tagsData);
        setPriorities(prioritiesData);
        setRelationshipTypes(relationshipTypesData);
      }

      setQuickActions(quickActionsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      toast.error(t("general.toast.error.settings_load"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshData();
  }, [refreshData]);

  return {
    statuses,
    tags,
    priorities,
    quickActions,
    relationshipTypes,
    theme,
    accentColor,
    sidebarCollapsed,
    loading,
    error,
    setTheme,
    setAccentColor,
    setSidebarCollapsed,
    refreshData,
  };
}
