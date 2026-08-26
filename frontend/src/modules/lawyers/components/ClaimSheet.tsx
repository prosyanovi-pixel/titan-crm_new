import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { Trash2, Folder, DollarSign, Clock, FileText, MessageSquare, BarChart3 } from "lucide-react";
import { LegalCase } from "../types";
import { CaseGeneralTab } from "./case-tabs/CaseGeneralTab";
import { CaseFinanceTab } from "./case-tabs/CaseFinanceTab";
import { CaseTimelineTab } from "./case-tabs/CaseTimelineTab";
import { CaseDocumentsTab } from "./case-tabs/CaseDocumentsTab";
import { CaseNotesTab } from "./case-tabs/CaseNotesTab";
import { CaseAnalyticsTab } from "./case-tabs/CaseAnalyticsTab";
import { Contractor, ContractorSheet } from "@/modules/contractors";
import { useSheetTabs } from "@/hooks/useSheetTabs";
import { SheetTabSettings, ResizableSheet } from "@/components/shared";

interface ClaimSheetProps {
  claim: LegalCase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (claim: LegalCase) => void;
  onDelete?: (id: string) => void;
  contractors: Contractor[];
  onAddContractor: (contractor: Contractor) => void;
  initialContractor?: string;
}

export function ClaimSheet({
  claim,
  open,
  onOpenChange,
  onSave,
  onDelete,
  contractors,
  onAddContractor,
  initialContractor
}: ClaimSheetProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<LegalCase>>({});
  
  // Tab Management
  const { tabs, toggleTab, moveTab } = useSheetTabs([
    { id: "general", label: "sheet.tabs.overview", icon: Folder, visible: true },
    { id: "finance", label: "sheet.tabs.finance", icon: DollarSign, visible: true },
    { id: "analytics", label: "sheet.tabs.analytics", icon: BarChart3, visible: true },
    { id: "timeline", label: "sheet.tabs.timeline", icon: Clock, visible: true },
    { id: "documents", label: "sheet.tabs.documents", icon: FileText, visible: true },
    { id: "notes", label: "sheet.tabs.notes", icon: MessageSquare, visible: true },
  ]);
  
  const [activeTab, setActiveTab] = useState("general");

  // Ensure active tab is visible
  useEffect(() => {
      const currentTab = tabs.find(t => t.id === activeTab);
      if (currentTab && !currentTab.visible) {
          const firstVisible = tabs.find(t => t.visible);
          // eslint-disable-next-line react-hooks/set-state-in-effect
          if (firstVisible) setActiveTab(firstVisible.id);
      }
  }, [tabs, activeTab]);

  // Contractor Sheet State
  const [isContractorSheetOpen, setIsContractorSheetOpen] = useState(false);

  useEffect(() => {
    if (claim) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(claim);
    } else {
      // Initialize with default values for a new claim
      const newClaimData: Partial<LegalCase> = {
        type: "claim",
        title: initialContractor ? `Претензия ${initialContractor}` : "Претензия",
        status: "claim_draft",
        creationDate: new Date().toLocaleDateString("ru-RU"),
        startDate: new Date().toLocaleDateString("ru-RU"),
        claimAmount: { amount: 0, currency: "RUB" },
        recoveredAmount: { amount: 0, currency: "RUB" },
        thirdParties: [],
        stateDuty: 0,
        expertiseCost: 0,
        otherClaimCosts: 0,
        enforcementFee: 0,
        executionCosts: 0,
        transportExpenses: 0,
        translationExpenses: 0,
        otherExpenses: 0,
        price: 0,
        events: [],
        documents: [],
        notes: [],
        plaintiff: initialContractor || "",
        defendant: "",
        courtName: "",
        courtAddress: "",
        judge: "",
        deadline: "",
        description: "",
        caseNumber: "",
        lawyerId: "",
        lawyerName: ""
      };
      
      setFormData(newClaimData);
    }
  }, [claim, open, initialContractor]);

  const handleInputChange = (field: keyof LegalCase, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(formData as LegalCase);
    onOpenChange(false);
  };

  const handleAddContractorSuccess = (newContractor: Contractor) => {
    onAddContractor(newContractor);
  };

  return (
    <>
      <ResizableSheet
        open={open}
        onOpenChange={onOpenChange}
        onSave={handleSave}
        onDelete={claim ? () => onDelete && onDelete(claim.id) : undefined}
        title={claim ? t('lawyers.case_sheet.title_edit') : t('lawyers.case_sheet.title_new')}
        description={formData.title || t('lawyers.case_sheet.default_title')}
        moduleKey="claim-sheet"
        defaultWidth="2xl"
        showDeleteButton={!!claim}
        saveButtonLabel="common.save"
        cancelButtonLabel="common.cancel"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-2 flex-nowrap">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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

          {activeTab === "general" && (
            <CaseGeneralTab 
              formData={formData} 
              handleChange={handleInputChange} 
              contractors={contractors}
              onCreateContractor={async (_name: string) => { setIsContractorSheetOpen(true); return ''; }}
            />
          )}
          {activeTab === "finance" && (
            <CaseFinanceTab formData={formData} handleChange={handleInputChange} />
          )}
          {activeTab === "analytics" && (
            <CaseAnalyticsTab legalCase={formData} />
          )}
          {activeTab === "timeline" && (
            <CaseTimelineTab 
              events={formData.events} 
              onChange={(events) => handleInputChange('events', events)}
            />
          )}
          {activeTab === "documents" && (
            <CaseDocumentsTab documents={formData.documents} />
          )}
          {activeTab === "notes" && (
            <CaseNotesTab notes={formData.notes} handleChange={handleInputChange} />
          )}
        </div>
      </ResizableSheet>

      {/* Contractor Creation Sheet Stacking */}
      <ContractorSheet 
        contractor={null}
        open={isContractorSheetOpen}
        onOpenChange={setIsContractorSheetOpen}
        onSave={handleAddContractorSuccess}
      />
    </>
  );
}