import { useTranslation } from '@/lib/i18n';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Save, Building2 } from 'lucide-react';
import { api } from '@/lib/api';

interface CompanyProfile {
  id?: number;
  full_name: string;
  short_name: string;
  legal_address: string;
  actual_address: string;
  inn: string;
  kpp: string;
  ogrn: string;
  bik: string;
  bank_account: string;
  corr_account: string;
  bank_name: string;
  phone: string;
  email: string;
  website: string;
}

const EMPTY: CompanyProfile = {
  full_name: '', short_name: '', legal_address: '', actual_address: '',
  inn: '', kpp: '', ogrn: '', bik: '',
  bank_account: '', corr_account: '', bank_name: '',
  phone: '', email: '', website: '',
};

// db.js converts snake_case → camelCase; map back to snake_case for local state
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fromApi = (res: any): CompanyProfile => ({
  id: res.id,
  full_name: res.fullName ?? res.full_name ?? '',
  short_name: res.shortName ?? res.short_name ?? '',
  legal_address: res.legalAddress ?? res.legal_address ?? '',
  actual_address: res.actualAddress ?? res.actual_address ?? '',
  inn: res.inn ?? '',
  kpp: res.kpp ?? '',
  ogrn: res.ogrn ?? '',
  bik: res.bik ?? '',
  bank_account: res.bankAccount ?? res.bank_account ?? '',
  corr_account: res.corrAccount ?? res.corr_account ?? '',
  bank_name: res.bankName ?? res.bank_name ?? '',
  phone: res.phone ?? '',
  email: res.email ?? '',
  website: res.website ?? '',
});

export function CompanyProfileEditor() {
  const { t } = useTranslation();
  const [data, setData] = useState<CompanyProfile>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/company/profile');
      if (res && (res.id || res.fullName || res.full_name)) {
        setData({ ...EMPTY, ...fromApi(res) });
      }
    } catch {
      toast.error(t('generated.oshibka_zagruzki_rekvizitov'));
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const set = (field: keyof CompanyProfile) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setData(prev => ({ ...prev, [field]: e.target.value }));

  const syncAccountFromProfile = async (profile: CompanyProfile) => {
    if (!profile.bank_account) return;
    try {
      const accounts: Array<{
        id: number;
        description?: string;
        accountNumber?: string;
        account_number?: string;
      }> = await api.get('/company/accounts');

      const profileAccount = accounts.find(
        a => a.description === '__from_profile__' ||
             (a.accountNumber ?? a.account_number) === profile.bank_account
      );

      const payload = {
        name: profile.bank_name
          ? `${profile.bank_name} (${t('settings.company.bank_account')})`
          : t('settings.company.bank_account'),
        description: '__from_profile__',
        account_type: 'bank',
        bank_name: profile.bank_name,
        account_number: profile.bank_account,
        currency_id: 'RUB',
        is_active: true,
      };

      if (profileAccount) {
        await api.put(`/company/accounts/${profileAccount.id}`, payload);
      } else {
        await api.post('/company/accounts', { ...payload, is_default: accounts.length === 0 });
      }
    } catch {
      // not critical — profile was saved successfully
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/company/profile', data);
      const saved = { ...EMPTY, ...fromApi(res) };
      setData(saved);
      await syncAccountFromProfile(saved);
      toast.success(t('generated.rekvizity_sohraneny'));
    } catch {
      toast.error(t('generated.oshibka_sohraneniya'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-8 text-center text-muted-foreground">{t('generated.zagruzka')}</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Building2 className="h-4 w-4" />
          {t('generated.dannye_ispol_zuyutsya_pri_formirovanii_s')}
        </div>
        <Button onClick={handleSave} disabled={saving} size="sm">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label>{t('generated.polnoe_naimenovanie')}</Label>
          <Input value={data.full_name} onChange={set('full_name')} placeholder='ООО "Название компании"' />
        </div>
        <div className="space-y-2">
          <Label>{t('generated.kratkoe_naimenovanie')}</Label>
          <Input value={data.short_name} onChange={set('short_name')} placeholder='ООО "Название"' />
        </div>
      </div>

      <Separator />
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('generated.rekvizity')}</p>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>{t('generated.inn')}</Label>
          <Input value={data.inn} onChange={set('inn')} placeholder="7700000000" maxLength={12} />
        </div>
        <div className="space-y-2">
          <Label>{t('generated.kpp')}</Label>
          <Input value={data.kpp} onChange={set('kpp')} placeholder="770001001" maxLength={9} />
        </div>
        <div className="space-y-2">
          <Label>{t('generated.ogrn')}</Label>
          <Input value={data.ogrn} onChange={set('ogrn')} placeholder="1027700000000" maxLength={15} />
        </div>
      </div>

      <Separator />
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('generated.bankovskie_rekvizity')}</p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('generated.nazvanie_banka')}</Label>
          <Input value={data.bank_name} onChange={set('bank_name')} placeholder='ПАО "Сбербанк"' />
        </div>
        <div className="space-y-2">
          <Label>{t('generated.bik')}</Label>
          <Input value={data.bik} onChange={set('bik')} placeholder="044525225" maxLength={9} />
        </div>
        <div className="space-y-2">
          <Label>{t('generated.raschetnyy_schet')}</Label>
          <Input value={data.bank_account} onChange={set('bank_account')} placeholder="40702810000000000000" maxLength={20} />
        </div>
        <div className="space-y-2">
          <Label>{t('generated.korrespondentskiy_schet')}</Label>
          <Input value={data.corr_account} onChange={set('corr_account')} placeholder="30101810400000000225" maxLength={20} />
        </div>
      </div>

      <Separator />
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('generated.adresa_i_kontakty')}</p>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label>{t('generated.yuridicheskiy_adres')}</Label>
          <Input value={data.legal_address} onChange={set('legal_address')} placeholder={t('generated.g_moskva_ul_primernaya_d_1')} />
        </div>
        <div className="space-y-2">
          <Label>{t('generated.fakticheskiy_adres')}</Label>
          <Input value={data.actual_address} onChange={set('actual_address')} placeholder={t('generated.sovpadaet_s_yuridicheskim')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t('generated.telefon')}</Label>
            <Input value={data.phone} onChange={set('phone')} placeholder="+7 (495) 000-00-00" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={data.email} onChange={set('email')} placeholder="info@company.ru" type="email" />
          </div>
          <div className="space-y-2">
            <Label>{t('generated.sayt')}</Label>
            <Input value={data.website} onChange={set('website')} placeholder="https://company.ru" />
          </div>
        </div>
      </div>
    </div>
  );
}
