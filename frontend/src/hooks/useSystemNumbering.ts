import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';

interface NumberingConfig {
  template: string;
  next: number;
}

interface SystemSettings {
  [key: string]: Record<string, unknown> | undefined; // General type for system settings
}

const defaultTemplateByModule = (moduleId: string): string => {
  const map: Record<string, string> = {
    tasks: 'TSK-{n}',
    projects: 'PRJ-{n}',
    contractors: 'CTR-{n}',
    documents: 'DOC-{n}',
    lawyers: 'LAW-{n}',
    cases: 'CASE-{n}/{yy}',
    calendar: 'EVT-{n}',
    mail: 'MAIL-{n}',
    contracts: 'CNT-{n}/{yyyy}',
  };
  return map[moduleId] || `${moduleId.toUpperCase()}-{n}`;
};

const buildNumber = (template: string, next: number) => {
  const date = new Date();
  const yyyy = String(date.getFullYear());
  const yy = yyyy.slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return template
    .replace(/\{yyyy\}/g, yyyy)
    .replace(/\{yy\}/g, yy)
    .replace(/\{mm\}/g, mm)
    .replace(/\{dd\}/g, dd)
    .replace(/\{n(\d*)\}/g, (_, widthRaw) => {
      const width = widthRaw ? Number(widthRaw) : 0;
      return width > 0 ? String(next).padStart(width, '0') : String(next);
    });
};

export function useSystemNumbering(moduleId: string) {
  const { t } = useTranslation();
  const [config, setConfig] = useState<NumberingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const numberingKey = `numbering_${moduleId}`;

  const fetchNumberingConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      const settings: SystemSettings = await api.get('/system-settings');
      const raw = settings?.[numberingKey];

      const template = (raw?.template as string) || defaultTemplateByModule(moduleId);
      const next = Number.isFinite(Number(raw?.next)) && Number(raw?.next) > 0 ? Number(raw?.next) : 1;

      setConfig({ template, next });
    } catch (error) {
      console.error(`Failed to load numbering settings for ${moduleId}:`, error);
      toast.error(t('general.toast.error.settings_load'));
    } finally {
      setIsLoading(false);
    }
  }, [moduleId, numberingKey, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNumberingConfig();
  }, [fetchNumberingConfig]);

  const generateNextNumber = useCallback(() => {
    if (!config) return '';
    return buildNumber(config.template, config.next);
  }, [config]);

  const incrementNextNumber = useCallback(async () => {
    if (!config) return;

    try {
      setIsUpdating(true);
      const updatedNext = config.next + 1;
      await api.post('/system-settings', {
        key: numberingKey,
        value: {
          template: config.template,
          next: updatedNext,
        },
      });
      setConfig(prev => prev ? { ...prev, next: updatedNext } : null); // Optimistic update
    } catch (error) {
      console.error(`Failed to update numbering settings for ${moduleId}:`, error);
      toast.error(t('general.toast.error.settings_save'));
    } finally {
      setIsUpdating(false);
    }
  }, [config, moduleId, numberingKey, t]);

  return {
    config,
    isLoading,
    isUpdating,
    generateNextNumber,
    incrementNextNumber,
  };
}
