// frontend/src/modules/finance/pages/FinancePage.tsx
import { useTranslation } from "@/lib/i18n";
import { usePageSettings } from "@/context/LayoutContext";
import { Button, Tabs, TabsContent, Skeleton } from "@/components/ui";
import { PeriodFilterBar } from "../components/PeriodFilterBar";
import { CreateInvoiceSheet } from "../components/CreateInvoiceSheet";
import { FinanceSummaryCards } from "../components/FinanceSummaryCards";
import { CreatePaymentSheet } from "../components/CreatePaymentSheet";
import { InvoiceTableRow } from "../components/InvoiceTableRow";
import { PaymentTableRow } from "../components/PaymentTableRow";
import { ImportStatementAction } from "../components/ImportStatementAction";
import { FinanceTableToolbar } from "../components/FinanceTableToolbar";
import { InvoiceFilters } from "../components/InvoiceFilters";
import { PaymentFilters } from "../components/PaymentFilters";
import { BankStatementsTab } from "../components/BankStatementsTab";
import { DDSTab } from "../components/DDSTab";
import { DebtsDashboard } from "../components/DebtsDashboard";
import { ReportsTab } from "../components/ReportsTab";
import { BulkEditDialog, SortableTabsList, DataTableToolbar, BulkActionButton } from "@/components/shared";
import { TableSkeleton } from "@/components/shared/skeletons";
import { useFinancePage } from "../hooks/useFinancePage";
import { useSettings } from "@/hooks/use-settings";
import { useProjects } from "@/modules/projects";
import { useTasks } from "@/modules/tasks";
import { useContractorsList } from "@/modules/contractors";
import { useCategories } from "../hooks/useFinance";
import { DataTable } from "@/components/ui/data-table";
import { 
  Plus, 
  DollarSign, 
  AlertCircle, 
  CheckCircle, 
  FileText, 
  Users,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { useModuleSettings } from "@/modules/settings/hooks/useModuleSettings";
import React, { useMemo } from "react";

export default function FinancePage() {
  const { t } = useTranslation();
  const { settings, isLoading: isSettingsLoading } = useModuleSettings("finance");
  const { getTagsByModule, getPrioritiesByModule } = useSettings();
  const { projects: projectsData } = useProjects();
  const { tasks: tasksData } = useTasks();
  const { contractors: contractorsData } = useContractorsList();
  const { data: categoriesData } = useCategories();
  const tagsData = getTagsByModule("finance") || [];

  const {
    activeTab, setActiveTab,
    createInvoiceOpen, setCreateInvoiceOpen,
    createPaymentOpen, setCreatePaymentOpen,
    selectedInvoice, setSelectedInvoice,
    selectedPayment, setSelectedPayment,
    setPrefillPaymentInvoiceId,
    prefillPaymentKind, setPrefillPaymentKind,
    bulkEditOpen, setBulkEditOpen,
    statusFilter, setStatusFilter,
    contractorFilter, setContractorFilter,
    paymentKindFilter, setPaymentKindFilter,
    paymentContractorFilter, setPaymentContractorFilter,
    amountFrom, setAmountFrom,
    amountTo, setAmountTo,
    debtorOnly, setDebtorOnly,
    periodPreset, setPeriodPreset,
    customFrom, setCustomFrom,
    customTo, setCustomTo,
    periodRange,
    contractors, invoiceStatuses,
    outgoingTable, incomingTable, paymentsTable, financeTabsTable,
    outgoingInvoices, incomingInvoices, filteredPayments,
    paginatedOutgoing, paginatedIncoming, paginatedPayments,
    totalReceivables, overdueCount, paidCount, totalInvoices,
    invoiceColumnLabels, paymentColumnLabels,
    handleBulkDeleteInvoices, handleBulkDeletePayments,
    handleBulkUpdateInvoices, handleBulkUpdatePayments,
    handleDeleteInvoice, handleSaveInvoice, handleSavePayment,
    handleInvoiceQuickAction, handlePaymentQuickAction,
    refetchInvoices, refetchPayments,
    isLoading, activeInvoiceTable,
    filteredOutgoingInvoices, filteredIncomingInvoices,
  } = useFinancePage();

  const showStats = settings.features?.enableStatistics !== false;

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
  });

  const activeToolbarTable = activeTab === 'payments' ? paymentsTable : activeInvoiceTable;
  const activeToolbarState = mapTableState(activeToolbarTable);
  const handleToolbarSearchChange = (value: string) => {
    activeToolbarTable.setSearchQuery(value);
    activeToolbarTable.setCurrentPage(1);
  };

  const mainAction = useMemo(() => (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <ImportStatementAction />
      
      <div className="h-8 w-px bg-border mx-1 hidden sm:block" />

      <Button 
        size="sm" 
        className="gap-2 h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all" 
        onClick={() => {
          setPrefillPaymentKind("income");
          setCreatePaymentOpen(true);
        }}
      >
        <TrendingUp className="w-4 h-4" />
        <span className="hidden md:inline">{t("finance.payment.kind.income")}</span>
      </Button>

      <Button 
        size="sm" 
        className="gap-2 h-9 px-3 bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all" 
        onClick={() => {
          setPrefillPaymentKind("expense");
          setCreatePaymentOpen(true);
        }}
      >
        <TrendingDown className="w-4 h-4" />
        <span className="hidden md:inline">{t("finance.payment.kind.expense")}</span>
      </Button>

      <div className="h-8 w-px bg-border mx-1 hidden sm:block" />

      <Button size="sm" variant="outline" className="gap-2 h-9 px-3" onClick={() => setCreateInvoiceOpen(true)}>
        <Plus className="w-4 h-4" />
        <span className="hidden md:inline">{t("finance.invoice.create")}</span>
      </Button>
    </div>
  ), [t, setCreateInvoiceOpen, setCreatePaymentOpen, setPrefillPaymentKind]);

  const invoiceFilterContent = (
    <InvoiceFilters
      statusFilter={statusFilter}
      onStatusChange={setStatusFilter}
      contractorFilter={contractorFilter}
      onContractorChange={setContractorFilter}
      invoiceStatuses={invoiceStatuses as any}
      contractors={contractors || []}
    />
  );

  const paymentFilterContent = (
    <PaymentFilters
      paymentKindFilter={paymentKindFilter}
      onPaymentKindChange={setPaymentKindFilter}
      paymentContractorFilter={paymentContractorFilter}
      onPaymentContractorChange={setPaymentContractorFilter}
      amountFrom={amountFrom}
      onAmountFromChange={setAmountFrom}
      amountTo={amountTo}
      onAmountToChange={setAmountTo}
      debtorOnly={debtorOnly}
      onDebtorOnlyChange={setDebtorOnly}
      contractors={contractors || []}
    />
  );

  const activeTabsConfig = financeTabsTable.tabsConfig.filter(t => 
    ["outgoing", "incoming", "payments"].includes(t.id)
  );

  usePageSettings({
    title: t("finance.title"),
    subtitle: t("finance.subtitle"),
    breadcrumbs: useMemo(() => [{ label: t("finance.title") }], [t]),
    actions: mainAction
  });

  return (
    <>
      {/* Stats - Responsive Grid */}
      {!isSettingsLoading && showStats && (
        <FinanceSummaryCards
          isLoading={isLoading}
          totalReceivables={totalReceivables}
          overdueCount={overdueCount}
          paidCount={paidCount}
          totalInvoices={totalInvoices}
        />
      )}

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v as typeof activeTab);
          if (v === 'outgoing') outgoingTable.injectTabColumns('outgoing');
          else if (v === 'incoming') incomingTable.injectTabColumns('incoming');
          else if (v === 'payments') paymentsTable.injectTabColumns('payments');
        }}
        className="space-y-4"
      >
        <FinanceTableToolbar
          activeTabsConfig={activeTabsConfig}
          financeTabsTable={financeTabsTable}
          activeToolbarState={activeToolbarState}
          handleToolbarSearchChange={handleToolbarSearchChange}
          activeTab={activeTab}
          handleBulkDeletePayments={handleBulkDeletePayments}
          handleBulkDeleteInvoices={handleBulkDeleteInvoices}
          activeInvoiceTable={activeInvoiceTable}
          setBulkEditOpen={setBulkEditOpen}
          paymentColumnLabels={paymentColumnLabels}
          invoiceColumnLabels={invoiceColumnLabels}
          paymentFilterContent={paymentFilterContent}
          invoiceFilterContent={invoiceFilterContent}
          periodPreset={periodPreset}
          setPeriodPreset={setPeriodPreset}
          customFrom={customFrom}
          setCustomFrom={setCustomFrom}
          customTo={customTo}
          setCustomTo={setCustomTo}
          periodRange={periodRange}
        />

        <TabsContent value="outgoing" className="m-0 outline-none">
          {isLoading ? (
            <TableSkeleton showToolbar={false} rowCount={10} columnCount={6} />
          ) : (
            <DataTable
              table={mapTableState(outgoingTable)}
              data={paginatedOutgoing}
              columnLabels={invoiceColumnLabels}
              totalCount={filteredOutgoingInvoices.length}
              filters={invoiceFilterContent}
              bulkActions={
                <BulkActionButton onClick={() => setBulkEditOpen(true)}>
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('common.bulk_edit.button')}</span>
                </BulkActionButton>
              }
              onBulkDelete={() => handleBulkDeleteInvoices(outgoingTable)}
              renderRow={(invoice) => (
                <InvoiceTableRow
                  key={invoice.id}
                  invoice={invoice}
                  selectedIds={outgoingTable.selectedIds}
                  visibleColumns={outgoingTable.visibleColumns}
                  columnOrder={outgoingTable.columnOrder}
                  columnWidths={outgoingTable.columnWidths}
                  invoiceStatuses={invoiceStatuses as any}
                  onToggleSelection={outgoingTable.toggleSelection}
                  onRowClick={setSelectedInvoice}
                  onQuickAction={handleInvoiceQuickAction}
                />
              )}
              virtualized={true}
              hideToolbar={true}
              className="border-none shadow-none"
            />
          )}
        </TabsContent>

        <TabsContent value="incoming" className="m-0 outline-none">
          {isLoading ? (
            <TableSkeleton showToolbar={false} rowCount={10} columnCount={6} />
          ) : (
            <DataTable
              table={mapTableState(incomingTable)}
              data={paginatedIncoming}
              columnLabels={invoiceColumnLabels}
              totalCount={filteredIncomingInvoices.length}
              filters={invoiceFilterContent}
              bulkActions={
                <BulkActionButton onClick={() => setBulkEditOpen(true)}>
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('common.bulk_edit.button')}</span>
                </BulkActionButton>
              }
              onBulkDelete={() => handleBulkDeleteInvoices(incomingTable)}
              renderRow={(invoice) => (
                <InvoiceTableRow
                  key={invoice.id}
                  invoice={invoice}
                  selectedIds={incomingTable.selectedIds}
                  visibleColumns={incomingTable.visibleColumns}
                  columnOrder={incomingTable.columnOrder}
                  columnWidths={incomingTable.columnWidths}
                  invoiceStatuses={invoiceStatuses as any}
                  onToggleSelection={incomingTable.toggleSelection}
                  onRowClick={setSelectedInvoice}
                  onQuickAction={handleInvoiceQuickAction}
                />
              )}
              virtualized={true}
              hideToolbar={true}
              className="border-none shadow-none"
            />
          )}
        </TabsContent>

        <TabsContent value="payments" className="m-0 outline-none">
          {isLoading ? (
            <TableSkeleton showToolbar={false} rowCount={10} columnCount={6} />
          ) : (
            <DataTable
              table={mapTableState(paymentsTable)}
              data={paginatedPayments}
              columnLabels={paymentColumnLabels}
              totalCount={filteredPayments.length}
              filters={paymentFilterContent}
              filterDropdownWidth="w-80"
              bulkActions={
                <BulkActionButton onClick={() => setBulkEditOpen(true)}>
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('common.bulk_edit.button')}</span>
                </BulkActionButton>
              }
              onBulkDelete={handleBulkDeletePayments}
              renderRow={(payment) => (
                <PaymentTableRow
                  key={payment.id}
                  payment={payment}
                  selectedIds={paymentsTable.selectedIds}
                  visibleColumns={paymentsTable.visibleColumns}
                  columnOrder={paymentsTable.columnOrder}
                  columnWidths={paymentsTable.columnWidths}
                  onToggleSelection={paymentsTable.toggleSelection}
                  onRowClick={setSelectedPayment}
                  onQuickAction={handlePaymentQuickAction}
                />
              )}
              virtualized={true}
              hideToolbar={true}
              className="border-none shadow-none"
            />
          )}
        </TabsContent>
      </Tabs>

      <CreateInvoiceSheet
        open={selectedInvoice !== null || createInvoiceOpen}
        onOpenChange={(open) => {
          if (!open) { setSelectedInvoice(null); setCreateInvoiceOpen(false); }
        }}
        invoice={selectedInvoice}
        onRefetch={async () => { refetchInvoices(); }}
      />

      <CreatePaymentSheet
        open={selectedPayment !== null || createPaymentOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPayment(null);
            setCreatePaymentOpen(false);
            setPrefillPaymentInvoiceId(null);
            setPrefillPaymentKind(null);
          }
        }}
        prefillKind={prefillPaymentKind}
        payment={selectedPayment ?? undefined}
        onRefetch={async () => { refetchPayments(); }}
      />

      <BulkEditDialog
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        onConfirm={activeTab === 'payments' ? handleBulkUpdatePayments : handleBulkUpdateInvoices}
        count={activeTab === 'payments' ? paymentsTable.selectedIds.size : activeInvoiceTable.selectedIds.size}
        moduleId="finance"
        referenceData={{
          statuses: invoiceStatuses || [],
          priorities: getPrioritiesByModule("finance") || [],
          tags: tagsData,
          users: [],
          expenseCategories: categoriesData || [],
          categories: categoriesData || [],
          finance_expenseCategories: categoriesData || [],
          projects: Array.isArray(projectsData) ? projectsData : (projectsData as any) || [],
          finance_projects: Array.isArray(projectsData) ? projectsData : (projectsData as any) || [],
          tasks: Array.isArray(tasksData) ? tasksData : (tasksData as any) || [],
          finance_tasks: Array.isArray(tasksData) ? tasksData : (tasksData as any) || [],
          contractors: Array.isArray(contractorsData) ? contractorsData : (contractorsData as any) || [],
          finance_contractors: Array.isArray(contractorsData) ? contractorsData : (contractorsData as any) || [],
          invoiceTypes: [
            { id: 'outgoing', name: 'Исходящий' },
            { id: 'incoming', name: 'Входящий' }
          ],
          currencies: [
            { id: 'RUB', name: 'Рубль' },
            { id: 'USD', name: 'Доллар' },
            { id: 'EUR', name: 'Евро' },
            { id: 'CNY', name: 'Юань' }
          ],
          paymentMethods: [
            { id: 'bank', name: 'Банк' },
            { id: 'cash', name: 'Наличные' },
            { id: 'card', name: 'Карта' }
          ]
        }}
      />
    </>
  );
}
