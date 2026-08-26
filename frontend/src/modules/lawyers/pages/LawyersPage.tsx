// frontend/src/modules/lawyers/pages/LawyersPage.tsx
import { usePageSettings } from "@/context/LayoutContext";
import { StatsCard, Button, Tabs, TabsContent, Skeleton } from "@/components/ui";
import { SortableTabsList } from "@/components/shared";
import { Plus, Scale, Gavel, Briefcase, FileText, Building2, ChevronDown, PenSquare, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LawyerSheet } from "../components/LawyerSheet";
import { CaseSheet } from "../components/CaseSheet";
import { LawyersList } from "../components/LawyersList";
import { CasesList } from "../components/CasesList";
import { LawyersFilterContent } from "../components/LawyersFilterContent";
import { CourtsJudgesTab } from "../components/CourtsJudgesTab";
import { BulkEditDialog, DataTableToolbar } from "@/components/shared";
 
import { QuickActionSheet } from "@/modules/contractors/components/QuickActionSheet";
import { useLawyersPage } from "../hooks/useLawyersPage";
import type { LawyerTabType } from "../types";

export default function Lawyers() {
  const {
    t,
    activeTab,
    setActiveTab,
    lawyerStatuses,
    caseStatuses,
    caseQuickActions,
    lawyers,
    cases,
    contractors,
    statusFilter,
    setStatusFilter,
    lawyerFilter,
    setLawyerFilter,
    lawyerStatusFilter,
    setLawyerStatusFilter,
    hideArchived,
    setHideArchived,
    selectedLawyer,
    isLawyerSheetOpen,
    setIsLawyerSheetOpen,
    selectedCase,
    isCaseSheetOpen,
    setIsCaseSheetOpen,
    isBulkEditDialogOpen,
    setIsBulkEditDialogOpen,
    eventSheet,
    setEventSheet,
    reminderSheet,
    setReminderSheet,
    casesTable,
    lawyersTable,
    displayedCases,
    filteredLawyers,
    paginatedCases,
    paginatedLawyers,
    handleBulkDelete,
    handleBulkEdit,
    handleEditLawyer,
    handleAddLawyer,
    handleSaveLawyer,
    handleDeleteLawyer,
    handleEditCase,
    handleAddCase,
    handleSaveCase,
    handleDeleteCase,
    handleAddContractor,
    handleQuickAction,
    isLoading,
    lawyerQuickActions,
    getStatusesByModule,
    getPrioritiesByModule,
    settings,
    isSettingsLoading,
    handleSyncKad,
    isSyncing,
  } = useLawyersPage();

  const priorities = getPrioritiesByModule("calendar");
  const calendarStatuses = getStatusesByModule("calendar");

  const mainAction = useMemo(() =>
    activeTab === "specialists" ? (
      <Button className="gap-2 h-9" onClick={handleAddLawyer}>
        <Plus className="w-4 h-4" />
        {t("lawyers.add_button")}
      </Button>
    ) : activeTab === "claims" ? (
      <Button className="gap-2 h-9" onClick={() => handleAddCase("claim")}>
        <Plus className="w-4 h-4" />
        {t("lawyers.add_claim")}
      </Button>
    ) : activeTab === "courts" ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="gap-2 h-9">
            <Plus className="w-4 h-4" />
            {t('common.create')}
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('openCourtJudgeSheet', { detail: { type: 'court' } }))}>
            <Building2 className="w-4 h-4 mr-2" />
            {t("lawyers.case_sheet.courts.court")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('openCourtJudgeSheet', { detail: { type: 'judge' } }))}>
            <Gavel className="w-4 h-4 mr-2" />
            {t("lawyers.case_sheet.courts.judge")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) : (
      <div className="flex gap-2">
        <Button variant="outline" className="gap-2 h-9" onClick={handleSyncKad} disabled={isSyncing}>
          <RefreshCcw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
          Синхронизация с КАД
        </Button>
        <Button className="gap-2 h-9" onClick={() => handleAddCase("court")}>
          <Plus className="w-4 h-4" />
          {t("lawyers.add_case")}
        </Button>
      </div>
    ), [activeTab, handleAddLawyer, handleAddCase, t, isSyncing, handleSyncKad]);

  // Настройка метаданных страницы
  usePageSettings({
    title: t("lawyers.title"),
    subtitle: t("lawyers.subtitle"),
    breadcrumbs: useMemo(() => [{ label: t("lawyers.title") }], [t]),
    actions: mainAction
  });

  const columnLabels = {
    specialists: {
      name: "lawyers.table.name",
      specialization: "lawyers.table.specialization",
      rating: "lawyers.table.rating",
      caseload: "lawyers.table.caseload",
      status: "lawyers.table.status",
    },
    cases: {
      title: "lawyers.table.case_name",
      plaintiff: "lawyers.table.plaintiff",
      defendant: "lawyers.table.defendant",
      client: "lawyers.table.client",
      lawyer: "lawyers.table.lawyer",
      status: "lawyers.table.status",
      outcome: "lawyers.table.outcome",
      claim_amount: "lawyers.table.claim_amount",
      expenses: "lawyers.table.expenses",
      total: "lawyers.table.total",
      deadline: "lawyers.table.deadline",
      price: "lawyers.table.price",
      sent_date: "lawyers.table.sent_date",
      response_due_date: "lawyers.table.response_due_date",
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapTableState = (hook: any) => ({
    searchQuery: hook.searchQuery,
    setSearchQuery: hook.setSearchQuery,
    selectedIds: hook.selectedIds,
    toggleSelection: hook.toggleSelection,
    toggleAllSelection: hook.toggleAllSelection,
    clearSelection: hook.clearSelection,
    visibleColumns: hook.visibleColumns,
    toggleColumnVisibility: hook.toggleColumnVisibility,
    columnOrder: hook.columnOrder,
    moveColumn: hook.moveColumn,
    columnWidths: hook.columnWidths,
    setColumnWidth: hook.setColumnWidth,
    sortConfig: hook.sortConfig,
    handleSort: hook.handleSort,
    rowsPerPage: hook.rowsPerPage,
    setRowsPerPage: hook.setRowsPerPage,
    currentPage: hook.currentPage,
    setCurrentPage: hook.setCurrentPage,
    tabsConfig: hook.tabsConfig,
    moveTab: hook.moveTab,
    toggleTabVisibility: hook.toggleTabVisibility,
  });

  const showStats = settings?.features?.enableStatistics !== false;

  return (
    <>
      {isLoading || isSettingsLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        </div>
      ) : (
        <>
          {showStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <StatsCard title={t("lawyers.stats.total")} value={lawyers.length} icon={Scale} />
              <StatsCard
                title={t("lawyers.stats.active_cases")}
                value={cases.filter((c) => c.type === "court" && c.status !== "done").length}
                icon={Gavel}
                className="bg-primary/5 border-primary/10"
              />
              <StatsCard
                title={t("lawyers.stats.claims")}
                value={cases.filter((c) => c.type === "claim" && c.status !== "done").length}
                icon={FileText}
              />
            </div>
          )}

          <Tabs 
            value={activeTab} 
            onValueChange={(value) => {
              setActiveTab(value as LawyerTabType);
              if (value === 'specialists') lawyersTable.injectTabColumns('specialists');
              else casesTable.injectTabColumns(value);
            }} 
            className="space-y-4"
          >
            {/* Responsive Control Bar */}
            <div className="flex flex-nowrap justify-between items-center gap-4 overflow-x-auto overflow-y-hidden w-full mb-4 pb-1">
              <SortableTabsList
                tabsConfig={casesTable.tabsConfig}
                onReorder={casesTable.reorderTab}
                t={t}
                className="h-10 sm:h-11 gap-1 p-1 bg-muted/50 rounded-xl flex-shrink-0 flex-nowrap w-max"
                triggerClassName="flex-none gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg font-medium px-3 sm:px-4 whitespace-nowrap"
              />

              <DataTableToolbar
                searchQuery={activeTab === "specialists" ? lawyersTable.searchQuery : casesTable.searchQuery}
                onSearchChange={activeTab === "specialists" ? lawyersTable.setSearchQuery : casesTable.setSearchQuery}
                selectedCount={activeTab === "specialists" ? lawyersTable.selectedIds.size : casesTable.selectedIds.size}
                onCancelSelection={activeTab === "specialists" ? lawyersTable.clearSelection : casesTable.clearSelection}
                filters={
                  <LawyersFilterContent
                    activeTab={activeTab}
                    statusFilter={statusFilter}
                    onStatusChange={setStatusFilter}
                    lawyerFilter={lawyerFilter}
                    onLawyerChange={setLawyerFilter}
                    caseStatuses={caseStatuses}
                    lawyers={lawyers}
                    lawyerStatusFilter={lawyerStatusFilter}
                    onLawyerStatusChange={setLawyerStatusFilter}
                    lawyerStatuses={lawyerStatuses}
                    hideArchived={hideArchived}
                    onHideArchivedChange={setHideArchived}
                  />
                }
                bulkActions={
                  <Button variant="outline" size="sm" className="h-8 gap-2" onClick={() => setIsBulkEditDialogOpen(true)}>
                    <PenSquare className="w-4 h-4" />
                    <span className="hidden sm:inline">{t("common.bulk_edit.button")}</span>
                  </Button>
                }
                onBulkDelete={handleBulkDelete}
                tabsConfig={activeTab === "specialists" ? lawyersTable.tabsConfig : casesTable.tabsConfig}
                onMoveTab={activeTab === "specialists" ? lawyersTable.moveTab : casesTable.moveTab}
                onToggleTab={activeTab === "specialists" ? lawyersTable.toggleTabVisibility : casesTable.toggleTabVisibility}
                visibleColumns={activeTab === "specialists" ? lawyersTable.visibleColumns : casesTable.visibleColumns}
                onToggleColumn={activeTab === "specialists" ? lawyersTable.toggleColumnVisibility : casesTable.toggleColumnVisibility}
                columnLabels={activeTab === "specialists" ? columnLabels.specialists : columnLabels.cases}
                columnOrder={activeTab === "specialists" ? lawyersTable.columnOrder : casesTable.columnOrder}
                className="w-max flex-nowrap bg-transparent border-0 shadow-none p-0 flex-shrink-0"
              />
            </div>

            <TabsContent value="specialists" className="m-0 outline-none">
              <LawyersList
                lawyers={paginatedLawyers}
                onEdit={handleEditLawyer}
                quickActions={lawyerQuickActions}
                onAction={handleQuickAction}
                table={mapTableState(lawyersTable)}
                totalCount={filteredLawyers.length}
              />
            </TabsContent>

            <TabsContent value="cases" className="m-0 outline-none">
              <CasesList
                cases={paginatedCases}
                onEdit={handleEditCase}
                quickActions={caseQuickActions}
                onAction={handleQuickAction}
                table={mapTableState(casesTable)}
                totalCount={displayedCases.length}
              />
            </TabsContent>

            <TabsContent value="claims" className="m-0 outline-none">
              <CasesList
                cases={paginatedCases}
                onEdit={handleEditCase}
                quickActions={caseQuickActions}
                onAction={handleQuickAction}
                table={mapTableState(casesTable)}
                totalCount={displayedCases.length}
              />
            </TabsContent>

            <TabsContent value="courts" className="m-0 outline-none"><CourtsJudgesTab /></TabsContent>
          </Tabs>

          <LawyerSheet
            lawyer={selectedLawyer}
            open={isLawyerSheetOpen}
            onOpenChange={setIsLawyerSheetOpen}
            onSave={handleSaveLawyer}
            onDelete={handleDeleteLawyer}
            allCases={cases}
          />

          <CaseSheet
            legalCase={selectedCase}
            open={isCaseSheetOpen}
            onOpenChange={setIsCaseSheetOpen}
            onSave={handleSaveCase}
            onDelete={handleDeleteCase}
            contractors={contractors}
            onAddContractor={handleAddContractor}
          />

          <BulkEditDialog
            moduleId="cases"
            open={isBulkEditDialogOpen}
            onOpenChange={setIsBulkEditDialogOpen}
            onConfirm={handleBulkEdit}
            count={casesTable.selectedIds.size}
            referenceData={{
              statuses: caseStatuses,
              users: lawyers.map(l => ({ id: l.id, name: l.name })),
              contractors: contractors.map(c => ({ id: String(c.id), name: c.name })),
              recentUsers: lawyers.map(l => ({ id: l.id, name: l.name })),
            }}
          />

          <QuickActionSheet
            type="event"
            open={eventSheet.isOpen}
            onOpenChange={(open) => setEventSheet(prev => ({ ...prev, isOpen: open }))}
            contractorName={eventSheet.contractorName}
            contractorId={eventSheet.contractorId}
            statuses={calendarStatuses}
            priorities={priorities}
            initialDescription={eventSheet.description}
            initialLocation={eventSheet.location}
          />

          <QuickActionSheet
            type="reminder"
            open={reminderSheet.isOpen}
            onOpenChange={(open) => setReminderSheet(prev => ({ ...prev, isOpen: open }))}
            contractorName={reminderSheet.contractorName}
            contractorId={reminderSheet.contractorId}
            statuses={calendarStatuses}
            priorities={priorities}
            initialDescription={reminderSheet.description}
          />
        </>
      )}
    </>
  );
}
