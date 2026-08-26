import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Building2, Gavel, Phone, Mail, DoorOpen, Users } from "lucide-react";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { EntityCombobox } from "@/components/shared/EntityCombobox";
import { ResizableSheet } from "@/components/shared";
import type { ComboboxOption } from "@/components/shared/EntityCombobox";

interface Court {
  id: string;
  name: string;
  address: string;
}

interface Judge {
  id: string;
  name: string;
  court_id: string;
  court_name?: string;
  secretary_phone?: string;
  assistant_phone?: string;
  email?: string;
  office?: string;
  composition?: string;
}

interface CourtJudgeSheetProps {
  court: Court | null;
  judge: Judge | null;
  courts: Court[];
  activeTab: 'court' | 'judge';
  onTabChange: (tab: 'court' | 'judge') => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveCourt: (court: Partial<Court>) => void;
  onSaveJudge: (judge: Partial<Judge>) => void;
}

export function CourtJudgeSheet({
  court,
  judge,
  courts,
  activeTab,
  onTabChange,
  open,
  onOpenChange,
  onSaveCourt,
  onSaveJudge
}: CourtJudgeSheetProps) {
  const { t } = useTranslation();

  // Court form state
  const [courtForm, setCourtForm] = useState<Partial<Court>>({ name: '', address: '' });
  
  // Judge form state
  const [judgeForm, setJudgeForm] = useState<Partial<Judge>>({
    name: '',
    court_id: '',
    secretary_phone: '',
    assistant_phone: '',
    email: '',
    office: '',
    composition: ''
  });

  useEffect(() => {
    if (court) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCourtForm(court);
    } else {
      setCourtForm({ name: '', address: '' });
    }
  }, [court, open, activeTab]);

  useEffect(() => {
    if (judge) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setJudgeForm(judge);
    } else {
      setJudgeForm({
        name: '',
        court_id: '',
        secretary_phone: '',
        assistant_phone: '',
        email: '',
        office: '',
        composition: ''
      });
    }
  }, [judge, open, activeTab]);

  const handleCourtChange = (field: keyof Court, value: string) => {
    setCourtForm(prev => ({ ...prev, [field]: value }));
  };

  const handleJudgeChange = (field: keyof Judge, value: string) => {
    setJudgeForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveCourt = () => {
    onSaveCourt(courtForm);
  };

  const handleSaveJudge = () => {
    onSaveJudge(judgeForm);
  };

  return (
    <ResizableSheet
      open={open}
      onOpenChange={onOpenChange}
      onSave={activeTab === 'court' ? handleSaveCourt : handleSaveJudge}
      onDelete={undefined}
      title={activeTab === 'court' 
        ? (court ? t('lawyers.case_sheet.courts.edit_title') : t('lawyers.case_sheet.courts.create_title'))
        : (judge ? t('lawyers.case_sheet.courts.edit_judge_title') : t('lawyers.case_sheet.courts.create_judge_title'))
      }
      description=""
      moduleKey="court-judge-sheet"
      defaultWidth="lg"
      showDeleteButton={false}
      saveButtonLabel="common.save"
      cancelButtonLabel="common.cancel"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="court" className="gap-2">
                <Building2 className="w-4 h-4" />
                {t('lawyers.case_sheet.instances.court')}
              </TabsTrigger>
              <TabsTrigger value="judge" className="gap-2">
                <Gavel className="w-4 h-4" />
                {t('lawyers.case_sheet.instances.judge')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {activeTab === 'court' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('lawyers.case_sheet.dialog.name_label')}</Label>
              <Input
                value={courtForm.name || ''}
                onChange={(e) => handleCourtChange('name', e.target.value)}
                placeholder={t('lawyers.case_sheet.courts.placeholder.court_name')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('lawyers.case_sheet.dialog.address_label')}</Label>
              <Textarea
                value={courtForm.address || ''}
                onChange={(e) => handleCourtChange('address', e.target.value)}
                placeholder={t('lawyers.case_sheet.courts.placeholder.address')}
                rows={3}
              />
            </div>
          </div>
        )}

        {activeTab === 'judge' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('lawyers.case_sheet.courts.judge_name')} *</Label>
              <Input
                value={judgeForm.name || ''}
                onChange={(e) => handleJudgeChange('name', e.target.value)}
                placeholder={t('profile.personal.full_name')}
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t('lawyers.case_sheet.courts.court_field')} *</Label>
              <EntityCombobox
                value={judgeForm.court_id || ''}
                onChange={(v) => handleJudgeChange('court_id', String(v ?? ''))}
                options={courts.map(c => ({ id: c.id, label: c.name } as ComboboxOption))}
                placeholder={t('lawyers.case_sheet.courts.placeholder.select_court')}
                onCreate={async (name) => {
                  try {
                    // Создаём суд
                    const response = await api.post('/courts', { name, address: '' });
                    const newCourt = response;
                    // Возвращаем ID созданного суда
                    return newCourt.id;
                  } catch (error) {
                    console.error('Error creating court:', error);
                    toast.error(t('lawyers.case_sheet.courts.toast.create_court_error'));
                    return '';
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  <Phone className="w-3 h-3 inline mr-1" />
                  {t('lawyers.case_sheet.courts.secretary_phone')}
                </Label>
                <MaskedInput
                  value={judgeForm.secretary_phone || ''}
                  onChange={(e) => handleJudgeChange('secretary_phone', e.target.value)}
                  placeholder="+7 (___) ___-__-__"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  <Phone className="w-3 h-3 inline mr-1" />
                  {t('lawyers.case_sheet.courts.assistant_phone')}
                </Label>
                <MaskedInput
                  value={judgeForm.assistant_phone || ''}
                  onChange={(e) => handleJudgeChange('assistant_phone', e.target.value)}
                  placeholder="+7 (___) ___-__-__"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                <Mail className="w-3 h-3 inline mr-1" />
                {t('lawyers.case_sheet.courts.email')}
              </Label>
              <Input
                type="email"
                value={judgeForm.email || ''}
                onChange={(e) => handleJudgeChange('email', e.target.value)}
                placeholder="judge@court.ru"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  <DoorOpen className="w-3 h-3 inline mr-1" />
                  {t('lawyers.case_sheet.courts.office')}
                </Label>
                <Input
                  value={judgeForm.office || ''}
                  onChange={(e) => handleJudgeChange('office', e.target.value)}
                  placeholder="101"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  <Users className="w-3 h-3 inline mr-1" />
                  {t('lawyers.case_sheet.courts.composition')}
                </Label>
                <Input
                  value={judgeForm.composition || ''}
                  onChange={(e) => handleJudgeChange('composition', e.target.value)}
                  placeholder={t('lawyers.case_sheet.courts.placeholder.composition')}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </ResizableSheet>
  );
}
