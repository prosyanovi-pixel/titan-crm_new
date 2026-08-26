import { useTranslation } from '@/lib/i18n';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface SyncConfig {
  backupCron: string;
  enrichmentCron: string;
  moduleSyncCron: string;
  cacheClearCron: string;
  trashCleanupCron: string;
  enabled: boolean;
}

export function ScheduleTab() {
  const { t } = useTranslation();
  const [config, setConfig] = useState<SyncConfig>({
    backupCron: "0 0 * * *",
    enrichmentCron: "0 3 * * *",
    moduleSyncCron: "0 1 * * *",
    cacheClearCron: "0 5 * * *",
    trashCleanupCron: "0 4 * * *",
    enabled: true
  });
  const [trashConfig, setTrashConfig] = useState({
    enabled: true,
    retention_days: 30
  });
  const [saving, setSaving] = useState(false);

  const { isLoading: loading } = useQuery({
    queryKey: ['settings-schedule'],
    queryFn: async () => {
      const settings = await api.get('/system-settings');
      if (settings.sync_config) {
        setConfig(settings.sync_config);
      }
      if (settings.trash_auto_clean) {
        setTrashConfig(settings.trash_auto_clean);
      }
      return settings;
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        api.post('/system-settings', {
          key: 'sync_config',
          value: config
        }),
        api.post('/system-settings', {
          key: 'trash_auto_clean',
          value: trashConfig
        })
      ]);
      toast.success(t('general.success_save'));
    } catch (error) {
      toast.error(t('general.error_save'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            {t('settings.maintenance.schedule.title')}
          </CardTitle>
          <CardDescription>
            {t('settings.maintenance.schedule.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="sync-enabled"
              checked={config.enabled}
              onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
            />
            <Label htmlFor="sync-enabled">{t('settings.maintenance.schedule.enabled')}</Label>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="backup-cron">{t('settings.maintenance.schedule.backup')}</Label>
              <Input
                id="backup-cron"
                value={config.backupCron}
                onChange={(e) => setConfig({ ...config, backupCron: e.target.value })}
                placeholder="0 0 * * *"
              />
              <p className="text-[10px] text-muted-foreground font-mono">
                {t('settings.maintenance.schedule.cron_hint')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="enrichment-cron">{t('settings.maintenance.schedule.enrichment')}</Label>
              <Input
                id="enrichment-cron"
                value={config.enrichmentCron}
                onChange={(e) => setConfig({ ...config, enrichmentCron: e.target.value })}
                placeholder="0 3 * * *"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="module-sync-cron">{t('settings.maintenance.schedule.module_sync')}</Label>
              <Input
                id="module-sync-cron"
                value={config.moduleSyncCron}
                onChange={(e) => setConfig({ ...config, moduleSyncCron: e.target.value })}
                placeholder="0 1 * * *"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cache-clear-cron">{t('settings.maintenance.schedule.cache_clear')}</Label>
              <Input
                id="cache-clear-cron"
                value={config.cacheClearCron}
                onChange={(e) => setConfig({ ...config, cacheClearCron: e.target.value })}
                placeholder="0 5 * * *"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trash-cleanup-cron">Автоочистка корзины (Cron)</Label>
              <Input
                id="trash-cleanup-cron"
                value={config.trashCleanupCron}
                onChange={(e) => setConfig({ ...config, trashCleanupCron: e.target.value })}
                placeholder="0 4 * * *"
              />
            </div>
          </div>

          <div className="pt-6 border-t space-y-6">
            <h4 className="text-sm font-semibold">Настройки корзины</h4>
            <div className="flex items-center space-x-2">
              <Switch
                id="trash-auto-clean"
                checked={trashConfig.enabled}
                onCheckedChange={(checked) => setTrashConfig({ ...trashConfig, enabled: checked })}
              />
              <Label htmlFor="trash-auto-clean">Включить автоматическую очистку</Label>
            </div>
            
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="retention-days">Хранить удаленные файлы (дней)</Label>
              <Input
                id="retention-days"
                type="number"
                min={1}
                value={trashConfig.retention_days}
                onChange={(e) => setTrashConfig({ ...trashConfig, retention_days: parseInt(e.target.value) || 30 })}
              />
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {t('general.save')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h4 className="text-sm font-semibold mb-2">{t('settings.maintenance.schedule.examples_title')}</h4>
          <ul className="text-xs space-y-1 text-muted-foreground list-disc pl-4">
            <li><code className="bg-muted px-1 rounded text-foreground">0 0 * * *</code> — {t('settings.maintenance.schedule.example_midnight')}</li>
            <li><code className="bg-muted px-1 rounded text-foreground">0 */3 * * *</code> — {t('settings.maintenance.schedule.example_every3h')}</li>
            <li><code className="bg-muted px-1 rounded text-foreground">0 9 * * 1-5</code> — {t('settings.maintenance.schedule.example_workdays')}</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
