import React from 'react';
import { SortableTabsList, DataTableToolbar, BulkActionButton } from "@/components/shared";
import { PeriodFilterBar } from "./PeriodFilterBar";
import { Users } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface FinanceTableToolbarProps {
  activeTabsConfig: any[];
  financeTabsTable: any;
  activeToolbarState: any;
  handleToolbarSearchChange: (v: string) => void;
  activeTab: string;
  handleBulkDeletePayments: () => void;
  handleBulkDeleteInvoices: (table: any) => void;
  activeInvoiceTable: any;
  setBulkEditOpen: (v: boolean) => void;
  paymentColumnLabels: any;
  invoiceColumnLabels: any;
  paymentFilterContent: React.ReactNode;
  invoiceFilterContent: React.ReactNode;
  periodPreset: any;
  setPeriodPreset: (v: any) => void;
  customFrom: string;
  setCustomFrom: (v: string) => void;
  customTo: string;
  setCustomTo: (v: string) => void;
  periodRange: any;
}

export function FinanceTableToolbar({
  activeTabsConfig,
  financeTabsTable,
  activeToolbarState,
  handleToolbarSearchChange,
  activeTab,
  handleBulkDeletePayments,
  handleBulkDeleteInvoices,
  activeInvoiceTable,
  setBulkEditOpen,
  paymentColumnLabels,
  invoiceColumnLabels,
  paymentFilterContent,
  invoiceFilterContent,
  periodPreset,
  setPeriodPreset,
  customFrom,
  setCustomFrom,
  customTo,
  setCustomTo,
  periodRange
}: FinanceTableToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-nowrap justify-between items-center gap-4 overflow-x-auto overflow-y-hidden w-full mb-4 pb-1">
      <SortableTabsList
        tabsConfig={activeTabsConfig}
        onReorder={financeTabsTable.reorderTab}
        t={t}
        className="h-10 sm:h-11 gap-1 p-1 bg-muted/50 rounded-xl flex-shrink-0 flex-nowrap w-max"
        triggerClassName="flex-none gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg font-medium px-3 sm:px-4 whitespace-nowrap"
      />

      <DataTableToolbar
        searchQuery={activeToolbarState.searchQuery}
        onSearchChange={handleToolbarSearchChange}
        selectedCount={activeToolbarState.selectedIds.size}
        onCancelSelection={activeToolbarState.clearSelection}
        onBulkDelete={activeTab === 'payments' ? handleBulkDeletePayments : () => handleBulkDeleteInvoices(activeInvoiceTable)}
        bulkActions={
          <BulkActionButton onClick={() => setBulkEditOpen(true)}>
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">{t('common.bulk_edit.button')}</span>
          </BulkActionButton>
        }
        tabsConfig={financeTabsTable.tabsConfig}
        onMoveTab={financeTabsTable.moveTab}
        onToggleTab={financeTabsTable.toggleTabVisibility}
        visibleColumns={activeToolbarState.visibleColumns}
        onToggleColumn={activeToolbarState.toggleColumnVisibility}
        columnLabels={activeTab === 'payments' ? paymentColumnLabels : invoiceColumnLabels}
        columnOrder={activeToolbarState.columnOrder}
        onMoveColumn={activeToolbarState.moveColumn}
        filters={activeTab === 'payments' ? paymentFilterContent : invoiceFilterContent}
        className="w-max flex-nowrap bg-transparent border-0 shadow-none p-0 flex-shrink-0"
      />

      <div className="flex-shrink-0 flex justify-end">
        <PeriodFilterBar
          preset={periodPreset}
          onPresetChange={setPeriodPreset}
          customFrom={customFrom}
          onCustomFromChange={setCustomFrom}
          customTo={customTo}
          onCustomToChange={setCustomTo}
          periodRange={periodRange}
          minimal={true}
        />
      </div>
    </div>
  );
}
