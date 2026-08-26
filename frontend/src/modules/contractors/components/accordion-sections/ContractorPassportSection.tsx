import { FileText } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Contractor } from "../../types/contractor.types";

interface ContractorPassportSectionProps {
  formData: Partial<Contractor>;
  handleChange: (field: keyof Contractor, value: unknown) => void;
}

/**
 * Accordion section for passport information (private contractors).
 * Handles series, number, issue date, registration address, etc.
 */
export function ContractorPassportSection({
  formData,
  handleChange,
}: ContractorPassportSectionProps) {
  const { t } = useTranslation();

  return (
    <AccordionItem value="passport" className="border-border/50">
      <AccordionTrigger className="hover:no-underline py-3 px-2 rounded-lg hover:bg-muted/50 transition-all">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-amber-500/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-sm font-bold uppercase tracking-widest">
            {t("contractor_sheet.section.passport")}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-2 px-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                {t("contractor_sheet.field.passport_series")}
              </Label>
              <Input
                value={formData.passportSeries || ""}
                onChange={(e) => handleChange("passportSeries", e.target.value)}
                placeholder="0000"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                {t("contractor_sheet.field.passport_number")}
              </Label>
              <Input
                value={formData.passportNumber || ""}
                onChange={(e) => handleChange("passportNumber", e.target.value)}
                placeholder="000000"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">
              {t("contractor_sheet.field.passport_unit_code")}
            </Label>
            <Input
              value={formData.passportUnitCode || ""}
              onChange={(e) => handleChange("passportUnitCode", e.target.value)}
              placeholder="000-000"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">
              {t("contractor_sheet.field.passport_issued_by")}
            </Label>
            <Input
              value={formData.passportIssuedBy || ""}
              onChange={(e) => handleChange("passportIssuedBy", e.target.value)}
              placeholder={t("contractor_sheet.field.passport_issued_by")}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">
              {t("contractor_sheet.field.passport_issued_date")}
            </Label>
            <DatePicker
              value={formData.passportIssuedDate || ""}
              onChange={(v) => handleChange("passportIssuedDate", v)}
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">
              {t("contractor_sheet.field.registration_address")}
            </Label>
            <Input
              value={formData.registrationAddress || ""}
              onChange={(e) => handleChange("registrationAddress", e.target.value)}
              placeholder={t("contractor_sheet.field.registration_address")}
            />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
