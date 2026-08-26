import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, DollarSign, AlertCircle, TrendingUp } from 'lucide-react';
import { formatMoney } from '../utils';

interface PaymentScheduleSummaryProps {
  summary: {
    totalPayments?: number;
    totalPaid?: number;
    overdueAmount?: number;
    pendingAmount?: number;
  } | null;
}

export const PaymentScheduleSummary = ({ summary }: PaymentScheduleSummaryProps) => {
  const { t } = useTranslation();

  if (!summary || summary.totalPayments <= 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t('projects.payments.summary.total')}</p>
              <p className="text-lg font-semibold">{summary.totalPayments}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">{t('projects.payments.summary.paid')}</p>
              <p className="text-lg font-semibold">{formatMoney(summary.totalPaid)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <div>
              <p className="text-xs text-muted-foreground">{t('projects.payments.summary.overdue')}</p>
              <p className="text-lg font-semibold">{formatMoney(summary.overdueAmount)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <div>
              <p className="text-xs text-muted-foreground">{t('projects.payments.summary.pending')}</p>
              <p className="text-lg font-semibold">{formatMoney(summary.pendingAmount)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
