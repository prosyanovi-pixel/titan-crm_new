/**
 * Quick action sheets for contractors
 * Sheet for creating Task, Claim, Project, Event, Reminder from contractor page
 */
import { useRef } from "react";
import { useTranslation } from "@/lib/i18n";
import { ResizableSheet } from "@/components/shared";
import { QuickActionType, useQuickActionMutations } from "../hooks/useQuickActionMutations";
import { QuickActionForm } from "./quick-forms/QuickActionForm";

interface QuickSheetProps {
  type: QuickActionType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractorName: string;
  contractorId?: number | string;
  statuses?: Array<{ id: string; name: string }>;
  priorities?: Array<{ id: string; name: string }>;
  projectTypes?: Array<{ id: string; name: string }>;
  caseTypes?: Array<{ id: string; name: string }>;
  initialDescription?: string;
  initialLocation?: string;
}

export function QuickActionSheet({
  type,
  open,
  onOpenChange,
  contractorName,
  contractorId,
  statuses = [],
  priorities = [],
  projectTypes = [],
  caseTypes = [],
  initialDescription = '',
  initialLocation = '',
}: QuickSheetProps) {
  const { t } = useTranslation();
  const { isSaving } = useQuickActionMutations();
  
  // Ref to hold the handleSave function from the child form
  const saveRef = useRef<(() => Promise<void>) | null>(null);

  const handleSaveTrigger = async () => {
    if (saveRef.current) {
      await saveRef.current();
    }
  };

  const getSheetTitle = (actionType: QuickActionType): string => {
    switch (actionType) {
      case 'task': return t('quick_sheet.create_task');
      case 'claim': return t('quick_sheet.create_claim');
      case 'event': return t('quick_sheet.new_event');
      case 'reminder': return t('quick_sheet.new_reminder');
      case 'project': return t('quick_sheet.create_project');
      default: return '';
    }
  };

  const sheetTitle = getSheetTitle(type);

  return (
    <ResizableSheet 
      open={open} 
      onOpenChange={onOpenChange}
      onSave={handleSaveTrigger}
      title={sheetTitle}
      moduleKey={`quick-action-${type}`}
      defaultWidth="md"
      saveDisabled={isSaving}
      saveButtonLabel={isSaving ? t('generated.sohranenie') : t('generated.sozdat')}
      cancelButtonOnLeft={true}
    >
      <div className="space-y-6 py-2 pb-10">
        {open && (
          <QuickActionForm
            key={`${type}-${contractorId}`} // Force reset on type/contractor change
            type={type}
            contractorName={contractorName}
            contractorId={contractorId}
            statuses={statuses}
            priorities={priorities}
            projectTypes={projectTypes}
            caseTypes={caseTypes}
            initialDescription={initialDescription}
            initialLocation={initialLocation}
            onSuccess={() => onOpenChange(false)}
            saveRef={saveRef}
          />
        )}
      </div>
    </ResizableSheet>
  );
}
