import { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/lib/i18n";
import { api } from "@/lib/api";
import { ResizableSheet } from "@/components/shared";
import { useContractorForm, useInnLookup } from "../hooks";
import { Contractor, LegalForm } from "../types/contractor.types";
import { Accordion } from "@/components/ui/accordion";
import { useSettings } from "@/hooks/use-settings";
import { ContractorTypeSelector } from "./create-forms/ContractorTypeSelector";
import { ContractorGeneralForm } from "./create-forms/ContractorGeneralForm";
import { 
  mapTypeToLegalDetails, 
  isPrivateContractor, 
  isBusinessContractor, 
  isIndividualEntrepreneur 
} from "../utils/contractor-utils";
import { ContractorPassportSection } from "./accordion-sections/ContractorPassportSection";
import { ContractorBusinessExtraSection } from "./accordion-sections/ContractorBusinessExtraSection";
import { ContractorRequisitesSection } from "./accordion-sections/ContractorRequisitesSection";
import { ContractorNotesSection } from "./accordion-sections/ContractorNotesSection";

/**
 * Types of legal entities supported in TITAN CRM.
 */
export type ContractorType = "private" | "individual" | "legal" | "foreign";

/**
 * Props for the ContractorCreateSheet component.
 */
interface ContractorCreateSheetProps {
  /** Whether the sheet is open */
  open: boolean;
  /** Callback to change the open state */
  onOpenChange: (open: boolean) => void;
  /** Optional callback after successful save */
  onSave?: (contractor: Contractor) => void;
  /** Initial name for the contractor (e.g. from search) */
  initialName?: string;
}


export function ContractorCreateSheet({
  open,
  onOpenChange,
  onSave,
  initialName,
}: ContractorCreateSheetProps) {
  const { t } = useTranslation();
  const settings = useSettings();
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedType, setSelectedType] = useState<ContractorType>("legal");
  const [inn, setInn] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const taxRegimesList = settings.taxRegimes || [];

  // Use the extracted INN lookup hook
  const { isLoading, error, performLookup } = useInnLookup();

  const relationshipTypes = settings.getRelationshipTypesByModule('contractors');
  const availableTags = settings.getTagsByModule('contractors');
  const availablePositions = (settings.getPositions() || []).map(p => ({ id: p.name as string, label: p.name as string }));

  // Form management
  const { formData, setFormData, handleChange, handleSubmit, isValid } = useContractorForm({
    initialContractor: null,
    initialName,
    initialLegalEntityType: selectedType,
    initialInn: inn.trim() || undefined,
    onSave,
  });

  // Reset when sheet closes
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setSelectedType("legal");
        setInn("");
        setTagSearch("");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  /**
   * Handles INN lookup with form auto-population.
   */
  const handleLookupByInn = async (forcedInn?: string) => {
    const innToLookup = forcedInn || inn;
    const result = await performLookup(innToLookup);
    
    if (result) {
      let detectedType: ContractorType = "legal";
      if (result.legalEntityType === "individual") detectedType = "individual";
      else if (result.legalEntityType === "foreign") detectedType = "foreign";
      else if (result.legalEntityType === "private") detectedType = "private";
      
      setSelectedType(detectedType);
      
      setFormData(prev => ({
        ...prev,
        name: result.name || prev.name || '',
        fullName: result.fullName || prev.fullName || '',
        inn: result.inn || innToLookup,
        kpp: result.kpp || prev.kpp || '',
        ogrn: result.ogrn || prev.ogrn || '',
        legalAddress: result.legalAddress || prev.legalAddress || '',
        director: result.director || prev.director || '',
        directorPosition: result.directorPosition || prev.directorPosition || '',
        okved: result.okved || prev.okved || '',
        okvedName: result.okvedName || prev.okvedName || '',
        legalEntityType: result.legalEntityType || detectedType,
        legalForm: (result.legalForm as LegalForm) || prev.legalForm,
        okpo: result.okpo || prev.okpo || '',
        okato: result.okato || prev.okato || '',
        phone: result.phone || prev.phone || '',
        email: result.email || prev.email || '',
      }));

      setTimeout(() => nameInputRef.current?.focus(), 200);
    }
  };

  const handleInnChange = (value: string) => {
    const val = value.replace(/\D/g, "");
    setInn(val);
    handleChange("inn", val);
    
    if ((val.length === 10 || val.length === 12) && selectedType !== "private") {
      handleLookupByInn(val);
    }
  };

  const handleTypeSelect = (type: ContractorType) => {
    setSelectedType(type);
    const { entityType, form } = mapTypeToLegalDetails(type);
    handleChange("legalEntityType", entityType);
    handleChange("legalForm", form);

    if (type === "foreign") {
      setInn("");
      handleChange("inn", "");
    }
  };

  const handleSave = () => {
    if (selectedType !== "foreign" && selectedType !== "private" && !inn.trim()) {
      // Error is handled by useInnLookup hook
      return;
    }
    handleSubmit();
    onOpenChange(false);
  };

  const isPrivate = isPrivateContractor(formData);
  const isBusiness = isBusinessContractor(formData);

  const handleAddCustomTag = () => {
    if (!tagSearch.trim()) return;
    const current = formData.tags || [];
    if (!current.includes(tagSearch.trim())) {
      handleChange("tags", [...current, tagSearch.trim()]);
    }
    setTagSearch("");
  };

  return (
    <ResizableSheet
      open={open}
      onOpenChange={onOpenChange}
      onSave={handleSave}
      title={t("contractors.add_button")}
      description={formData.name || t("contractor_sheet.title_new")}
      moduleKey="contractor-create-sheet"
      defaultWidth="xl"
      showDeleteButton={false}
      saveButtonLabel="contractor_sheet.action.save"
      cancelButtonLabel="contractor_sheet.action.cancel"
      saveDisabled={!isValid}
    >
      <div className="space-y-6 pb-10 px-1">
        <ContractorTypeSelector
          selectedType={selectedType}
          onTypeSelect={handleTypeSelect}
          inn={inn}
          onInnChange={handleInnChange}
          onLookup={() => handleLookupByInn()}
          isLoading={isLoading}
          error={error}
        />

        <ContractorGeneralForm
          formData={formData}
          handleChange={handleChange}
          relationshipTypes={relationshipTypes}
          availableTags={availableTags}
          availablePositions={availablePositions}
          taxRegimesList={taxRegimesList}
          tagSearch={tagSearch}
          setTagSearch={setTagSearch}
          onAddCustomTag={handleAddCustomTag}
          nameInputRef={nameInputRef}
        />

        <Accordion type="multiple" className="w-full">
          {isPrivate && <ContractorPassportSection formData={formData} handleChange={handleChange} />}
          {!isPrivate && <ContractorBusinessExtraSection formData={formData} handleChange={handleChange} />}
          <ContractorRequisitesSection formData={formData} handleChange={handleChange} isCreating={true} />
          <ContractorNotesSection formData={formData} handleChange={handleChange} />
        </Accordion>
      </div>
    </ResizableSheet>
  );
}
