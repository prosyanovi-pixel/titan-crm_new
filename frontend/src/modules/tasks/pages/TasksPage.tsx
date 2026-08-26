// frontend/src/modules/tasks/pages/TasksPage.tsx
import { usePageSettings } from "@/context/LayoutContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, CheckSquare, Kanban, PenSquare } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import React, { useMemo } from "react";
import { TaskList } from "../components/TaskList";
import { TaskBoard } from "../components/TaskBoard";
import { TaskSheet } from "../components/TaskSheet";
import { TasksFilterContent } from "../components/TasksFilterContent";
import { useTasksPage } from "../hooks/useTasksPage";
import { SortableTabsList, DataTableToolbar, BulkEditDialog, BulkActionButton } from "@/components/shared";
import { TableSkeleton, CardSkeleton } from "@/components/shared/skeletons";
import { TabConfig } from "@/hooks/useDataTable";
import { TaskStatsGroup } from "../components/TaskStatsGroup";
import { useModuleSettings } from "@/modules/settings/hooks/useModuleSettings";

export default function TasksPage() {
  const {
    t,
    tasks,
    users,
    loading,
    references,
    taskActions,
    activeTab,
    setActiveTab,
    isSheetOpen,
    setIsSheetOpen,
    selectedTask,
    bulkEditOpen,
    setBulkEditOpen,
    // Filters
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    assigneeFilter,
    setAssigneeFilter,
    hideArchived,
    setHideArchived,
    completedTaskId,
    // Table state
    searchQuery,
    setSearchQuery,
    selectedIds,
    visibleColumns,
    columnOrder,
    columnWidths,
    setColumnWidth,
    sortConfig,
    handleSort,
    toggleSelection,
    toggleAllSelection,
    clearSelection,
    toggleColumnVisibility,
    moveColumn,
    tabsConfig,
    reorderTab,
    moveTab,
    toggleTabVisibility,
    rowsPerPage,
    setRowsPerPage,
    currentPage,
    setCurrentPage,
    // Derived
    filteredTasks,
    paginatedTasks,
    // Handlers
    handleAddTask,
    handleEditTask,
    handleSaveTask,
    handleDeleteTask,
    handleBulkDelete,
    handleBulkStatusChange,
    handleStatusChange,
    handleQuickAction,
  } = useTasksPage();

  const columnLabels = {
    id: "tasks.table.id",
    title: "tasks.table.title",
    status: "common.status",
    priority: "common.priority",
    assignee: "tasks.table.assignee",
    dueDate: "tasks.table.due_date",
  };

  const tableState = {
    searchQuery,
    setSearchQuery,
    selectedIds,
    toggleSelection,
    toggleAllSelection,
    clearSelection,
    visibleColumns,
    toggleColumnVisibility,
    columnOrder,
    moveColumn,
    columnWidths,
    setColumnWidth,
    sortConfig,
    handleSort,
    tabsConfig,
    moveTab,
    toggleTabVisibility,
    rowsPerPage,
    setRowsPerPage,
    currentPage,
    setCurrentPage,
  };

  const actions = useMemo(() => (
    <Button className="gap-2 h-9" onClick={handleAddTask}>
      <Plus className="w-4 h-4" />
      <span className="hidden sm:inline">{t("tasks.new_task")}</span>
    </Button>
  ), [t, handleAddTask]);

  usePageSettings({
    title: t("tasks.title"),
    subtitle: t("tasks.subtitle"),
    breadcrumbs: useMemo(() => [{ label: t("tasks.title") }], [t]),
    actions
  });

  const { settings, isLoading: isSettingsLoading } = useModuleSettings("tasks");
  const showStats = settings.features?.enableStatistics !== false;

  return (
    <>
      {!isSettingsLoading && showStats && <TaskStatsGroup tasks={tasks} />}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Parameters<typeof setActiveTab>[0])} className="space-y-4">
        <div className="flex flex-nowrap justify-between items-center gap-4 overflow-x-auto overflow-y-hidden w-full mb-4 pb-1">
          <SortableTabsList
            tabsConfig={tabsConfig}
            onReorder={reorderTab}
            t={t}
            className="h-10 sm:h-11 gap-1 p-1 bg-muted/50 rounded-xl flex-shrink-0 flex-nowrap w-max"
            triggerClassName="flex-none gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg font-medium px-3 sm:px-4 whitespace-nowrap"
          />

          <DataTableToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCount={selectedIds.size}
            onCancelSelection={clearSelection}
            onBulkDelete={handleBulkDelete}
            tabsConfig={tabsConfig}
            onMoveTab={moveTab}
            onToggleTab={toggleTabVisibility}
            visibleColumns={visibleColumns}
            onToggleColumn={toggleColumnVisibility}
            columnLabels={columnLabels}
            columnOrder={columnOrder}
            onMoveColumn={moveColumn}
            filters={
              <TasksFilterContent
                references={references}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                priorityFilter={priorityFilter}
                onPriorityChange={setPriorityFilter}
                assigneeFilter={assigneeFilter}
                onAssigneeChange={setAssigneeFilter}
                hideArchived={hideArchived}
                onHideArchivedChange={setHideArchived}
              />
            }
            className="w-max flex-nowrap bg-transparent border-0 shadow-none p-0 flex-shrink-0"
            bulkActions={
              <BulkActionButton onClick={() => setBulkEditOpen(true)}>
                <PenSquare className="w-4 h-4" />
                <span className="hidden sm:inline">{t('common.bulk_edit.button')}</span>
              </BulkActionButton>
            }
          />
        </div>

        <TabsContent value="list" className="mt-0 outline-none">
          {loading ? (
            <TableSkeleton showToolbar={false} rowCount={10} columnCount={6} />
          ) : (
            <TaskList
              tasks={paginatedTasks}
              selectedIds={selectedIds}
              visibleColumns={visibleColumns}
              columnOrder={columnOrder}
              onEdit={handleEditTask}
              onAction={handleQuickAction}
              quickActions={taskActions}
              table={tableState}
              totalCount={filteredTasks.length}
            />
          )}
        </TabsContent>

        <TabsContent value="board" className="mt-0 outline-none min-h-[500px]">
          {loading ? (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="min-w-[300px] w-[300px] space-y-4">
                  <CardSkeleton count={4} />
                </div>
              ))}
            </div>
          ) : (
            <TaskBoard 
              tasks={filteredTasks} 
              onEdit={handleEditTask} 
              onStatusChange={handleStatusChange}
            />
          )}
        </TabsContent>
      </Tabs>

      <TaskSheet
        task={selectedTask}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        references={references}
      />

      <BulkEditDialog
        moduleId="tasks"
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        onConfirm={handleBulkStatusChange}
        count={selectedIds.size}
        referenceData={{
          statuses: [
            { id: "To Do", name: t("generated.k_vypolneniyu") },
            { id: "In Progress", name: t("generated.v_rabote") },
            { id: "Done", name: t("generated.vypolneno") },
          ],
          priorities: [
            { id: "High", name: t("generated.vysokiy") },
            { id: "Medium", name: t("generated.sredniy") },
            { id: "Low", name: t("generated.nizkiy") },
          ],
          users: users,
          assignee: users,
        }}
      />
    </>
  );
}
