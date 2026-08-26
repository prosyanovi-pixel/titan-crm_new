import { useState, useMemo } from 'react';
import { useTranslation } from '@/lib/i18n';
import { ResizableSheet } from '@/components/shared/ResizableSheet';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSettings } from '@/hooks/use-settings';
import { Contractor } from '../types/contractor.types';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ContractorConversionWizardProps {
  contractor: Contractor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newContractor: Contractor) => void;
}

export function ContractorConversionWizard({
  contractor,
  open,
  onOpenChange,
  onSuccess,
}: ContractorConversionWizardProps) {
  const { t } = useTranslation();
  const { legalForms } = useSettings();
  
  const [step, setStep] = useState<'select' | 'mapping' | 'submitting'>('select');
  const [targetFormCode, setTargetFormCode] = useState<string>('');
  
  // Mapping state
  const [mappedData, setMappedData] = useState<Partial<Contractor>>({});

  const sourceGroup = useMemo(() => {
    return legalForms.find(f => f.id === contractor.legalForm)?.groupId || 'unknown';
  }, [contractor.legalForm, legalForms]);

  const targetForm = useMemo(() => {
    return legalForms.find(f => f.id === targetFormCode);
  }, [targetFormCode, legalForms]);

  const handleNextToMapping = () => {
    if (!targetForm) return;
    
    // Auto-fill logic based on source -> target mapping
    const newData: Partial<Contractor> = {
      legalForm: targetForm.id as any,
      type: contractor.type, // Copy type
    };

    const isSourceIndividual = ['individual', 'private'].includes(sourceGroup);
    const isTargetIndividual = ['individual', 'private'].includes(targetForm.groupId || '');

    if (isSourceIndividual && !isTargetIndividual) {
      // Individual -> Entity (e.g., Физлицо -> ООО)
      // Name becomes the Director
      newData.director = contractor.name || [contractor.lastName, contractor.firstName, contractor.middleName].filter(Boolean).join(' ');
      newData.name = ''; // User must fill the company name
      newData.fullName = '';
    } else if (!isSourceIndividual && isTargetIndividual) {
      // Entity -> Individual (e.g., ООО -> ИП)
      // Director becomes the Name (approximate mapping)
      const dirParts = (contractor.director || '').split(' ');
      newData.lastName = dirParts[0] || '';
      newData.firstName = dirParts[1] || '';
      newData.middleName = dirParts.slice(2).join(' ') || '';
    } else {
      // Entity -> Entity or Individual -> Individual
      newData.name = contractor.name;
      newData.fullName = contractor.fullName;
      newData.lastName = contractor.lastName;
      newData.firstName = contractor.firstName;
      newData.middleName = contractor.middleName;
      newData.director = contractor.director;
    }

    setMappedData(newData);
    setStep('mapping');
  };

  const handleSubmit = async () => {
    setStep('submitting');
    try {
      const payload = {
        ...mappedData,
        legalForm: targetFormCode,
        // Carry over other important IDs
        type: contractor.type,
      };

      const { data } = await api.post(
        `/contractors/${contractor.id}/convert`,
        payload
      );
      
      toast.success('Контрагент успешно сконвертирован');
      onSuccess(data.data);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('common.error'));
      setStep('mapping');
    }
  };

  return (
    <ResizableSheet
      open={open}
      onOpenChange={(v) => { if (step !== 'submitting') onOpenChange(v); }}
      moduleKey="contractor-conversion-wizard"
      defaultWidth="md"
      title={
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-primary" />
          Смена организационно-правовой формы
        </div>
      }
      description="Создание преемника с переносом истории, связей и контактов."
      hideFooter
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto pr-2 pb-6 space-y-6">
          {step === 'select' && (
            <div className="space-y-4">
              <Alert variant="default" className="bg-primary/5 border-primary/20">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <AlertTitle>Как это работает?</AlertTitle>
                <AlertDescription className="text-xs text-muted-foreground mt-2 space-y-2">
                  <p>1. Текущая карточка будет переведена в статус "Неактивна".</p>
                  <p>2. Будет создана <b>новая</b> карточка контрагента, связанная с текущей (преемник).</p>
                  <p>3. Контакты, счета, теги и файлы будут автоматически скопированы.</p>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Текущая форма</Label>
                <div className="p-3 bg-muted rounded-md text-sm border font-medium">
                  {legalForms.find(f => f.id === contractor.legalForm)?.name || contractor.legalForm}
                  <span className="text-muted-foreground ml-2">({contractor.name})</span>
                </div>
              </div>

              <div className="flex justify-center text-muted-foreground py-2">
                <ArrowRight className="w-5 h-5" />
              </div>

              <div className="space-y-2">
                <Label>Новая форма</Label>
                <Select value={targetFormCode} onValueChange={setTargetFormCode}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Выберите новую организационно-правовую форму..." />
                  </SelectTrigger>
                  <SelectContent>
                    {legalForms.filter(f => f.id !== contractor.legalForm).map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg border">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">Источник</div>
                  <div className="font-medium truncate">{contractor.name}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0 text-right">
                  <div className="text-xs text-muted-foreground">Целевая форма</div>
                  <div className="font-medium text-primary truncate">{targetForm?.name}</div>
                </div>
              </div>

              {['individual', 'private'].includes(targetForm?.groupId || '') ? (
                // Individual fields
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>{t('contractor.last_name')}</Label>
                    <Input 
                      value={mappedData.lastName || ''} 
                      onChange={e => setMappedData(p => ({ ...p, lastName: e.target.value }))} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('contractor.first_name')}</Label>
                    <Input 
                      value={mappedData.firstName || ''} 
                      onChange={e => setMappedData(p => ({ ...p, firstName: e.target.value }))} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('contractor.middle_name')}</Label>
                    <Input 
                      value={mappedData.middleName || ''} 
                      onChange={e => setMappedData(p => ({ ...p, middleName: e.target.value }))} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('contractor_sheet.field.inn')}</Label>
                    <Input 
                      value={mappedData.inn || ''} 
                      onChange={e => setMappedData(p => ({ ...p, inn: e.target.value }))} 
                      placeholder="12 цифр"
                    />
                  </div>
                </div>
              ) : (
                // Entity fields
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>{t('contractor_sheet.field.name')}</Label>
                    <Input 
                      value={mappedData.name || ''} 
                      onChange={e => setMappedData(p => ({ ...p, name: e.target.value }))} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('contractor_sheet.field.full_name')}</Label>
                    <Input 
                      value={mappedData.fullName || ''} 
                      onChange={e => setMappedData(p => ({ ...p, fullName: e.target.value }))} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('contractor_sheet.field.inn')}</Label>
                    <Input 
                      value={mappedData.inn || ''} 
                      onChange={e => setMappedData(p => ({ ...p, inn: e.target.value }))} 
                      placeholder="10 цифр"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('contractor_sheet.field.kpp')}</Label>
                    <Input 
                      value={mappedData.kpp || ''} 
                      onChange={e => setMappedData(p => ({ ...p, kpp: e.target.value }))} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('contractor_sheet.field.director')}</Label>
                    <Input 
                      value={mappedData.director || ''} 
                      onChange={e => setMappedData(p => ({ ...p, director: e.target.value }))} 
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-auto pt-6 border-t flex justify-end">
          {step === 'select' && (
            <Button 
              className="w-full" 
              disabled={!targetFormCode}
              onClick={handleNextToMapping}
            >
              {t('common.next')}
            </Button>
          )}
          {step === 'mapping' && (
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1" onClick={() => setStep('select')}>
                {t('common.back')}
              </Button>
              <Button className="flex-1" onClick={handleSubmit}>
                Сконвертировать
              </Button>
            </div>
          )}
          {step === 'submitting' && (
            <Button className="w-full" disabled>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              {t('common.loading')}
            </Button>
          )}
        </div>
      </div>
    </ResizableSheet>
  );
}
