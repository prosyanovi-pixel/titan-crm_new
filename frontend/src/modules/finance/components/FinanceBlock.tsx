import React from 'react';
import { ProjectFinanceSummary } from '../types/finance.types';
import { useTranslation } from '@/lib/i18n';

interface FinanceBlockProps {
  summary: ProjectFinanceSummary | undefined;
  isLoading?: boolean;
}

export function FinanceBlock({ summary, isLoading }: FinanceBlockProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="p-4 bg-slate-50 rounded-lg animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const profitColor = summary.profitLoss >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{t('generated.finansy')}</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="p-3 bg-blue-50 rounded">
          <div className="text-xs text-slate-600">{t('generated.vystavleno_schetov')}</div>
          <div className="font-semibold text-blue-900">{formatCurrency(summary.totalInvoiced)}</div>
        </div>
        <div className="p-3 bg-green-50 rounded">
          <div className="text-xs text-slate-600">{t('generated.polucheno_platezhey')}</div>
          <div className="font-semibold text-green-900">{formatCurrency(summary.totalPaid)}</div>
        </div>
        <div className="p-3 bg-orange-50 rounded">
          <div className="text-xs text-slate-600">{t('generated.rashody')}</div>
          <div className="font-semibold text-orange-900">{formatCurrency(summary.totalExpenses)}</div>
        </div>
        <div className={`p-3 rounded ${summary.profitLoss >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="text-xs text-slate-600">{t('generated.pribyl_ubytok')}</div>
          <div className={`font-semibold ${profitColor}`}>{formatCurrency(summary.profitLoss)}</div>
        </div>
      </div>
      {summary.openReceivables > 0 && (
        <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
          <div className="text-xs text-slate-600">{t('generated.otkrytaya_zadolzhennost')}</div>
          <div className="font-semibold text-yellow-900">{formatCurrency(summary.openReceivables)}</div>
        </div>
      )}
    </div>
  );
}
