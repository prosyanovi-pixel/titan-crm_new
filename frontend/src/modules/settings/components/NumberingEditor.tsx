import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface ModuleItem {
  id: string;
  name: string;
}

interface NumberingConfig {
  template: string;
  next: number;
}

interface NumberingEditorProps {
  modules: ModuleItem[];
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

const buildPreview = (template: string, next: number) => {
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

export function NumberingEditor({ modules }: NumberingEditorProps) {
  const { t } = useTranslation();
  const [configs, setConfigs] = useState<Record<string, NumberingConfig>>({});
  const [saving, setSaving] = useState(false);
  const { data: fetchedSettings, isLoading: loading } = useQuery({
    queryKey: ['settings-numbering-all'],
    queryFn: async () => {
      const settings = await api.get('/system-settings');
      return settings;
    },
    staleTime: 5 * 60 * 1000,
  });

  const [prevFetchedSettings, setPrevFetchedSettings] = useState<unknown>(null);
  if (fetchedSettings !== prevFetchedSettings) {
    setPrevFetchedSettings(fetchedSettings);
    if (fetchedSettings) {
      const initial: Record<string, NumberingConfig> = {};
      modules.forEach((module) => {
        const key = `numbering_${module.id}`;
        const raw = fetchedSettings?.[key];
        const template = raw?.template || defaultTemplateByModule(module.id);
        const next = Number.isFinite(Number(raw?.next)) && Number(raw?.next) > 0 ? Number(raw.next) : 1;
        initial[module.id] = { template, next };
      });
      setConfigs(initial);
    }
  }

  const orderedModules = useMemo(() => modules, [modules]);

  const updateTemplate = (moduleId: string, template: string) => {
    setConfigs((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        template,
      },
    }));
  };

  const updateNext = (moduleId: string, nextRaw: string) => {
    const parsed = Number(nextRaw);
    const next = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;

    setConfigs((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        next,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      for (const module of orderedModules) {
        const value = configs[module.id];
        if (!value) continue;

        await api.post('/system-settings', {
          key: `numbering_${module.id}`,
          value: {
            template: value.template,
            next: value.next,
          },
        });
      }

      toast.success(t('general.toast.success.settings_saved'));
    } catch (error) {
      console.error('Failed to save numbering settings', error);
      toast.error(t('general.toast.error.settings_save'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.numbering.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-sm text-muted-foreground">
          {t('settings.numbering.hint')}
        </div>

        <div className="space-y-4">
          {orderedModules.map((module) => {
            const cfg = configs[module.id] || {
              template: defaultTemplateByModule(module.id),
              next: 1,
            };

            return (
              <div key={module.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border rounded-md p-3">
                <div className="md:col-span-3">
                  <Label>{t(`settings.modules.${module.id}`)}</Label>
                  <div className="text-xs text-muted-foreground mt-1">{module.id}</div>
                </div>

                <div className="md:col-span-6">
                  <Label>{t('settings.numbering.template')}</Label>
                  <Input
                    value={cfg.template}
                    onChange={(event) => updateTemplate(module.id, event.target.value)}
                    placeholder="TSK-{n}/{yy}"
                  />
                </div>

                <div className="md:col-span-3">
                  <Label>{t('settings.numbering.next')}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={cfg.next}
                    onChange={(event) => updateNext(module.id, event.target.value)}
                  />
                </div>

                <div className="md:col-span-12 text-xs text-muted-foreground">
                  {t('settings.numbering.preview')}: {buildPreview(cfg.template, cfg.next)}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading || saving}>
            {t('common.save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
