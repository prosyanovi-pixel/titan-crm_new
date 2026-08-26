import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/lib/i18n';
import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, Star, Landmark, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Currency { id: string; name: string; symbol: string; }
interface CompanyAccount {
  id: number;
  name: string;
  description: string;
  currency_id: string;
  account_type: string;
  bank_name: string;
  account_number: string;
  is_default: boolean;
  is_active: boolean;
  currency_name?: string;
  currency_symbol?: string;
}

// db.js converts snake_case → camelCase; normalize to snake_case for our interface
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizeAccount = (a: any): CompanyAccount => ({
  id: a.id,
  name: a.name ?? '',
  description: a.description ?? '',
  currency_id: a.currencyId ?? a.currency_id ?? 'RUB',
  account_type: a.accountType ?? a.account_type ?? 'bank',
  bank_name: a.bankName ?? a.bank_name ?? '',
  account_number: a.accountNumber ?? a.account_number ?? '',
  is_default: a.isDefault ?? a.is_default ?? false,
  is_active: a.isActive ?? a.is_active ?? true,
  currency_name: a.currencyName ?? a.currency_name,
  currency_symbol: a.currencySymbol ?? a.currency_symbol,
});

const ACCOUNT_TYPES = (t: (k: string) => string) => [
  { value: 'bank', label: t('settings.company.accounts.types.bank') },
  { value: 'cash', label: t('settings.company.accounts.types.cash') },
  { value: 'card', label: t('settings.company.accounts.types.card') },
  { value: 'virtual', label: t('settings.company.accounts.types.virtual') },
];

const EMPTY_FORM = {
  name: '', description: '', currency_id: 'RUB', account_type: 'bank',
  bank_name: '', account_number: '', is_default: false, is_active: true,
};

export function CompanyAccountEditor() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<CompanyAccount[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const { data: fetchedData, isLoading: loading, refetch } = useQuery({
    queryKey: ['settings-company-accounts'],
    queryFn: async () => {
      try {
        const [acc, cur] = await Promise.all([
          api.get('/company/accounts'),
          api.get('/references/currencies'),
        ]);
        return { acc, cur };
      } catch {
        toast.error(t('generated.oshibka_zagruzki'));
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const [prevFetchedData, setPrevFetchedData] = useState<unknown>(null);
  if (fetchedData !== prevFetchedData) {
    setPrevFetchedData(fetchedData);
    if (fetchedData) {
      const data = fetchedData as any;
      setAccounts(Array.isArray(data.acc) ? data.acc.map(normalizeAccount) : []);
      setCurrencies(Array.isArray(data.cur) ? data.cur : []);
    }
  }

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (a: CompanyAccount) => {
    setEditingId(a.id);
    setForm({
      name: a.name,
      // don't expose internal marker in the visible description field
      description: a.description === '__from_profile__' ? '' : (a.description || ''),
      currency_id: a.currency_id, account_type: a.account_type,
      bank_name: a.bank_name || '', account_number: a.account_number || '',
      is_default: a.is_default, is_active: a.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error(t('generated.nazvanie_obyazatel_no')); return; }
    setSaving(true);
    try {
      if (editingId) {
        const res = await api.put(`/company/accounts/${editingId}`, form);
        const normalized = normalizeAccount(res);
        setAccounts(prev => prev.map(a =>
          a.id === editingId ? normalized : (form.is_default ? { ...a, is_default: false } : a)
        ));
      } else {
        const res = await api.post('/company/accounts', form);
        const normalized = normalizeAccount(res);
        setAccounts(prev => [
          ...(form.is_default ? prev.map(a => ({ ...a, is_default: false })) : prev),
          normalized,
        ]);
      }
      setDialogOpen(false);
      toast.success(editingId ? t('generated.schet_obnovlen') : t('generated.schet_dobavlen'));
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.error(err?.message || t('settings.validation.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/company/accounts/${id}`);
      setAccounts(prev => prev.filter(a => a.id !== id));
      toast.success(t('generated.schet_udalen'));
    } catch {
      toast.error(t('generated.oshibka_udaleniya'));
    }
  };

  const typeLabel = (val: string) => ACCOUNT_TYPES(t).find(x => x.value === val)?.label ?? val;

  if (loading) return <div className="py-8 text-center text-muted-foreground">{t('generated.zagruzka')}</div>;

  return (
    <div className="space-y-3">
      {accounts.map(a => (
        <div key={a.id} className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg border",
          !a.is_active && "opacity-50",
          a.is_default && "border-primary/40 bg-primary/5"
        )}>
          <div className="text-muted-foreground">
            {a.account_type === 'cash' ? <Wallet className="h-5 w-5" /> : <Landmark className="h-5 w-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{a.name}</span>
              {a.is_default && <Badge variant="outline" className="text-[10px] h-4 px-1 border-primary text-primary">{t('generated.osnovnoy')}</Badge>}
              {!a.is_active && <Badge variant="secondary" className="text-[10px] h-4 px-1">{t('generated.neaktiven')}</Badge>}
              {a.description === '__from_profile__' && <Badge variant="secondary" className="text-[10px] h-4 px-1">{t('generated.iz_rekvizitov')}</Badge>}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {typeLabel(a.account_type)}
              {a.bank_name && ` · ${a.bank_name}`}
              {a.account_number && ` · ${a.account_number}`}
            </div>
          </div>
          <Badge variant="secondary" className="font-mono">
            {a.currency_symbol} {a.currency_id}
          </Badge>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(a.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}

      <Button variant="outline" className="w-full" size="sm" onClick={openAdd}>
        <Plus className="h-4 w-4 mr-2" /> {t('generated.dobavit_schet')}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? t('settings.company.accounts.edit_account') : t('settings.company.accounts.new_account')}</DialogTitle>
            <DialogDescription>
              {editingId ? t('general.generated.izmenite_informatsiyu_o_bankovskom_schete') : t('general.generated.dobavte_novyy_bankovskiy_schet_dlya_kompanii')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>{t('generated.nazvanie')}</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder={t('generated.raschetnyy_schet_rub')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('generated.valyuta')}</Label>
                <Select value={form.currency_id} onValueChange={v => setForm(p => ({ ...p, currency_id: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {currencies.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.symbol} {c.id} — {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('generated.tip')}</Label>
                <Select value={form.account_type} onValueChange={v => setForm(p => ({ ...p, account_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES(t).map(at => <SelectItem key={at.value} value={at.value}>{at.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t('generated.bank')}</Label>
              <Input value={form.bank_name} onChange={e => setForm(p => ({ ...p, bank_name: e.target.value }))} placeholder={t('settings.company.accounts.example_bank')} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('generated.nomer_scheta')}</Label>
              <Input value={form.account_number} onChange={e => setForm(p => ({ ...p, account_number: e.target.value }))} placeholder="40702810..." maxLength={25} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('generated.opisanie')}</Label>
              <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder={t('generated.neobyazatel_no')} />
            </div>
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" className="rounded" checked={form.is_default}
                  onChange={e => setForm(p => ({ ...p, is_default: e.target.checked }))} />
                <Star className="h-3.5 w-3.5 text-muted-foreground" /> {t('generated.osnovnoy')}
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" className="rounded" checked={form.is_active}
                  onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} />
                {t('generated.aktiven')}
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('generated.otmena')}</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? t('generated.sohranenie') : t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
