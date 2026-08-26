import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/lib/i18n';
import { useState } from 'react';
import { Database, RefreshCw, Play, Info, ChevronRight, Package, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { EnvInfo } from './types';

export function MaintenanceTab() {
  const { t } = useTranslation();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [output, setOutput] = useState<{ title: string; text: string } | null>(null);

  const { data: envInfo = null, isLoading: envLoading, refetch: loadEnvInfo } = useQuery({
    queryKey: ['settings-env-info'],
    queryFn: async () => {
      try {
        const data = await api.get('/admin/env-info');
        return data as EnvInfo;
      } catch {
        toast.error(t('generated.oshibka_zagruzki_informatsii_ob_okruzhen'));
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const runAction = async (action: string, label: string) => {
    setActionLoading(action);
    try {
      const endpoint = action.startsWith('cache/') ? `/admin/${action}` : `/admin/maintenance/${action}`;
      const res = await api.post(endpoint, {});
      toast.success(res.message || `${label} ${t('settings.system.maintenance.success_suffix')}`);
      if (res.output) setOutput({ title: label, text: res.output });
    } catch (e: unknown) {
      const err = e as { error?: string };
      toast.error(err.error || `${t('settings.system.maintenance.error_prefix')}: ${label}`);
    } finally {
      setActionLoading(null);
    }
  };

  const actions = [
    {
      id: 'vacuum',
      label: 'VACUUM ANALYZE',
      description: t('settings.maintenance.db_analyze.description'),
      icon: Database,
      danger: false,
    },
    {
      id: 'sync-modules',
      label: t('settings.maintenance.sync_modules.label'),
      description: t('settings.maintenance.sync_modules.description'),
      icon: RefreshCw,
      danger: false,
    },
    {
      id: 'cache/clear',
      label: t('settings.maintenance.clear_cache.label'),
      description: t('settings.maintenance.clear_cache.description_full'),
      icon: RefreshCw,
      danger: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Действия обслуживания */}
      <div>
        <h3 className="text-sm font-semibold mb-3">{t('generated.zadachi_obsluzhivaniya')}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {actions.map(a => (
            <Card key={a.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <a.icon className="w-4 h-4 text-muted-foreground" />
                  {a.label}
                </CardTitle>
                <CardDescription className="text-xs">{a.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  size="sm"
                  variant={a.danger ? 'destructive' : 'outline'}
                  onClick={() => runAction(a.id, a.label)}
                  disabled={!!actionLoading}
                >
                  {actionLoading === a.id
                    ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    : <Play className="w-3 h-3 mr-1" />
                  }
                  {t('settings.system.maintenance.run_button')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Окружение */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">{t('generated.informatsiya_ob_okruzhenii')}</h3>
          <Button size="sm" variant="ghost" onClick={() => loadEnvInfo()} disabled={envLoading}>
            <RefreshCw className={`w-3 h-3 ${envLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        {envInfo && (
          <div className="grid gap-4 sm:grid-cols-2">
            {/* ENV переменные */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Info className="w-3 h-3" />{t('generated.peremennye_okruzheniya')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {Object.entries(envInfo.env).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-muted-foreground font-mono">{k}</span>
                      <span className="font-mono">{v}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs pt-1 border-t mt-1">
                    <span className="text-muted-foreground font-mono">VERSION</span>
                    <span className="font-mono">{envInfo.packageVersion}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* npm scripts */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <ChevronRight className="w-3 h-3" />npm scripts (package.json)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {envInfo.scripts.map(s => (
                    <div key={s} className="flex items-center gap-1 text-xs">
                      <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <span className="font-mono">{s}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Зависимости */}
            <Card className="sm:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Package className="w-3 h-3" />{t('settings.system.maintenance.dependencies')} ({envInfo.dependencies.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {envInfo.dependencies.map(d => (
                    <Badge key={d.name} variant="secondary" className="text-xs font-mono">
                      {d.name} <span className="text-muted-foreground ml-1">{d.version}</span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Output dialog */}
      <Dialog open={!!output} onOpenChange={() => setOutput(null)}>
        <DialogContent className="max-w-2xl max-h-[60vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{output?.title} — {t('settings.system.maintenance.output_title')}</DialogTitle>
            <DialogDescription>{t('general.generated.rezultat_vypolneniya_operatsii')}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0 border rounded">
            <pre className="p-3 text-xs font-mono whitespace-pre-wrap">
              {output?.text || t('settings.maintenance.output_empty')}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
