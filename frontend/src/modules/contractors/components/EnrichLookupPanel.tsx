import { useTranslation } from '@/lib/i18n';
/**
 * EnrichLookupPanel — поиск контрагента в реестре по любому запросу
 * (ИНН, ОГРН, название) и заполнение полей формы из найденных данных.
 */
import { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Sparkles, RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Contractor } from '../types/contractor.types';

interface EnrichLookupPanelProps {
  formData: Partial<Contractor>;
  handleChange: (field: keyof Contractor, value: unknown) => void;
}

type RawData = Record<string, string | null>;

interface FieldRow {
  field: keyof Contractor;
  label: string;
  current: string | null;
  fetched: string;
  changed: boolean;
}

const getFieldMeta = (t: (key: string) => string): { field: keyof Contractor; label: string }[] => [
  { field: 'name',             label: t('contractor_sheet.field.short_name') },
  { field: 'fullName',         label: t('contractor_sheet.field.full_name')  },
  { field: 'inn',              label: t('contractor_sheet.field.inn')                  },
  { field: 'ogrn',             label: t('contractor_sheet.field.ogrn')                 },
  { field: 'kpp',              label: t('contractor_sheet.field.kpp')                  },
  { field: 'legalAddress',     label: t('contractor_sheet.field.legal_address')    },
  { field: 'director',         label: t('contractor_sheet.field.director')   },
  { field: 'directorPosition', label: t('contractor_sheet.field.position')            },
  { field: 'registrationDate', label: t('contractor_sheet.field.registration_date')     },
  { field: 'legalForm',        label: t('contractor_sheet.field.legal_form')       },
];

export function EnrichLookupPanel({ formData, handleChange }: EnrichLookupPanelProps) {
  const { t } = useTranslation();
  const [open, setOpen]         = useState(false);
  const [query, setQuery]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [source, setSource]     = useState<string | null>(null);
  const [rows, setRows]         = useState<FieldRow[]>([]);
  const [selected, setSelected] = useState<Set<keyof Contractor>>(new Set());

  // Предзаполнение запроса при открытии панели
  const handleOpen = () => {
    if (!open && !query) {
      setQuery(formData.inn || formData.ogrn || formData.name || '');
    }
    setOpen(v => !v);
  };

  const doSearch = async () => {
    if (!query.trim()) { toast.error(t('enrichment.enter_query')); return; }
    setLoading(true);
    setRows([]);
    setSelected(new Set());
    try {
      const result: { source: string; data: RawData } = await api.post('/enrichment/search', { query: query.trim() });
      const { source: src, data } = result;
      setSource(src);

      const newRows: FieldRow[] = [];
      const fieldMeta = getFieldMeta(t);
      for (const { field, label } of fieldMeta) {
        const fetched = data[field as string];
        if (!fetched) continue;
        const current = (formData[field] as string | null | undefined) ?? null;
        const changed = String(fetched).trim() !== String(current ?? '').trim();
        newRows.push({ field, label, current: current || null, fetched, changed });
      }

      setRows(newRows);
      // Автоматически выбираем поля которых нет или которые изменились
      setSelected(new Set(newRows.filter(r => r.changed).map(r => r.field)));

      if (!newRows.length) toast.info(t('enrichment.data_matches_or_no_new_data'));
    } catch (e: unknown) {
      toast.error(t('enrichment.error_search') + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  };

  const toggle = (field: keyof Contractor) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  };

  const applySelected = () => {
    let count = 0;
    for (const row of rows) {
      if (!selected.has(row.field)) continue;
      // registrationDate: конвертируем из YYYY-MM-DD если нужно
      handleChange(row.field, row.fetched);
      count++;
    }
    if (count) {
      toast.success(t('enrichment.fields_filled', { count }));
      setRows([]);
      setSelected(new Set());
      setSource(null);
    }
  };

  const changedCount  = rows.filter(r => r.changed).length;
  const selectedCount = selected.size;

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Заголовок-кнопка */}
      <button
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          {t('enrichment.find_in_registry')}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-border p-4 space-y-4 bg-muted/20">
          {/* Строка поиска */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('enrichment.inn_ogrn_or_company_name')}
                className="pl-9"
                onKeyDown={e => e.key === 'Enter' && doSearch()}
              />
            </div>
            <Button onClick={doSearch} disabled={loading} className="shrink-0 gap-2">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {t('common.find')}
            </Button>
          </div>

          {/* Результаты */}
          {rows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {t('generated.istochnik')} <Badge variant="outline" className="text-xs ml-1">{source}</Badge>
                  {changedCount > 0 && <span className="ml-2 text-emerald-600">· {t('enrichment.differences', { count: changedCount })}</span>}
                </span>
                <Button
                  size="sm"
                  onClick={applySelected}
                  disabled={selectedCount === 0}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  {t('enrichment.fill_selected', { count: selectedCount })}
                </Button>
              </div>

              <div className="rounded-md border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="w-8 px-3 py-2"></th>
                      <th className="px-3 py-2 text-left text-muted-foreground font-medium">{t('generated.pole')}</th>
                      <th className="px-3 py-2 text-left text-muted-foreground font-medium">{t('generated.seychas')}</th>
                      <th className="px-3 py-2 text-left text-muted-foreground font-medium">{t('generated.naydeno')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(row => (
                      <tr
                        key={String(row.field)}
                        className={`border-b border-border last:border-0 cursor-pointer hover:bg-muted/30 transition-colors ${selected.has(row.field) ? 'bg-emerald-500/5' : ''}`}
                        onClick={() => toggle(row.field)}
                      >
                        <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                          <Checkbox
                            checked={selected.has(row.field)}
                            onCheckedChange={() => toggle(row.field)}
                          />
                        </td>
                        <td className="px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">{row.label}</td>
                        <td className="px-3 py-2 text-muted-foreground/60 max-w-[120px] truncate">
                          {row.current || <span className="italic">{t('generated.pusto')}</span>}
                        </td>
                        <td className={`px-3 py-2 max-w-[160px] truncate font-medium ${row.changed ? 'text-emerald-600' : 'text-foreground'}`}>
                          {row.fetched}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
