import { Landmark } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Contractor } from "../../types/contractor.types";

interface ContractorBusinessExtraSectionProps {
  formData: Partial<Contractor>;
  handleChange: (field: keyof Contractor, value: unknown) => void;
}

/**
 * Accordion section for business extra information.
 * Handles OKVED, OKPO, OKATO codes (business entities).
 */
export function ContractorBusinessExtraSection({
  formData,
  handleChange,
}: ContractorBusinessExtraSectionProps) {
  const { t } = useTranslation();

  return (
    <AccordionItem value="business-extra" className="border-border/50">
      <AccordionTrigger className="hover:no-underline py-3 px-2 rounded-lg hover:bg-muted/50 transition-all">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-purple-500/10 flex items-center justify-center">
            <Landmark className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-sm font-bold uppercase tracking-widest">
            {t("contractor_sheet.section.extra_info")}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-2 px-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">
              {t("contractor_sheet.field.okved")}
            </Label>
            <Input
              value={formData.okved || ""}
              onChange={(e) => handleChange("okved", e.target.value)}
              placeholder="62.01"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">
              {t("contractor_sheet.field.okved_name")}
            </Label>
            <Input
              value={formData.okvedName || ""}
              onChange={(e) => handleChange("okvedName", e.target.value)}
              placeholder={t("contractor_sheet.field.okved_name")}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">
              {t("contractor_sheet.field.okpo")}
            </Label>
            <Input
              value={formData.okpo || ""}
              onChange={(e) => handleChange("okpo", e.target.value)}
              placeholder="01285944"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">
              {t("contractor_sheet.field.okato")}
            </Label>
            <Input
              value={formData.okato || ""}
              onChange={(e) => handleChange("okato", e.target.value)}
              placeholder="46458000000"
            />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
