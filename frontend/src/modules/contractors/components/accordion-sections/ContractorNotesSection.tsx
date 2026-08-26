import { FileText } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Contractor } from "../../types/contractor.types";

interface ContractorNotesSectionProps {
  formData: Partial<Contractor>;
  handleChange: (field: keyof Contractor, value: unknown) => void;
}

/**
 * Accordion section for contractor notes/comments.
 * Simple textarea for additional information.
 */
export function ContractorNotesSection({
  formData,
  handleChange,
}: ContractorNotesSectionProps) {
  const { t } = useTranslation();

  return (
    <AccordionItem value="notes" className="border-border/50">
      <AccordionTrigger className="hover:no-underline py-3 px-2 rounded-lg hover:bg-muted/50 transition-all">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
            <FileText className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="text-sm font-bold uppercase tracking-widest">
            {t("contractor_sheet.section.notes")}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-2 px-2">
        <textarea
          value={formData.notes || ""}
          onChange={(e) => handleChange("notes", e.target.value)}
          placeholder={t("contractor_sheet.placeholder.notes")}
          className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:ring-1 focus:ring-primary outline-none"
        />
      </AccordionContent>
    </AccordionItem>
  );
}
