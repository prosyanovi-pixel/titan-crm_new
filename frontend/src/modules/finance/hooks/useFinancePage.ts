// frontend/src/modules/finance/hooks/useFinancePage.ts
import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { useDataTable } from "@/hooks/useDataTable";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useSettings } from "@/hooks/use-settings";
import { usePersistedTab } from "@/hooks/usePersistedTab";
import { useContractorsList } from "@/modules/contractors";
import { useInvoices, usePayments, useReceivablesReport } from "./useFinance";
import { 
  ArrowUpFromLine, 
  ArrowDownToLine, 
  DollarSign, 
  Landmark, 
  CreditCard, 
  BarChart3, 
  BookOpen 
} from "lucide-react";
import { api } from "@/lib/api";
import { parseRowsPerPage } from "@/lib/utils";
import { toast } from "sonner";

export type ActiveTab = "outgoing" | "incoming" | "payments" | "statements" | "debts" | "dds" | "reports";

export function useFinancePage() {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const { getQuickActionsByModule } = useSettings();

  // ── UI state ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = usePersistedTab<ActiveTab>("tab:finance", "outgoing");
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [createPaymentOpen, setCreatePaymentOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [prefillPaymentInvoiceId, setPrefillPaymentInvoiceId] = useState<string | number | null>(null);
  const [prefillPaymentKind, setPrefillPaymentKind] = useState<"income" | "expense" | null>(null);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);

  // ── Invoice filters ───────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState("all");
  const [contractorFilter, setContractorFilter] = useState("all");

  // ── Payment filters ───────────────────────────────────────────
  const [paymentKindFilter, setPaymentKindFilter] = useState("all");
  const [paymentContractorFilter, setPaymentContractorFilter] = useState("all");
  const [amountFrom, setAmountFrom] = useState("");
  const [amountTo, setAmountTo] = useState("");
  const [debtorOnly, setDebtorOnly] = useState(false);

  // ── Period filters ────────────────────────────────────────────
  const [periodPreset, setPeriodPreset] = useState<any>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const periodRange = useMemo(() => {
    if (periodPreset === "custom") return { from: customFrom, to: customTo };
    if (periodPreset === "all") return { from: "", to: "" };
    const now = new Date();
    const from = new Date();
    if (periodPreset === "month") from.setMonth(now.getMonth() - 1);
    else if (periodPreset === "quarter") from.setMonth(now.getMonth() - 3);
    else if (periodPreset === "year") from.setFullYear(now.getFullYear() - 1);
    
    return { 
      from: from.toISOString().split('T')[0], 
      to: now.toISOString().split('T')[0] 
    };
  }, [periodPreset, customFrom, customTo]);

  // ── Data ──────────────────────────────────────────────────────
  const { contractors } = useContractorsList();
  const { data: invoices = [], isLoading: loadingInvoices, refetch: refetchInvoices } = useInvoices();
  const { data: payments = [], isLoading: loadingPayments, refetch: refetchPayments } = usePayments();
  const { data: receivables } = useReceivablesReport();

  const isLoading = loadingInvoices || loadingPayments;

  // ── Table hooks ───────────────────────────────────────────────
  const outgoingTable = useDataTable<any>({
    initialData: [],
    initialColumns: {
      identifier: true, contractor: true, project: true,
      amountTotal: true, vat: true, status: true, issueDate: true, dueDate: true,
    },
    storageKey: "finance-invoices-outgoing",
  });

  const incomingTable = useDataTable<any>({
    initialData: [],
    initialColumns: {
      identifier: true, contractor: true, project: true,
      amountTotal: true, vat: true, status: true, issueDate: true, dueDate: true,
    },
    storageKey: "finance-invoices-incoming",
  });

  const paymentsTable = useDataTable<any>({
    initialData: [],
    initialColumns: {
      paymentDate: true,
      kind: true,
      contractorName: true,
      amount: true,
      projectName: true,
      invoiceIdentifier: false,
      description: true,
      paymentNumber: true,
      paymentMethod: false,
      categoryName: true,
    },
    storageKey: "finance-payments",
  });

  const financeTabsTable = useDataTable<{ id: string }>({
    initialData: [],
    initialColumns: {},
    storageKey: "finance-tabs",
    initialTabs: [
      { id: "outgoing",   label: "finance.tabs.invoices_outgoing", icon: ArrowUpFromLine, visible: true },
      { id: "incoming",   label: "finance.tabs.invoices_incoming", icon: ArrowDownToLine, visible: true },
      { id: "payments",   label: "finance.tabs.payments",          icon: DollarSign,      visible: true },
    ],
  });

  // ── Derived lists ─────────────────────────────────────────────
  const invoiceStatuses = useMemo(() => [
    { id: 'draft', label: t('finance.status.draft'), color: '#94A3B8' },
    { id: 'sent', label: t('finance.status.sent'), color: '#3B82F6' },
    { id: 'partial_paid', label: t('finance.status.partial_paid'), color: '#F59E0B' },
    { id: 'paid', label: t('finance.status.paid'), color: '#22C55E' },
    { id: 'overdue', label: t('finance.status.overdue'), color: '#EF4444' },
  ], [t]);

  const outgoingInvoices = useMemo(() => (invoices as any[]).filter(i => i.invoiceType === 'outgoing'), [invoices]);
  const incomingInvoices = useMemo(() => (invoices as any[]).filter(i => i.invoiceType === 'incoming'), [invoices]);

  const matchesSearch = (values: unknown[], query: string) => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return true;

    return values.some((value) => String(value ?? '').toLowerCase().includes(normalizedQuery));
  };

  const isWithinPeriod = (dateVal: any, range: { from: string, to: string }) => {
    if (!range.from && !range.to) return true;
    if (!dateVal) return false;
    
    let d: string;
    if (typeof dateVal === 'string') {
      d = dateVal.split('T')[0];
    } else if (dateVal instanceof Date) {
      d = dateVal.toISOString().split('T')[0];
    } else {
      d = String(dateVal).split('T')[0];
    }

    if (range.from && d < range.from) return false;
    if (range.to && d > range.to) return false;
    return true;
  };

  const filteredOutgoingInvoices = useMemo(() => {
    return outgoingInvoices.filter((invoice: any) => {
      if (statusFilter !== 'all' && invoice.status !== statusFilter) return false;
      if (contractorFilter !== 'all' && invoice.contractorName !== contractorFilter) return false;
      if (!isWithinPeriod(invoice.issueDate, periodRange)) return false;
      
      return matchesSearch([
        invoice.identifier,
        invoice.contractorName,
        invoice.contractorLegalForm,
        invoice.taxRegimeName,
        invoice.projectName,
        invoice.status,
        invoice.issueDate,
        invoice.dueDate,
        invoice.amountTotal,
        invoice.vatAmount,
        invoice.vatRate,
      ], outgoingTable.searchQuery);
    });
  }, [outgoingInvoices, outgoingTable.searchQuery, statusFilter, contractorFilter, periodRange]);

  const filteredIncomingInvoices = useMemo(() => {
    return incomingInvoices.filter((invoice: any) => {
      if (statusFilter !== 'all' && invoice.status !== statusFilter) return false;
      if (contractorFilter !== 'all' && invoice.contractorName !== contractorFilter) return false;
      if (!isWithinPeriod(invoice.issueDate, periodRange)) return false;

      return matchesSearch([
        invoice.identifier,
        invoice.contractorName,
        invoice.contractorLegalForm,
        invoice.taxRegimeName,
        invoice.projectName,
        invoice.status,
        invoice.issueDate,
        invoice.dueDate,
        invoice.amountTotal,
        invoice.vatAmount,
        invoice.vatRate,
      ], incomingTable.searchQuery);
    });
  }, [incomingInvoices, incomingTable.searchQuery, statusFilter, contractorFilter, periodRange]);

  // Apply filters
  const filteredPayments = useMemo(() => {
    let result = [...payments];
    if (paymentKindFilter !== 'all') result = result.filter(p => p.kind === paymentKindFilter);
    if (paymentContractorFilter !== 'all') result = result.filter(p => p.contractorName === paymentContractorFilter);
    if (amountFrom) result = result.filter(p => p.amount >= Number(amountFrom));
    if (amountTo) result = result.filter(p => p.amount <= Number(amountTo));
    if (debtorOnly) result = result.filter(p => (Number(p.amount) || 0) < 0); // basic debtor check if needed
    
    return result.filter((payment: any) => {
      if (!isWithinPeriod(payment.paymentDate, periodRange)) return false;

      return matchesSearch([
        payment.paymentDate,
        payment.kind,
        payment.contractorName,
        payment.categoryName,
        payment.projectName,
        payment.invoiceIdentifier,
        payment.description,
        payment.paymentNumber,
        payment.paymentMethod,
        payment.amount,
      ], paymentsTable.searchQuery);
    });
  }, [payments, paymentKindFilter, paymentContractorFilter, amountFrom, amountTo, debtorOnly, periodRange, paymentsTable.searchQuery]);

  // Paginated results
  const perPage = 25;
  const paginatedOutgoing = filteredOutgoingInvoices.slice((outgoingTable.currentPage - 1) * perPage, outgoingTable.currentPage * perPage);
  const paginatedIncoming = filteredIncomingInvoices.slice((incomingTable.currentPage - 1) * perPage, incomingTable.currentPage * perPage);
  const paginatedPayments = filteredPayments.slice((paymentsTable.currentPage - 1) * perPage, paymentsTable.currentPage * perPage);

  // Stats
  const totalReceivables = useMemo(() => {
    if (!receivables || !Array.isArray(receivables)) return 0;
    return receivables.reduce((sum, item) => sum + (Number(item.totalDue) || 0), 0);
  }, [receivables]);
  const overdueCount = outgoingInvoices.filter(i => i.status === 'overdue').length;
  const paidCount = outgoingInvoices.filter(i => i.status === 'paid').length;
  const totalInvoices = outgoingInvoices.length;

  // Column labels
  const invoiceColumnLabels = {
    identifier:  t("finance.table.identifier"),
    contractor:  t("finance.table.contractor"),
    project:     t("finance.table.project"),
    amountTotal: t("finance.table.amount"),
    vat:         t("finance.table.vat"),
    status:      t("finance.table.status"),
    issueDate:   t("finance.table.issue_date"),
    dueDate:     t("finance.table.due_date"),
  };

  const paymentColumnLabels = {
    paymentDate:       "finance.table.payment_date",
    kind:              "finance.table.kind",
    contractorName:    "finance.table.payer",
    amount:            "finance.table.amount",
    projectName:       "finance.table.project",
    invoiceIdentifier: "finance.table.invoice",
    description:       "finance.table.description",
    paymentMethod:     "finance.table.payment_method",
    paymentNumber:     "finance.table.payment_number",
    categoryName:      "finance.table.category",
  };

  // ── CRUD handlers ─────────────────────────────────────────────
  const handleBulkDeleteInvoices = async (table: any) => {
    const ok = await confirm({
      title: t('common.confirm_deletion'),
      description: t('finance.confirm.delete_invoices', { count: table.selectedIds.size }),
      variant: 'destructive',
    });
    if (!ok) return;

    try {
      await Promise.all(Array.from(table.selectedIds).map((id) => api.delete(`/finance/invoices/${id}`)));
      await refetchInvoices();
      toast.success(t("general.toast.success.invoices_deleted", [table.selectedIds.size]));
      table.clearSelection();
    } catch {
      toast.error(t("generated.oshibka_pri_udalenii_schetov"));
    }
  };

  const handleBulkDeletePayments = async () => {
    const ok = await confirm({
      title: t('common.confirm_deletion'),
      description: t('finance.confirm.delete_payments', { count: paymentsTable.selectedIds.size }),
      variant: 'destructive',
    });
    if (!ok) return;

    try {
      await Promise.all(
        Array.from(paymentsTable.selectedIds).map((id) => api.delete(`/finance/payments/${id}`)),
      );
      await refetchPayments();
      toast.success(t("general.toast.success.payments_deleted", [paymentsTable.selectedIds.size]));
      paymentsTable.clearSelection();
    } catch {
      toast.error(t("generated.oshibka_pri_udalenii_platezhey"));
    }
  };

  const handleBulkUpdateInvoices = async (field: string, value: string) => {
    const table = activeTab === 'outgoing' ? outgoingTable : incomingTable;
    if (!table.selectedIds.size) return;
    try {
      await api.post('/finance/invoices/bulk-update', { ids: Array.from(table.selectedIds), updates: { [field]: value } });
      await refetchInvoices();
      toast.success(t('generated.zapis_obnovlen'));
      table.clearSelection();
    } catch (e) {
      toast.error(t('generated.oshibka_sohraneniya'));
    }
  };

  const handleBulkUpdatePayments = async (field: string, value: string) => {
    if (!paymentsTable.selectedIds.size) return;
    try {
      await api.post('/finance/payments/bulk-update', { ids: Array.from(paymentsTable.selectedIds), updates: { [field]: value } });
      await refetchPayments();
      toast.success(t('generated.zapis_obnovlen'));
      paymentsTable.clearSelection();
    } catch (e) {
      toast.error(t('generated.oshibka_sohraneniya'));
    }
  };

  const handleDeleteInvoice = async (id: string | number) => {
    const ok = await confirm({
      title: t('common.confirm_deletion'),
      description: t("generated.udalit_schet"),
      variant: 'destructive',
    });
    if (!ok) return;
    await api.delete(`/finance/invoices/${id}`);
    await refetchInvoices();
    toast.success(t("generated.schet_udalen"));
  };

  const handleDeletePayment = async (id: string | number) => {
    const ok = await confirm({
      title: t('common.confirm_deletion'),
      description: t("generated.udalit_platezh"),
      variant: 'destructive',
    });
    if (!ok) return;
    await api.delete(`/finance/payments/${id}`);
    await refetchPayments();
    toast.success(t("generated.platezh_udalen"));
  };

  const handleSaveInvoice = async (invoice: any) => {
    try {
      if (invoice.id) await api.put(`/finance/invoices/${invoice.id}`, invoice);
      else await api.post("/finance/invoices", invoice);
      await refetchInvoices();
      setCreateInvoiceOpen(false);
      setSelectedInvoice(null);
    } catch {
      toast.error(t("generated.oshibka_sohraneniya"));
    }
  };

  const handleSavePayment = async (payment: any) => {
    try {
      if (payment.id) await api.put(`/finance/payments/${payment.id}`, payment);
      else await api.post("/finance/payments", payment);
      await refetchPayments();
      setCreatePaymentOpen(false);
      setSelectedPayment(null);
    } catch {
      toast.error(t("generated.oshibka_sohraneniya"));
    }
  };

  const handleInvoiceQuickAction = async (action: string, id: number | string) => {
    const invoice = invoices.find(i => i.id === id);
    if (!invoice) return;
    if (action === 'delete') await handleDeleteInvoice(id);
    else if (action === 'edit') setSelectedInvoice(invoice);
  };

  const handlePaymentQuickAction = async (action: string, id: number | string) => {
    const payment = payments.find(p => p.id === id);
    if (!payment) return;
    if (action === 'delete') await handleDeletePayment(id);
    else if (action === 'edit') setSelectedPayment(payment);
  };

  const activeInvoiceTable = activeTab === 'outgoing' ? outgoingTable : incomingTable;

  return {
    t, activeTab, setActiveTab, createInvoiceOpen, setCreateInvoiceOpen,
    createPaymentOpen, setCreatePaymentOpen, selectedInvoice, setSelectedInvoice,
    selectedPayment, setSelectedPayment, setPrefillPaymentInvoiceId,
    prefillPaymentKind, setPrefillPaymentKind,
    bulkEditOpen, setBulkEditOpen,
    statusFilter, setStatusFilter, contractorFilter, setContractorFilter,
    paymentKindFilter, setPaymentKindFilter, paymentContractorFilter, setPaymentContractorFilter,
    amountFrom, setAmountFrom, amountTo, setAmountTo, debtorOnly, setDebtorOnly,
    periodPreset, setPeriodPreset, customFrom, setCustomFrom, customTo, setCustomTo, periodRange,
    contractors, invoiceStatuses, outgoingTable, incomingTable, paymentsTable, financeTabsTable,
    outgoingInvoices, incomingInvoices, filteredOutgoingInvoices, filteredIncomingInvoices, filteredPayments,
    paginatedOutgoing, paginatedIncoming, paginatedPayments,
    totalReceivables, overdueCount, paidCount, totalInvoices,
    invoiceColumnLabels, paymentColumnLabels,
    handleBulkDeleteInvoices, handleBulkDeletePayments,
    handleBulkUpdateInvoices, handleBulkUpdatePayments,
    handleDeleteInvoice, handleSaveInvoice, handleSavePayment,
    handleInvoiceQuickAction, handlePaymentQuickAction,
    refetchInvoices, refetchPayments, isLoading, activeInvoiceTable,
  };
}
