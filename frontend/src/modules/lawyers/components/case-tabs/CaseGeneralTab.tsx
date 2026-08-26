
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OutcomeSelect, useOutcomes } from "@/components/ui/status-system";
import { UserSelect } from "@/components/shared";
import { EntityCombobox } from "@/components/shared/EntityCombobox";
import type { ComboboxOption } from "@/components/shared/EntityCombobox";
import { User, Plus, X, Trophy } from "lucide-react";
import { CourtSearchInput } from "../CourtSearchInput";
import { useTranslation } from "@/lib/i18n";
import { LegalCase, ThirdParty, Court, Judge } from "../../types";
import { Button } from "@/components/ui/button";
import { Contractor } from "@/modules/contractors";
import { DatePicker } from "@/components/ui/date-picker";
import { useSettings } from "@/hooks/use-settings";
import { api } from "@/lib/api";
import { SmartMetadataGrid } from "@/components/shared";
import { Calendar } from "lucide-react";

interface User {
  id: string;
  name: string;
}

interface CaseGeneralTabProps {
  formData: Partial<LegalCase>;
  handleChange: (field: keyof LegalCase, value: unknown) => void;
  contractors: Contractor[];
  onCreateContractor: (name: string) => Promise<string>;
  selectedInstanceId?: string;
  handleInstanceChange?: (instanceId: string, field: string, value: unknown) => void;
}

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-destructive font-bold">*</span>
      <span>{children}</span>
    </div>
  );
}

export function CaseGeneralTab({ formData, handleChange, contractors, onCreateContractor, selectedInstanceId, handleInstanceChange }: CaseGeneralTabProps) {
  const { outcomes } = useOutcomes();
  const { t } = useTranslation();
  const { getStatusesByModule } = useSettings();

  const caseStatuses = getStatusesByModule('cases');
  
  // Find current instance if selected
  const selectedInstance = formData.instances?.find(i => i.id === selectedInstanceId);
  
  // Helper to handle change for either root case or specific instance
  const handleValueChange = (field: string, value: unknown) => {
    if (selectedInstanceId && handleInstanceChange) {
      handleInstanceChange(selectedInstanceId, field, value);
    } else {
      handleChange(field as keyof LegalCase, value);
    }
  };

  // Local state for dictionaries (loaded from API)
  const [courtsList, setCourtsList] = useState<Court[]>([]);
  const [judgesList, setJudgesList] = useState<Judge[]>([]);
  const [lawyersList, setLawyersList] = useState<User[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);

  // Load courts, judges and lawyers from API
  useEffect(() => {
    api.get('/courts').then(setCourtsList).catch(console.error);
    api.get('/courts/judges').then(setJudgesList).catch(console.error);
    api.get('/lawyers').then(setLawyersList).catch(console.error);
  }, []);

  // Handle lawyer selection - update both name and id
  const handleLawyerChange = (lawyerName: string) => {
    console.log('[CaseGeneralTab] handleLawyerChange called with Name:', lawyerName);
    const selectedLawyer = lawyersList.find(l => l.name === lawyerName);
    console.log('[CaseGeneralTab] selectedLawyer found:', selectedLawyer);
    if (selectedLawyer) {
      handleChange("lawyerId", selectedLawyer.id);
      handleChange("lawyerName", selectedLawyer.name);
    }
  };

  // Sheet states

  // Form states for new entities

  const handleAddThirdParty = () => {
    const newParty: ThirdParty = { name: "", role: "" };
    handleChange("thirdParties", [...(formData.thirdParties || []), newParty]);
  };

  const handleThirdPartyChange = (index: number, field: keyof ThirdParty, value: string) => {
    const newParties = [...(formData.thirdParties || [])];
    newParties[index] = { ...newParties[index], [field]: value };
    handleChange("thirdParties", newParties);
  };

  const handleRemoveThirdParty = (index: number) => {
    const newParties = [...(formData.thirdParties || [])];
    newParties.splice(index, 1);
    handleChange("thirdParties", newParties);
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-2">
        <Label>
          <RequiredLabel>{t('common.name')}</RequiredLabel>
        </Label>
        <Input 
          value={formData.title || ""} 
          onChange={(e) => handleChange("title", e.target.value)} 
          placeholder={t('lawyers.case_sheet.placeholder.summary')}
        />
      </div>

      {/* Номер дела — для суд. дел: номер 1й инстанции; для претензий: исходящий номер */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          {formData.type === 'court' ? (
            <>
              <Label>{t('lawyers.case_sheet.field.first_instance_number')}</Label>
              <Input
                value={formData.firstInstanceNumber || ""}
                onChange={(e) => handleChange("firstInstanceNumber", e.target.value)}
                placeholder={t('lawyers.case_sheet.placeholder.case_num_format')}
              />
            </>
          ) : (
            <>
              <Label>{t('lawyers.case_sheet.field.case_number')}</Label>
              <Input
                value={formData.caseNumber || ""}
                onChange={(e) => handleChange("caseNumber", e.target.value)}
                placeholder={t('lawyers.case_sheet.placeholder.outgoing')}
              />
            </>
          )}
        </div>
        <div className="space-y-2">
          <Label>
            <RequiredLabel>{t('common.status')}</RequiredLabel>
          </Label>
          <Select
            value={(selectedInstance ? selectedInstance.status : formData.status) || ""}
            onValueChange={(v) => handleValueChange("status", v)}
          >
            <SelectTrigger className={!formData.status ? 'text-muted-foreground' : ''}>
              <SelectValue placeholder={t('common.select')} />
            </SelectTrigger>
            <SelectContent>
              {caseStatuses.length > 0 ? (
                caseStatuses.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))
              ) : formData.type === 'claim' ? (
                <>
                  <SelectItem value="draft">{t('lawyers.case_status.draft')}</SelectItem>
                  <SelectItem value="sent">{t('lawyers.case_status.sent')}</SelectItem>
                  <SelectItem value="rejected">{t('lawyers.case_status.rejected')}</SelectItem>
                  <SelectItem value="satisfied">{t('lawyers.case_status.satisfied')}</SelectItem>
                  <SelectItem value="transferred_to_court">{t('lawyers.case_status.transferred_to_court')}</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="new">{t('lawyers.case_status.new')}</SelectItem>
                  <SelectItem value="preparation">{t('lawyers.case_status.preparation')}</SelectItem>
                  <SelectItem value="filing">{t('lawyers.case_status.filing')}</SelectItem>
                  <SelectItem value="hearing">{t('lawyers.case_status.hearing')}</SelectItem>
                  <SelectItem value="decision">{t('lawyers.case_status.decision')}</SelectItem>
                  <SelectItem value="enforcement">{t('lawyers.case_status.enforcement')}</SelectItem>
                  <SelectItem value="done">{t('lawyers.case_status.done')}</SelectItem>
                  <SelectItem value="paused">{t('lawyers.case_status.paused')}</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>
            <RequiredLabel>{t('lawyers.table.lawyer')}</RequiredLabel>
          </Label>
          <UserSelect
            value={formData.lawyerName || ""}
            onValueChange={handleLawyerChange}
            endpoint="/lawyers"
          />
        </div>

        <div className="space-y-2">
          <Label>
            <RequiredLabel>{t('lawyers.case_sheet.field.creation_date')}</RequiredLabel>
          </Label>
          <DatePicker
            value={formData.creationDate || ""}
            onChange={(date) => handleChange("creationDate", date)}
            placeholder={t('lost.dd_mm_gggg')}
          />
        </div>
      </div>

      {/* Dates and Outcome via SmartMetadataGrid */}
      <SmartMetadataGrid items={[
        ...(formData.type === 'claim' ? [
          {
            id: 'sentDate',
            label: t('lawyers.case_sheet.field.sent_date_field'),
            value: editingField === 'sentDate' ? '__editing__' : (formData.sentDate ? new Date(formData.sentDate).toLocaleDateString() : null),
            icon: <Calendar className="w-4 h-4 text-blue-500" />,
            onClick: () => setEditingField('sentDate'),
            onClickPlaceholder: () => setEditingField('sentDate'),
            renderCustomBadge: editingField === 'sentDate' ? () => (
              <div className="min-w-[200px]">
                <DatePicker
                  value={formData.sentDate || ""}
                  onChange={(date) => { handleChange("sentDate", date); setEditingField(null); }}
                  placeholder={t('lost.dd_mm_gggg')}
                />
              </div>
            ) : undefined
          },
          {
            id: 'responseDueDate',
            label: t('lawyers.case_sheet.field.response_due_date_field'),
            value: editingField === 'responseDueDate' ? '__editing__' : (formData.responseDueDate ? new Date(formData.responseDueDate).toLocaleDateString() : null),
            icon: <Calendar className="w-4 h-4 text-orange-500" />,
            isCritical: true,
            onClick: () => setEditingField('responseDueDate'),
            onClickPlaceholder: () => setEditingField('responseDueDate'),
            renderCustomBadge: editingField === 'responseDueDate' ? () => (
              <div className="min-w-[200px]">
                <DatePicker
                  value={formData.responseDueDate || ""}
                  onChange={(date) => { handleChange("responseDueDate", date); setEditingField(null); }}
                  placeholder={t('lost.dd_mm_gggg')}
                />
              </div>
            ) : undefined
          }
        ] : []),
        ...(formData.type === 'court' ? [
          {
            id: 'deadline',
            label: t('lawyers.table.deadline'),
            value: editingField === 'deadline' ? '__editing__' : (formData.deadline ? new Date(formData.deadline).toLocaleDateString() : null),
            icon: <Calendar className="w-4 h-4 text-red-500" />,
            isCritical: true,
            onClick: () => setEditingField('deadline'),
            onClickPlaceholder: () => setEditingField('deadline'),
            renderCustomBadge: editingField === 'deadline' ? () => (
              <div className="min-w-[200px]">
                <DatePicker
                  value={formData.deadline || ""}
                  onChange={(date) => { handleChange("deadline", date); setEditingField(null); }}
                  placeholder={t('lost.dd_mm_gggg')}
                />
              </div>
            ) : undefined
          }
        ] : []),
        {
          id: 'outcome',
          label: t('lawyers.case_sheet.field.outcome'),
          value: editingField === 'outcome' ? '__editing__' : (formData.outcome ? (outcomes.find(o => o.id === formData.outcome)?.name || String(formData.outcome)) : null),
          icon: <Trophy className="w-4 h-4 text-primary" />,
          onClick: () => setEditingField('outcome'),
          onClickPlaceholder: () => setEditingField('outcome'),
          renderCustomBadge: editingField === 'outcome' ? () => (
            <div className="min-w-[250px]">
              <OutcomeSelect
                value={formData.outcome || ""}
                onChange={(v) => { handleChange("outcome", v as import('../../types').CaseOutcome); setEditingField(null); }}
                placeholder={t('lawyers.case_sheet.placeholder.vyberite_iskhod_dela')}
              />
            </div>
          ) : undefined
        }
      ]} />

      {/* Participants */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <User className="w-4 h-4 text-primary" />
          {t('lawyers.case_sheet.participants')}
        </div>

        {/* Клиент */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">{t('lawyers.case_sheet.field.client')}</Label>
          <EntityCombobox
            value={formData.client || 'ТИТАН'}
            onChange={(v) => handleChange('client', v ?? 'ТИТАН')}
            options={contractors.map(c => ({ id: c.name, label: c.name } as ComboboxOption))}
            placeholder="ТИТАН"
            onCreate={onCreateContractor}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">{t('lawyers.case_sheet.field.plaintiff')}</Label>
            <EntityCombobox
              value={formData.plaintiff || ''}
              onChange={(v) => handleChange('plaintiff', v ?? '')}
              options={contractors.map(c => ({ id: c.name, label: c.name } as ComboboxOption))}
              placeholder={t('generated.vyberite_isttsa')}
              onCreate={onCreateContractor}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">{t('lawyers.case_sheet.field.defendant')}</Label>
            <EntityCombobox
              value={formData.defendant || ''}
              onChange={(v) => handleChange('defendant', v ?? '')}
              options={contractors.map(c => ({ id: c.name, label: c.name } as ComboboxOption))}
              placeholder={t('generated.vyberite_otvetchika')}
              onCreate={onCreateContractor}
            />
          </div>
        </div>

        {/* Third Parties List */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
             <Label className="text-xs text-muted-foreground uppercase tracking-wide">{t('lawyers.case_sheet.field.third_parties')}</Label>
             <Button type="button" variant="ghost" size="sm" className="h-6 gap-1" onClick={handleAddThirdParty}>
                <Plus className="w-3 h-3" /> {t('common.add')}
             </Button>
          </div>
          {formData.thirdParties?.map((party, index) => (
            <div key={index} className="flex gap-2 items-center">
                {/* Third Party as Contractor Combobox */}
                <div className="flex-1">
                    <EntityCombobox
                        value={party.name || ''}
                        onChange={(v) => handleThirdPartyChange(index, "name", String(v ?? ''))}
                        options={contractors.map(c => ({ id: c.name, label: c.name } as ComboboxOption))}
                        placeholder={t('generated.vyberite_kontragenta')}
                        onCreate={onCreateContractor}
                    />
                </div>
                
                <Input 
                    value={party.role} 
                    onChange={(e) => handleThirdPartyChange(index, "role", e.target.value)}
                    placeholder={t('generated.rol_ekspert_svidetel')}
                    className="w-1/3 h-8 text-sm"
                />
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveThirdParty(index)}>
                    <X className="w-4 h-4" />
                </Button>
            </div>
          ))}
          {(!formData.thirdParties || formData.thirdParties.length === 0) && (
              <p className="text-xs text-muted-foreground italic">{t('lost.net_tret_ih_lits')}</p>
          )}
        </div>
      </div>

      {/* Court Info - Only for Court Cases */}
      {formData.type === 'court' && (
        <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span className="text-primary">⚖️</span>
              {t('lawyers.case_sheet.court_info')}
            </div>

            <div className="space-y-2">
            <Label>{t('lawyers.case_sheet.field.court_name')}</Label>
            <CourtSearchInput
                value={(selectedInstance ? selectedInstance.courtName : formData.courtName) || ''}
                onChange={(court) => {
                  handleValueChange('courtName', court?.name ?? '');
                }}
                placeholder={t('generated.vyberite_sud')}
            />
            </div>

            <div className="space-y-2">
            <Label>{t('lawyers.case_sheet.field.judge')}</Label>
            <EntityCombobox
                value={(selectedInstance ? selectedInstance.judge : formData.judge) || ''}
                onChange={(v) => {
                  // EntityCombobox возвращает id, но у нас id = name для судей
                  console.log('Judge selected:', v, 'Type:', typeof v);
                  const judgeName = v ?? '';
                  console.log('Setting judge to:', judgeName);
                  handleValueChange('judge', judgeName);
                }}
                options={
                  // Фильтруем судей по выбранному суду
                  (selectedInstance ? selectedInstance.courtName : formData.courtName)
                    ? judgesList
                        .filter(j => {
                          // Если у судьи есть court_id, проверяем привязку к суду
                          const currentCourtName = selectedInstance ? selectedInstance.courtName : formData.courtName;
                          if (j.courtId) {
                            const court = courtsList.find(c => c.id === j.courtId);
                            return court?.name === currentCourtName;
                          }
                          // Если court_id нет, проверяем court_name
                          return j.courtName === currentCourtName;
                        })
                        .map(j => ({ id: j.name, label: j.name } as ComboboxOption))
                    : judgesList.map(j => ({ id: j.name, label: j.name } as ComboboxOption))
                }
                placeholder={
                  (selectedInstance ? selectedInstance.courtName : formData.courtName)
                    ? t('generated.vyberite_sud_yu')
                    : t('lawyers.case_sheet.courts.placeholder.select_court_first')
                }
                disabled={!(selectedInstance ? selectedInstance.courtName : formData.courtName)}
                onCreate={async (name) => {
                  try {
                    // Сначала находим или создаём суд
                    const currentCourtName = selectedInstance ? selectedInstance.courtName : formData.courtName;
                    let selectedCourt = courtsList.find(c => c.name === currentCourtName);

                    if (!selectedCourt) {
                      // Создаём суд, если не найден
                      const courtResponse = await api.post('/courts', {
                        name: currentCourtName || '',
                        address: ''
                      });
                      selectedCourt = courtResponse;
                      setCourtsList(prev => [...prev, selectedCourt!]);
                    }

                    // Теперь создаём судью с court_id
                    const response = await api.post('/courts/judges', {
                      name,
                      court_id: selectedCourt!.id,
                      secretary_phone: '',
                      assistant_phone: '',
                      email: '',
                      office: '',
                      composition: ''
                    });
                    const newJudge = response;
                    setJudgesList(prev => [...prev, newJudge]);
                    handleValueChange('judge', name);
                    return name; // Возвращаем имя как id
                  } catch (error) {
                    console.error('Error creating judge:', error);
                    // Fallback to local state if API fails
                    const currentCourtName = selectedInstance ? selectedInstance.courtName : formData.courtName;
                    const selectedCourt = courtsList.find(c => c.name === currentCourtName);
                    const newJudge: Judge = {
                      id: Math.random().toString(),
                      name,
                      courtId: selectedCourt?.id || '',
                      courtName: selectedCourt?.name
                    };
                    setJudgesList(prev => [...prev, newJudge]);
                    handleValueChange('judge', name);
                    return name;
                  }
                }}
            />
            {(selectedInstance ? selectedInstance.courtName : formData.courtName) && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {t('lawyers.case_sheet.courts.label.judges_of_court')} <span className="font-medium text-foreground">{(selectedInstance ? selectedInstance.courtName : formData.courtName)}</span>
              </p>
            )}
            {!(selectedInstance ? selectedInstance.courtName : formData.courtName) && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {t('lawyers.case_sheet.courts.label.select_court_to_see_judges')}
              </p>
            )}
            </div>
        </div>
      )}



      <div className="space-y-2">
        <Label>{t('common.description')}</Label>
        <Textarea
          value={formData.description || ""}
          onChange={(e) => handleChange("description", e.target.value)}
          rows={3}
        />
      </div>

    </div>
  );
}
