import React, { useState, useMemo } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { usePageSettings } from '@/context/LayoutContext';
import { WarehousesList } from '../components/WarehousesList';
import { BalancesList } from '../components/BalancesList';
import { TransactionsList } from '../components/TransactionsList';
import { SortableTabsList, BulkActionButton } from '@/components/shared';
import { WarehouseToolbar } from '../components/WarehouseToolbar';
import { useWarehousePage } from '../hooks/useWarehousePage';
import { Button } from '@/components/ui/button';
import { Plus, PenSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TransactionForm } from '../components/TransactionForm';
import { WarehouseForm } from '../components/WarehouseForm';
import { WarehouseBulkEditDialog } from '../components/WarehouseBulkEditDialog';
import { QuickActionSheet } from '@/modules/contractors/components/QuickActionSheet';
import { useModuleSettings } from '@/modules/settings/hooks/useModuleSettings';

export const WarehousePage = () => {
  const { t } = useTranslation();
  const pageState = useWarehousePage();
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
  const { 
    activeTab, 
    setActiveTab, 
    tabsConfig, 
    reorderTab,
    isTransactionFormOpen,
    setIsTransactionFormOpen,
    isWarehouseFormOpen,
    setIsWarehouseFormOpen,
    balancesTable,
    warehousesTable,
    transactionsTable,
    taskSheet, setTaskSheet,
    projectSheet, setProjectSheet,
    claimSheet, setClaimSheet,
    eventSheet, setEventSheet,
    reminderSheet, setReminderSheet,
  } = pageState;

  // Settings
  const { settings: taskSettings } = useModuleSettings('tasks');
  const { settings: projectSettings } = useModuleSettings('projects');
  const { settings: casesSettings } = useModuleSettings('legal-cases');
  const { settings: calendarSettings } = useModuleSettings('calendar');

  const actions = useMemo(() => {
    if (activeTab === 'transactions') {
      return (
        <Button className="gap-2 h-9" onClick={() => setIsTransactionFormOpen(true)}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t('warehouse.transaction.new')}</span>
        </Button>
      );
    }
    if (activeTab === 'warehouses') {
      return (
        <Button className="gap-2 h-9" onClick={() => setIsWarehouseFormOpen(true)}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t('warehouse.warehouse_new')}</span>
        </Button>
      );
    }
    return [];
  }, [activeTab, t, setIsTransactionFormOpen, setIsWarehouseFormOpen]);

  usePageSettings({
    title: t('warehouse.title'),
    actions,
  });

  const getActiveTable = () => {
    switch (activeTab) {
      case 'balances': return balancesTable;
      case 'warehouses': return warehousesTable;
      case 'transactions': return transactionsTable;
      default: return balancesTable;
    }
  };

  const activeTable = getActiveTable();

  const getColumnLabels = () => {
    switch (activeTab) {
      case 'balances': return {
        skuInternal: 'warehouse.columns.balances.skuInternal',
        productName: 'warehouse.columns.balances.productName',
        warehouseName: 'warehouse.columns.balances.warehouseName',
        quantity: 'warehouse.columns.balances.quantity',
        reservedQuantity: 'warehouse.columns.balances.reservedQuantity',
        available: 'warehouse.columns.balances.available',
      };
      case 'warehouses': return {
        name: 'common.name',
        type: 'warehouse.columns.warehouses.type',
        address: 'warehouse.columns.warehouses.address',
        status: 'common.status',
        tags: 'common.tags',
      };
      case 'transactions': return {
        createdAt: 'warehouse.columns.transactions.createdAt',
        type: 'warehouse.columns.transactions.type',
        productName: 'warehouse.columns.transactions.productName',
        warehouseName: 'warehouse.columns.transactions.warehouseName',
        quantity: 'warehouse.columns.transactions.quantity',
      };
      default: return {};
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Dialog open={isTransactionFormOpen} onOpenChange={setIsTransactionFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('warehouse.transaction.new')}</DialogTitle>
          </DialogHeader>
          <TransactionForm 
            onSuccess={() => setIsTransactionFormOpen(false)}
            onCancel={() => setIsTransactionFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isWarehouseFormOpen} onOpenChange={setIsWarehouseFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('warehouse.warehouse_new')}</DialogTitle>
          </DialogHeader>
          <WarehouseForm 
            onSuccess={() => setIsWarehouseFormOpen(false)}
            onCancel={() => setIsWarehouseFormOpen(false)}
            statuses={(pageState.warehouseSettings as { statuses?: Array<{id: string, name: string}> }).statuses || []}
          />
        </DialogContent>
      </Dialog>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)} className="flex-1 flex flex-col">
        <div className="flex flex-nowrap justify-between items-center gap-4 overflow-x-auto w-full mb-4 pb-1">
          <SortableTabsList
            tabsConfig={tabsConfig}
            onReorder={reorderTab}
            t={t}
            className="h-10 sm:h-11 gap-1 p-1 bg-muted/50 rounded-xl flex-shrink-0 flex-nowrap w-max"
            triggerClassName="flex-none gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg font-medium px-3 sm:px-4 whitespace-nowrap"
          />

          <WarehouseToolbar
            searchQuery={activeTable.searchQuery}
            onSearchChange={activeTable.setSearchQuery}
            selectedCount={activeTable.selectedIds.size}
            onCancelSelection={activeTable.clearSelection}
            onBulkDelete={() => {
              alert(t('common.coming_soon'));
              activeTable.clearSelection();
            }}
            bulkActions={
              <Button variant="outline" size="sm" onClick={() => setIsBulkEditDialogOpen(true)} className="h-8 gap-2 bg-background/80">
                <span className="hidden sm:inline">{t('common.bulk_edit')}</span>
              </Button>
            }
            tabsConfig={tabsConfig}
            onMoveTab={(index, direction) => {
              const tab = tabsConfig[index];
              const targetIndex = direction === 'up' ? index - 1 : index + 1;
              const targetTab = tabsConfig[targetIndex];
              if (tab && targetTab) reorderTab(tab.id, targetTab.id);
            }}
            onToggleTab={(id) => {
              // Tab visibility toggling handled by useDataTable hook
            }}
            visibleColumns={activeTable.visibleColumns}
            onToggleColumn={(id) => activeTable.toggleColumnVisibility(id, !activeTable.visibleColumns[id])}
            columnLabels={getColumnLabels()}
            columnOrder={activeTable.columnOrder}
            onMoveColumn={activeTable.moveColumn}
            statusFilter={pageState.statusFilter}
            onStatusFilterChange={pageState.setStatusFilter}
            statuses={(pageState.warehouseSettings as { statuses?: Array<{id: string, name: string}> }).statuses || []}
            className="w-max flex-nowrap bg-transparent border-0 shadow-none p-0 flex-shrink-0"
          />
        </div>
        
        <TabsContent value="balances" className="mt-0 outline-none flex-1">
          <BalancesList 
            balancesTable={pageState.balancesTable} 
            filteredBalances={pageState.filteredBalances} 
            balancesLoading={pageState.balancesLoading} 
          />
        </TabsContent>

        <TabsContent value="warehouses" className="mt-0 outline-none flex-1">
          <WarehousesList 
            warehousesTable={pageState.warehousesTable} 
            filteredWarehouses={pageState.filteredWarehouses} 
            warehousesLoading={pageState.warehousesLoading}
            handleWarehouseQuickAction={pageState.handleWarehouseQuickAction}
          />
        </TabsContent>

        <TabsContent value="transactions" className="mt-0 outline-none flex-1">
          <TransactionsList 
            transactionsTable={pageState.transactionsTable} 
            filteredTransactions={pageState.filteredTransactions} 
            transactionsLoading={pageState.transactionsLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Quick Action Sheets */}
      <QuickActionSheet
        type="task"
        open={taskSheet.isOpen}
        onOpenChange={(open) => setTaskSheet({ ...taskSheet, isOpen: open })}
        contractorName={taskSheet.contractorName}
        contractorId={taskSheet.contractorId}
        statuses={(taskSettings as { statuses?: Array<{id: string, name: string}> }).statuses || []}
        priorities={(taskSettings as { priorities?: Array<{id: string, name: string}> }).priorities || []}
      />
      <QuickActionSheet
        type="project"
        open={projectSheet.isOpen}
        onOpenChange={(open) => setProjectSheet({ ...projectSheet, isOpen: open })}
        contractorName={projectSheet.contractorName}
        contractorId={projectSheet.contractorId}
        statuses={(projectSettings as { statuses?: Array<{id: string, name: string}> }).statuses || []}
        priorities={(projectSettings as { priorities?: Array<{id: string, name: string}> }).priorities || []}
      />
      <QuickActionSheet
        type="claim"
        open={claimSheet.isOpen}
        onOpenChange={(open) => setClaimSheet({ ...claimSheet, isOpen: open })}
        contractorName={claimSheet.contractorName}
        contractorId={claimSheet.contractorId}
        statuses={(casesSettings as { statuses?: Array<{id: string, name: string}> }).statuses || []}
      />
      <QuickActionSheet
        type="event"
        open={eventSheet.isOpen}
        onOpenChange={(open) => setEventSheet({ ...eventSheet, isOpen: open })}
        contractorName={eventSheet.contractorName}
        contractorId={eventSheet.contractorId}
        statuses={(calendarSettings as { statuses?: Array<{id: string, name: string}> }).statuses || []}
        priorities={(calendarSettings as { priorities?: Array<{id: string, name: string}> }).priorities || []}
      />
      <QuickActionSheet
        type="reminder"
        open={reminderSheet.isOpen}
        onOpenChange={(open) => setReminderSheet({ ...reminderSheet, isOpen: open })}
        contractorName={reminderSheet.contractorName}
        contractorId={reminderSheet.contractorId}
        statuses={(calendarSettings as { statuses?: Array<{id: string, name: string}> }).statuses || []}
        priorities={(calendarSettings as { priorities?: Array<{id: string, name: string}> }).priorities || []}
      />

      <WarehouseBulkEditDialog
        open={isBulkEditDialogOpen}
        onOpenChange={setIsBulkEditDialogOpen}
        count={activeTable.selectedIds.size}
        selectedIds={Array.from(activeTable.selectedIds).map(id => Number(id))}
        onSuccess={() => activeTable.clearSelection()}
      />
    </div>
  );
};
