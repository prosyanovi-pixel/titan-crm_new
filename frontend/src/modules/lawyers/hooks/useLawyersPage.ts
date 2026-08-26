import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/lib/i18n";
import { useSettings } from "@/hooks/use-settings";
import { useDataTable } from "@/hooks/useDataTable";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { usePersistedTab } from "@/hooks/usePersistedTab";
import { useModuleSettings } from "@/modules/settings/hooks/useModuleSettings";
import { api } from "@/lib/api";
import { parseRowsPerPage } from "@/lib/utils";
import { toast } from "sonner";
import { 
  Scale, Gavel, FileText, Building2 
} from "lucide-react";
import { LegalCase, Lawyer, LawyerTabType } from "../types";

export function useLawyersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const { 
    getStatusesByModule, 
    getQuickActionsByModule, 
    getPrioritiesByModule,
    legalForms,
  } = useSettings();
  const { settings, isLoading: isSettingsLoading } = useModuleSettings("lawyers");

  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [cases, setCases] = useState<LegalCase[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [contractors, setContractors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [hideArchived, setHideArchived] = useState(true);
  const [lawyerFilter, setLawyerFilter] = useState("all");
  const [lawyerStatusFilter, setLawyerStatusFilter] = useState("all");
  const [hasDocumentsFilter, setHasDocumentsFilter] = useState(false);
  const [sortByFilter, setSortByFilter] = useState("updated_at");

  // Selection/Sheet state
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);
  const [isLawyerSheetOpen, setIsLawyerSheetOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);
  const [isCaseSheetOpen, setIsCaseSheetOpen] = useState(false);
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);

  const [eventSheet, setEventSheet] = useState({ 
    isOpen: false, 
    contractorName: '', 
    contractorId: '' as string | number, 
    description: '', 
    location: '' 
  });
  const [reminderSheet, setReminderSheet] = useState({ 
    isOpen: false, 
    contractorName: '', 
    contractorId: '' as string | number, 
    description: '', 
    location: '' 
  });

  const [activeTab, setActiveTab] = usePersistedTab<LawyerTabType>("tab:lawyers", "cases");

  // Table hooks
  const casesTable = useDataTable<LegalCase>({
    initialData: [],
    initialColumns: { title: true, lawyer: true, status: true, outcome: true, deadline: true },
    initialTabs: [
      { id: "cases",  label: "lawyers.tabs.cases", icon: Gavel, visible: true },
      { id: "claims", label: "lawyers.tabs.claims", icon: FileText, visible: true },
      { id: "specialists", label: "lawyers.tabs.specialists", icon: Scale, visible: true },
      { id: "courts", label: "lawyers.tabs.courts", icon: Building2, visible: false },
    ],
    storageKey: "lawyers-cases-table",
    defaultRowsPerPage: String(settings.display?.itemsPerPage || "25"),
  });

  const lawyersTable = useDataTable<Lawyer>({
    initialData: [],
    initialColumns: { name: true, specialization: true, rating: true, caseload: true, status: true },
    storageKey: "lawyers-specialists-table",
    defaultRowsPerPage: String(settings.display?.itemsPerPage || "25"),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalizeFromResponse = useCallback((l: any): Lawyer => ({
    ...l,
    id: String(l.id),
    activeCasesCount: Number(l.activeCasesCount || 0),
    rating: Number(l.rating || 0),
  }), []);

  const fetchLawyers = useCallback(async () => {
    try {
      const data = await api.get("/lawyers");
      setLawyers(data.map(normalizeFromResponse));
    } catch (err) {
      console.error("Failed to fetch lawyers data:", err);
    }
  }, [normalizeFromResponse]);

  const fetchCases = useCallback(async () => {
    try {
      const data = await api.get("/legal-cases");
      setCases(data);
    } catch (err) {
      console.error("Failed to fetch cases data:", err);
    }
  }, []);

  const fetchContractors = useCallback(async () => {
    try {
      const data = await api.get("/contractors?all=true");
      setContractors(data);
    } catch (err) {
      console.error("Failed to fetch contractors data:", err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchLawyers(), fetchCases(), fetchContractors()]);
    setLoading(false);
  }, [fetchLawyers, fetchCases, fetchContractors]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const lawyerStatuses = getStatusesByModule("lawyers");
  const caseStatuses = getStatusesByModule("cases");
  const caseQuickActions = getQuickActionsByModule("cases");
  const lawyerQuickActions = getQuickActionsByModule("lawyers");

  const displayedCases = useMemo(() => {
    let result = cases.filter(c => {
      if (activeTab === "claims") return c.type === "claim";
      if (activeTab === "cases") return c.type !== "claim";
      return true;
    });

    if (casesTable.searchQuery) {
      const q = casesTable.searchQuery.toLowerCase();
      result = result.filter(c => 
          c.title.toLowerCase().includes(q) || 
          (c.caseNumber ?? '').toLowerCase().includes(q)
      );
    }
    if (hideArchived) result = result.filter(c => c.status !== 'archived');
    if (statusFilter !== "all") result = result.filter((c) => c.status === statusFilter);
    if (lawyerFilter !== "all") result = result.filter((c) => c.lawyerName === lawyerFilter);
    
    return result;
  }, [cases, activeTab, casesTable.searchQuery, statusFilter, lawyerFilter, hideArchived]);

  const filteredLawyers = useMemo(() => {
    let result = lawyers.filter((l) =>
      (l.name ?? '').toLowerCase().includes(lawyersTable.searchQuery.toLowerCase())
    );
    if (hideArchived) result = result.filter(l => l.status !== 'archived');
    if (lawyerStatusFilter !== "all") {
      result = result.filter((l) => l.status === lawyerStatusFilter);
    }
    return result;
  }, [lawyers, lawyersTable.searchQuery, lawyerStatusFilter, hideArchived]);

  const casesPerPage = parseRowsPerPage(casesTable.rowsPerPage);
  const paginatedCases = displayedCases.slice((casesTable.currentPage - 1) * casesPerPage, casesTable.currentPage * casesPerPage);
  const paginatedLawyers = filteredLawyers.slice((lawyersTable.currentPage - 1) * casesPerPage, lawyersTable.currentPage * casesPerPage);

  const handleBulkDelete = async () => {
    const ok = await confirm({
      title: t('common.confirm_deletion'),
      description: t('common.confirm_bulk_deletion_text', { count: casesTable.selectedIds.size }),
      variant: 'destructive',
    });
    if (!ok) return;

    try {
      await Promise.all(Array.from(casesTable.selectedIds).map((id) => api.delete(`/legal-cases/${id}`)));
      setCases((prev) => prev.filter((c) => !casesTable.selectedIds.has(c.id)));
      casesTable.clearSelection();
      toast.success(t("general.toast.success.records_deleted"));
    } catch {
      toast.error(t("general.toast.error.records_delete"));
    }
  };

  const handleBulkEdit = async (field: string, value: string) => {
    try {
      const selectedIds = activeTab === 'specialists' ? lawyersTable.selectedIds : casesTable.selectedIds;
      const endpoint = activeTab === 'specialists' ? '/lawyers' : '/legal-cases';
      
      await api.post(`${endpoint}/bulk-update`, { 
        ids: Array.from(selectedIds), 
        updates: { [field]: value } 
      });
      
      if (activeTab === 'specialists') {
        await fetchLawyers();
        lawyersTable.clearSelection();
      } else {
        await fetchCases();
        casesTable.clearSelection();
      }
      toast.success(t("general.toast.success.records_updated"));
    } catch (err) {
      toast.error(t("general.toast.error.records_update"));
    }
  };

  const handleEditLawyer = (lawyer: Lawyer) => { setSelectedLawyer(lawyer); setIsLawyerSheetOpen(true); };
  const handleAddLawyer = () => { setSelectedLawyer(null); setIsLawyerSheetOpen(true); };

  const handleSaveLawyer = async (lawyer: Lawyer) => {
    try {
      if (selectedLawyer) await api.put(`/lawyers/${lawyer.id}`, lawyer);
      else await api.post("/lawyers", lawyer);
      await fetchLawyers();
      setIsLawyerSheetOpen(false);
      toast.success(t("general.toast.success.lawyer_updated"));
    } catch { toast.error(t("general.toast.error.lawyer_save")); }
  };

  const handleDeleteLawyer = async (id: string) => {
    const ok = await confirm({
      title: t('common.confirm_deletion'),
      description: t('common.confirm_deletion_text'),
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await api.delete(`/lawyers/${id}`);
      await fetchLawyers();
      setIsLawyerSheetOpen(false);
      toast.success(t("general.toast.success.lawyer_deleted"));
    } catch { toast.error(t("general.toast.error.lawyer_delete")); }
  };

  const handleEditCase = async (legalCase: LegalCase) => {
    const fullCase = await api.get(`/legal-cases/${legalCase.id}`);
    setSelectedCase(fullCase);
    setIsCaseSheetOpen(true);
  };

  const handleAddCase = (type: "court" | "claim") => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setSelectedCase({ type, status: "draft", title: "" } as any);
    setIsCaseSheetOpen(true);
  };

  const handleSaveCase = async (legalCase: LegalCase) => {
    try {
      if (legalCase.id) await api.put(`/legal-cases/${legalCase.id}`, legalCase);
      else await api.post("/legal-cases", legalCase);
      await fetchCases();
      setIsCaseSheetOpen(false);
      toast.success(t("general.toast.success.record_updated"));
    } catch { toast.error(t("general.toast.error.records_update")); }
  };

  const handleDeleteCase = async (id: string) => {
    const ok = await confirm({
      title: t('common.confirm_deletion'),
      description: t('common.confirm_deletion_text'),
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await api.delete(`/legal-cases/${id}`);
      await fetchCases();
      setIsCaseSheetOpen(false);
      toast.success(t("general.toast.success.record_deleted"));
    } catch { toast.error(t("general.toast.error.records_delete")); }
  };

  const handleQuickAction = async (action: string, id: string | number) => {
    const legalCase = cases.find(c => c.id === id);
    const lawyer = lawyers.find(l => l.id === id);
    
    if (action === 'delete') await handleDeleteCase(String(id));
    else if (action === 'edit') {
      if (legalCase) handleEditCase(legalCase);
      else if (lawyer) handleEditLawyer(lawyer);
    }
    else if (action === 'archive') {
      if (legalCase) {
        const ok = await confirm({
          title: t('lawyers.archive.case_title'),
          description: t('lawyers.archive.case_description').replace('{name}', legalCase.title),
        });
        if (ok) await handleSaveCase({ ...legalCase, status: 'archived' });
      } else if (lawyer) {
        const ok = await confirm({
          title: t('lawyers.archive.lawyer_title'),
          description: t('lawyers.archive.lawyer_description').replace('{name}', lawyer.name),
        });
        if (ok) await handleSaveLawyer({ ...lawyer, status: 'archived' });
      }
    }
    else if (action.startsWith('status:')) {
      const newStatus = action.replace('status:', '');
      if (legalCase) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await handleSaveCase({ ...legalCase, status: newStatus as any });
      } else if (lawyer) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await handleSaveLawyer({ ...lawyer, status: newStatus as any });
      }
    }
    else if (action === 'send_email') {
      const target = legalCase ? legalCase.client : (lawyer ? lawyer.name : 'Получатель');
      toast.info(t('general.toast.info.send_email').replace('{0}', target));
      navigate('/mail');
    }
    else if (action === 'make_call' || action === 'call') {
      const phone = lawyer ? lawyer.phone : null;
      const name = lawyer ? lawyer.name : (legalCase ? legalCase.client : 'Контакт');
      
      if (phone) {
        window.open(`tel:${phone}`, '_blank');
        toast.success(t('contractor_sheet.messages.call', { phone }));
      } else {
        toast.error(`У ${name} не указан номер телефона`);
      }
    }
    else if (action === 'add_note') {
      const name = legalCase ? legalCase.title : (lawyer ? lawyer.name : '');
      toast.info(t('general.toast.info.add_note').replace('{0}', name));
    }
    else if (action === 'create_event' || action === 'create_reminder') {
      const isReminder = action === 'create_reminder';
      const setter = isReminder ? setReminderSheet : setEventSheet;
      
      if (legalCase) {
        const descriptionParts = [];
        if (legalCase.caseNumber) descriptionParts.push(`Номер дела: ${legalCase.caseNumber}`);
        if (legalCase.lawyerName) descriptionParts.push(`Юрист: ${legalCase.lawyerName}`);
        if (legalCase.plaintiff) descriptionParts.push(`Истец: ${legalCase.plaintiff}`);
        if (legalCase.defendant) descriptionParts.push(`Ответчик: ${legalCase.defendant}`);
        if (legalCase.courtName) descriptionParts.push(`Суд: ${legalCase.courtName}`);
        
        const description = descriptionParts.join('\n');
        
        // Find contractorId if possible
        const contractor = contractors.find(c => c.name === legalCase.client);
        
        setter({
          isOpen: true,
          contractorName: legalCase.client || 'Клиент',
          contractorId: contractor?.id || '',
          description,
          location: legalCase.courtName || ''
        });
      } else if (lawyer) {
        setter({
          isOpen: true,
          contractorName: lawyer.name,
          contractorId: '',
          description: `Связаться с юристом: ${lawyer.name}\nТелефон: ${lawyer.phone || '—'}`,
          location: ''
        });
      }
    }
  };

  const handleSyncKad = async () => {
    setIsSyncing(true);
    try {
      await api.post("/legal-cases/sync");
      await fetchCases();
      toast.success("Синхронизация с КАД успешно завершена");
    } catch (err) {
      toast.error("Ошибка при синхронизации с КАД");
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    t, activeTab, setActiveTab, lawyerStatuses, caseStatuses, caseQuickActions, lawyers, cases, contractors,
    statusFilter, setStatusFilter, hideArchived, setHideArchived, lawyerFilter, setLawyerFilter, lawyerStatusFilter, setLawyerStatusFilter,
    selectedLawyer, isLawyerSheetOpen, setIsLawyerSheetOpen, selectedCase, isCaseSheetOpen, setIsCaseSheetOpen,
    isTaskSheetOpen, setIsTaskSheetOpen, isBulkEditDialogOpen, setIsBulkEditDialogOpen,
    eventSheet, setEventSheet,
    reminderSheet, setReminderSheet,
    casesTable, lawyersTable, displayedCases, filteredLawyers, paginatedCases, paginatedLawyers,
    handleBulkDelete, handleBulkEdit, handleEditLawyer, handleAddLawyer, handleSaveLawyer, handleDeleteLawyer,
    handleEditCase, handleAddCase, handleSaveCase, handleDeleteCase, handleQuickAction, handleSyncKad, isLoading: loading, isSyncing,
    handleAddContractor: () => {},
    getQuickActionsByModule,
    getStatusesByModule,
    getPrioritiesByModule,
    lawyerQuickActions,
    settings,
    isSettingsLoading,
  };
}
