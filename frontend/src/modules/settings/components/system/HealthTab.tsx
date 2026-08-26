import { useTranslation } from '@/lib/i18n';
import { useState, useCallback, useEffect } from 'react';
import { Database, FileText, RefreshCw, Clock, Cpu, HardDrive, Server, MemoryStick } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { HealthCheck } from './types';
import { StatusDot, ProgressBar, formatDate } from './helpers';

export function HealthTab() {
  const { t } = useTranslation();
  const [data, setData] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api.get('/admin/health')); }
    catch { toast.error(t('generated.oshibka_zagruzki_sostoyaniya_sistemy')); }
    finally { setLoading(false); }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  if (!data && loading) return (
    <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
      <RefreshCw className="w-4 h-4 animate-spin" />{t('generated.zagruzka')}
    </div>
  );
  if (!data) return null;

  const { checks } = data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusDot status={data.status} />
          <span className="font-medium">
            {t('settings.system.health.status.title')}: {data.status === 'ok' ? t('settings.system.health.status.ok') : data.status === 'degraded' ? t('settings.system.health.status.degraded') : t('settings.system.health.status.error')}
          </span>
          <span className="text-xs text-muted-foreground">{t('settings.system.health.status.updated_at')} {formatDate(data.generatedAt)}</span>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />{t('generated.obnovit')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* БД */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="w-4 h-4" />{t('generated.baza_dannyh_postgresql')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <StatusDot status={checks.database?.status ?? 'error'} />
              <span>{checks.database?.status === 'ok' ? t('settings.system.health.db.connected') : checks.database?.error}</span>
            </div>
            {checks.database?.version && (
              <div className="text-muted-foreground">{checks.database.version}</div>
            )}
            {checks.database?.responseMs !== undefined && (
              <div className="text-muted-foreground">{t('settings.system.health.db.response')}: {checks.database.responseMs} {t('settings.system.health.db.ms')}</div>
            )}
            {checks.database?.connections && (
              <div className="grid grid-cols-3 gap-1 mt-2">
                {(['total','active','idle'] as const).map(k => (
                  <div key={k} className="bg-muted rounded p-2 text-center">
                    <div className="font-semibold">{checks.database!.connections![k]}</div>
                    <div className="text-xs text-muted-foreground">
                      {k === 'total' ? t('settings.system.health.db.connections.total') : k === 'active' ? t('settings.system.health.db.connections.active') : t('settings.system.health.db.connections.idle')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Память */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MemoryStick className="w-4 h-4" />{t('generated.pamyat')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {checks.memory && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('generated.sistema')}</span>
                  <span>{checks.memory.used} / {checks.memory.total}</span>
                </div>
                <ProgressBar value={checks.memory.usedPct} />
                <div className="text-xs text-muted-foreground">{checks.memory.usedPct}% {t('settings.system.health.memory.used_pct')}</div>
                <div className="mt-3 pt-2 border-t space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">{t('generated.protsess_node_js')}</div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Heap</span>
                    <span>{checks.memory.process.heapUsed} / {checks.memory.process.heapTotal}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">RSS</span>
                    <span>{checks.memory.process.rss}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Аптайм */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />{t('generated.vremya_raboty')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {checks.uptime && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded p-3">
                  <div className="text-xs text-muted-foreground mb-1">{t('generated.server_api')}</div>
                  <div className="font-semibold">{checks.uptime.processHuman}</div>
                </div>
                <div className="bg-muted rounded p-3">
                  <div className="text-xs text-muted-foreground mb-1">{t('generated.operatsionnaya_sistema')}</div>
                  <div className="font-semibold">{checks.uptime.systemHuman}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Окружение */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Server className="w-4 h-4" />{t('generated.okruzhenie')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {checks.environment && Object.entries({
              'Node.js':   checks.environment.nodeVersion,
              [t('settings.system.health.env.platform')]: checks.environment.platform,
              [t('settings.system.health.env.cpus')]:  String(checks.environment.cpus),
              [t('settings.system.health.env.host')]:      checks.environment.hostname,
              [t('settings.system.health.env.mode')]:     checks.environment.nodeEnv,
            }).map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-mono text-xs">{v}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Резервные копии */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <HardDrive className="w-4 h-4" />{t('generated.rezervnye_kopii')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {checks.backups && Object.entries({
              [t('settings.system.health.tags.files_count')]: String(checks.backups.count),
              [t('settings.system.health.tags.total_size')]:      checks.backups.totalSize,
              [t('settings.system.health.tags.last_backup')]:   formatDate(checks.backups.lastBackupAt),
            }).map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-muted-foreground">{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Лог-файлы */}
        {checks.logs && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" />{t('generated.log_fayly')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {Object.entries({
                [t('settings.system.health.tags.files')]:       String(checks.logs.fileCount),
                [t('settings.system.health.tags.total_size')]: checks.logs.totalSize,
              }).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-muted-foreground">{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
