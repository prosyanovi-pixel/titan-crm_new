import React from 'react';
import { useTranslation } from "@/lib/i18n";
import { StatsCard, Skeleton } from "@/components/ui";
import { DollarSign, AlertCircle, CheckCircle, FileText } from "lucide-react";

interface FinanceSummaryCardsProps {
  isLoading: boolean;
  totalReceivables: number;
  overdueCount: number;
  paidCount: number;
  totalInvoices: number;
}

export function FinanceSummaryCards({
  isLoading,
  totalReceivables,
  overdueCount,
  paidCount,
  totalInvoices
}: FinanceSummaryCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {isLoading ? (
        [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 sm:h-32 rounded-xl" />)
      ) : (
        <>
          <StatsCard
            title={t("finance.stats.receivables")}
            value={new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(totalReceivables)}
            icon={DollarSign}
            className="bg-primary/5 border-primary/10"
          />
          <StatsCard 
            title={t("finance.stats.overdue")}        
            value={String(overdueCount)}  
            icon={AlertCircle} 
            className="bg-destructive/5 border-destructive/10 text-destructive" 
          />
          <StatsCard 
            title={t("finance.stats.paid_invoices")}  
            value={String(paidCount)}     
            icon={CheckCircle} 
            className="bg-green-50 border-green-100" 
          />
          <StatsCard 
            title={t("finance.stats.total_invoices")} 
            value={String(totalInvoices)} 
            icon={FileText} 
          />
        </>
      )}
    </div>
  );
}
