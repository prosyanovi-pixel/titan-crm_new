/**
 * Contracts Page - Main list view with tabs (Contracts / Templates)
 * Tabs and DataTableToolbar are on a single row following the standard ProjectsPage pattern.
 * Creating contracts/templates opens a Sheet drawer (not a separate page).
 */

import { TableSkeleton, CardSkeleton } from '@/components/shared/skeletons';
import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { useBulkActions } from "@/modules/registry/hooks/useBulkActions";
import { Routes, Route, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, PenSquare, LayoutList, LayoutGrid } from 'lucide-react';
import { ContractList, ContractSheet, ContractFilters } from '../components';

import { useBulkDeleteContracts, useBulkUpdateContractStatus } from '../hooks';
import ContractDetailPage from './ContractDetailPage';
import ContractTemplatesPage from './ContractTemplatesPage';
import { useDataTable } from '@/hooks/useDataTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DataTableToolbar, BulkEditDialog, SortableTabsList } from '@/components/shared';
import { usePageSettings } from '@/context/LayoutContext';
import { TabConfig } from '@/hooks/useDataTable';
import { FileText, FileType } from 'lucide-react';
import type { Contract } from '../types/contract.types';
import type { ContractTemplate } from '../types/contract.types';
import { CONTRACT_STATUS } from '../types/contract.types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const contractColumnLabels: Record<string, string> = {
  contractNumber: 'contracts.table.contract_number',
  name: 'contracts.table.name',
  startDate: 'contracts.table.start_date',
  endDate: 'contracts.table.end_date',
  status: 'contracts.table.status',
  contractorName: 'contracts.table.contractor',
  type: 'contracts.table.type',
  amount: 'contracts.table.amount',
  paymentStatus: 'contracts.table.payment_status',
  tags: 'contracts.form.fields.tags',
  assignedTo: 'contracts.table.assigned_to',
  createdAt: 'contracts.table.created_at',
};

const templateColumnLabels: Record<string, string> = {
  name: 'general.name',
  category: 'contracts.templates.category',
  status: 'general.status',
  createdAt: 'general.created',
};

function ContractListView() {
  const { t } = useTranslation();
  
  const DEFAULT_CONTRACTS_TABS: TabConfig[] = [
    { id: 'contracts', label: 'contracts.list.title', icon: FileText, visible: true },
    { id: 'templates', label: 'contracts.templates.title', icon: FileType, visible: true },
  ];
  
  const [activeTab, setActiveTab] = React.useState('contracts');
  const [viewMode, setViewMode] = React.useState<'list' | 'kanban'>('list');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [advancedFilters, setAdvancedFilters] = React.useState<Record<string, unknown>>({});

  // Sheet state for creating/editing a contract
  const [contractSheetOpen, setContractSheetOpen] = React.useState(false);
  const [editingContract, setEditingContract] = React.useState<Contract | null>(null);

  // Dialog state for creating a template (passed to ContractTemplatesPage)
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = React.useState(false);

  const [tabsConfig, setTabsConfig] = React.useState<TabConfig[]>(() => {
    const saved = localStorage.getItem('contracts-tabs-order');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const mapped = parsed.map((p: { id: string; visible?: boolean }) => {
          const def = DEFAULT_CONTRACTS_TABS.find(d => d.id === p.id);
          return def ? { ...def, visible: p.visible ?? true } : null;
        }).filter(Boolean);
        if (mapped.length === DEFAULT_CONTRACTS_TABS.length) return mapped;
      } catch {
        // Ignore JSON parsing errors
      }
    }
    return DEFAULT_CONTRACTS_TABS;
  });

  const reorderTab = React.useCallback((fromId: string, toId: string) => {
    setTabsConfig(prev => {
      const newTabs = [...prev];
      const fromIndex = newTabs.findIndex(t => t.id === fromId);
      const toIndex = newTabs.findIndex(t => t.id === toId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const [item] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, item);
      localStorage.setItem('contracts-tabs-order', JSON.stringify(newTabs.map(t => ({ id: t.id, visible: t.visible }))));
      return newTabs;
    });
  }, []);

  // Separate table state for contracts and templates
  const contractTable = useDataTable<Contract>({
    initialData: [],
    initialColumns: {
      contractNumber: true,
      name: true,
      status: true,
      contractorName: true,
      type: true,
      amount: true,
      paymentStatus: true,
      tags: true,
      assignedTo: false,
      createdAt: true,
    },
    defaultColumnWidths: {
      contractNumber: 120,
      name: 190,
      status: 160,
      contractorName: 180,
      type: 130,
      amount: 150,
      paymentStatus: 170,
      tags: 180,
      assignedTo: 160,
      createdAt: 150,
    },
    storageKey: 'contracts-table',
  });

  const [isBulkEditOpen, setIsBulkEditOpen] = React.useState(false);
  const bulkDeleteMutation = useBulkDeleteContracts();
  const bulkUpdateStatusMutation = useBulkUpdateContractStatus();

  const handleBulkDelete = () => {
    const ids = Array.from(contractTable.selectedIds) as string[];
    if (ids.length === 0) return;
    bulkDeleteMutation.mutate(ids, {
      onSuccess: () => {
        contractTable.clearSelection();
      },
    });
  };

  const handleBulkEditConfirm = (field: string, value: string) => {
    // Support status bulk-edit for contracts
    if (field === 'status') {
      const ids = Array.from(contractTable.selectedIds) as string[];
      bulkUpdateStatusMutation.mutate({ contractIds: ids, newStatus: value }, {
        onSuccess: () => {
          contractTable.clearSelection();
          setIsBulkEditOpen(false);
        },
      });
    }
  };

  const templateTable = useDataTable<ContractTemplate>({
    initialData: [],
    initialColumns: {
      name: true,
      category: true,
      status: true,
      createdAt: true,
    },
    storageKey: 'contract-templates-table',
  });

  // Action button in page header switches based on active tab
  const actions = activeTab === 'contracts' ? (
    <Button className="gap-2 h-9" onClick={() => setContractSheetOpen(true)}>
      <Plus className="w-4 h-4" />
      <span className="hidden sm:inline">{t('contracts.toolbar.create')}</span>
    </Button>
  ) : (
    <Button className="gap-2 h-9" onClick={() => setIsTemplateDialogOpen(true)}>
      <Plus className="w-4 h-4" />
      <span className="hidden sm:inline">{t('contracts.templates.create')}</span>
    </Button>
  );

  usePageSettings({
    title: t('contracts.title'),
    subtitle: t('contracts.subtitle'),
    breadcrumbs: [{ label: t('contracts.title') }],
    actions,
  });

  const contractFilters = (
    <div className="p-2 space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase">
            {t('contracts.filters.filter_status')}
          </label>
          <Select
            value={statusFilter}
            onValueChange={(v) => { setStatusFilter(v); contractTable.setCurrentPage(1); }}
          >
            <SelectTrigger className="w-full h-8">
              <SelectValue placeholder={t('contracts.toolbar.filter_status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('general.all')}</SelectItem>
              {Object.values(CONTRACT_STATUS).map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`contracts.status.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <ContractFilters
            filters={advancedFilters}
            onChange={(next) => { setAdvancedFilters(next as Record<string, unknown>); contractTable.setCurrentPage(1); }}
            onClear={() => { setAdvancedFilters({}); contractTable.setCurrentPage(1); }}
          />
        </div>
      </div>
    </div>
  );

  const bulkActionsList = useBulkActions("contracts");
  const hasBulkDelete = bulkActionsList.some(a => a.id === "bulk_delete");
  const hasBulkEdit = bulkActionsList.some(a => a.id === "bulk_edit");

  return (
    <>
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">

          {/* ─── Single row: Tabs + Toolbar ─── */}
          <div className="flex flex-nowrap justify-between items-center gap-4 overflow-x-auto overflow-y-hidden w-full mb-4 pb-1">

            {/* Tabs */}
            <SortableTabsList
              tabsConfig={tabsConfig}
              onReorder={reorderTab}
              t={t}
              className="h-10 sm:h-11 gap-1 p-1 bg-muted/50 rounded-xl flex-shrink-0 flex-nowrap w-max"
              triggerClassName="flex-none gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg font-medium px-3 sm:px-4 whitespace-nowrap"
            />

            {/* Contracts toolbar */}
            {activeTab === 'contracts' && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as 'list' | 'kanban')} className="bg-background border rounded-lg h-9 p-0.5">
                  <ToggleGroupItem value="list" aria-label="List view" className="px-2.5 h-8 data-[state=on]:bg-muted">
                    <LayoutList className="w-4 h-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="kanban" aria-label="Kanban view" className="px-2.5 h-8 data-[state=on]:bg-muted">
                    <LayoutGrid className="w-4 h-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
                
                <DataTableToolbar
                  searchQuery={contractTable.searchQuery}
                  onSearchChange={contractTable.setSearchQuery}
                  selectedCount={contractTable.selectedIds.size}
                  onBulkDelete={hasBulkDelete ? handleBulkDelete : undefined}
                  bulkActions={
                    hasBulkEdit ? (
                      <Button variant="outline" size="sm" className="h-8 gap-2" onClick={() => setIsBulkEditOpen(true)}>
                        <PenSquare className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('contracts.bulk_actions.edit')}</span>
                      </Button>
                    ) : null
                  }
                  onCancelSelection={contractTable.clearSelection}
                  visibleColumns={contractTable.visibleColumns}
                  onToggleColumn={contractTable.toggleColumnVisibility}
                  columnLabels={contractColumnLabels}
                  columnOrder={contractTable.columnOrder}
                  onMoveColumn={contractTable.moveColumn}
                  filters={contractFilters}
                  filterDropdownWidth="w-[90vw] sm:w-[500px] lg:w-[700px] p-2"
                  searchPlaceholder={t('contracts.filters.search_placeholder')}
                  className="w-max flex-nowrap bg-transparent border-0 shadow-none p-0 flex-shrink-0"
                />
              </div>
            )}

            {/* Templates toolbar */}
            {activeTab === 'templates' && (
              <DataTableToolbar
                searchQuery={templateTable.searchQuery}
                onSearchChange={templateTable.setSearchQuery}
                selectedCount={templateTable.selectedIds.size}
                onCancelSelection={templateTable.clearSelection}
                visibleColumns={templateTable.visibleColumns}
                onToggleColumn={templateTable.toggleColumnVisibility}
                columnLabels={templateColumnLabels}
                columnOrder={templateTable.columnOrder}
                onMoveColumn={templateTable.moveColumn}
                searchPlaceholder={t('contracts.filters.search_placeholder')}
                className="w-max flex-nowrap bg-transparent border-0 shadow-none p-0 flex-shrink-0"
              />
            )}
          </div>

          <TabsContent value="contracts" className="m-0 outline-none h-full">
            <ContractList
              table={contractTable}
              statusFilter={statusFilter}
              advancedFilters={advancedFilters}
              viewMode={viewMode}
            />
          </TabsContent>

          <TabsContent value="templates" className="m-0 outline-none">
            <ContractTemplatesPage
              isCreateOpen={isTemplateDialogOpen}
              onOpenCreate={setIsTemplateDialogOpen}
              externalSearch={templateTable.searchQuery}
            />
          </TabsContent>
        </Tabs>

        <BulkEditDialog
          moduleId="contracts"
          open={isBulkEditOpen}
          onOpenChange={setIsBulkEditOpen}
          onConfirm={handleBulkEditConfirm}
          count={contractTable.selectedIds.size}
          referenceData={{
            statuses: Object.values(CONTRACT_STATUS).map((s) => ({ id: s, name: t(`contracts.status.${s}`) })),
          }}
        />
      </div>

      {/* ─── Contract Create/Edit Sheet ─── */}
      <ContractSheet
        open={contractSheetOpen}
        onOpenChange={(open) => {
          setContractSheetOpen(open);
          if (!open) {
            // Reset editing contract after a small delay to allow animation to finish
            setTimeout(() => setEditingContract(null), 300);
          }
        }}
        contract={editingContract}
        onSuccess={() => {
          setContractSheetOpen(false);
          setTimeout(() => setEditingContract(null), 300);
          contractTable.setCurrentPage(1);
        }}
      />
    </>
  );
}

export default function ContractsPage() {
  const location = useLocation();

  return (
    <Routes key={location.pathname}>
      <Route index element={<ContractListView />} />
      <Route path=":id" element={<ContractDetailPage />} />
    </Routes>
  );
}
