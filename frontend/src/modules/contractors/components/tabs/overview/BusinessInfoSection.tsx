import React from "react";
import { ShieldCheck } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Contractor } from "../../../types/contractor.types";

interface BusinessInfoSectionProps {
  formData: Partial<Contractor>;
  handleChange: (field: keyof Contractor, value: unknown) => void;
  isCreating: boolean;
  editingField: string | null;
  toggleEdit: (field: string | null) => void;
  changedFields: Set<string>;
}

export const BusinessInfoSection = ({
  formData,
  handleChange,
  isCreating,
  editingField,
  toggleEdit,
  changedFields,
}: BusinessInfoSectionProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 pt-4 border-t border-border/50">
      <div className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 px-2">
        <ShieldCheck className="w-3.5 h-3.5" />
        {t('contractor_sheet.field.okved_name')}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">{t('contractor_sheet.field.okved')}</label>
        <div className="grid grid-cols-4 gap-2">
          <Input 
            className="col-span-1"
            value={formData.okved || ""} 
            placeholder={t('common.code')}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("okved", e.target.value)}
          />
          <Input 
            className="col-span-3"
            value={formData.okvedName || ""} 
            placeholder={t('common.name')}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("okvedName", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">{t('contractor_sheet.field.org_status')}</label>
        <div>
          {formData.isActive === false ? <Badge variant="destructive">{t('contractor_sheet.status.liquidated')}</Badge> : <Badge variant="secondary">{t('contractor_sheet.status.active')}</Badge>}
        </div>
      </div>
    </div>
  );
};
