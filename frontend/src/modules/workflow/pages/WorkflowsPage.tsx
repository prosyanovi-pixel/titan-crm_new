import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Network, Plus, AlertCircle } from 'lucide-react';
import { usePageSettings } from "@/context/LayoutContext";
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import { toast } from 'sonner';
import { fetchWorkflows, deleteWorkflow, Workflow, runWorkflow } from '../api/workflowAPI';
import { useModuleSettings } from '@/modules/settings/hooks/useModuleSettings';
import {
  WorkflowCanvas, 
  ExecutionHistorySheet, 
  WorkflowTableRow 
} from '../components';
import { useDataTable } from '@/hooks/useDataTable';
import { DataTable } from '@/components/ui/data-table';
import { useConfirm } from '@/components/ui/confirm-dialog';

export const WorkflowsPage: React.FC = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { settings } = useModuleSettings("workflows");
  const [isEditorOpen, setIsEditorOpen]       = useState(false);
  const [selectedWorkflowId, setSelectedId]   = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen]     = useState(false);
  const [historyTarget, setHistoryTarget]     = useState<Workflow | null>(null);
  const { confirm } = useConfirm();

  const { data: workflowsRaw = [], isLoading, error, refetch } = useQuery({
    queryKey: ['workflows'],
    queryFn: fetchWorkflows,
    retry: false,
  });

  const workflows = useMemo(() => workflowsRaw as (Workflow & { id: string })[], [workflowsRaw]);

  const deleteMutation = useMutation({
    mutationFn: deleteWorkflow,
    onSuccess: () => {
      toast.success(t('workflows.toast.deleted'));
      qc.invalidateQueries({ queryKey: ['workflows'] });
    },
    onError: (e: Error) => toast.error(t('workflows.toast.delete_error'), { description: e.message }),
  });

  const handleCreate = () => {
    setSelectedId(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (id: string) => {
    setSelectedId(id);
    setIsEditorOpen(true);
  };

  const handleShowHistory = (wf: Workflow) => {
    setHistoryTarget(wf);
    setIsHistoryOpen(true);
  };

  const handleRunNow = async (id: string, dryRun: boolean = false) => {
    try {
      await runWorkflow(id, dryRun);
      toast.success(dryRun ? t('workflows.toast.dry_run_started') : t('workflows.toast.run_started'));
    } catch (e: unknown) {
      toast.error(t('workflows.toast.run_error'), { description: (e as Error).message });
    }
  };

  const tableHook = useDataTable<Workflow & { id: string }>({
    initialData: [],
    initialColumns: { name: true, trigger: true, status: true, steps: true },
    storageKey: 'workflows-table-v2',
  });

  const columnLabels: Record<string, string> = {
    name: t('workflows.table.name'),
    trigger: t('workflows.table.trigger'),
    status: t('workflows.table.status'),
    steps: t('workflows.table.steps'),
  };

  const filteredWorkflows = useMemo(() => {
    return workflows.filter(wf => 
      wf.name.toLowerCase().includes(tableHook.searchQuery.toLowerCase()) || 
      (wf.description && wf.description.toLowerCase().includes(tableHook.searchQuery.toLowerCase()))
    );
  }, [workflows, tableHook.searchQuery]);

  const paginatedWorkflows = useMemo(() => {
    const perPage = Number(tableHook.rowsPerPage) || 25;
    const start = (tableHook.currentPage - 1) * perPage;
    return filteredWorkflows.slice(start, start + perPage);
  }, [filteredWorkflows, tableHook.currentPage, tableHook.rowsPerPage]);

  const handleBulkDelete = async () => {
    const ok = await confirm({
      title: t('workflows.actions.confirm_delete_bulk', { count: tableHook.selectedIds.size }),
      description: t('common.confirm_bulk_deletion_text', { count: tableHook.selectedIds.size }),
      variant: "destructive",
    });
    if (ok) {
      for (const id of Array.from(tableHook.selectedIds)) {
        await deleteMutation.mutateAsync(id as string);
      }
      tableHook.clearSelection();
    }
  };

  const mapTableState = (hook: ReturnType<typeof useDataTable<Workflow & { id: string }>>) => ({
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
  });

  const actions = (
    <Button onClick={handleCreate} className="gap-2 h-9">
      <Plus className="w-4 h-4" />
      <span className="hidden sm:inline">{t('workflows.new_workflow')}</span>
    </Button>
  );

  usePageSettings({
    title: t('workflows.title'),
    subtitle: t('workflows.subtitle'),
    breadcrumbs: [{ label: t('workflows.title') }],
    actions
  });

  return (
    <>
      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{t('workflows.errors.load_failed')}</p>
            <p className="text-xs opacity-75 truncate">{(error as Error)?.message}</p>
          </div>
          <Button variant="outline" size="sm" className="h-8 border-red-200 hover:bg-red-100" onClick={() => refetch()}>
            {t('workflows.actions.retry')}
          </Button>
        </div>
      ) : (
        <DataTable
          table={mapTableState(tableHook)}
          data={paginatedWorkflows}
          columnLabels={columnLabels}
          totalCount={filteredWorkflows.length}
          searchPlaceholder={t('workflows.search_placeholder')}
          onBulkDelete={handleBulkDelete}
          isLoading={isLoading}
          renderRow={(wf) => (
            <WorkflowTableRow
              key={wf.id}
              workflow={wf}
              selectedIds={tableHook.selectedIds}
              visibleColumns={tableHook.visibleColumns}
              columnOrder={tableHook.columnOrder}
              columnWidths={tableHook.columnWidths}
              onToggleSelection={tableHook.toggleSelection}
              onEdit={handleEdit}
              onRun={handleRunNow}
              onDelete={(id) => deleteMutation.mutate(id)}
              onShowHistory={settings.features?.enableExecutionLog !== false ? handleShowHistory : undefined}
            />
          )}
          virtualized={true}
          className="flex-1"
        />
      )}

      {isEditorOpen && (
        <WorkflowCanvas
          workflowId={selectedWorkflowId}
          onClose={() => setIsEditorOpen(false)}
          onSaveComplete={() => {
            setIsEditorOpen(false);
            refetch();
          }}
        />
      )}

      {isHistoryOpen && (
        <ExecutionHistorySheet 
          open={isHistoryOpen}
          onOpenChange={setIsHistoryOpen}
          workflowId={historyTarget?.id || null}
          workflowName={historyTarget?.name || ''}
        />
      )}
    </>
  );
};

export default WorkflowsPage;
