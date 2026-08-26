import { useTranslation } from '@/lib/i18n';
import { useState, useCallback } from 'react';
import { ResizableSheet } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  RefreshCw, Sparkles, CheckCircle2, AlertCircle, ArrowRight, Info,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface DiffField {
  label: string;
  current: string | null;
  fetched: string;
  changed: boolean;
}

interface EnrichResult {
  source: string;
  diff: Record<string, DiffField>;
  raw: Record<string, string>;
}

interface ContractorEnrichDrawerProps {
  contractorId: number;
  contractorName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplied: () => void;
}


export function ContractorEnrichDrawer({
  contractorId,
  contractorName,
  open,
  onOpenChange,
  onApplied,
}: ContractorEnrichDrawerProps) {
  const { t } = useTranslation();
  const [step, setStep]         = useState<'idle' | 'loading' | 'result' | 'applying' | 'error'>('idle');
  const [result, setResult]     = useState<EnrichResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const lookup = useCallback(async () => {
    setStep('loading');
    setResult(null);
    setErrorMsg('');
    try {
      const data: EnrichResult = await api.get(`/enrichment/lookup/${contractorId}`);
      setResult(data);

      // По умолчанию — выбрать все изменившиеся поля
      const changed = Object.entries(data.diff)
        .filter(([, v]) => v.changed)
        .map(([k]) => k);
      setSelected(new Set(changed));

      setStep('result');
    } catch (e: unknown) {
      const msg = (e as { error?: string; message?: string }).error
        || (e as Error).message
        || t('enrichment.error_search');
      setErrorMsg(msg);
      setStep('error');
    }
  }, [contractorId, t]);

  const toggleField = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (!result) return;
    const all = Object.keys(result.diff);
    setSelected(prev => prev.size === all.length ? new Set() : new Set(all));
  };

  const apply = async () => {
    if (!result || selected.size === 0) return;
    setStep('applying');
    try {
      const res = await api.post(`/enrichment/apply/${contractorId}`, {
        fields: Array.from(selected),
        source: result.source,
        data:   result.raw,
      });
      toast.success(t('messages.updated_fields', { count: res.updated }));
      onApplied();
      onOpenChange(false);
      setStep('idle');
    } catch (e: unknown) {
      const msg = (e as { error?: string }).error || t('contractor_sheet.enrichment.error_apply');
      toast.error(msg);
      setStep('result');
    }
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) setStep('idle');
    onOpenChange(v);
  };

  const diffEntries = result ? Object.entries(result.diff) : [];
  const changedCount = diffEntries.filter(([, v]) => v.changed).length;
  const unchangedCount = diffEntries.length - changedCount;

  return (
    <ResizableSheet 
      open={open} 
      onOpenChange={handleOpenChange}
      moduleKey="contractor_enrich"
      defaultWidth="md"
      hideFooter={true}
      title={
        <span className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-500" />
          {t('generated.obnovit_iz_otkrytyh_istochnikov')}
        </span>
      }
      description={contractorName}
    >

        {/* Body */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 space-y-4">

            {/* Idle */}
            {step === 'idle' && (
              <div className="text-center py-10 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                  <Sparkles className="w-7 h-7 text-emerald-500" />
                </div>
                <div>
                  <p className="font-medium mb-1">{t('generated.poisk_dannyh_v_egryul')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('generated.sravnivaem_tekuschie_dannye_s_informatsi')}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground bg-muted rounded-lg p-3 text-left space-y-1">
                  <div className="font-medium mb-1 flex items-center gap-1"><Info className="w-3 h-3" />{t('generated.istochniki_v_poryadke_prioriteta')}</div>
                  <div>{t('generated.1_dadata_esli_nastroen_api_klyuch_nastro')}</div>
                  <div>{t('generated.2_api_fns_ru_besplatnyy_demo_rezhim')}</div>
                </div>
                <Button onClick={lookup} className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  {t('generated.nayti_dannye')}
                </Button>
              </div>
            )}

            {/* Loading */}
            {step === 'loading' && (
              <div className="text-center py-16 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground text-sm">{t('generated.zaprashivaem_dannye_iz_istochnikov')}</p>
              </div>
            )}

            {/* Error */}
            {step === 'error' && (
              <div className="text-center py-10 space-y-4">
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-7 h-7 text-red-500" />
                </div>
                <div>
                  <p className="font-medium mb-1">{t('generated.ne_udalos_poluchit_dannye')}</p>
                  <p className="text-sm text-muted-foreground">{errorMsg}</p>
                </div>
                <Button variant="outline" onClick={lookup} className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  {t('generated.poprobovat_snova')}
                </Button>
              </div>
            )}

            {/* Result */}
            {(step === 'result' || step === 'applying') && result && (
              <div className="space-y-4">
                {/* Source badge */}
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    {t('enrichment.source')}: {t(`enrichment.sources.${result.source}`, { defaultValue: result.source })}
                  </Badge>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {changedCount > 0 && (
                      <span className="text-orange-600 font-medium">{t('enrichment.differences', { count: changedCount })}</span>
                    )}
                    {unchangedCount > 0 && (
                      <span>{t('enrichment.unchanged', { count: unchangedCount })}</span>
                    )}
                  </div>
                </div>

                {changedCount === 0 && (
                  <div className="text-center py-6">
                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="font-medium text-sm">{t('generated.vse_dannye_aktual_ny')}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t('generated.razlichiy_ne_obnaruzheno')}</p>
                  </div>
                )}

                {diffEntries.length > 0 && (
                  <div className="space-y-1">
                    {/* Выбрать все */}
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Checkbox
                        id="select-all"
                        checked={selected.size === diffEntries.length}
                        onCheckedChange={toggleAll}
                      />
                      <label htmlFor="select-all" className="text-xs font-medium cursor-pointer text-muted-foreground">
                        {t('enrichment.select_all_fields', { selected: selected.size, total: diffEntries.length })}
                      </label>
                    </div>

                    {diffEntries.map(([key, field]) => (
                      <div
                        key={key}
                        className={`rounded-lg border p-3 space-y-2 transition-colors ${
                          field.changed ? 'border-orange-200 bg-orange-50/50 dark:bg-orange-950/10' : 'border-border bg-muted/20'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <Checkbox
                            id={`field-${key}`}
                            checked={selected.has(key)}
                            onCheckedChange={() => toggleField(key)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <label
                              htmlFor={`field-${key}`}
                              className="text-xs font-medium cursor-pointer leading-none"
                            >
                              {field.label}
                              {field.changed && (
                                <span className="ml-2 text-orange-600 font-normal">{t('generated.izmenilos')}</span>
                              )}
                            </label>

                            <div className="mt-1.5 grid grid-cols-[1fr_auto_1fr] items-start gap-1">
                              {/* Текущее */}
                              <div className="text-xs text-muted-foreground bg-background rounded px-2 py-1 border min-h-[28px]">
                                {field.current || <span className="italic text-muted-foreground/60">{t('generated.ne_zapolneno')}</span>}
                              </div>

                              <ArrowRight className="w-3 h-3 text-muted-foreground mt-1.5 shrink-0" />

                              {/* Новое */}
                              <div className={`text-xs rounded px-2 py-1 border min-h-[28px] ${
                                field.changed
                                  ? 'bg-green-50 border-green-200 text-green-900 dark:bg-green-950/20 dark:text-green-300'
                                  : 'bg-background text-muted-foreground'
                              }`}>
                                {field.fetched || <span className="italic opacity-60">{t('generated.pusto')}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </ScrollArea>

        {/* Footer */}
        {(step === 'result' || step === 'applying') && result && (
          <div className="p-4 border-t bg-background flex items-center justify-between gap-3">
            <Button variant="outline" onClick={lookup} disabled={step === 'applying'} size="sm">
              <RefreshCw className="w-3 h-3 mr-1" />
              {t('generated.obnovit')}
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={step === 'applying'}>
                {t('generated.otmena')}
              </Button>
              <Button
                onClick={apply}
                disabled={selected.size === 0 || step === 'applying'}
                className="gap-2"
              >
                {step === 'applying'
                  ? <RefreshCw className="w-4 h-4 animate-spin" />
                  : <CheckCircle2 className="w-4 h-4" />
                }
                {selected.size > 0
                  ? t('enrichment.apply_with_count', { count: selected.size })
                  : t('enrichment.apply')}
              </Button>
            </div>
          </div>
        )}
      </ResizableSheet>
  );
}
