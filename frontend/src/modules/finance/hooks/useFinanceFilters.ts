// frontend/src/modules/finance/hooks/useFinanceFilters.ts
import { useState, useMemo, useEffect } from "react";
import type { PeriodPreset } from "../components/PeriodFilterBar";
import type { Invoice, Payment } from "../types/finance.types";

type SortConfig = { key: PropertyKey; direction: "asc" | "desc" } | null;

export function usePeriodFilter() {
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("quarter");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const periodRange = useMemo(() => {
    const now = new Date();
    if (periodPreset === "month") {
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
        to: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
      };
    }
    if (periodPreset === "quarter") {
      const q = Math.floor(now.getMonth() / 3);
      return {
        from: new Date(now.getFullYear(), q * 3, 1).toISOString().slice(0, 10),
        to: new Date(now.getFullYear(), q * 3 + 3, 0).toISOString().slice(0, 10),
      };
    }
    if (periodPreset === "year") {
      return { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31` };
    }
    if (periodPreset === "custom") {
      return { from: customFrom, to: customTo };
    }
    return { from: "", to: "" };
  }, [periodPreset, customFrom, customTo]);

  return { periodPreset, setPeriodPreset, customFrom, setCustomFrom, customTo, setCustomTo, periodRange };
}

interface UseInvoiceFilterOptions {
  invoices: Invoice[] | undefined;
  invoiceType: "outgoing" | "incoming";
  searchQuery: string;
  sortConfig: SortConfig;
  statusFilter: string;
  contractorFilter: string;
  periodRange: { from: string; to: string };
}

export function useFilteredInvoices({
  invoices,
  invoiceType,
  searchQuery,
  sortConfig,
  statusFilter,
  contractorFilter,
  periodRange,
}: UseInvoiceFilterOptions) {
  return useMemo(() => {
    let result = (invoices || []).filter((i) =>
      invoiceType === "outgoing"
        ? !i.invoiceType || i.invoiceType === "outgoing"
        : i.invoiceType === "incoming"
    );

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.identifier.toLowerCase().includes(q) ||
          (i.contractorName || "").toLowerCase().includes(q) ||
          (i.projectName || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") result = result.filter((i) => i.status === statusFilter);
    if (contractorFilter !== "all") result = result.filter((i) => i.contractorName === contractorFilter);
    if (periodRange.from) result = result.filter((i) => String(i.issueDate).slice(0, 10) >= periodRange.from);
    if (periodRange.to) result = result.filter((i) => String(i.issueDate).slice(0, 10) <= periodRange.to);

    if (sortConfig) {
      result = [...result].sort((a, b) => {
        const aVal = (a as any)[sortConfig.key];
        const bVal = (b as any)[sortConfig.key];
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
        }
        return sortConfig.direction === "asc"
          ? String(aVal || "").localeCompare(String(bVal || ""))
          : String(bVal || "").localeCompare(String(aVal || ""));
      });
    }
    return result;
  }, [invoices, invoiceType, searchQuery, sortConfig, statusFilter, contractorFilter, periodRange]);
}

interface UsePaymentFilterOptions {
  payments: Payment[] | undefined;
  invoices: Invoice[] | undefined;
  searchQuery: string;
  sortConfig: SortConfig;
  paymentKindFilter: string;
  periodRange: { from: string; to: string };
  paymentContractorFilter: string;
  amountFrom: string;
  amountTo: string;
  debtorOnly: boolean;
}

export function useFilteredPayments({
  payments,
  invoices,
  searchQuery,
  sortConfig,
  paymentKindFilter,
  periodRange,
  paymentContractorFilter,
  amountFrom,
  amountTo,
  debtorOnly,
}: UsePaymentFilterOptions) {
  return useMemo(() => {
    let result = payments || [];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          (p.comment || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q) ||
          (p.invoiceIdentifier || "").toLowerCase().includes(q) ||
          (String((p as any).contractorName || "")).toLowerCase().includes(q)
      );
    }
    if (paymentKindFilter !== "all") result = result.filter((p) => p.kind === paymentKindFilter);
    if (periodRange.from) result = result.filter((p) => String(p.paymentDate).slice(0, 10) >= periodRange.from);
    if (periodRange.to) result = result.filter((p) => String(p.paymentDate).slice(0, 10) <= periodRange.to);
    if (paymentContractorFilter !== "all") {
      result = result.filter((p) => String(p.contractorId) === paymentContractorFilter);
    }
    if (amountFrom) result = result.filter((p) => p.amount >= Number(amountFrom));
    if (amountTo) result = result.filter((p) => p.amount <= Number(amountTo));
    if (debtorOnly) {
      const debtorIds = new Set(
        (invoices || []).filter((i) => i.status === "overdue").map((i) => String(i.contractorId))
      );
      result = result.filter((p) => p.contractorId && debtorIds.has(String(p.contractorId)));
    }

    if (sortConfig) {
      result = [...result].sort((a, b) => {
        const aVal = (a as any)[sortConfig.key];
        const bVal = (b as any)[sortConfig.key];
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
        }
        return sortConfig.direction === "asc"
          ? String(aVal || "").localeCompare(String(bVal || ""))
          : String(bVal || "").localeCompare(String(aVal || ""));
      });
    }
    return result;
  }, [payments, invoices, searchQuery, sortConfig, paymentKindFilter, periodRange, paymentContractorFilter, amountFrom, amountTo, debtorOnly]);
}

export function usePaginationReset(
  page: React.Dispatch<React.SetStateAction<number>>,
  deps: unknown[]
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { page(1); }, deps);
}
