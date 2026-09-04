import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/lib/i18n';
import {
  StatusItem, TagItem, PriorityItem, ProjectStageItem, QuickAction, RelationshipTypeItem, LegalFormItem, PositionItem,
} from '../modules/settings/types/settings.types';
import {
  defaultStatuses, defaultTags, defaultPriorities, defaultRelationshipTypes,
} from '../lib/settings-data';
import { api } from '@/lib/api';
import { settingsService } from '@/modules/settings/api/settingsService';
import { ThemeType, DensityType, FontSizeType, SettingsContextType, CompanyProfile, TaxRegimeItem } from './SettingsContext.types';
import { SettingsContext } from './useSettingsContext';

const STORAGE_KEYS = {
  theme: 'titan_settings_theme',
  accentColor: 'titan_settings_accent',
  sidebarCollapsed: 'titan_settings_sidebar_collapsed',
  density: 'titan_settings_density',
  tableFontSize: 'titan_settings_font_size',
};

const accentColors = [
  { id: 'blue', primary: '221.2 83.2% 53.3%', hue: 221 },
  { id: 'rose', primary: '346.8 77.2% 49.8%', hue: 346 },
  { id: 'green', primary: '142.1 76.2% 36.3%', hue: 142 },
  { id: 'orange', primary: '24.6 95% 53.1%', hue: 24 },
  { id: 'violet', primary: '262.1 83.3% 57.8%', hue: 262 },
];

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  
  const [localTheme, setLocalTheme] = useState<ThemeType | null>(null);
  const [localAccentColor, setLocalAccentColor] = useState<string | null>(null);
  const [localSidebarCollapsed, setLocalSidebarCollapsed] = useState<boolean | null>(null);
  const [localDensity, setLocalDensity] = useState<DensityType | null>(null);
  const [localTableFontSize, setLocalTableFontSize] = useState<FontSizeType | null>(null);

  const applyTheme = useCallback((newTheme: ThemeType) => {
    const root = document.documentElement;
    let isDark = newTheme === 'dark';
    if (newTheme === 'system') {
      isDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
    }
    root.classList.toggle('dark', isDark);
  }, []);

  const applyAccent = useCallback((color: string) => {
    const cfg = accentColors.find(c => c.id === color);
    if (cfg) {
      document.documentElement.style.setProperty('--primary', cfg.primary);
      document.documentElement.style.setProperty('--ring', cfg.primary);
    }
  }, []);

  const applyDensity = useCallback((val: string) => {
    const root = document.documentElement;
    if (val === 'comfortable') {
        root.style.setProperty('--table-padding', '0.75rem');
        root.style.setProperty('--table-row-height', '3.5rem');
    } else if (val === 'compact') {
      root.style.setProperty('--table-padding', '0.5rem');
      root.style.setProperty('--table-row-height', '2.5rem');
    } else if (val === 'high') {
      root.style.setProperty('--table-padding', '0.25rem');
      root.style.setProperty('--table-row-height', '2rem');
    }
  }, []);

  const applyFontSize = useCallback((val: string) => {
    const root = document.documentElement;
    if (val === 'small') {
      root.style.setProperty('--table-font-main', '12px');
      root.style.setProperty('--table-font-meta', '10px');
    } else if (val === 'large') {
      root.style.setProperty('--table-font-main', '15px');
      root.style.setProperty('--table-font-meta', '13px');
    } else {
      root.style.setProperty('--table-font-main', '13.5px');
      root.style.setProperty('--table-font-meta', '11px');
    }
  }, []);

  // Fetch all global settings and reference data using TanStack Query
  const { data: settingsData, isLoading: loading, refetch: loadData } = useQuery({
    queryKey: ['global-settings'],
    queryFn: async () => {
      try {
        const [referenceData, refs, dbTheme, dbAccent, dbCollapsed, dbDensity, dbFontSize, legalFormsRes, legalFormGroupsRes, apiQuickActions, positionsRes, companyProfileRes] = await Promise.all([
          settingsService.getReferenceData().catch(() => null),
          api.get('/references').catch(() => null),
          api.get(`/user-settings/${STORAGE_KEYS.theme}`).catch(() => null),
          api.get(`/user-settings/${STORAGE_KEYS.accentColor}`).catch(() => null),
          api.get(`/user-settings/${STORAGE_KEYS.sidebarCollapsed}`).catch(() => null),
          api.get(`/user-settings/${STORAGE_KEYS.density}`).catch(() => null),
          api.get(`/user-settings/${STORAGE_KEYS.tableFontSize}`).catch(() => null),
          api.get('/references/legal_forms').catch(() => []),
          api.get('/references/legal_form_groups').catch(() => []),
          api.get('/quick-actions').catch(() => []),
          api.get('/references/positions').catch(() => []),
          api.get('/company/profile').catch(() => null),
        ]);
        
        return {
          referenceData, refs, dbTheme, dbAccent, dbCollapsed, dbDensity, dbFontSize,
          legalFormsRes, legalFormGroupsRes, apiQuickActions, positionsRes, companyProfileRes
        };
      } catch (e) {
        console.error('Failed to load settings:', e);
        return null;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes cache
  });

  const theme = localTheme ?? (settingsData?.dbTheme as ThemeType | undefined) ?? (localStorage.getItem(STORAGE_KEYS.theme) as ThemeType | null) ?? 'system';
  const accentColor = localAccentColor ?? settingsData?.dbAccent ?? localStorage.getItem(STORAGE_KEYS.accentColor) ?? 'blue';
  const sidebarCollapsed = localSidebarCollapsed ?? Boolean(settingsData?.dbCollapsed ?? localStorage.getItem(STORAGE_KEYS.sidebarCollapsed) === 'true');
  const density = localDensity ?? (settingsData?.dbDensity as DensityType | undefined) ?? (localStorage.getItem(STORAGE_KEYS.density) as DensityType | null) ?? 'comfortable';
  const tableFontSize = localTableFontSize ?? (settingsData?.dbFontSize as FontSizeType | undefined) ?? (localStorage.getItem(STORAGE_KEYS.tableFontSize) as FontSizeType | null) ?? 'medium';

  // Apply visual changes when values change
  useEffect(() => { applyTheme(theme); }, [theme, applyTheme]);
  useEffect(() => { applyAccent(accentColor); }, [accentColor, applyAccent]);
  useEffect(() => { applyDensity(density); }, [density, applyDensity]);
  useEffect(() => { applyFontSize(tableFontSize); }, [tableFontSize, applyFontSize]);

  // Derived data
  const statuses = settingsData?.referenceData?.statuses || settingsData?.refs?.statuses || defaultStatuses;
  const tags = settingsData?.referenceData?.tags || settingsData?.refs?.tags || defaultTags;
  const priorities = settingsData?.referenceData?.priorities || settingsData?.refs?.prioritySettings || defaultPriorities;
  const projectStages = (settingsData?.referenceData as Record<string, unknown>)?.projectStages as ProjectStageItem[] || (settingsData?.refs as Record<string, unknown>)?.projectStages as ProjectStageItem[] || [];
  const relationshipTypes = settingsData?.referenceData?.relationshipTypes || settingsData?.refs?.relationshipTypes || defaultRelationshipTypes;
  const contractorTypes = settingsData?.referenceData?.contractorTypes || settingsData?.refs?.contractorTypes || [];
  const taxRegimes = (
    (settingsData?.referenceData as Record<string, unknown>)?.taxRegimes ||
    (settingsData?.refs as Record<string, unknown>)?.taxRegimes ||
    []
  ) as TaxRegimeItem[];

  /** Профиль компании — загружается глобально, не нужен отдельный запрос в компонентах */
  const companyProfile: CompanyProfile | null = (() => {
    const raw = settingsData?.companyProfileRes;
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;
    // db.js конвертирует snake_case → camelCase автоматически
    return {
      id: r.id as number | undefined,
      fullName: (r.fullName ?? r.full_name) as string | undefined,
      shortName: (r.shortName ?? r.short_name) as string | undefined,
      inn: r.inn as string | undefined,
      kpp: r.kpp as string | undefined,
      taxRegimeId: ((r.taxRegimeId ?? r.tax_regime_id) as number | null | undefined) ?? null,
      ...r,
    };
  })();
  
  const allQuickActions = Array.isArray(settingsData?.apiQuickActions) ? settingsData.apiQuickActions : [];
  const quickActions = allQuickActions.filter((qa: QuickAction) => qa.isActive !== false);
  const legalForms = Array.isArray(settingsData?.legalFormsRes) ? settingsData?.legalFormsRes : ((settingsData?.legalFormsRes as { data?: LegalFormItem[] })?.data || []);
  const legalFormGroups = Array.isArray(settingsData?.legalFormGroupsRes) ? settingsData?.legalFormGroupsRes : (settingsData?.legalFormGroupsRes?.rows || []);
  const positions = Array.isArray(settingsData?.positionsRes) ? settingsData?.positionsRes : ((settingsData?.positionsRes as { data?: PositionItem[] })?.data || []);
  const modules = settingsData?.refs?.modules || [];
  
  const managers = settingsData?.refs?.managers || [];
  const marketingStatuses = settingsData?.referenceData?.marketingStatuses || settingsData?.refs?.marketingStatuses || [];
  const marketingTypes = settingsData?.referenceData?.marketingTypes || settingsData?.refs?.marketingTypes || [];
  const projectStatuses = settingsData?.refs?.projectStatuses || [];

  const addItem = async (table: string, item: Record<string, unknown>) => {
    const res = await api.post(`/references/${table}`, item);
    await loadData();
    return res;
  };

  const updateItem = async (table: string, item: Record<string, unknown>) => {
    const res = await api.put(`/references/${table}/${item.id}`, item);
    await loadData();
    return res;
  };

  const deleteItem = async (table: string, id: string | number, module?: string) => {
    await api.delete(`/references/${table}/${id}${module ? `?module=${module}` : ''}`);
    await loadData();
  };

  const saveQuickActions = async (actions: QuickAction[]) => {
    await api.post('/quick-actions/reorder', { items: actions });
    await loadData();
  };

  const addLegalForm = async (form: Record<string, unknown>) => {
    const res = await api.post('/references/legal_forms', form);
    await loadData();
    return res;
  };

  const updateLegalForm = async (id: string, form: Record<string, unknown>) => {
    const res = await api.put(`/references/legal_forms/${id}`, form);
    await loadData();
    return res;
  };

  const deleteLegalForm = async (id: string) => {
    await api.delete(`/references/legal_forms/${id}`);
    await loadData();
  };

  const setTheme = (newTheme: ThemeType) => {
    setLocalTheme(newTheme);
    localStorage.setItem(STORAGE_KEYS.theme, newTheme);
    api.post('/user-settings', { key: STORAGE_KEYS.theme, value: newTheme });
  };

  const setAccentColor = (color: string) => {
    setLocalAccentColor(color);
    localStorage.setItem(STORAGE_KEYS.accentColor, color);
    api.post('/user-settings', { key: STORAGE_KEYS.accentColor, value: color });
  };

  const setSidebarCollapsed = (collapsed: boolean) => {
    setLocalSidebarCollapsed(collapsed);
    localStorage.setItem(STORAGE_KEYS.sidebarCollapsed, String(collapsed));
    api.post('/user-settings', { key: STORAGE_KEYS.sidebarCollapsed, value: collapsed });
  };

  const setDensity = (val: DensityType) => {
    setLocalDensity(val);
    localStorage.setItem(STORAGE_KEYS.density, val);
    api.post('/user-settings', { key: STORAGE_KEYS.density, value: val });
  };

  const setTableFontSize = (val: FontSizeType) => {
    setLocalTableFontSize(val);
    localStorage.setItem(STORAGE_KEYS.tableFontSize, val);
    api.post('/user-settings', { key: STORAGE_KEYS.tableFontSize, value: val });
  };

  const contextValue: SettingsContextType = {
    theme, accentColor, sidebarCollapsed, density, tableFontSize, loading,
    statuses, tags, priorities, projectStages, quickActions, allQuickActions, relationshipTypes, taxRegimes, legalForms, legalFormGroups, contractorTypes, positions, modules,
    managers, marketingStatuses, marketingTypes, projectStatuses,
    companyProfile,
    setTheme, setAccentColor, setSidebarCollapsed, setDensity, setTableFontSize,
    refresh: async () => { await loadData(); },
    addItem, updateItem, deleteItem, saveQuickActions,
    addLegalForm, updateLegalForm, deleteLegalForm,
    getStatusesByModule: (m) => statuses.filter((s: StatusItem) => s.module === m),
    getTagsByModule: (m) => tags.filter((t: TagItem) => t.module === m),
    getPrioritiesByModule: (m) => priorities.filter((p: PriorityItem) => p.module === m),
    getProjectStages: () => projectStages,
    getQuickActionsByModule: (m) => quickActions.filter((q: QuickAction) => q.module === m),
    getRelationshipTypesByModule: (m) => relationshipTypes.filter((rt: RelationshipTypeItem) => rt.module === m),
    getContractorTypesByModule: () => contractorTypes,
    getLegalFormsByModule: () => legalForms,
    getPositions: () => positions,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}
