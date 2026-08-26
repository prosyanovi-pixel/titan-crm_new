import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/lib/i18n";
import {
  CircleDot,
  Activity,
  Users,
  FileText,
  Scale,
  FolderOpen,
  X,
  MessageSquare
} from "lucide-react";
import { Contractor } from "../types/contractor.types";
import { ContractorType } from "./ContractorCreateSheet";
import { CommentsSection } from '@/components/shared/CommentsSection';
import {
  ContractorOverviewTab,
  ContractorRequisitesTab,
  ContractorContactsTab,
  ContractorTaxTab,
  ContractorActivityTab,
  ContractorDashboardTab
} from "./tabs";
import { useSheetTabs } from "@/hooks/useSheetTabs";
import { ContractorSheetTab } from "@/modules/contractors/hooks/useContractorSheetManager";
import { SheetTabSettings, ResizableSheet } from "@/components/shared";
import { useContractorForm } from "../hooks";
import { isPrivateContractor } from "../utils/contractor-utils";
import { useModuleSettings } from "@/modules/settings/hooks/useModuleSettings";
import { useSettings } from "@/hooks/use-settings";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ContractorConversionWizard } from "./ContractorConversionWizard";
import { RefreshCw } from "lucide-react";

interface ContractorSheetProps {
  contractor: Contractor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (contractor: Contractor) => void;
  onDelete?: (id: number) => void;
  initialName?: string;
  defaultContractorName?: string;
  initialLegalEntityType?: ContractorType;
  initialInn?: string;
  initialTab?: ContractorSheetTab;
}

export function ContractorSheet({
  contractor,
  open,
  onOpenChange,
  onSave,
  onDelete,
  initialName,
  initialLegalEntityType,
  initialInn,
  initialTab,
}: ContractorSheetProps) {
  const { t } = useTranslation();
  const { legalFormGroups } = useSettings();
  const [referencesUpdateTrigger, setReferencesUpdateTrigger] = useState(0);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  
  // Form management
  const { formData, handleChange, handleSubmit, isValid } = useContractorForm({
    initialContractor: contractor,
    initialName: contractor ? undefined : initialName,
    initialLegalEntityType: contractor ? undefined : initialLegalEntityType,
    initialInn: contractor ? undefined : initialInn,
    onSave,
  });
  
  // Tab Management
  const { tabs, toggleTab, moveTab } = useSheetTabs([
    { id: "dashboard", label: t('contractors.contractor_sheet.tabs.dashboard'), icon: Activity, visible: true },
    { id: "overview", label: "contractors.tabs.card", icon: CircleDot, visible: true },
    { id: "comments", label: "components.comments.title", icon: MessageSquare, visible: true },
    { id: "contacts", label: "contractors.tabs.contacts", icon: Users, visible: true },
    { id: "taxes", label: "contractor.tab_taxes", icon: Scale, visible: !!contractor && !isPrivateContractor(contractor) },
    { id: "activity", label: "contractors.tabs.activity", icon: Activity, visible: true },
  ]);
  
  const [activeTab, setActiveTab] = useState<string>(initialTab ?? "dashboard");
  const isCreating = contractor === null;

  // Ensure active tab is visible when opening or changing configuration
  useEffect(() => {
      const currentTab = tabs.find(t => t.id === activeTab);
      if (currentTab && !currentTab.visible) {
          const firstVisible = tabs.find(t => t.visible);
            // eslint-disable-next-line react-hooks/set-state-in-effect
              if (firstVisible) setActiveTab(firstVisible.id as ContractorSheetTab);
      }
  }, [tabs, activeTab, contractor]);

  // Listen for references updates from Settings
  useEffect(() => {
    const onReferencesUpdated = () => {
      setReferencesUpdateTrigger(prev => prev + 1);
    };
    window.addEventListener('references:updated', onReferencesUpdated);
    return () => window.removeEventListener('references:updated', onReferencesUpdated);
  }, []);

  const handleSave = () => {
    handleSubmit();
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (contractor && onDelete) {
      onDelete(contractor.id);
    }
    onOpenChange(false);
  };

  const currentGroup = useMemo(() => 
    legalFormGroups.find(g => g.id === formData.groupId),
    [legalFormGroups, formData.groupId]
  );
  
  const headerTitle = (
    <div className="flex items-center gap-2 max-w-full overflow-hidden mr-8">
      <div className="flex flex-col min-w-0">
        <span className="font-bold truncate flex-shrink-1 min-w-0" title={contractor?.name || ''}>
          {contractor ? contractor.name : t('contractors.add_button')}
        </span>
        {contractor?.inn && (
          <span className="text-[10px] text-muted-foreground opacity-70">
            {t('contractor_sheet.field.inn')} {contractor.inn}
          </span>
        )}
      </div>
      
      {contractor && (
        <div className="flex gap-2 flex-shrink-0">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-6 px-2 text-[10px] gap-1 border-dashed rounded-full bg-primary/5 text-primary hover:bg-primary/10 transition-all font-bold uppercase tracking-tight flex-shrink-0 max-w-[180px]"
              >
                <FolderOpen className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{currentGroup?.name || t('contractor_sheet.action.group.select')}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-1 shadow-xl border-primary/10" align="start">
              <div className="grid gap-0.5">
                 {legalFormGroups.map(group => (
                   <Button
                     key={group.id}
                     variant="ghost"
                     size="sm"
                     className="justify-start font-normal h-9 text-xs px-3 hover:bg-primary/5"
                     onClick={() => handleChange('groupId', group.id)}
                   >
                     <div className="w-2 h-2 rounded-full mr-3 shrink-0" style={{ backgroundColor: group.color }} />
                     <span className="truncate">{group.name}</span>
                   </Button>
                 ))}
                 <div className="h-px bg-border my-1" />
                 <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start font-normal h-9 text-xs px-3 text-muted-foreground hover:bg-destructive/5 hover:text-destructive"
                    onClick={() => handleChange('groupId', null)}
                 >
                   <X className="w-3.5 h-3.5 mr-3 shrink-0" />
                   {t('common.clear')}
                 </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button 
            variant="outline" 
            size="sm" 
            className="h-6 px-2 text-[10px] gap-1 border border-primary/20 rounded-full hover:bg-primary hover:text-white transition-all font-medium flex-shrink-0"
            onClick={() => setIsWizardOpen(true)}
          >
            <RefreshCw className="w-3 h-3 flex-shrink-0" />
            Сменить форму
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <ResizableSheet
        open={open}
        onOpenChange={onOpenChange}
      onSave={handleSave}
      onDelete={contractor ? handleDelete : undefined}
      title={headerTitle}
      description={formData.name || t('contractor_sheet.title_new')}
      moduleKey="contractor-sheet"
      defaultWidth="xl"
      showDeleteButton={!!contractor}
      saveButtonLabel="contractor_sheet.action.save"
      cancelButtonLabel="contractor_sheet.action.cancel"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ContractorSheetTab)} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
              {tabs.map(tab => {
                if (!tab.visible) return null;
                const Icon = tab.icon;
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5 text-xs">
                    <Icon className="w-3.5 h-3.5" />
                    {t(tab.label)}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
          
          <SheetTabSettings 
            tabs={tabs} 
            onToggle={toggleTab} 
            onMove={moveTab} 
          />
        </div>

        {activeTab === "dashboard" && (
          <ContractorDashboardTab 
            contractor={contractor || formData as Contractor}
            onNavigate={(tab) => setActiveTab(tab)}
            onUpdateField={handleChange}
          />
        )}

        {activeTab === "overview" && (
          <div className="space-y-8 pb-10">
            <ContractorOverviewTab 
              formData={formData} 
              handleChange={handleChange} 
              _triggerUpdate={referencesUpdateTrigger}
              isSheetOpen={open}
            />

            {contractor && (
              <div className="rounded-xl border border-border/50 bg-background p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-bold uppercase tracking-widest">
                    {t("contractor_sheet.section.notes")}
                  </span>
                </div>
                <textarea
                  value={formData.notes || ""}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder={t("contractor_sheet.placeholder.notes")}
                  className="w-full min-h-[160px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            )}
          </div>
        )}

        {activeTab === "contacts" && (
          <ContractorContactsTab formData={formData} handleChange={handleChange} />
        )}

        {activeTab === "taxes" && contractor && (
          <ContractorTaxTab contractorId={contractor.id} />
        )}

        {activeTab === "comments" && (
          contractor ? (
            <div className="pt-4">
              <CommentsSection entityType="contractor" entityId={String(contractor.id)} />
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              {t('components.comments.save_to_add_comments')}
            </div>
          )
        )}

        {activeTab === "activity" && contractor && (
          <ContractorActivityTab contractorId={contractor.id} />
        )}

      </div>
    </ResizableSheet>

    {contractor && isWizardOpen && (
      <ContractorConversionWizard
        contractor={contractor}
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        onSuccess={(newContractor) => {
          if (onSave) onSave(newContractor);
          onOpenChange(false); 
        }}
      />
    )}
    </>
  );
}
