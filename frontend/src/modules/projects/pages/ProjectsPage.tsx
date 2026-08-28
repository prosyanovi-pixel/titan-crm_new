import { usePageSettings } from "@/context/LayoutContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, PenSquare } from "lucide-react";
import {
  ProjectSheet,
  ProjectList,
  ProjectBoard,
  ProjectGantt,
  ProjectResources,
} from "../components";
import type { Project } from "../types";
import { ProjectsFilterContent } from "../components/ProjectsFilterContent";
import { ProjectStatsGroup } from "../components/ProjectStatsGroup";
import { DataTableToolbar, BulkEditDialog, SortableTabsList, BulkActionButton } from "@/components/shared";
import { TableSkeleton, CardSkeleton } from "@/components/shared/skeletons";
// eslint-disable-next-line no-restricted-imports
import { TaskSheet } from "@/modules/tasks/components/TaskSheet";
import { useProjectsPage } from "../hooks/useProjectsPage";
import { useTranslation } from "@/lib/i18n";
import { useModuleSettings } from "@/modules/settings/hooks/useModuleSettings";

export default function Projects() {
  const { t } = useTranslation();
  const {
    projects,
    activeTab,
    setActiveTab,
    references,
    contractors,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    managerFilter,
    setManagerFilter,
    projectTypeFilter,
    setProjectTypeFilter,
    hideArchived,
    setHideArchived,
    projectActions,
    table,
    sheetOpen,
    setSheetOpen,
    selectedProject,
    bulkEditOpen,
    setBulkEditOpen,
    taskSheetState,
    setTaskSheetState,
    sortedProjects,
    paginatedProjects,
    totalBudget,
    handleSaveTask,
    handleDeleteTask,
    handleAddProject,
    handleEditProject,
    handleSaveProject,
    handleDeleteProject,
      handleArchiveProject,
      handleDuplicateProject,
    handleBulkDelete,
    handleBulkEdit,
    handleQuickAction,
    handleStageChange,
    openProjectTaskSheet,
    isTreeView,
    setIsTreeView,
    isLoading,
  } = useProjectsPage();

  const columnLabels = {
    name: "projects.table.name",
    client: "common.client",
    manager: "common.manager",
    status: "common.status",
    priority: "common.priority",
    stage: "projects.table.stage",
    tags: "projects.table.tags",
    budget: "projects.table.budget_used",
    deadline: "projects.table.deadline",
  };

  const tableState = {
    searchQuery: table.searchQuery,
    setSearchQuery: table.setSearchQuery,
    selectedIds: table.selectedIds,
    toggleSelection: table.toggleSelection,
    toggleAllSelection: table.toggleAllSelection,
    clearSelection: table.clearSelection,
    visibleColumns: table.visibleColumns,
    toggleColumnVisibility: table.toggleColumnVisibility,
    columnOrder: table.columnOrder,
    moveColumn: table.moveColumn,
    columnWidths: table.columnWidths,
    setColumnWidth: table.setColumnWidth,
    sortConfig: table.sortConfig,
    handleSort: table.handleSort,
    tabsConfig: table.tabsConfig,
    moveTab: table.moveTab,
    toggleTabVisibility: table.toggleTabVisibility,
    rowsPerPage: table.rowsPerPage,
    setRowsPerPage: table.setRowsPerPage,
    currentPage: table.currentPage,
    setCurrentPage: table.setCurrentPage,
  };

  const actions = (
    <Button className="gap-2 h-9" onClick={handleAddProject}>
      <Plus className="w-4 h-4" />
      <span className="hidden sm:inline">{t("projects.new_project")}</span>
    </Button>
  );

  usePageSettings({
    title: t("projects.title"),
    subtitle: t("projects.subtitle"),
    breadcrumbs: [{ label: t("projects.title") }],
    actions
  });

  const { settings, isLoading: isSettingsLoading } = useModuleSettings("projects");
  const showStats = settings.features?.enableStatistics !== false;

  return (
    <>
      {!isSettingsLoading && showStats && <ProjectStatsGroup projects={projects} totalBudget={totalBudget} />}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)} className="space-y-4">
        <div className="flex flex-nowrap justify-between items-center gap-4 overflow-x-auto overflow-y-hidden w-full mb-4 pb-1">
          <SortableTabsList
            tabsConfig={table.tabsConfig}
            onReorder={table.reorderTab}
            t={t}
            className="h-10 sm:h-11 gap-1 p-1 bg-muted/50 rounded-xl flex-shrink-0 flex-nowrap w-max"
            triggerClassName="flex-none gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg font-medium px-3 sm:px-4 whitespace-nowrap"
          />

          <DataTableToolbar
            searchQuery={table.searchQuery}
            onSearchChange={table.setSearchQuery}
            selectedCount={table.selectedIds.size}
            onCancelSelection={table.clearSelection}
            onBulkDelete={handleBulkDelete}
            bulkActions={
              <BulkActionButton onClick={() => setBulkEditOpen(true)}>
                <PenSquare className="w-4 h-4" />
                <span className="hidden sm:inline">{t("projects.bulk_edit.button")}</span>
              </BulkActionButton>
            }
            tabsConfig={table.tabsConfig}
            onMoveTab={table.moveTab}
            onToggleTab={table.toggleTabVisibility}
            visibleColumns={table.visibleColumns}
            onToggleColumn={table.toggleColumnVisibility}
            columnLabels={columnLabels}
            columnOrder={table.columnOrder}
            onMoveColumn={table.moveColumn}
            className="w-max flex-nowrap bg-transparent border-0 shadow-none p-0 flex-shrink-0"
            filters={
              <ProjectsFilterContent
                references={references}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                priorityFilter={priorityFilter}
                onPriorityChange={setPriorityFilter}
                managerFilter={managerFilter}
                onManagerChange={setManagerFilter}
                projectTypeFilter={projectTypeFilter}
                onProjectTypeChange={setProjectTypeFilter}
                hideArchived={hideArchived}
                onHideArchivedChange={setHideArchived}
                isTreeView={isTreeView}
                onTreeViewChange={setIsTreeView}
              />
            }
          />
        </div>

        <TabsContent value="list" className="mt-0 outline-none">
          {isLoading ? (
            <TableSkeleton showToolbar={false} rowCount={10} columnCount={8} />
          ) : (
            <ProjectList
              projects={paginatedProjects}
              selectedIds={table.selectedIds as unknown as Set<number>}
              onToggleSelection={(id) => table.toggleSelection(id)}
              visibleColumns={table.visibleColumns}
              columnOrder={table.columnOrder}
              onReorderColumn={table.reorderColumn}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
              onSort={(column: string) => table.handleSort(column as keyof Project)}
              sortConfig={table.sortConfig}
              quickActions={projectActions}
              onAction={handleQuickAction}
              columnWidths={table.columnWidths}
              onResizeColumn={table.setColumnWidth}
              table={tableState}
              totalCount={sortedProjects.length}
            />
          )}
        </TabsContent>
<TabsContent value="board" className="mt-0 outline-none min-h-[400px]">
  {isLoading ? (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="min-w-[300px] w-[300px] space-y-4">
          <CardSkeleton count={3} />
        </div>
      ))}
    </div>
  ) : (
    <ProjectBoard
      projects={sortedProjects}
      onEdit={handleEditProject}
      onDelete={handleDeleteProject}
      onArchive={handleArchiveProject}
      onDuplicate={handleDuplicateProject}
      onStageChange={handleStageChange}
    />
  )}
</TabsContent>

        <TabsContent value="gantt" className="mt-0 outline-none">
          <ProjectGantt projects={sortedProjects} onEdit={handleEditProject} />
        </TabsContent>

        <TabsContent value="resources" className="mt-0 outline-none">
          <ProjectResources projects={sortedProjects} />
        </TabsContent>
      </Tabs>

      <ProjectSheet
        project={selectedProject}
        allProjects={projects}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSave={handleSaveProject}
        onDelete={handleDeleteProject}
        contractors={contractors}
        references={references}
        onOpenTaskSheet={openProjectTaskSheet}
      />

      <BulkEditDialog
        moduleId="projects"
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        onConfirm={handleBulkEdit}
        count={table.selectedIds.size}
        referenceData={{
          statuses: references.projectStatuses || [],
          priorities: references.priorities || [],
          users: references.managers || [],
        }}
      />

      <TaskSheet
        task={taskSheetState.task}
        open={taskSheetState.open}
        onOpenChange={(open) => {
          if (!open) setTaskSheetState();
        }}
        onSave={handleSaveTask as any}
        onDelete={handleDeleteTask}
        initialProject={taskSheetState.initialProject}
      />
    </>
  );
}
