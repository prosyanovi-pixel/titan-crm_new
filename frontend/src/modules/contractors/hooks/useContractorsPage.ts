import { useState, useMemo, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useValidationToast } from "@/components/shared";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { api } from "@/lib/api";
import { parseRowsPerPage } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { useSettings } from "@/hooks/use-settings";
import { useDataTable } from "@/hooks/useDataTable";
import { usePersistedTab } from "@/hooks/usePersistedTab";
import { useBulkSelection } from "@/hooks/useBulkSelection";

import { useContractorActions } from "../hooks";
import { useContractors, useContractorReferences, useContractorMutations, CONTRACTOR_KEYS } from "./useContractorQueries";
import { useModuleSettings } from "@/modules/settings/hooks/useModuleSettings";
import { 
  useContractorSheetManager, 
  initialSheetState 
} from "./useContractorSheetManager";
import { useContractorTabsManager } from "./useContractorTabsManager";
import { useContractorBulkActions } from "./useContractorBulkActions";
import { Contractor } from "../types/contractor.types";
import { Users } from "lucide-react";
import { ContractorsQueryParams } from "../api/contractors.api";

/**
 * Основной хук для оркестрации страницы контрагентов.
 * Управляет данными, фильтрацией, сортировкой, пагинацией и различными панелями (шторами).
 * 
 * @returns Состояния и методы для управления страницей контрагентов
 */
export function useContractorsPage() {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const { 
    getStatusesByModule, 
    getTagsByModule, 
    getPrioritiesByModule,
    legalForms, 
    legalFormGroups,
    relationshipTypes 
  } = useSettings();
  const { validate } = useValidationToast();
  const navigate = useNavigate();

  // 1. UI Sheets Management (Tasks, Claims, Projects, Details)
  const {
    taskSheet, setTaskSheet,
    claimSheet, setClaimSheet,
    projectSheet, setProjectSheet,
    eventSheet, setEventSheet,
    reminderSheet, setReminderSheet,
    contractorSheet,
    openContractorSheet,
    closeContractorSheet,
  } = useContractorSheetManager();

  // 2. Table and Pagination State
  const { settings } = useModuleSettings("contractors");

  const {
    sortConfig,
    visibleColumns,
    columnOrder,
    tabsConfig,
    setTabsConfig,
    savedTabVisibilityRef,
    handleSort,
    toggleColumnVisibility,
    rowsPerPage,
    setRowsPerPage,
    currentPage,
    setCurrentPage,
    columnWidths,
    setColumnWidth,
    moveTab,
    moveColumn,
    reorderColumn,
    reorderTab,
    selectedIds: tableSelectedIds,
    setSelectedIds: setTableSelectedIds,
  } = useDataTable<Contractor>({
    initialData: [],
    initialColumns: {
      name: true,
      tags: true,
      type: true,
      status: true,
      phone: true,
      manager: true,
    },
    initialTabs: [
      { id: "all", label: "contractors.tabs.all", icon: Users, visible: true },
    ],
    storageKey: "contractors-table",
    defaultRowsPerPage: String(settings.display?.itemsPerPage || "25"),
  });

  // 3. Filtering State
  const [searchQuery, _setSearchQuery] = useState("");
  const setSearchQuery = useCallback((v: string) => {
    _setSearchQuery(v);
    setCurrentPage(1);
  }, [setCurrentPage]);

  const [statusFilter, _setStatusFilter] = useState<string>("all");
  const setStatusFilter = useCallback((v: string) => {
    _setStatusFilter(v);
    setCurrentPage(1);
  }, [setCurrentPage]);

  const [hideArchived, _setHideArchived] = useState<boolean>(true);
  const setHideArchived = useCallback((v: boolean) => {
    _setHideArchived(v);
    setCurrentPage(1);
  }, [setCurrentPage]);

  const [activeTab, _setActiveTab] = usePersistedTab<string>("tab:contractors", "all");
  const setActiveTab = useCallback((v: string) => {
    _setActiveTab(v);
    setCurrentPage(1);
  }, [setCurrentPage, _setActiveTab]);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);

  // 4. Dynamic Tabs Management
  useContractorTabsManager({
    legalFormGroups,
    relationshipTypes,
    activeTab,
    setActiveTab,
    setTabsConfig,
    savedTabVisibilityRef,
  });

  // 5. Data management - с серверными параметрами
  const serverParams: ContractorsQueryParams = useMemo(() => {
    const params: ContractorsQueryParams = {
      page: currentPage,
      limit: parseRowsPerPage(rowsPerPage),
    };

    if (searchQuery && searchQuery.trim()) {
      params.search = searchQuery.trim();
    }

    if (statusFilter && statusFilter !== "all") {
      params.status = statusFilter;
    }

    if (hideArchived) {
      params.excludeStatus = "archived";
    }

    if (activeTab && activeTab !== "all") {
      if (activeTab === "employee") {
        params.isEmployee = true;
      } else if (relationshipTypes.some(rt => rt.module === 'contractors' && rt.id === activeTab)) {
        params.type = activeTab;
      } else {
        params.groupId = activeTab;
      }
    }

    if (sortConfig) {
      params.sortField = sortConfig.key;
      params.sortOrder = sortConfig.direction;
    }

    return params;
  }, [currentPage, rowsPerPage, searchQuery, statusFilter, hideArchived, activeTab, sortConfig, relationshipTypes]);

  const { data: contractorsData, isLoading: loading, refetch } = useContractors(serverParams);
  const contractors = contractorsData?.data || [];
  const pagination = contractorsData?.pagination;
  const totalCount = pagination?.total || 0;

  const { data: references } = useContractorReferences();
  const { createMutation, updateMutation, deleteMutation, bulkDeleteMutation, bulkUpdateMutation } = useContractorMutations();
  const queryClient = useQueryClient();

  const refreshData = useCallback(async () => {
    await refetch();
    await queryClient.invalidateQueries({ queryKey: CONTRACTOR_KEYS.references });
  }, [refetch, queryClient]);

  const createContractor = useCallback(
    async (data: Partial<Contractor>) => {
      try { return await createMutation.mutateAsync(data); } catch { return null; }
    },
    [createMutation]
  );

  const updateContractor = useCallback(
    async (id: number, data: Partial<Contractor>) => {
      try { return await updateMutation.mutateAsync({ id, data }); } catch { return null; }
    },
    [updateMutation]
  );

  const deleteContractor = useCallback(
    async (id: number) => {
      try { await deleteMutation.mutateAsync(id); return true; } catch { return false; }
    },
    [deleteMutation]
  );

  /** Массовое удаление через единственный POST /contractors/bulk-delete */
  const deleteContractors = useCallback(
    async (ids: number[]) => {
      try { await bulkDeleteMutation.mutateAsync(ids); return true; } catch { return false; }
    },
    [bulkDeleteMutation]
  );

  // 6. Filtering Logic — серверная фильтрация
  const filteredContractors = contractors;

  // 7. Sorting Logic — серверная сортировка
  const sortedContractors = contractors;

  // 8. Pagination Logic — серверная пагинация
  const paginatedContractors = contractors;

  // Reset page logic is now handled by the wrapped setters above

  // 9. Bulk Selection & Actions
  const {
    selectedIds,
    toggleOne,
    toggleCurrentPage,
    toggleAllPages,
    clearSelection,
    selectCurrentPageOnly,
    isCurrentPageSelected,
    isAllSelected,
    isSomeSelected,
    selectedCount,
  } = useBulkSelection({
    allData: sortedContractors,
    pageData: paginatedContractors,
    selectedIds: tableSelectedIds,
    setSelectedIds: setTableSelectedIds,
    getId: (c) => c.id,
  });

  const { handleBulkUpdate, handleBulkDelete } = useContractorBulkActions({
    selectedIds,
    clearSelection,
    refreshData,
    deleteContractors,
  });

  // 10. Quick Actions & Handlers
  const { handleQuickAction } = useContractorActions({
    contractors,
    onCreateTask: (name, id) => setTaskSheet({ isOpen: true, contractorName: name, contractorId: id }),
    onCreateClaim: (name, id) => setClaimSheet({ isOpen: true, contractorName: name, contractorId: id }),
    onCreateProject: (name, id) => setProjectSheet({ isOpen: true, contractorName: name, contractorId: id }),
    onCreateEvent: (name, id) => setEventSheet({ isOpen: true, contractorName: name, contractorId: id }),
    onCreateReminder: (name, id) => setReminderSheet({ isOpen: true, contractorName: name, contractorId: id }),
    onAddNote: (_name, id) => openContractorSheet(Number(id), "overview"),
    onUpdateContractor: async (c) => { await updateContractor(c.id, c); },
    onDeleteContractor: async (id) => { await deleteContractor(id); },
    confirm,
  });

  const handleToggleTab = useCallback((tabId: string) => {
    setTabsConfig(prev => prev.map(tab =>
      tab.id === tabId ? { ...tab, visible: !tab.visible } : tab
    ));
  }, [setTabsConfig]);

  const handleToggleColumn = useCallback((column: string) => {
    toggleColumnVisibility(column, !visibleColumns[column]);
  }, [toggleColumnVisibility, visibleColumns]);

  return {
    t,
    getStatusesByModule,
    getTagsByModule,
    initialSheetState,
    contractors,
    references,
    loading,
    createContractor,
    updateContractor,
    deleteContractor,
    refreshData,
    
    // Sheets
    contractorSheet,
    openContractorSheet,
    closeContractorSheet,
    selectedContractor: contractorSheet.contractorId ? contractors.find(c => c.id === contractorSheet.contractorId) || null : null,
    taskSheet, setTaskSheet,
    claimSheet, setClaimSheet,
    projectSheet, setProjectSheet,
    eventSheet, setEventSheet,
    reminderSheet, setReminderSheet,
    getPrioritiesByModule,
    
    // Actions
    handleContractorQuickAction: handleQuickAction,
    handleBulkUpdate,
    handleBulkDelete,
    
    // Table/Selection
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    hideArchived, setHideArchived,
    activeTab, setActiveTab,
    sortConfig, handleSort,
    visibleColumns, handleToggleColumn,
    columnOrder, moveColumn, reorderColumn,
    tabsConfig, moveTab, reorderTab, handleToggleTab,
    rowsPerPage, setRowsPerPage,
    currentPage, setCurrentPage,
    columnWidths, setColumnWidth,
    
    // Selection state
    selectedIds,
    toggleSelection: toggleOne,
    toggleCurrentPage,
    toggleAllPages,
    clearSelection,
    selectCurrentPageOnly,
    isCurrentPageSelected,
    isAllSelected,
    isSomeSelected,
    selectedCount,
    
    // Data
    sortedContractors,
    paginatedContractors,
    totalCount,
    pagination,
    
    // Settings
    legalForms,
    legalFormGroups,
    relationshipTypes,
    
    // UI
    bulkEditOpen,
    setBulkEditOpen,
  };
}
