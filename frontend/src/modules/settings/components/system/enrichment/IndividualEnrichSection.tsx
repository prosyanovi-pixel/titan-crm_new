import { useTranslation } from '@/lib/i18n';
import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Search, RefreshCw, X, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { EnrichFieldDiff } from './types';

export function IndividualEnrichSection() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [query, setQuery]               = useState('');
  const [contractors, setContractors]   = useState<{ id: number; name: string; inn?: string }[]>([]);
  const [loadingList, setLoadingList]   = useState(false);
  const [selected, setSelected]         = useState<{ id: number; name: string; inn?: string } | null>(null);
  const [searching, setSearching]       = useState(false);
  const [diff, setDiff]                 = useState<Record<string, EnrichFieldDiff> | null>(null);
  const [raw, setRaw]                   = useState<Record<string, unknown> | null>(null);
  const [source, setSource]             = useState<string | null>(null);
  const [fieldSel, setFieldSel]         = useState<Set<string>>(new Set());
  const [applying, setApplying]         = useState(false);

  // поиск по нашей БД
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!query.trim()) { setContractors([]); return; }
    const t = setTimeout(async () => {
      setLoadingList(true);
      try {
        const data = await api.get(`/contractors?search=${encodeURIComponent(query)}&limit=20`);
        setContractors(Array.isArray(data) ? data : (data.contractors ?? data.data ?? []));
      } catch { setContractors([]); }
      finally { setLoadingList(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const lookup = useCallback(async (c: { id: number; name: string; inn?: string }) => {
    setSelected(c);
    setDiff(null);
    setRaw(null);
    setSource(null);
    setFieldSel(new Set());
    setSearching(true);
    try {
      const timestamp = new Date().getTime();
      const data = await api.get(`/enrichment/lookup/${c.id}?_=${timestamp}`);
      setDiff(data.diff ?? null);
      setRaw(data.raw ?? null);
      setSource(data.source ?? null);
      const changed = Object.entries(data.diff ?? {})
        .filter(([, v]) => (v as EnrichFieldDiff).changed).map(([k]) => k);
      setFieldSel(new Set(changed));
    } catch (e: unknown) {
      toast.error(t('generated.oshibka_poiska') + (e instanceof Error ? e.message : String(e)));
    } finally { setSearching(false); }
  }, [t]);

  const apply = async () => {
    if (!selected || !raw || fieldSel.size === 0) return;
    setApplying(true);
    try {
      await api.post(`/enrichment/apply/${selected.id}`, {
        fields: Array.from(fieldSel), source: source ?? 'admin', data: raw,
      });
      toast.success(t('generated.dannye_kontragenta_obnovleny'));
      // Invalidate cached lookup for this contractor
      queryClient.invalidateQueries({ queryKey: ['enrichmentLookup', selected.id] });
      setDiff(null); setRaw(null); setSource(null); setFieldSel(new Set());
    } catch (e: unknown) {
      toast.error(t('generated.oshibka') + (e instanceof Error ? e.message : String(e)));
    } finally { setApplying(false); }
  };

  const toggle = (field: string) => {
    setFieldSel(prev => {
      const n = new Set(prev);
      if (n.has(field)) n.delete(field);
      else n.add(field);
      return n;
    });
  };

  const changedRows = Object.entries(diff ?? {}).filter(([, v]) => v.changed);
  const sameRows    = Object.entries(diff ?? {}).filter(([, v]) => !v.changed && v.fetched);

  return (
    <div className="space-y-4">
      {/* Поиск по нашей БД */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('generated.nachnite_vvodit_nazvanie_inn_ili_ogrn')}
          className="pl-9"
        />
      </div>

      {loadingList && <p className="text-xs text-muted-foreground px-1">{t('generated.poisk')}</p>}

      {contractors.length > 0 && !selected && (
        <div className="border border-border rounded-lg overflow-hidden">
          {contractors.map(c => (
            <button
              key={c.id}
              onClick={() => lookup(c)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted/50 border-b border-border last:border-0 text-left"
            >
              <span className="font-medium truncate">{c.name}</span>
              {c.inn && <span className="text-xs text-muted-foreground ml-3 shrink-0">{t('settings.system.enrichment.individual.inn_prefix')} {c.inn}</span>}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{t('generated.vybran')}</Badge>
              <span className="text-sm font-medium">{selected.name}</span>
              {selected.inn && <span className="text-xs text-muted-foreground">{t('settings.system.enrichment.individual.inn_prefix')} {selected.inn}</span>}
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setSelected(null); setDiff(null); setQuery(''); }}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {searching && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <RefreshCw className="w-4 h-4 animate-spin" /> {t('generated.ischem_dannye_v_reestre')}
            </div>
          )}

          {diff && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {t('generated.istochnik')} <Badge variant="outline" className="text-xs">{source}</Badge>
                {changedRows.length > 0 && <span className="text-emerald-600 ml-1">· {changedRows.length} {t('settings.system.enrichment.individual.differences')}</span>}
              </div>

              {changedRows.length > 0 ? (
                <>
                  <div className="rounded-md border border-border overflow-hidden text-xs">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/40">
                          <th className="w-10 px-3 py-2">
                            <Checkbox
                              checked={changedRows.length > 0 && changedRows.every(([f]) => fieldSel.has(f))}
                              onCheckedChange={checked => {
                                if (checked) setFieldSel(new Set(changedRows.map(([f]) => f)));
                                else setFieldSel(new Set());
                              }}
                            />
                          </th>
                          <th className="px-3 py-2 text-left text-muted-foreground font-medium">{t('generated.pole')}</th>
                          <th className="px-3 py-2 text-left text-muted-foreground font-medium">{t('generated.seychas_v_bd')}</th>
                          <th className="px-3 py-2 text-left text-muted-foreground font-medium">{t('generated.naydeno')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {changedRows.map(([field, v]) => (
                          <tr
                            key={field}
                            className={`border-b last:border-0 cursor-pointer hover:bg-muted/30 ${fieldSel.has(field) ? 'bg-emerald-500/5' : ''}`}
                            onClick={() => toggle(field)}
                          >
                            <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                              <Checkbox checked={fieldSel.has(field)} onCheckedChange={() => toggle(field)} />
                            </td>
                            <td className="px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">{v.label}</td>
                            <td className="px-3 py-2 text-muted-foreground/60 max-w-[120px] truncate">{v.current || <span className="italic">{t('generated.pusto')}</span>}</td>
                            <td className="px-3 py-2 text-emerald-600 font-medium max-w-[160px] truncate">{v.fetched}</td>
                          </tr>
                        ))}
                        {sameRows.map(([field, v]) => (
                          <tr key={field} className="border-b last:border-0 opacity-40">
                            <td className="px-3 py-2"><Checkbox checked={false} disabled /></td>
                            <td className="px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">{v.label}</td>
                            <td className="px-3 py-2 text-muted-foreground/60 max-w-[120px] truncate" colSpan={2}>
                              {v.fetched} <span className="italic">{t('generated.sovpadaet')}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Button
                    onClick={apply}
                    disabled={applying || fieldSel.size === 0}
                    className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {applying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {t('settings.system.enrichment.individual.save_fields')} ({fieldSel.size} {t('settings.system.enrichment.individual.of')} {changedRows.length})
                  </Button>
                </>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
                  {t('generated.vse_dannye_aktual_ny')}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
