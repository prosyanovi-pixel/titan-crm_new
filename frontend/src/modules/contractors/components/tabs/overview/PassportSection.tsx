import React from "react";
import { UserCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Contractor } from "../../../types/contractor.types";
import { formatDateDisplay } from "../../../utils/contractor-utils";

interface PassportSectionProps {
  formData: Partial<Contractor>;
  handleChange: (field: keyof Contractor, value: unknown) => void;
  editingField: string | null;
  toggleEdit: (field: string | null) => void;
}

export const PassportSection = ({
  formData,
  handleChange,
  editingField,
  toggleEdit,
}: PassportSectionProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 pt-4 border-t border-border/50">
        <div className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 px-2">
          <UserCircle className="w-3.5 h-3.5" />
          {t('contractor_sheet.section.passport')}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">{t('contractor_sheet.field.passport_series')}</label>
            <Input value={formData.passportSeries || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("passportSeries", e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">{t('contractor_sheet.field.passport_number')}</label>
            <Input value={formData.passportNumber || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("passportNumber", e.target.value)} />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">{t('contractor_sheet.field.passport_issued_by')}</label>
          <Input value={formData.passportIssuedBy || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("passportIssuedBy", e.target.value)} />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">{t('contractor_sheet.field.passport_issued_date')}</label>
            <DatePicker value={formData.passportIssuedDate || ""} onChange={(v: string) => handleChange("passportIssuedDate", v)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">{t('contractor_sheet.field.passport_unit_code')}</label>
            <Input value={formData.passportUnitCode || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("passportUnitCode", e.target.value)} />
          </div>
        </div>
    </div>
  );
};
