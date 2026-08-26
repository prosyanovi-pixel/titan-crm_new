import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useContractorTaxes, useLegalForms } from '../../hooks';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  History, 
  Calculator,
  ShieldCheck,
  Building2,
  User as UserIcon
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/formatters';

interface ContractorTaxTabProps {
  contractorId: number;
}

interface TaxRegime {
  id: number;
  name: string;
  maxIncomeLimit?: number;
}

export function ContractorTaxTab({ contractorId }: ContractorTaxTabProps) {
  const { t } = useTranslation();
  const { data: taxInfo, isLoading, updateTaxSystem } = useContractorTaxes(contractorId);
  const { data: legalForms } = useLegalForms();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRegime, setSelectedRegime] = useState<string>('');
  const [changeReason, setChangeReason] = useState('');
  const [availableRegimes, setAvailableRegimes] = useState<TaxRegime[]>([]);
  const [loadingRegimes, setLoadingRegimes] = useState(false);

  const handleOpenChangeDialog = async () => {
    if (!taxInfo?.legalForm) return;
    
    setLoadingRegimes(true);
    try {
      const response = await api.get(`/contractors/legal-forms/${taxInfo.legalForm}/tax-regimes`);
      setAvailableRegimes(Array.isArray(response) ? response : []);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Failed to load available regimes', error);
    } finally {
      setLoadingRegimes(false);
    }
  };

  const handleConfirmChange = async () => {
    if (!selectedRegime) return;
    
    await updateTaxSystem.mutateAsync({
      regimeId: parseInt(selectedRegime),
      reason: changeReason
    });
    
    setIsDialogOpen(false);
    setChangeReason('');
    setSelectedRegime('');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!taxInfo) return null;

  const currentLegalForm = legalForms?.find(f => f.code === taxInfo.legalForm);

  return (
    <div className="space-y-6">
      {/* Основная информация */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              {t('projects.sheet.contractor_label')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold">{currentLegalForm?.name || taxInfo.legalForm}</p>
                <p className="text-xs text-muted-foreground">{t('contractor.legal_form_description')}</p>
              </div>
              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                {taxInfo.legalForm === 'IP' ? <UserIcon className="text-primary" /> : <Building2 className="text-primary" />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              {t('contractor.tax_regimes_title')}
            </CardTitle>
          </CardHeader>
          {taxInfo.taxRegime ? (
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold">{taxInfo.taxRegime.name}</p>
                  <Badge variant={taxInfo.taxRegime.requiresNds ? "default" : "secondary"}>
                    {taxInfo.taxRegime.requiresNds ? t('settings.tax.types.vat') : t('contractor.no_vat')}
                  </Badge>
                </div>
                <Button variant="outline" size="sm" onClick={handleOpenChangeDialog}>
                  {t('common.change')}
                </Button>
              </div>
            </CardContent>
          ) : (
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {t('common.not_specified')}
                <Button variant="outline" size="sm" onClick={handleOpenChangeDialog} className="ml-4">
                  {t('common.set')}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Активные налоги */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            {t('contractor.active_taxes_2026')}
          </CardTitle>
          <CardDescription>{t('contractor.tax_burden_estimate')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {taxInfo.activeTaxes?.length > 0 ? (
              <div className="grid gap-2">
                {taxInfo.activeTaxes.map((tax, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-background rounded-md border shadow-sm">
                        <span className="text-xs font-bold text-primary">{tax.type}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{tax.name}</p>
                        <p className="text-[10px] text-muted-foreground">{t('contractor.valid_from')} {tax.validFrom}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{tax.rate}%</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Info className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>{t('contractor.no_active_taxes')}</p>
              </div>
            )}

            {taxInfo.limitsCheck && (
              <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-200 dark:border-orange-900/50">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <p className="text-sm font-bold text-orange-800 dark:text-orange-400">{t('contractor.limits_verification')}</p>
                </div>
                <div className="space-y-2">
                  {taxInfo.limitsCheck.passed ? (
                    <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400">
                      <CheckCircle2 className="w-3 h-3" />
                      {t('contractor.all_limits_passed')}
                    </div>
                  ) : (
                    <ul className="text-xs text-orange-700 dark:text-orange-400 space-y-1 list-disc list-inside">
                      {taxInfo.limitsCheck.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* История */}
      {taxInfo.history && taxInfo.history.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <History className="w-4 h-4" />
              {t('common.history')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {taxInfo.history.map((entry, i) => (
                <div key={i} className="flex gap-4 items-start relative pb-4 last:pb-0">
                  {i < taxInfo.history!.length - 1 && (
                    <div className="absolute left-[7px] top-4 bottom-0 w-[2px] bg-muted" />
                  )}
                  <div className="h-4 w-4 rounded-full border-2 border-primary bg-background z-10 mt-1 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between">
                      <p className="text-sm font-bold">{entry.newRegime?.name || t('common.change')}</p>
                      <span className="text-[10px] text-muted-foreground">{entry.date}</span>
                    </div>
                    {entry.oldRegime && (
                      <p className="text-xs text-muted-foreground">
                        {t('contractor.from')} <span className="line-through">{entry.oldRegime.name}</span>
                      </p>
                    )}
                    {entry.reason && (
                      <p className="text-xs italic bg-muted/30 p-2 rounded-md border border-border/50">
                        "{entry.reason}"
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground">{t('common.changed_by')}: {entry.changedBy}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Диалог смены СНО */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('contractor.change_tax_system_title')}</DialogTitle>
            <DialogDescription>
              {t('contractor.change_tax_system_description')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>{t('contractor.select_new_regime')}</Label>
              <Select value={selectedRegime} onValueChange={setSelectedRegime}>
                <SelectTrigger>
                  <SelectValue placeholder={t('common.select')} />
                </SelectTrigger>
                <SelectContent>
                  {availableRegimes.map(r => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name} {r.maxIncomeLimit && t('contractor.tax_regime_limit', { limit: formatMoney(r.maxIncomeLimit) })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>{t('common.reason')}</Label>
              <Textarea 
                value={changeReason} 
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder={t('contractor.reason_placeholder')}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="button" onClick={handleConfirmChange} disabled={!selectedRegime || updateTaxSystem.isPending}>
              {updateTaxSystem.isPending ? t('common.loading') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
