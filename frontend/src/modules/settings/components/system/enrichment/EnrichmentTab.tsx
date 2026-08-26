import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Sparkles, Settings, Database, Key, BarChart2, RefreshCw, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { BatchEnrichSection } from './BatchEnrichSection';
import { IndividualEnrichSection } from './IndividualEnrichSection';

export function EnrichmentTab() {
  const [mode, setMode] = useState<'batch' | 'single'>('batch');
  const { t } = useTranslation();

  // Состояние для статистики (перенесено из Integrations)
  const [loadingDadataStat, setLoadingDadataStat] = useState(false);
  const [dadataStat, setDadataStat] = useState<{
    today: { total: number; limit: number; remaining: number };
    daily: Array<{ date: string; total: number; successful: number }>;
  } | null>(null);
  const [dadataStatError, setDadataStatError] = useState<string | null>(null);

  const [loadingApifnsStat, setLoadingApifnsStat] = useState(false);
  const [apifnsStat, setApifnsStat] = useState<Record<string, any> | null>(null);
  const [statError, setStatError] = useState<{ message: string; hint?: string } | null>(null);

  const loadDadataStat = useCallback(async () => {
    setLoadingDadataStat(true);
    setDadataStatError(null);
    try {
      const data = await api.get('/settings/external/dadata/stat');
      setDadataStat(data);
    } catch (e: unknown) {
      const error = e as Error;
      setDadataStatError(error.message || t('settings.common.errors.stat_load'));
    } finally {
      setLoadingDadataStat(false);
    }
  }, [t]);

  const loadApifnsStat = useCallback(async () => {
    setLoadingApifnsStat(true);
    setStatError(null);
    try {
      const data = await api.get('/settings/external/apifns/stat');
      setApifnsStat(data);
    } catch (e: unknown) {
      const error = e as Error;
      setStatError({ 
        message: error.message || t('settings.common.errors.stat_load'),
        hint: (error as any).hint
      });
    } finally {
      setLoadingApifnsStat(false);
    }
  }, [t]);

  useEffect(() => {
    let isMounted = true;

    const initFetch = async () => {
      if (isMounted) {
        await loadDadataStat();
        await loadApifnsStat();
      }
    };

    initFetch();

    return () => {
      isMounted = false;
    };
  }, [loadDadataStat, loadApifnsStat]);

  return (
    <div className="space-y-6">
      {/* Шапка с описанием и кнопкой настроек */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border">
        <div className="text-sm text-muted-foreground max-w-2xl">
          <p className="font-medium text-foreground mb-1">{t('settings.system.enrichment.title')}</p>
          <p>{t('settings.system.enrichment.description')}</p>
        </div>
        <Link to="/settings?section=enrichment&tab=params">
          <Button variant="outline" size="sm" className="shrink-0 gap-2">
            <Settings className="w-4 h-4" />
            {t('settings.system.enrichment.setup_button')}
          </Button>
        </Link>
      </div>

      {/* Переключатель режима и контент */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setMode('batch')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === 'batch'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {t('settings.system.enrichment.tabs.batch')}
          </button>
          <button
            onClick={() => setMode('single')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === 'single'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {t('settings.system.enrichment.tabs.individual')}
          </button>
        </div>

        {mode === 'batch' ? <BatchEnrichSection /> : <IndividualEnrichSection />}
      </div>

      {/* Секция статистики (перенесена для удобства мониторинга) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
        {/* DaData Stat */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-500" />
              {t('settings.system.enrichment.stats.title')}
            </h4>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={loadDadataStat} disabled={loadingDadataStat}>
              <RefreshCw className={`w-3.5 h-3.5 ${loadingDadataStat ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {dadataStatError ? (
            <div className="text-xs text-destructive flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> {dadataStatError}
            </div>
          ) : dadataStat ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>{t('settings.system.enrichment.stats.used')}: {dadataStat.today?.total} / {dadataStat.today?.limit}</span>
                <span className="font-semibold">{dadataStat.today?.remaining} {t('settings.system.enrichment.stats.remaining')}</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all" 
                  style={{ width: `${dadataStat.today?.limit > 0 ? (dadataStat.today?.total / dadataStat.today?.limit) * 100 : 0}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground animate-pulse">{t('settings.system.enrichment.stats.loading')}</div>
          )}
        </div>

        {/* api-fns.ru Stat */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-500" />
              {t('settings.system.enrichment.stats.api_fns')}
            </h4>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={loadApifnsStat} disabled={loadingApifnsStat}>
              <RefreshCw className={`w-3.5 h-3.5 ${loadingApifnsStat ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {statError ? (
            <div className="space-y-2">
              <div className="text-xs text-destructive flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> {statError.message}
              </div>
              {statError.hint && (
                <div className="text-[11px] bg-destructive/10 text-destructive p-2 rounded border border-destructive/20">
                  <span className="font-semibold text-foreground italic">{t('settings.system.enrichment.stats.tip')} </span>
                  {statError.hint}
                </div>
              )}
            </div>
          ) : apifnsStat ? (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(apifnsStat).slice(0, 4).map(([k, v]: [string, { used: number } | number]) => (
                <div key={k} className="p-2 bg-muted/50 rounded flex justify-between items-center text-xs">
                  <span className="text-muted-foreground uppercase">{k}</span>
                  <span className="font-mono">{typeof v === 'object' ? v.used : v}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground animate-pulse">{t('settings.system.enrichment.stats.loading')}</div>
          )}
        </div>
      </div>
    </div>
  );
}
