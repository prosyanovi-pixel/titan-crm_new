import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/lib/i18n';
import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, Save, Star, Pencil, X, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Currency {
  id: string;
  name: string;
  symbol: string;
  exchangeRate: number | string;
  isBase: boolean;
}

const EMPTY_NEW = { id: '', name: '', symbol: '', exchangeRate: 1, isBase: false };

export function CurrencyEditor() {
  const { t } = useTranslation();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Currency>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newCurrency, setNewCurrency] = useState(EMPTY_NEW);

  const { data: fetchedCurrencies, isLoading: loading, refetch } = useQuery({
    queryKey: ['settings-currencies'],
    queryFn: async () => {
      try {
        const data = await api.get('/references/currencies');
        return data;
      } catch {
        toast.error(t('generated.oshibka_zagruzki_valyut'));
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const [prevFetchedCurrencies, setPrevFetchedCurrencies] = useState<unknown>(null);
  if (fetchedCurrencies !== prevFetchedCurrencies) {
    setPrevFetchedCurrencies(fetchedCurrencies);
    if (fetchedCurrencies) {
      setCurrencies(Array.isArray(fetchedCurrencies) ? fetchedCurrencies : []);
    }
  }

  const handleEdit = (c: Currency) => {
    setEditingId(c.id);
    setEditData({ ...c });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      const res = await api.put(`/references/currencies/${editingId}`, editData);
      setCurrencies(prev => prev.map(c => c.id === editingId ? res : c));
      setEditingId(null);
      toast.success(t('generated.valyuta_obnovlena'));
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.error(err?.message || t('settings.validation.error'));
    }
  };

  const handleSetBase = async (id: string) => {
    try {
      const res = await api.put(`/references/currencies/${id}`, { isBase: true, exchangeRate: 1 });
      setCurrencies(prev => prev.map(c =>
        c.id === id ? res : { ...c, isBase: false }
      ));
      toast.success(t('generated.bazovaya_valyuta_izmenena'));
    } catch {
      toast.error(t('generated.oshibka'));
    }
  };

  const handleAdd = async () => {
    if (!newCurrency.id.trim() || !newCurrency.name.trim()) {
      toast.error(t('generated.kod_i_nazvanie_obyazatel_ny'));
      return;
    }
    try {
      const res = await api.post('/references/currencies', newCurrency);
      setCurrencies(prev => [...prev, res]);
      setNewCurrency(EMPTY_NEW);
      setIsAdding(false);
      toast.success(t('generated.valyuta_dobavlena'));
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.error(err?.message || t('settings.validation.error'));
    }
  };

  const handleDelete = async (id: string) => {
    const c = currencies.find(c => c.id === id);
    if (c?.isBase) { toast.error(t('generated.nel_zya_udalit_bazovuyu_valyutu')); return; }
    try {
      await api.delete(`/references/currencies/${id}`);
      setCurrencies(prev => prev.filter(c => c.id !== id));
      toast.success(t('generated.valyuta_udalena'));
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.error(err?.message || t('settings.validation.in_use_system'));
    }
  };

  if (loading) return <div className="py-8 text-center text-muted-foreground">{t('generated.zagruzka')}</div>;

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {t('generated.kurs_kolichestvo_edinits_bazovoy_valyuty')}
      </div>

      {/* Заголовок таблицы */}
      <div className="grid grid-cols-[80px_1fr_80px_120px_100px] gap-2 px-3 py-2 bg-muted/50 rounded-md text-xs font-medium text-muted-foreground">
        <span>{t('generated.kod')}</span>
        <span>{t('generated.nazvanie')}</span>
        <span>{t('generated.simvol')}</span>
        <span>{t('generated.kurs_k_bazovoy')}</span>
        <span></span>
      </div>

      {currencies.map(c => (
        <div key={c.id} className={cn(
          "grid grid-cols-[80px_1fr_80px_120px_100px] gap-2 items-center px-3 py-2 rounded-md border",
          c.isBase && "border-primary/40 bg-primary/5"
        )}>
          {editingId === c.id ? (
            <>
              <span className="font-mono font-bold text-sm">{c.id}</span>
              <Input className="h-7 text-sm" value={editData.name ?? ''} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))} />
              <Input className="h-7 text-sm w-16" value={editData.symbol ?? ''} onChange={e => setEditData(p => ({ ...p, symbol: e.target.value }))} />
              <Input
                className="h-7 text-sm"
                type="number" step="0.0001"
                value={editData.exchangeRate ?? 1}
                disabled={!!editData.isBase}
                onChange={e => setEditData(p => ({ ...p, exchangeRate: parseFloat(e.target.value) }))}
              />
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveEdit}><Check className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5" /></Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-sm">{c.id}</span>
                {c.isBase && <Badge variant="outline" className="text-[10px] h-4 px-1 border-primary text-primary">{t('generated.bazovaya')}</Badge>}
              </div>
              <span className="text-sm">{c.name}</span>
              <span className="text-sm text-muted-foreground">{c.symbol}</span>
              <span className="text-sm font-mono">{c.isBase ? '1' : Number(c.exchangeRate)?.toFixed(4)}</span>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" title={t('generated.sdelat_bazovoy')} onClick={() => handleSetBase(c.id)} disabled={c.isBase}>
                  <Star className={cn("h-3.5 w-3.5", c.isBase && "fill-primary text-primary")} />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(c.id)} disabled={c.isBase}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </>
          )}
        </div>
      ))}

      {isAdding && (
        <div className="grid grid-cols-[80px_1fr_80px_120px_100px] gap-2 items-center px-3 py-2 rounded-md border-2 border-dashed border-primary/40">
              <Input className="h-7 text-sm" placeholder={t('generated.kod_usd')} value={newCurrency.id} onChange={e => setNewCurrency(p => ({ ...p, id: e.target.value.toUpperCase() }))} />
              <Input className="h-7 text-sm" placeholder={t('generated.nazvanie_valyuty')} value={newCurrency.name} onChange={e => setNewCurrency(p => ({ ...p, name: e.target.value }))} />
              <Input className="h-7 text-sm w-16" placeholder="$" value={newCurrency.symbol} onChange={e => setNewCurrency(p => ({ ...p, symbol: e.target.value }))} />
              <Input
                className="h-7 text-sm"
                type="number" step="0.0001"
                value={newCurrency.exchangeRate}
                onChange={e => setNewCurrency(p => ({ ...p, exchangeRate: parseFloat(e.target.value) }))}
              /><div className="flex gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleAdd}><Check className="h-3.5 w-3.5" /></Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setIsAdding(false); setNewCurrency(EMPTY_NEW); }}><X className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      )}

      {!isAdding && (
        <Button variant="outline" size="sm" className="w-full" onClick={() => setIsAdding(true)}>
          <Plus className="h-4 w-4 mr-2" /> {t('generated.dobavit_valyutu')}
        </Button>
      )}
    </div>
  );
}
