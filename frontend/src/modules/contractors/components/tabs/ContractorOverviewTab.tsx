import React from "react";
import { useTranslation } from "@/lib/i18n";
import { Contractor } from "../../types/contractor.types";
import { useSettings } from "@/hooks/use-settings";
import { useCurrencies } from "@/hooks/useCurrencies";
import { 
  isPrivateContractor, 
  isBusinessContractor, 
  isIndividualEntrepreneur 
} from "../../utils/contractor-utils";

import { useContractorOverview } from "../../hooks/useContractorOverview";
import { useModuleSettings } from "@/modules/settings/hooks/useModuleSettings";
import { SmartMetadataGrid, MetadataItem } from "@/components/shared/SmartMetadataGrid";
import { ShieldCheck, Briefcase, User, FileText, Percent } from "lucide-react";
import { BasicInfoSection } from "./overview/BasicInfoSection";
import { RequisitesSection } from "./overview/RequisitesSection";
import { BusinessInfoSection } from "./overview/BusinessInfoSection";
import { BankAccountsSection } from "./overview/BankAccountsSection";
import { PassportSection } from "./overview/PassportSection";
import { TagsSection } from "./overview/TagsSection";
import { ComparisonDialog } from "./overview/ComparisonDialog";
import { BankFormSheet } from "./overview/BankFormSheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserSelect } from "@/components/shared/UserSelect";
import { AiInsightPanel } from "@/components/ai/AiInsightPanel";

interface ContractorOverviewTabProps {
  formData: Partial<Contractor>;
  handleChange: (field: keyof Contractor, value: unknown) => void;
  _triggerUpdate?: number;
  isSheetOpen?: boolean;
  isCreating?: boolean;
}

/**
 * Tab component for basic contractor information in the ContractorSheet.
 * Handles data display, inline editing, and external data enrichment (lookup).
 */
export function ContractorOverviewTab({ 
  formData, 
  handleChange, 
  isSheetOpen = true, 
  isCreating = false 
}: ContractorOverviewTabProps) {
  const { t } = useTranslation();
  const { settings: moduleSettings } = useModuleSettings("contractors");
  const settings = useSettings();
  const { data: currencies = [] } = useCurrencies();
  
  const legalFormsList = settings.getLegalFormsByModule();
  const statuses = settings.getStatusesByModule('contractors');
  const relationshipTypes = settings.getRelationshipTypesByModule('contractors');
  const availableTags = settings.getTagsByModule('contractors');

  const {
    taxRegimes,
    isLookupLoading,
    editingField,
    changedFields,
    tagSearch, setTagSearch,
    isBankSheetOpen, setIsBankSheetOpen,
    editingBankId,
    bankForm, setBankForm,
    comparisonData,
    isComparisonOpen, setIsComparisonOpen,
    handleLookupCurrentContractor,
    applyComparison,
    toggleEdit,
    openAddBank,
    openEditBank,
    handleSaveBank,
    removeBank,
  } = useContractorOverview({
    formData,
    handleChange,
    isSheetOpen,
    legalFormsList,
  });

  // Types from utils
  const isPrivate = isPrivateContractor(formData);
  const isBusiness = isBusinessContractor(formData);
  const isIndividual = isIndividualEntrepreneur(formData);

  const showTags = moduleSettings.features?.enableTags !== false;

  const metadataItems: MetadataItem[] = [];
  
  if (!isCreating) {
    metadataItems.push({
      id: 'status',
      label: t('contractor_sheet.field.status'),
      value: editingField === 'status' ? '__editing__' : statuses.find(s => s.id === formData.status)?.name || formData.status,
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      onClick: () => toggleEdit('status'),
      onClickPlaceholder: () => toggleEdit('status'),
      renderCustomBadge: editingField === 'status' ? () => (
        <div className="min-w-[200px]">
          <Select value={formData.status} onValueChange={(v: string) => { handleChange('status', v); toggleEdit(null); }}>
            <SelectTrigger autoFocus className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent className="z-[110]">
              {statuses.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      ) : undefined
    });

    metadataItems.push({
      id: 'type',
      label: t('contractor_sheet.field.type'),
      value: editingField === 'type' ? '__editing__' : relationshipTypes.find(rt => rt.id === formData.type)?.name || formData.type,
      icon: <Briefcase className="w-3.5 h-3.5" />,
      onClick: () => toggleEdit('type'),
      onClickPlaceholder: () => toggleEdit('type'),
      renderCustomBadge: editingField === 'type' ? () => (
        <div className="min-w-[200px]">
          <Select value={formData.type} onValueChange={(v: string) => { handleChange('type', v); toggleEdit(null); }}>
            <SelectTrigger autoFocus className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent className="z-[110]">
              {relationshipTypes.map(rt => <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      ) : undefined
    });

    metadataItems.push({
      id: 'manager',
      label: t('contractor_sheet.field.manager'),
      value: editingField === 'manager' ? '__editing__' : formData.manager,
      icon: <User className="w-3.5 h-3.5" />,
      onClick: () => toggleEdit('manager'),
      onClickPlaceholder: () => toggleEdit('manager'),
      renderCustomBadge: editingField === 'manager' ? () => (
        <div className="min-w-[250px]">
          <UserSelect
            value={formData.manager || ""}
            onValueChange={(v: string) => { handleChange("manager", v); toggleEdit(null); }}
          />
        </div>
      ) : undefined
    });
  }

  return (
    <div className="space-y-8 pb-10">
      {metadataItems.length > 0 && (
        <SmartMetadataGrid items={metadataItems} />
      )}
      <BasicInfoSection
        formData={formData}
        handleChange={handleChange}
        isPrivate={isPrivate}
        isCreating={isCreating}
        editingField={editingField}
        toggleEdit={toggleEdit}
        changedFields={changedFields}
        handleLookup={handleLookupCurrentContractor}
        isLookupLoading={isLookupLoading}
        statuses={statuses}
        relationshipTypes={relationshipTypes}
      />

      <RequisitesSection
        formData={formData}
        handleChange={handleChange}
        isPrivate={isPrivate}
        isBusiness={isBusiness}
        isIndividual={isIndividual}
        isCreating={isCreating}
        editingField={editingField}
        toggleEdit={toggleEdit}
        changedFields={changedFields}
        taxRegimes={taxRegimes}
        legalFormsList={legalFormsList}
      />

      {!isPrivate && (
        <BusinessInfoSection
          formData={formData}
          handleChange={handleChange}
          isCreating={isCreating}
          editingField={editingField}
          toggleEdit={toggleEdit}
          changedFields={changedFields}
        />
      )}

      {!isCreating && !isPrivate && (
        <BankAccountsSection
          formData={formData}
          onAdd={openAddBank}
          onEdit={openEditBank}
          onRemove={removeBank}
        />
      )}

      {isPrivate && (
        <PassportSection
          formData={formData}
          handleChange={handleChange}
          editingField={editingField}
          toggleEdit={toggleEdit}
        />
      )}

      {formData.id && !isCreating && (
        <AiInsightPanel
          entityType="contractor"
          entityId={String(formData.id)}
          insightType="summary"
          description={t('contractors.ai.summary_desc')}
        />
      )}

      {showTags && (
        <TagsSection
          formData={formData}
          handleChange={handleChange}
          availableTags={availableTags}
          tagSearch={tagSearch}
          setTagSearch={setTagSearch}
        />
      )}

      <ComparisonDialog
        isOpen={isComparisonOpen}
        onOpenChange={setIsComparisonOpen}
        formData={formData}
        comparisonData={comparisonData}
        onApply={applyComparison}
        legalFormsList={legalFormsList}
      />

      <BankFormSheet
        isOpen={isBankSheetOpen}
        onOpenChange={setIsBankSheetOpen}
        bankForm={bankForm}
        setBankForm={setBankForm}
        onSave={handleSaveBank}
        editingBankId={editingBankId}
        currencies={currencies}
      />
    </div>
  );
}
