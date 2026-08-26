import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, AlertCircle, TrendingDown, FileCheck } from 'lucide-react';
import { formatMoney } from '../utils';

interface ProjectExpensesSummaryProps {
  summary: {
    totalExpenses?: number;
    totalAmount?: number;
    approvedAmount?: number;
    pendingAmount?: number;
  } | null;
}

export const ProjectExpensesSummary = ({ summary }: ProjectExpensesSummaryProps) => {
  const { t } = useTranslation();

  if (!summary || summary.totalExpenses <= 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t('projects.expenses.summary.total')}</p>
              <p className="text-lg font-semibold">{summary.totalExpenses}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-red-600" />
            <div>
              <p className="text-xs text-muted-foreground">{t('projects.expenses.summary.total_amount')}</p>
              <p className="text-lg font-semibold">{formatMoney(summary.totalAmount)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground">{t('projects.expenses.summary.approved')}</p>
              <p className="text-lg font-semibold">{formatMoney(summary.approvedAmount)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <div>
              <p className="text-xs text-muted-foreground">{t('projects.expenses.summary.pending')}</p>
              <p className="text-lg font-semibold">{formatMoney(summary.pendingAmount)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
