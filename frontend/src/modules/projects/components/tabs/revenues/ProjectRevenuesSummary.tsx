import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, DollarSign, AlertCircle, Percent } from 'lucide-react';
import { formatMoney } from '../utils';

interface ProjectRevenuesSummaryProps {
  summary: {
    totalRevenues?: number;
    receivedAmount?: number;
    overdueAmount?: number;
    totalVat?: number;
  } | null;
}

export const ProjectRevenuesSummary = ({ summary }: ProjectRevenuesSummaryProps) => {
  const { t } = useTranslation();

  if (!summary || summary.totalRevenues <= 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t('projects.revenues.summary.total')}</p>
              <p className="text-lg font-semibold">{summary.totalRevenues}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">{t('projects.revenues.summary.received')}</p>
              <p className="text-lg font-semibold">{formatMoney(summary.receivedAmount)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <div>
              <p className="text-xs text-muted-foreground">{t('projects.revenues.summary.overdue')}</p>
              <p className="text-lg font-semibold">{formatMoney(summary.overdueAmount)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-amber-600" />
            <div>
              <p className="text-xs text-muted-foreground">{t('projects.revenues.summary.vat')}</p>
              <p className="text-lg font-semibold">{formatMoney(summary.totalVat)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
