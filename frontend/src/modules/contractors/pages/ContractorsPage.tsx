import { useTranslation } from "@/lib/i18n";
import { usePageSettings } from "@/context/LayoutContext";
import {
  Plus
} from "lucide-react";
import { 
  ContractorSheet, 
  ContractorCreateSheet, 
  ContractorTableRow, 
  ContractorStats, 
  ContractorToolbar,
  QuickActionSheet 
} from "../components";
import { Contractor } from "../types/contractor.types";
import { useContractorsPage, useContractorsUIState } from "../hooks";
import { BulkEditDialog } from "@/components/shared";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SortableTabsList } from "@/components/shared";
import { DataTable } from "@/components/ui/data-table";
import { TableSkeleton } from "@/components/shared/skeletons";
import React, { useMemo, useState, useEffect } from "react";
import { useModuleSettings } from "@/modules/settings/hooks/useModuleSettings";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { getContractorQuickSheetKind } from "../utils/quickActionRouting";
import { useQuery } from "@tanstack/react-query";

export default function ContractorsPage() {
  const { t } = useTranslation();
  // UI state management (create sheet, bulk edit dialog)
  const { createSheetOpen, setCreateSheetOpen, bulkEditOpen, setBulkEditOpen } = useContractorsUIState();

  const { data: allUsers = [] } = useQuery({
    queryKey: ['contractors-users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return Array.isArray(response) ? response : (response?.data || []);
    },
    staleTime: 5 * 60 * 1000,
  });

  const {
    contractors,
    loading,
    searchQuery, setSearchQuery,
    selectedIds,
    handleBulkUpdate,
    getTagsByModule,
    legalForms,
    legalFormGroups,
    relationshipTypes,
    visibleColumns, columnOrder, tabsConfig,
    handleSort, toggleSelection, clearSelection, moveTab, moveColumn, reorderColumn, reorderTab,
    toggleCurrentPage, toggleAllPages,
    statusFilter, setStatusFilter,
    hideArchived, setHideArchived,
    activeTab, setActiveTab,
    sortedContractors, paginatedContractors, totalCount,
    currentPage, setCurrentPage,
    rowsPerPage, setRowsPerPage,
    handleToggleColumn, handleToggleTab,
    setColumnWidth, columnWidths,
    selectedCount, isAllSelected, isSomeSelected,
    openContractorSheet, closeContractorSheet, contractorSheet,
    handleBulkDelete,
    handleContractorQuickAction,
    createContractor, updateContractor, deleteContractor,
    // Task/Project Quick Actions
    taskSheet, setTaskSheet,
    claimSheet, setClaimSheet,
    projectSheet, setProjectSheet,
    eventSheet, setEventSheet,
    reminderSheet, setReminderSheet,
    getStatusesByModule,
    getPrioritiesByModule,
  } = useContractorsPage();

  const priorities = getPrioritiesByModule("calendar");
  const projectStatuses = getStatusesByModule("projects");
  const taskStatuses = getStatusesByModule("tasks");
  const caseStatuses = getStatusesByModule("legal-cases");
  const calendarStatuses = getStatusesByModule("calendar");

  usePageSettings({
    title: t("contractors.title"),
    subtitle: t("contractors.subtitle"),
    breadcrumbs: [{ label: t("contractors.title") }],
    actions: (
      <Button className="gap-2 h-9" onClick={() => setCreateSheetOpen(true)}>
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">{t("contractors.add_button")}</span>
      </Button>
    )
  });

  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('titan_user_id') : null;

  const recentUsers = useMemo(() => {
    if (!allUsers || !Array.isArray(allUsers) || allUsers.length === 0) return [];
    const sorted = [...allUsers].sort((a, b) => Number(b.id) - Number(a.id));
    const currentUser = currentUserId ? sorted.find(u => String(u.id) === currentUserId) : null;
    const others = sorted.filter(u => String(u.id) !== currentUserId).slice(0, 3);
    const result = currentUser ? [currentUser, ...others] : others.slice(0, 3);
    return result.slice(0, 3);
  }, [allUsers, currentUserId]);

  const handleContractorRowQuickAction = async (action: string, id: number | string) => {
    const contractor = contractors.find(c => c.id === Number(id));
    const sheetKind = getContractorQuickSheetKind(action);

    if (contractor && sheetKind) {
      const commonSheetState = {
        isOpen: true,
        contractorId: Number(id),
        contractorName: contractor.name,
      };

      switch (sheetKind) {
        case "task":
          setTaskSheet(commonSheetState);
          return;
        case "claim":
          setClaimSheet(commonSheetState);
          return;
        case "project":
          setProjectSheet(commonSheetState);
          return;
        case "event":
          setEventSheet(commonSheetState);
          return;
        case "reminder":
          setReminderSheet(commonSheetState);
          return;
      }
    }

    await handleContractorQuickAction(action, id);
  };


  const contractorColumnLabels: Record<string, string> = {
    name: t("contractor_sheet.field.name"),
    status: t("contractor_sheet.field.status"),
    type: t("contractor_sheet.field.type"),
    phone: t("contractor_sheet.field.phone"),
    manager: t("contractor_sheet.field.manager"),
    tags: t("contractor_sheet.field.tags"),
  };

  const tableState = {
    searchQuery, setSearchQuery,
    selectedIds, toggleSelection, toggleCurrentPage, toggleAllPages, clearSelection,
    toggleAllSelection: toggleCurrentPage, // Shim for DataTable component
    visibleColumns, toggleColumnVisibility: handleToggleColumn,
    columnOrder, moveColumn, reorderColumn,
    columnWidths, setColumnWidth,
    handleSort,
    tabsConfig, moveTab, toggleTabVisibility: handleToggleTab,
    rowsPerPage, setRowsPerPage,
    currentPage, setCurrentPage
  };

  const activeContractor = useMemo(() => {
    if (!contractorSheet.contractorId) return null;
    return contractors.find(c => c.id === contractorSheet.contractorId) || null;
  }, [contractors, contractorSheet.contractorId]);

  const handleSaveContractor = async (contractor: Contractor) => {
    await updateContractor(contractor.id, contractor);
  };

  const handleCreateContractor = async (contractor: Partial<Contractor>) => {
    const result = await createContractor(contractor);
    if (result) {
      setCreateSheetOpen(false);
    }
  };

  const { settings, isLoading: isSettingsLoading } = useModuleSettings("contractors");
  const showStats = settings.features?.enableStatistics !== false;

  return (
    <div className="space-y-6">
      {!isSettingsLoading && showStats && <ContractorStats contractors={contractors} />}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {/* ─── Single row: Tabs + Toolbar ─── */}
        <div className="flex flex-nowrap justify-between items-center gap-4 overflow-x-auto overflow-y-hidden w-full mb-4 pb-1">
          <SortableTabsList
            tabsConfig={tabsConfig}
            onReorder={reorderTab}
            t={t}
            className="h-10 sm:h-11 gap-1 p-1 bg-muted/50 rounded-xl flex-shrink-0 flex-nowrap w-max"
            triggerClassName="flex-none gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg font-medium px-3 sm:px-4 whitespace-nowrap"
          />

          <ContractorToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCount={selectedCount}
            onCancelSelection={clearSelection}
            onBulkDelete={handleBulkDelete}
            tabsConfig={tabsConfig}
            onMoveTab={moveTab}
            onToggleTab={handleToggleTab}
            visibleColumns={visibleColumns}
            onToggleColumn={handleToggleColumn}
            columnOrder={columnOrder}
            onMoveColumn={moveColumn}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            hideArchived={hideArchived}
            onHideArchivedChange={setHideArchived}
            statuses={getStatusesByModule("contractors")}
            onBulkEditClick={() => setBulkEditOpen(true)}
            onAddContractor={() => setCreateSheetOpen(true)}
            className="w-max flex-nowrap bg-transparent border-0 shadow-none p-0 flex-shrink-0"
          />
        </div>

        <TabsContent value={activeTab} className="mt-0 flex flex-col">
          {loading ? (
            <TableSkeleton showToolbar={false} rowCount={10} columnCount={6} />
          ) : (
            <DataTable
              table={tableState}
              data={paginatedContractors}
              columnLabels={contractorColumnLabels}
              totalCount={totalCount}
              virtualized={true}
              hideToolbar={true}
              renderRow={(contractor) => (
                <ContractorTableRow
                  key={contractor.id}
                  contractor={contractor}
                  selectedIds={selectedIds}
                  visibleColumns={visibleColumns}
                  columnOrder={columnOrder}
                  onToggleSelection={(id) => toggleSelection(id)}
                  onRowClick={() => openContractorSheet(contractor.id)}
                  onQuickAction={handleContractorRowQuickAction}
                  relationshipTypes={relationshipTypes}
                />
              )}
            />
          )}
        </TabsContent>
      </Tabs>

      <ContractorSheet
        contractor={activeContractor}
        open={contractorSheet.isOpen}
        initialTab={contractorSheet.initialTab}
        onOpenChange={(open) => {
          if (!open) {
            closeContractorSheet();
          }
        }}
        onSave={handleSaveContractor}
        onDelete={async (id) => {
           await deleteContractor(id);
        }}
      />

      <ContractorCreateSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        onSave={handleCreateContractor}
      />

      <BulkEditDialog
        moduleId="contractors"
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        onConfirm={handleBulkUpdate}
        count={selectedCount}
        referenceData={{
          statuses: getStatusesByModule("contractors"),
          relationshipTypes: relationshipTypes.filter(rt => rt.module === 'contractors'),
          legalForms,
          legalFormGroups,
          tags: getTagsByModule('contractors'),
          users: allUsers.length ? allUsers : [],
          recentUsers,
        }}
      />

      {/* Quick Action Sheets */}
      <QuickActionSheet
        type="task"
        open={taskSheet.isOpen}
        onOpenChange={(open) => setTaskSheet(prev => ({ ...prev, isOpen: open }))}
        contractorName={taskSheet.contractorName}
        contractorId={taskSheet.contractorId}
        statuses={taskStatuses}
        priorities={priorities}
      />

      <QuickActionSheet
        type="project"
        open={projectSheet.isOpen}
        onOpenChange={(open) => setProjectSheet(prev => ({ ...prev, isOpen: open }))}
        contractorName={projectSheet.contractorName}
        contractorId={projectSheet.contractorId}
        statuses={projectStatuses}
        priorities={priorities}
      />

      <QuickActionSheet
        type="claim"
        open={claimSheet.isOpen}
        onOpenChange={(open) => setClaimSheet(prev => ({ ...prev, isOpen: open }))}
        contractorName={claimSheet.contractorName}
        contractorId={claimSheet.contractorId}
        statuses={caseStatuses}
      />

      <QuickActionSheet
        type="event"
        open={eventSheet.isOpen}
        onOpenChange={(open) => setEventSheet(prev => ({ ...prev, isOpen: open }))}
        contractorName={eventSheet.contractorName}
        contractorId={eventSheet.contractorId}
        statuses={calendarStatuses}
        priorities={priorities}
        initialDescription={(() => {
          const contractor = contractors.find(c => c.id === eventSheet.contractorId);
          if (!contractor) return '';
          return t('contractors.quick_actions.event_description')
            .replace('{name}', contractor.name)
            .replace('{inn}', contractor.inn || t('common.no_data'))
            .replace('{phone}', contractor.phone || t('common.no_data'));
        })()}
        initialLocation={contractors.find(c => c.id === eventSheet.contractorId)?.legalAddress || ''}
      />

      <QuickActionSheet
        type="reminder"
        open={reminderSheet.isOpen}
        onOpenChange={(open) => setReminderSheet(prev => ({ ...prev, isOpen: open }))}
        contractorName={reminderSheet.contractorName}
        contractorId={reminderSheet.contractorId}
        statuses={calendarStatuses}
        priorities={priorities}
        initialDescription={(() => {
          const contractor = contractors.find(c => c.id === reminderSheet.contractorId);
          if (!contractor) return '';
          return t('contractors.quick_actions.reminder_description')
            .replace('{name}', contractor.name)
            .replace('{phone}', contractor.phone || t('common.no_data'));
        })()}
      />
    </div>
  );
}
