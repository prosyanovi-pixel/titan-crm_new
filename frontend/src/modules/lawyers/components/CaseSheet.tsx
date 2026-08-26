
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ResizableSheet } from "@/components/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { CheckCircle2, Trash2, Folder, DollarSign, Clock, FileText, MessageSquare, BarChart3, X, Bell, Plus, MoreHorizontal } from "lucide-react";
import { LegalCase, CaseStatus } from "../types";
import { CaseGeneralTab } from "./case-tabs/CaseGeneralTab";
import { CaseFinanceTab } from "./case-tabs/CaseFinanceTab";
import { CaseTimelineTab } from "./case-tabs/CaseTimelineTab";
import { CaseDocumentsTab } from "./case-tabs/CaseDocumentsTab";
import { CaseNotesTab } from "./case-tabs/CaseNotesTab";
import { CaseAnalyticsTab } from "./case-tabs/CaseAnalyticsTab";
import { CaseUpdatesTab } from "./case-tabs/CaseUpdatesTab";
import { cn } from "@/lib/utils";
import { Contractor, ContractorSheet } from "@/modules/contractors";
import { useSheetTabs } from "@/hooks/useSheetTabs";
import { useModuleSettings } from "@/modules/settings/hooks/useModuleSettings";
import { SheetTabSettings } from "@/components/shared";
import { DiscardChangesDialog } from "@/components/shared";
import { useUploadedFilesTracker } from "@/components/ui/useUploadedFilesTracker";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CaseInstance, CaseInstanceType } from "../types/lawyer.types";

interface CaseSheetProps {
  legalCase: LegalCase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (legalCase: LegalCase) => void | Promise<void>;
  onDelete?: (id: string) => void;
  contractors: Contractor[];
  onAddContractor: (contractor: Contractor) => void;
}

export function CaseSheet({
  legalCase,
  open,
  onOpenChange,
  onSave,
  onDelete,
  contractors,
  onAddContractor
}: CaseSheetProps) {
  const { t } = useTranslation();
  const { settings } = useModuleSettings("cases");
  const [formData, setFormData] = useState<Partial<LegalCase>>({});
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | undefined>(undefined);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);
  
  const [isInstanceDialogOpen, setIsInstanceDialogOpen] = useState(false);
  const [newInstance, setNewInstance] = useState<Partial<CaseInstance>>({
    instanceType: 'appeal',
    instanceNumber: '',
    isActive: true
  });

  const handleCreateInstance = async () => {
    if (!legalCase?.id || !newInstance.instanceNumber || !newInstance.instanceType) {
      toast.error(t('lawyers.case_sheet.validation.fill_number_and_type'));
      return;
    }

    try {
      const created = await api.post(`/legal-cases/${legalCase.id}/instances`, newInstance);
      toast.success(t('lawyers.case_sheet.toast.instance_added'));
      setIsInstanceDialogOpen(false);
      setNewInstance({ instanceType: 'appeal', instanceNumber: '', isActive: true });
      fetchInstances(legalCase.id);
    } catch (err) {
      console.error('[CaseSheet] Failed to create instance:', err);
      toast.error(t('lawyers.case_sheet.toast.instance_create_error'));
    }
  };

  const handleInstanceChange = async (instanceId: string, field: string, value: unknown) => {
    console.log(`[CaseSheet] handleInstanceChange: ${instanceId}, ${field} = `, value);
    
    // Update local state first (optimistic)
    setFormData(prev => {
      const instances = prev.instances?.map(inst => 
        inst.id === instanceId ? { ...inst, [field]: value } : inst
      );
      return { ...prev, instances };
    });

    // ВАЖНО: Мы больше НЕ синхронизируем поля инстанции (статус, суд, судья) с корнем дела, 
    // чтобы избежать дублирования данных. Корень дела хранит только статус всего дела.

    // Persist to backend
    try {
      await api.patch(`/legal-cases/instances/${instanceId}`, { [field]: value });
    } catch (err) {
      console.error('[CaseSheet] Failed to update instance:', err);
      toast.error(t('lawyers.case_sheet.toast.instance_update_error'));
    }
  };

  // Fetch instances for the case
  const fetchInstances = useCallback(async (caseId: string) => {
    try {
      const instances = await api.get(`/legal-cases/${caseId}/instances`);
      setFormData(prev => ({ ...prev, instances }));
      
      // Select active instance by default
      const active = instances.find((i: Record<string, unknown>) => i.isActive || i.is_active);
      if (active) {
        setSelectedInstanceId(active.id);
      } else if (instances.length > 0) {
        setSelectedInstanceId(instances[instances.length - 1].id);
      }
    } catch (err) {
      console.error('[CaseSheet] Failed to fetch instances:', err);
    }
  }, []);
  

  
  // Track uploaded files for cleanup on cancel
  const { trackFile, cleanup: cleanupUploadedFiles, clear: clearUploadedFiles } = useUploadedFilesTracker({
    cleanupEndpoint: '/legal-cases/documents/cleanup',
    onCleanup: (ids) => console.log('[CaseSheet] Cleaned up', ids.length, 'unused files'),
    onError: (error) => console.error('[CaseSheet] Cleanup error:', error),
  });

  // Track changes in notes tab
  const handleNotesChange = () => {
    setHasUnsavedChanges(true);
  };
  
  // Tab Management
  const { tabs, toggleTab, moveTab } = useSheetTabs([
    { id: "general", label: "sheet.tabs.overview", icon: Folder, visible: true },
    { id: "finance", label: "sheet.tabs.finance", icon: DollarSign, visible: settings.features?.enableCostsTracking !== false },
    { id: "analytics", label: "sheet.tabs.analytics", icon: BarChart3, visible: settings.features?.enableReporting !== false },
    { id: "timeline", label: "sheet.tabs.timeline", icon: Clock, visible: settings.features?.enableHearingSchedule !== false },
    { id: "documents", label: "sheet.tabs.documents", icon: FileText, visible: settings.features?.enableDocumentTracking !== false },
    { id: "updates", label: "sheet.tabs.updates", icon: Bell, visible: true },
    { id: "notes", label: "sheet.tabs.notes", icon: MessageSquare, visible: settings.features?.enableNotes !== false },
  ], "lawyer-sheet");

  
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    if (activeTab === 'updates' && legalCase?.id) {
      api.post(`/legal-cases/${legalCase.id}/updates/mark-viewed`).catch((err) => {
        console.error('[CaseSheet] Failed to mark updates as viewed:', err);
      });
    }
  }, [activeTab, legalCase?.id]);

  // Ensure active tab is visible
  useEffect(() => {
      const currentTab = tabs.find(t => t.id === activeTab);
      if (currentTab && !currentTab.visible) {
          const firstVisible = tabs.find(t => t.visible);
          if (firstVisible) {
            queueMicrotask(() => setActiveTab(firstVisible.id));
          }
      }
  }, [tabs, activeTab]);

  // Contractor Sheet State — Promise-resolver pattern
  const contractorResolverRef = useRef<{ resolve: (name: string) => void; reject: () => void } | null>(null);
  const [isContractorSheetOpen, setIsContractorSheetOpen] = useState(false);
  const [pendingContractorName, setPendingContractorName] = useState('');

  useEffect(() => {
    if (legalCase) {
      console.log('[CaseSheet] Initializing with case:', {
        title: legalCase.title,
        lawyerId: legalCase.lawyerId,
        caseNumber: legalCase.caseNumber,
        creationDate: legalCase.creationDate
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(legalCase);
      clearUploadedFiles(); // Reset for existing case
      
      if (legalCase.id) {
        fetchInstances(legalCase.id);
      }
      
    } else {
      const defaultCase: Partial<LegalCase> = {
        status: "new",
        creationDate: new Date().toLocaleDateString("ru-RU"), // Default to today
        claimAmount: { amount: 0, currency: "RUB" },
        recoveredAmount: { amount: 0, currency: "RUB" },
        thirdParties: [],
        stateDuty: 0,
        price: 0,
        events: [],
        documents: [],
        notes: [],
        instances: []
      };
      console.log('[CaseSheet] Initializing with new case defaults');
      setSelectedInstanceId(undefined);
      setFormData(defaultCase);
      clearUploadedFiles(); // Reset for new case
    }
    setHasUnsavedChanges(false);
  }, [legalCase, open, fetchInstances, clearUploadedFiles]); // Fixed missing dependency

  const handleInputChange = (field: keyof LegalCase, value: unknown) => {
    console.log(`[CaseSheet] handleInputChange: ${String(field)} = `, value);
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      console.log(`[CaseSheet] formData after update:`, {
        status: updated.status,
        lawyerId: updated.lawyerId,
        lawyerName: updated.lawyerName,
        title: updated.title
      });
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const handleDeleteUpdate = async (updateId: string) => {
    if (!legalCase?.id) return;
    try {
      await api.delete(`/legal-cases/${legalCase.id}/updates/${updateId}`);
      setFormData(prev => ({
        ...prev,
        unviewedUpdates: prev.unviewedUpdates?.filter(u => u.id !== updateId)
      }));
      toast.success(t('lawyers.case_sheet.toast.update_deleted'));
    } catch (err) {
      console.error('[CaseSheet] Failed to delete update:', err);
      toast.error(t('lawyers.case_sheet.toast.update_delete_error'));
    }
  };

  const handleDeleteAllUpdates = async () => {
    if (!legalCase?.id) return;
    try {
      await api.delete(`/legal-cases/${legalCase.id}/updates`);
      setFormData(prev => ({
        ...prev,
        unviewedUpdates: []
      }));
      toast.success(t('lawyers.case_sheet.toast.all_updates_deleted'));
    } catch (err) {
      console.error('[CaseSheet] Failed to delete all updates:', err);
      toast.error(t('lawyers.case_sheet.toast.all_updates_delete_error'));
    }
  };

  // Track uploaded file IDs
  const handleDocumentUploadSuccess = (upload: { response?: { id: string; name: string; url: string } }) => {
    if (upload.response?.id) {
      trackFile(upload.response.id, upload.response.name, upload.response.url);
    }
  };

  const handleSave = async () => {
    console.log('[CaseSheet] handleSave called');
    console.log('[CaseSheet] Current formData BEFORE validation:', {
      id: formData.id,
      title: formData.title,
      type: formData.type,
      status: formData.status,
      lawyerId: formData.lawyerId,
      lawyerName: formData.lawyerName,
      caseNumber: formData.caseNumber,
      creationDate: formData.creationDate,
      allKeys: Object.keys(formData).sort()
    });
    
    // Валидация перед отправкой
    if (!formData.title?.toString().trim()) {
      toast.error(t('lawyers.case_sheet.validation.fill_title'));
      return;
    }
    if (!formData.type) {
      toast.error(t('lawyers.case_sheet.validation.select_type'));
      return;
    }
    if (!formData.status) {
      toast.error(t('lawyers.case_sheet.validation.select_status'));
      return;
    }
    if (!formData.lawyerId) {
      toast.error(t('lawyers.case_sheet.validation.select_lawyer'));
      return;
    }
    if (!formData.caseNumber) {
      toast.error(t('lawyers.case_sheet.validation.fill_case_number'));
      return;
    }
    if (!formData.creationDate) {
      toast.error(t('lawyers.case_sheet.validation.fill_creation_date'));
      return;
    }
    
    try {
      setIsSaving(true);
      console.log('[CaseSheet] All validations passed, calling onSave');
      await Promise.resolve(onSave(formData as LegalCase));
      setHasUnsavedChanges(false);
      clearUploadedFiles(); // Clear tracking after successful save (files are now associated with the case)
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && hasUnsavedChanges) {
      // User is trying to close with unsaved changes
      setPendingClose(true);
      setShowDiscardDialog(true);
    } else if (!newOpen && !hasUnsavedChanges) {
      // Clean up any uploaded files before closing
      cleanupUploadedFiles();
      onOpenChange(false);
    } else {
      onOpenChange(newOpen);
    }
  };

  const handleAddContractorSuccess = (newContractor: Contractor) => {
    onAddContractor(newContractor);
    if (contractorResolverRef.current) {
      contractorResolverRef.current.resolve(newContractor.name);
      contractorResolverRef.current = null;
    }
  };

  const handleCreateContractor = (name: string): Promise<string> =>
    new Promise((resolve, reject) => {
      contractorResolverRef.current = { resolve, reject };
      setPendingContractorName(name);
      setIsContractorSheetOpen(true);
    });

  // Funnel steps logic
  const steps: CaseStatus[] = ["new", "preparation", "filing", "hearing", "decision", "enforcement", "done"];
  const currentStepIndex = steps.indexOf(formData.status as CaseStatus);

  return (
    <>
    <ResizableSheet
      open={open}
      onOpenChange={onOpenChange}
      moduleKey="lawyers_cases"
      defaultWidth="lg"
      title={legalCase?.id 
        ? (formData.type === 'claim' ? t('lawyers.case_sheet.title_edit_claim') : t('lawyers.case_sheet.title_edit'))
        : (formData.type === 'claim' ? t('lawyers.case_sheet.title_new_claim') : t('lawyers.case_sheet.title_new'))
      }
      description={
        <span className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-primary" />
          {formData.title || (formData.type === 'claim' ? t('lawyers.case_sheet.default_title_claim') : t('lawyers.case_sheet.default_title'))}
        </span>
      }
      onSave={handleSave}
      onDelete={legalCase ? () => onDelete && onDelete(legalCase.id) : undefined}
      showDeleteButton={!!legalCase}
      hasUnsavedChanges={hasUnsavedChanges}
      onShowDiscardDialog={() => setShowDiscardDialog(true)}
      saveDisabled={isSaving}
    >
      <div className="flex flex-col gap-6">
        {/* Visual Status Pipeline - Только для судебных дел */}
        {formData.type === 'court' && (
          <div>
            <div className="flex items-center justify-between relative">
              {/* Line background */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-secondary -z-10" />
              
              {steps.map((step, index) => {
                const isActive = index === currentStepIndex;
                const isCompleted = index < currentStepIndex;
                
                return (
                  <div key={step} className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => handleInputChange('status', step)}>
                    <div className={cn(
                      "w-3 h-3 rounded-full border-2 transition-colors duration-200",
                      isActive ? "bg-primary border-primary ring-4 ring-primary/20" : 
                      isCompleted ? "bg-primary border-primary" : 
                      "bg-background border-muted-foreground"
                    )} />
                    <span className={cn(
                      "text-[10px] font-medium transition-colors duration-200",
                      isActive ? "text-primary" : 
                      isCompleted ? "text-foreground" : 
                      "text-muted-foreground"
                    )}>
                      {t(`lawyers.case_status.${step}`).slice(0, 8)}..
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Instance Selector */}
        {formData.id && formData.type === 'court' && (
          <div className="flex items-center gap-2">
            <div className="flex bg-secondary/50 p-1 rounded-md overflow-x-auto no-scrollbar">
              <button
                onClick={() => setSelectedInstanceId(undefined)}
                className={cn(
                  "px-3 py-1 text-xs rounded-sm transition-all whitespace-nowrap",
                  !selectedInstanceId ? "bg-background text-foreground shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t('lawyers.case_sheet.instances.general')}
              </button>
              {formData.instances?.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => setSelectedInstanceId(inst.id)}
                  className={cn(
                    "px-3 py-1 text-xs rounded-sm transition-all whitespace-nowrap flex items-center gap-1.5",
                    selectedInstanceId === inst.id ? "bg-background text-foreground shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t(`lawyers.case_sheet.instances.${inst.instanceType}`)}
                  {inst.isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                </button>
              ))}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 rounded-full bg-secondary/30 flex-shrink-0"
              onClick={() => setIsInstanceDialogOpen(true)}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

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
      </div>

      <div className="mt-6">
        {tabs.find(t => t.id === "general")?.visible && activeTab === "general" && (
          <div className="animate-in fade-in-50">
            <CaseGeneralTab 
                formData={formData} 
                handleChange={handleInputChange} 
                contractors={contractors}
                onCreateContractor={handleCreateContractor}
                selectedInstanceId={selectedInstanceId}
                handleInstanceChange={handleInstanceChange}
            />
          </div>
        )}
        {tabs.find(t => t.id === "finance")?.visible && activeTab === "finance" && (
          <div className="animate-in fade-in-50">
            <CaseFinanceTab formData={formData} handleChange={handleInputChange} />
          </div>
        )}
        {tabs.find(t => t.id === "analytics")?.visible && activeTab === "analytics" && (
          <div className="animate-in fade-in-50">
            <CaseAnalyticsTab legalCase={formData} />
          </div>
        )}
        {tabs.find(t => t.id === "timeline")?.visible && activeTab === "timeline" && (
          <div className="animate-in fade-in-50">
            <CaseTimelineTab 
              events={formData.events?.filter(e => !selectedInstanceId || !e.instanceId || e.instanceId === selectedInstanceId)} 
              onChange={(events) => handleInputChange('events', events)}
              instanceId={selectedInstanceId}
            />
          </div>
        )}
        {tabs.find(t => t.id === "documents")?.visible && activeTab === "documents" && (
          <div className="animate-in fade-in-50">
            <CaseDocumentsTab
              documents={formData.documents?.filter(d => !selectedInstanceId || d.instanceId === selectedInstanceId)}
              notes={formData.notes?.filter(n => !selectedInstanceId || n.instanceId === selectedInstanceId)}
              onChange={(documents) => {
                handleInputChange('documents', documents);
                setHasUnsavedChanges(true);
              }}
              onNotesChange={(notes) => {
                handleInputChange('notes', notes);
                setHasUnsavedChanges(true);
              }}
              caseId={legalCase?.id}
              instanceId={selectedInstanceId}
              onUploadSuccess={handleDocumentUploadSuccess}
            />
          </div>
        )}
        {tabs.find(t => t.id === "updates")?.visible && activeTab === "updates" && (
          <div className="animate-in fade-in-50">
            <CaseUpdatesTab 
              updates={formData.unviewedUpdates} 
              onDeleteUpdate={handleDeleteUpdate}
              onDeleteAll={handleDeleteAllUpdates}
            />
          </div>
        )}
        {tabs.find(t => t.id === "notes")?.visible && activeTab === "notes" && (
          <div className="animate-in fade-in-50">
            <CaseNotesTab
              notes={formData.notes?.filter(n => !selectedInstanceId || n.instanceId === selectedInstanceId)}
              instanceId={selectedInstanceId}
              handleChange={(field, value) => {
                handleInputChange(field, value);
                handleNotesChange();
              }}
            />
          </div>
        )}
      </div>
    </ResizableSheet>

    {/* Discard Changes Confirmation Dialog */}
    <DiscardChangesDialog
     open={showDiscardDialog}
     onOpenChange={setShowDiscardDialog}
     onContinue={() => {
       // Continue editing - do nothing, just close dialog
     }}
     onDiscard={async () => {
       // Discard changes and close - cleanup uploaded files
       await cleanupUploadedFiles();
       setHasUnsavedChanges(false);
       onOpenChange(false);
     }}
     onSave={handleSave}
    />

    {/* New Instance Dialog */}
    <Dialog open={isInstanceDialogOpen} onOpenChange={setIsInstanceDialogOpen}>
     <DialogContent>
       <DialogHeader>
         <DialogTitle>{t('lawyers.case_sheet.instances.add_button')}</DialogTitle>
         <DialogDescription>
           {t('lawyers.case_sheet.instances.add_description')}
         </DialogDescription>
       </DialogHeader>

       <div className="space-y-4 py-4">
         <div className="space-y-2">
           <Label>{t('lawyers.case_sheet.instances.type')}</Label>
           <Select 
             value={newInstance.instanceType} 
             onValueChange={(v: CaseInstanceType) => setNewInstance(prev => ({ ...prev, instanceType: v }))}
           >
             <SelectTrigger>
               <SelectValue />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="first">{t('lawyers.case_sheet.instances.first')}</SelectItem>
               <SelectItem value="appeal">{t('lawyers.case_sheet.instances.appeal')}</SelectItem>
               <SelectItem value="cassation">{t('lawyers.case_sheet.instances.cassation')}</SelectItem>
               <SelectItem value="supervision">{t('lawyers.case_sheet.instances.supervision')}</SelectItem>
             </SelectContent>
           </Select>
         </div>

         <div className="space-y-2">
           <Label>{t('lawyers.case_sheet.instances.number')}</Label>
           <Input 
             placeholder={t('lawyers.case_sheet.placeholder.case_num_format')}
             value={newInstance.instanceNumber}
             onChange={(e) => setNewInstance(prev => ({ ...prev, instanceNumber: e.target.value }))}
           />
         </div>

         <div className="space-y-2">
           <Label>{t('lawyers.case_sheet.instances.court')}</Label>
           <Input 
             value={newInstance.courtName || ''}
             onChange={(e) => setNewInstance(prev => ({ ...prev, courtName: e.target.value }))}
           />
         </div>

         <div className="space-y-2">
           <Label>{t('lawyers.case_sheet.instances.judge')}</Label>
           <Input 
             value={newInstance.judge || ''}
             onChange={(e) => setNewInstance(prev => ({ ...prev, judge: e.target.value }))}
           />
         </div>
       </div>

       <DialogFooter>
         <Button variant="outline" onClick={() => setIsInstanceDialogOpen(false)}>
           {t('common.cancel')}
         </Button>
         <Button onClick={handleCreateInstance}>
           {t('common.save')}
         </Button>
       </DialogFooter>
     </DialogContent>
    </Dialog>

    {/* Contractor Creation Sheet Stacking */}

    <ContractorSheet 
        contractor={null}
        initialName={pendingContractorName}
        open={isContractorSheetOpen}
        onOpenChange={(open) => {
          if (!open) {
            contractorResolverRef.current?.reject();
            contractorResolverRef.current = null;
            setIsContractorSheetOpen(false);
          }
        }}
        onSave={handleAddContractorSuccess}
    />
    </>
  );
}
