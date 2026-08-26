import React from "react";
import { FileText, Percent } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Contractor } from "../../../types/contractor.types";
import { 
  detectLegalFormFromName 
} from "../../../utils/contractor-utils";
import { LegalFormItem } from "@/modules/settings/types/settings.types";
import { TaxRegime } from "../../../hooks/useContractorOverview";
import { SmartMetadataGrid, MetadataItem } from "@/components/shared/SmartMetadataGrid";

interface RequisitesSectionProps {
  formData: Partial<Contractor>;
  handleChange: (field: keyof Contractor, value: unknown) => void;
  isPrivate: boolean;
  isBusiness: boolean;
  isIndividual: boolean;
  isCreating: boolean;
  editingField: string | null;
  toggleEdit: (field: string | null) => void;
  changedFields: Set<string>;
  taxRegimes: TaxRegime[];
  legalFormsList: LegalFormItem[];
}

export const RequisitesSection = ({
  formData,
  handleChange,
  isPrivate,
  isBusiness,
  isIndividual,
  isCreating,
  editingField,
  toggleEdit,
  changedFields,
  taxRegimes,
  legalFormsList,
}: RequisitesSectionProps) => {
  const { t } = useTranslation();

  const metadataItems: MetadataItem[] = [];

  if (!isCreating) {
    metadataItems.push({
      id: 'inn',
      label: t('contractor_sheet.field.inn'),
      value: editingField === 'inn' ? '__editing__' : formData.inn,
      icon: <FileText className="w-3.5 h-3.5" />,
      onClick: () => toggleEdit('inn'),
      onClickPlaceholder: () => toggleEdit('inn'),
      renderCustomBadge: editingField === 'inn' ? () => (
        <div className="min-w-[200px]">
          <Input 
            value={formData.inn || ""} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("inn", e.target.value)} 
            onBlur={() => toggleEdit(null)} 
            autoFocus 
            className="h-8"
          />
        </div>
      ) : undefined
    });

    if (isBusiness && !isPrivate) {
      if (!isIndividual) {
        metadataItems.push({
          id: 'kpp',
          label: t('contractor_sheet.field.kpp'),
          value: editingField === 'kpp' ? '__editing__' : formData.kpp,
          icon: <FileText className="w-3.5 h-3.5" />,
          onClick: () => toggleEdit('kpp'),
          onClickPlaceholder: () => toggleEdit('kpp'),
          renderCustomBadge: editingField === 'kpp' ? () => (
            <div className="min-w-[200px]">
              <Input 
                value={formData.kpp || ""} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("kpp", e.target.value)} 
                onBlur={() => toggleEdit(null)} 
                autoFocus 
                className="h-8"
              />
            </div>
          ) : undefined
        });
      }

      metadataItems.push({
        id: 'ogrn',
        label: isIndividual ? t('contractor_sheet.field.ogrnip') : t('contractor_sheet.field.ogrn'),
        value: editingField === 'ogrn' ? '__editing__' : formData.ogrn,
        icon: <FileText className="w-3.5 h-3.5" />,
        onClick: () => toggleEdit('ogrn'),
        onClickPlaceholder: () => toggleEdit('ogrn'),
        renderCustomBadge: editingField === 'ogrn' ? () => (
          <div className="min-w-[200px]">
            <Input 
              value={formData.ogrn || ""} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("ogrn", e.target.value)} 
              onBlur={() => toggleEdit(null)} 
              autoFocus 
              className="h-8"
            />
          </div>
        ) : undefined
      });
    }

    if (!isPrivate || isIndividual) {
      metadataItems.push({
        id: 'taxRegimeId',
        label: t('finance.invoice.field.tax_regime'),
        value: editingField === 'taxRegimeId' ? '__editing__' : (taxRegimes || []).find(r => r.id === formData.taxRegimeId)?.name,
        icon: <Percent className="w-3.5 h-3.5" />,
        onClick: () => toggleEdit('taxRegimeId'),
        onClickPlaceholder: () => toggleEdit('taxRegimeId'),
        renderCustomBadge: editingField === 'taxRegimeId' ? () => (
          <div className="min-w-[250px]">
            <Select 
              value={formData.taxRegimeId ? String(formData.taxRegimeId) : undefined} 
              onValueChange={(v) => { handleChange('taxRegimeId', parseInt(v)); toggleEdit(null); }}
            >
              <SelectTrigger autoFocus className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent className="z-[110]">
                {(taxRegimes || []).map(tr => <SelectItem key={tr.id} value={String(tr.id)}>{tr.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        ) : undefined
      });
    }
  }

  return (
    <div className="space-y-4 pt-4 border-t border-border/50">
      <div className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 px-2">
        <FileText className="w-3.5 h-3.5" />
        {t('contractor_sheet.section.requisites')}
      </div>

      {metadataItems.length > 0 && (
        <div className="mb-4">
          <SmartMetadataGrid items={metadataItems} />
        </div>
      )}

      {isCreating && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">{t('contractor_sheet.field.inn')}</label>
            <Input value={formData.inn || ""} onChange={(e) => handleChange("inn", e.target.value)} />
          </div>
          {isBusiness && !isPrivate && !isIndividual && (
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">{t('contractor_sheet.field.kpp')}</label>
              <Input value={formData.kpp || ""} onChange={(e) => handleChange("kpp", e.target.value)} />
            </div>
          )}
          {isBusiness && !isPrivate && (
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                {isIndividual ? t('contractor_sheet.field.ogrnip') : t('contractor_sheet.field.ogrn')}
              </label>
              <Input value={formData.ogrn || ""} onChange={(e) => handleChange("ogrn", e.target.value)} />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">{t('finance.invoice.field.tax_regime')}</label>
            <Select 
              value={formData.taxRegimeId ? String(formData.taxRegimeId) : undefined} 
              onValueChange={(v) => handleChange('taxRegimeId', parseInt(v))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {taxRegimes.map(r => (
                  <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {!isPrivate && (
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">{t('contractor_sheet.field.full_name')}</label>
          <Input
            value={formData.fullName || ""}
            onChange={(e) => {
              const value = e.target.value;
              handleChange("fullName", value);
              
              const detected = detectLegalFormFromName(value, legalFormsList);
              if (detected) {
                handleChange('legalForm', detected.id);
                if (detected.groupId) {
                    handleChange('groupId', detected.groupId);
                }
              }
            }}
          />
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">
          {isPrivate ? t('contractor_sheet.field.birthday') : t('contractor_sheet.field.registration_date')}
        </label>
        <DatePicker 
          value={formData.registrationDate || ""} 
          onChange={(v) => handleChange("registrationDate", v)} 
        />
      </div>

      {isBusiness && !isIndividual && !isPrivate && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">{t('contractor_sheet.field.director')}</label>
            <Input
              value={formData.director || ""}
              onChange={(e) => handleChange("director", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">{t('contractor_sheet.field.position')}</label>
            <Input
              value={formData.directorPosition || ""}
              onChange={(e) => handleChange("directorPosition", e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">
          {isPrivate ? t('contractor_sheet.field.address') : t('contractor_sheet.field.legal_address')}
        </label>
        <Input 
          value={formData.legalAddress || ""} 
          onChange={(e) => handleChange("legalAddress", e.target.value)}
        />
      </div>
    </div>
  );
};
