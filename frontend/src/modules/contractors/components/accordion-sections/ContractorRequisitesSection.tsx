import { CreditCard } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ContractorContactsTab } from "../tabs/ContractorContactsTab";
import { ContractorRequisitesTab } from "../tabs/ContractorRequisitesTab";
import { Contractor } from "../../types/contractor.types";

interface ContractorRequisitesSectionProps {
  formData: Partial<Contractor>;
  handleChange: (field: keyof Contractor, value: unknown) => void;
  isCreating?: boolean;
}

/**
 * Accordion section for requisites and contacts.
 * Combines contacts (phone, email) and bank requisites.
 */
export function ContractorRequisitesSection({
  formData,
  handleChange,
  isCreating = true,
}: ContractorRequisitesSectionProps) {
  const { t } = useTranslation();

  return (
    <AccordionItem value="requisites-full" className="border-border/50">
      <AccordionTrigger className="hover:no-underline py-3 px-2 rounded-lg hover:bg-muted/50 transition-all">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-blue-500/10 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-sm font-bold uppercase tracking-widest">
            {t("contractor_sheet.section.banks")}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-2 px-2 space-y-8">
        <ContractorContactsTab
          formData={formData}
          handleChange={handleChange}
          isCreating={isCreating}
        />
        <div className="border-t border-border/50 pt-6">
          <ContractorRequisitesTab
            formData={formData}
            handleChange={handleChange}
            isCreating={isCreating}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
