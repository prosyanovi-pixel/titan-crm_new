import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, Save, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { DatePicker } from '@/components/ui/date-picker';
import { useConfirm } from '@/components/ui/confirm-dialog';

interface TaxRegime {
  id: number;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  hasVat: boolean;
  hasProfitTax: boolean;
  hasUsnTax: boolean;
  hasInsurance: boolean;
  hasNdfl: boolean;
  defaultVatRate: number;
  defaultProfitTaxRate: number;
  defaultUsnRate: number;
  defaultInsuranceRate: number;
  defaultNdflRate: number;
  // Новые поля для налогового модуля 2026
  appliesToLegalForms: string[];
  validFrom: string;
  validTo: string;
  requiresNds: boolean;
  maxIncomeLimit?: number;
  maxEmployeesLimit?: number;
  requiresOnlineCashier: boolean;
}

interface TaxRate {
  id: number;
  taxRegimeId: number;
  taxType: 'vat' | 'profit_tax' | 'usn' | 'insurance' | 'ndfl';
  name: string;
  rate: number;
  isFixed: boolean;
  fixedAmount?: number;
  description?: string;
  isActive: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  // Новые поля для налогового модуля 2026
  rateValue: number;
  appliesFrom: string;
  isDefault: boolean;
  legalForms: string[];
}

export function FinanceTaxSettings() {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  
  const [taxRegimes, setTaxRegimes] = useState<TaxRegime[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog states
  const [isRegimeDialogOpen, setIsRegimeDialogOpen] = useState(false);
  const [editingRegime, setEditingRegime] = useState<TaxRegime | null>(null);
  const [isRateDialogOpen, setIsRateDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<TaxRate | null>(null);
  
  const [rateFormData, setRateFormData] = useState<Partial<TaxRate>>({
    taxRegimeId: 0,
    taxType: 'vat',
    name: '',
    rate: 20,
    isFixed: false,
    isActive: true,
    effectiveFrom: format(new Date(), 'dd.MM.yyyy'),
    effectiveTo: '',
    // Новые поля для налогового модуля 2026
    rateValue: 20,
    appliesFrom: format(new Date(), 'dd.MM.yyyy'),
    isDefault: false,
    legalForms: [],
  });
  
  const [regimeFormData, setRegimeFormData] = useState<Partial<TaxRegime>>({
    code: '',
    name: '',
    description: '',
    isActive: true,
    hasVat: false,
    hasProfitTax: false,
    hasUsnTax: false,
    hasInsurance: false,
    hasNdfl: false,
    defaultVatRate: 20,
    defaultProfitTaxRate: 20,
    defaultUsnRate: 6,
    defaultInsuranceRate: 30,
    defaultNdflRate: 13,
    // Новые поля для налогового модуля 2026
    appliesToLegalForms: [],
    validFrom: '2024-01-01',
    validTo: '2099-12-31',
    requiresNds: false,
    maxIncomeLimit: undefined,
    maxEmployeesLimit: undefined,
    requiresOnlineCashier: false,
  });

  const fetchSettings = useCallback(async () => {
    try {
      const regimesRes = await api.get('/finance/settings/tax-regimes');
      const ratesRes = await api.get('/finance/settings/tax-rates');
      
      setTaxRegimes(Array.isArray(regimesRes) ? regimesRes : []);
      setTaxRates(Array.isArray(ratesRes) ? ratesRes : []);
    } catch (error) {
      console.error('Error loading tax settings:', error);
      toast.error(t('settings.tax.error.load'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await fetchSettings();
  }, [fetchSettings]);

  useEffect(() => { 
    const timer = setTimeout(() => {
      void fetchSettings();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchSettings]);

  // --- REGIME ACTIONS ---

  const handleSaveRegime = async () => {
    if (!regimeFormData.code || !regimeFormData.name) {
      toast.error(t('settings.tax.error.required_fields'));
      return;
    }

    try {
      if (editingRegime) {
        await api.put(`/finance/settings/tax-regimes/${editingRegime.id}`, regimeFormData);
        toast.success(t('settings.tax.toast.regime_updated'));
      } else {
        await api.post('/finance/settings/tax-regimes', regimeFormData);
        toast.success(t('settings.tax.toast.regime_created'));
      }
      setIsRegimeDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error(t('settings.tax.error.save_regime'));
    }
  };

  const handleEditRegime = (regime: TaxRegime) => {
    setEditingRegime(regime);
    setRegimeFormData({ ...regime });
    setIsRegimeDialogOpen(true);
  };

  const handleDeleteRegime = async (regime: TaxRegime) => {
    if (!await confirm({
      title: t('common.confirm_deletion'),
      description: t('settings.tax.confirm_delete_regime', { name: regime.name }),
      variant: 'destructive'
    })) return;

    try {
      await api.delete(`/finance/settings/tax-regimes/${regime.id}`);
      toast.success(t('settings.tax.toast.regime_deleted'));
      loadData();
    } catch (error) {
      toast.error(t('settings.tax.error.delete_regime'));
    }
  };

  // --- RATE ACTIONS ---

  const handleSaveRate = async () => {
    if (!rateFormData.name || !rateFormData.taxRegimeId) {
      toast.error(t('settings.tax.error.required_fields'));
      return;
    }

    try {
      if (editingRate) {
        await api.put(`/finance/settings/tax-rates/${editingRate.id}`, rateFormData);
        toast.success(t('settings.tax.toast.rate_updated'));
      } else {
        await api.post('/finance/settings/tax-rates', rateFormData);
        toast.success(t('settings.tax.toast.rate_created'));
      }
      setIsRateDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error(t('settings.tax.error.save_rate'));
    }
  };

  const handleEditRate = (rate: TaxRate) => {
    setEditingRate(rate);
    setRateFormData({ ...rate });
    setIsRateDialogOpen(true);
  };

  const handleDeleteRate = async (rate: TaxRate) => {
    if (!await confirm({
      title: t('common.confirm_deletion'),
      description: t('settings.tax.confirm_delete_rate', { name: rate.name }),
      variant: 'destructive'
    })) return;

    try {
      await api.delete(`/finance/settings/tax-rates/${rate.id}`);
      toast.success(t('settings.tax.toast.rate_deleted'));
      loadData();
    } catch (error) {
      toast.error(t('settings.tax.error.delete_rate'));
    }
  };

  const getTaxTypes = (regime: TaxRegime) => {
    const types = [];
    if (regime.hasVat) types.push(`${t('settings.tax.types.vat')} (${regime.defaultVatRate}%)`);
    if (regime.hasProfitTax) types.push(`${t('settings.tax.types.profit')} (${regime.defaultProfitTaxRate}%)`);
    if (regime.hasUsnTax) types.push(`${t('settings.tax.types.usn')} (${regime.defaultUsnRate}%)`);
    if (regime.hasInsurance) types.push(`${t('settings.tax.types.insurance')} (${regime.defaultInsuranceRate}%)`);
    if (regime.hasNdfl) types.push(`${t('settings.tax.types.ndfl')} (${regime.defaultNdflRate}%)`);
    return types;
  };

  return (
    <div className="space-y-6">
      {/* Tax Regimes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('settings.tax.regimes.title')}</CardTitle>
              <CardDescription>{t('settings.tax.regimes.description')}</CardDescription>
            </div>
            <Button size="sm" onClick={() => {
              setEditingRegime(null);
              setRegimeFormData({
                code: '', name: '', description: '', isActive: true,
                hasVat: true, hasProfitTax: false, hasUsnTax: false, hasInsurance: false, hasNdfl: false,
                defaultVatRate: 20, defaultProfitTaxRate: 20, defaultUsnRate: 6, defaultInsuranceRate: 30, defaultNdflRate: 13,
              });
              setIsRegimeDialogOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              {t('settings.tax.regimes.add')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('settings.tax.regimes.table.code')}</TableHead>
                <TableHead>{t('settings.tax.regimes.table.name')}</TableHead>
                <TableHead>{t('settings.tax.regimes.table.taxes')}</TableHead>
                <TableHead>{t('settings.tax.regimes.table.active')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxRegimes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    {isLoading ? t('common.loading') : t('settings.tax.regimes.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                taxRegimes.map((regime) => (
                  <TableRow key={regime.id}>
                    <TableCell className="font-bold">{regime.code}</TableCell>
                    <TableCell>{regime.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getTaxTypes(regime).map((type, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">{type}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={regime.isActive ? 'default' : 'secondary'}>
                        {regime.isActive ? t('common.yes') : t('common.no')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditRegime(regime)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteRegime(regime)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tax Rates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('settings.tax.rates.title')}</CardTitle>
              <CardDescription>{t('settings.tax.rates.description')}</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={() => {
              setEditingRate(null);
              setRateFormData({
                taxRegimeId: taxRegimes[0]?.id || 0,
                taxType: 'vat', name: '', rate: 20, isFixed: false, isActive: true,
                effectiveFrom: format(new Date(), 'dd.MM.yyyy'), effectiveTo: '',
              });
              setIsRateDialogOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              {t('settings.tax.table.add_rate')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('settings.tax.rates.table.regime')}</TableHead>
                <TableHead>{t('settings.tax.rates.table.type')}</TableHead>
                <TableHead>{t('settings.tax.rates.table.name')}</TableHead>
                <TableHead>{t('settings.tax.rates.table.rate')}</TableHead>
                <TableHead>{t('settings.tax.table.effective_from')}</TableHead>
                <TableHead>{t('settings.tax.rates.table.active')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxRates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    {t('settings.tax.rates.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                taxRates.map((rate) => {
                  const regime = taxRegimes.find(r => r.id === rate.taxRegimeId);
                  return (
                    <TableRow key={rate.id}>
                      <TableCell className="font-medium text-xs">{regime?.code || t('common.no_data')}</TableCell>
                      <TableCell className="text-xs">{t(`settings.tax.types.${rate.taxType}`)}</TableCell>
                      <TableCell className="font-medium">{rate.name}</TableCell>
                      <TableCell className="font-bold">{rate.isFixed ? `${rate.fixedAmount} ₽` : `${rate.rate}%`}</TableCell>
                      <TableCell className="text-xs">{rate.effectiveFrom || t('common.no_data')}</TableCell>
                      <TableCell>
                        <Badge variant={rate.isActive ? 'default' : 'secondary'}>
                          {rate.isActive ? t('common.yes') : t('common.no')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditRate(rate)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteRate(rate)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Regime Dialog */}
      <Dialog open={isRegimeDialogOpen} onOpenChange={setIsRegimeDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRegime ? t('settings.tax.regimes.edit_title', { name: editingRegime.name }) : t('settings.tax.regimes.create_title')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('settings.tax.regimes.field.code')} *</Label>
                <Input value={regimeFormData.code} onChange={(e) => setRegimeFormData({ ...regimeFormData, code: e.target.value.toUpperCase() })} />
              </div>
              <div className="space-y-2">
                <Label>{t('settings.tax.regimes.field.name')} *</Label>
                <Input value={regimeFormData.name} onChange={(e) => setRegimeFormData({ ...regimeFormData, name: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
               <Switch checked={regimeFormData.isActive} onCheckedChange={(v) => setRegimeFormData({ ...regimeFormData, isActive: v })} />
               <Label>{t('settings.tax.regimes.field.active')}</Label>
            </div>
            {/* Новые поля для налогового модуля 2026 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('settings.tax.applies_to_legal_forms')}</Label>
                <Input
                  value={Array.isArray(regimeFormData.appliesToLegalForms) ? regimeFormData.appliesToLegalForms.join(', ') : regimeFormData.appliesToLegalForms || ''}
                  onChange={(e) => setRegimeFormData({ ...regimeFormData, appliesToLegalForms: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder={t('settings.tax.legal_forms_placeholder_regime')}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('settings.tax.requires_nds')}</Label>
                <div className="flex items-center gap-2">
                  <Switch checked={regimeFormData.requiresNds} onCheckedChange={(v) => setRegimeFormData({ ...regimeFormData, requiresNds: v })} />
                  <Label>{regimeFormData.requiresNds ? t('common.yes') : t('common.no')}</Label>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('settings.tax.valid_from')}</Label>
                <DatePicker value={regimeFormData.validFrom} onChange={(v) => setRegimeFormData({ ...regimeFormData, validFrom: v })} />
              </div>
              <div className="space-y-2">
                <Label>{t('settings.tax.valid_to')}</Label>
                <DatePicker value={regimeFormData.validTo} onChange={(v) => setRegimeFormData({ ...regimeFormData, validTo: v })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('settings.tax.max_income_limit')}</Label>
                <Input
                  type="number"
                  value={regimeFormData.maxIncomeLimit || ''}
                  onChange={(e) => setRegimeFormData({ ...regimeFormData, maxIncomeLimit: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder={t('settings.tax.not_limited')}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('settings.tax.max_employees_limit')}</Label>
                <Input
                  type="number"
                  value={regimeFormData.maxEmployeesLimit || ''}
                  onChange={(e) => setRegimeFormData({ ...regimeFormData, maxEmployeesLimit: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                  placeholder={t('settings.tax.not_limited')}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={regimeFormData.requiresOnlineCashier} onCheckedChange={(v) => setRegimeFormData({ ...regimeFormData, requiresOnlineCashier: v })} />
              <Label>{t('settings.tax.requires_online_cashier')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveRegime}><Save className="w-4 h-4 mr-2" />{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rate Dialog */}
      <Dialog open={isRateDialogOpen} onOpenChange={setIsRateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRate ? t('settings.tax.rates.edit_title', { name: editingRate.name }) : t('settings.tax.rates.create_title')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>{t('settings.tax.rates.table.regime')} *</Label>
              <Select value={String(rateFormData.taxRegimeId)} onValueChange={(v) => setRateFormData({ ...rateFormData, taxRegimeId: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {taxRegimes.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('settings.tax.rates.table.type')} *</Label>
              <Select value={rateFormData.taxType} onValueChange={(v) => setRateFormData({ ...rateFormData, taxType: v as TaxRate['taxType'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vat">{t('settings.tax.types.vat')}</SelectItem>
                  <SelectItem value="profit_tax">{t('settings.tax.types.profit')}</SelectItem>
                  <SelectItem value="usn">{t('settings.tax.types.usn')}</SelectItem>
                  <SelectItem value="insurance">{t('settings.tax.types.insurance')}</SelectItem>
                  <SelectItem value="ndfl">{t('settings.tax.types.ndfl')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('settings.tax.rates.table.name')} *</Label>
              <Input value={rateFormData.name} onChange={(e) => setRateFormData({ ...rateFormData, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('settings.tax.rates.table.rate')} (%)</Label>
                <Input type="number" value={rateFormData.rate} onChange={(e) => setRateFormData({ ...rateFormData, rate: parseFloat(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>{t('settings.tax.table.effective_from')}</Label>
                <DatePicker value={rateFormData.effectiveFrom} onChange={(v) => setRateFormData({ ...rateFormData, effectiveFrom: v })} />
              </div>
            </div>
            {/* Новые поля для налогового модуля 2026 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('settings.tax.rate_value')}</Label>
                <Input
                  type="number"
                  value={rateFormData.rateValue || rateFormData.rate || ''}
                  onChange={(e) => setRateFormData({ ...rateFormData, rateValue: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('settings.tax.applies_from')}</Label>
                <DatePicker value={rateFormData.appliesFrom || rateFormData.effectiveFrom} onChange={(v) => setRateFormData({ ...rateFormData, appliesFrom: v })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('settings.tax.applies_to_legal_forms')}</Label>
                <Input
                  value={Array.isArray(rateFormData.legalForms) ? rateFormData.legalForms.join(', ') : rateFormData.legalForms || ''}
                  onChange={(e) => setRateFormData({ ...rateFormData, legalForms: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder={t('settings.tax.legal_forms_placeholder_rate')}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('settings.tax.is_default')}</Label>
                <div className="flex items-center gap-2">
                  <Switch checked={rateFormData.isDefault} onCheckedChange={(v) => setRateFormData({ ...rateFormData, isDefault: v })} />
                  <Label>{rateFormData.isDefault ? t('common.yes') : t('common.no')}</Label>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <Switch checked={rateFormData.isActive} onCheckedChange={(v) => setRateFormData({ ...rateFormData, isActive: v })} />
               <Label>{t('settings.tax.regimes.field.active')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveRate}><Save className="w-4 h-4 mr-2" />{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
