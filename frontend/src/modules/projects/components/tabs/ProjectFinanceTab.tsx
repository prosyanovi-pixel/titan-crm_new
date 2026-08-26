import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, TrendingUp, TrendingDown, Percent, Calculator, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatMoney, cn } from '@/lib/utils';
import { useProjectPnL } from '../../hooks/useProjectQueries';
import { api } from '@/lib/api';

interface ProjectPnLReport {
  projectId: number;
  projectName: string;
  revenue: number;
  vatAmount: number;
  revenueExcludingVat: number;
  directExpenses: number;
  directExpensesBreakdown: {
    salary: number;
    materials: number;
    services: number;
    other: number;
  };
  grossProfit: number;
  grossMargin: number;
  overheadExpenses: number;
  operatingProfit: number;
  operatingMargin: number;
  taxes: {
    vat: number;
    usn: number;
    profitTax: number;
    insurance: number;
    ndfl: number;
    total: number;
  };
  netProfit: number;
  netMargin: number;
  profitability: number;
  budget: number;
  budgetUsed: number;
  budgetUsagePercent: number;
  calculatedAt: string;
}

interface ProjectFinanceTabProps {
  projectId?: number;
}

export function ProjectFinanceTab({ projectId }: ProjectFinanceTabProps) {
  const { t } = useTranslation();
  const { data: report, isLoading, error } = useProjectPnL(projectId || null);

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        {t('projects.finance.no_project_selected')}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground border border-dashed rounded-xl bg-muted/20">
        {t('projects.finance.no_data')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t('projects.finance.pnl_title')}</h3>
          <p className="text-sm text-muted-foreground">{report.projectName}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">{t('projects.finance.calculated_at')}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {new Date(report.calculatedAt).toLocaleString('ru-RU')}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={async () => {
              try {
                const blob = await api.get(`/projects/${projectId}/finance/report/pdf`, { responseType: 'blob' }) as Blob;
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `project_${projectId}_finance_report.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              } catch (error) {
                console.error('Failed to download report', error);
              }
            }}
          >
            <Download className="w-4 h-4" />
            {t('common.download')}
          </Button>
        </div>
      </div>

      {/* P&L Отчёт */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Левая колонка - Выручка и Расходы */}
        <Card className="rounded-2xl border-border/40 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold uppercase tracking-wider text-muted-foreground/80">{t('projects.finance.revenue_expenses')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{t('projects.finance.revenue_total')}</span>
              <span className="font-extrabold">{formatMoney(report.revenue)}</span>
            </div>
            
            {report.vatAmount > 0 && (
              <>
                <div className="flex justify-between items-center pl-4">
                  <span className="text-sm text-muted-foreground">- {t('projects.finance.vat')}</span>
                  <span className="text-destructive font-medium">- {formatMoney(report.vatAmount)}</span>
                </div>
                <div className="flex justify-between items-center font-bold border-t pt-2 border-border/50">
                  <span className="text-sm">{t('projects.finance.revenue_excluding_vat')}</span>
                  <span>{formatMoney(report.revenueExcludingVat)}</span>
                </div>
              </>
            )}

            <div className="border-t pt-3 border-border/50">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">{t('projects.finance.direct_expenses')}</span>
                <span className="text-destructive font-extrabold">- {formatMoney(report.directExpenses)}</span>
              </div>
              
              {report.directExpensesBreakdown.salary > 0 && (
                <div className="flex justify-between items-center pl-4 text-xs">
                  <span className="text-muted-foreground">{t('projects.finance.salary')}</span>
                  <span className="font-medium">- {formatMoney(report.directExpensesBreakdown.salary)}</span>
                </div>
              )}
              {report.directExpensesBreakdown.materials > 0 && (
                <div className="flex justify-between items-center pl-4 text-xs">
                  <span className="text-muted-foreground">{t('projects.finance.materials')}</span>
                  <span className="font-medium">- {formatMoney(report.directExpensesBreakdown.materials)}</span>
                </div>
              )}
              {report.directExpensesBreakdown.services > 0 && (
                <div className="flex justify-between items-center pl-4 text-xs">
                  <span className="text-muted-foreground">{t('projects.finance.services')}</span>
                  <span className="font-medium">- {formatMoney(report.directExpensesBreakdown.services)}</span>
                </div>
              )}
              {report.directExpensesBreakdown.other > 0 && (
                <div className="flex justify-between items-center pl-4 text-xs">
                  <span className="text-muted-foreground">{t('projects.finance.other')}</span>
                  <span className="font-medium">- {formatMoney(report.directExpensesBreakdown.other)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center font-extrabold text-lg border-t pt-3 border-border/80">
              <span>{t('projects.finance.gross_profit')}</span>
              <span className={report.grossProfit >= 0 ? 'text-emerald-600' : 'text-destructive'}>
                {formatMoney(report.grossProfit)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-medium">{t('projects.finance.gross_margin')}</span>
              <span className={cn("font-bold px-2 py-0.5 rounded-full text-xs", report.grossMargin >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-destructive/10 text-destructive')}>
                {report.grossMargin}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Правая колонка - Прибыль и Налоги */}
        <Card className="rounded-2xl border-border/40 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold uppercase tracking-wider text-muted-foreground/80">{t('projects.finance.profit_taxes')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {report.overheadExpenses > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{t('projects.finance.overhead')}</span>
                <span className="text-destructive font-medium">- {formatMoney(report.overheadExpenses)}</span>
              </div>
            )}

            <div className="flex justify-between items-center font-bold border-t pt-2 border-border/50">
              <span className="text-sm">{t('projects.finance.operating_profit')}</span>
              <span className={report.operatingProfit >= 0 ? 'text-emerald-600' : 'text-destructive'}>
                {formatMoney(report.operatingProfit)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-medium">{t('projects.finance.operating_margin')}</span>
              <span className={cn("font-bold px-2 py-0.5 rounded-full text-xs", report.operatingMargin >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-destructive/10 text-destructive')}>
                {report.operatingMargin}%
              </span>
            </div>

            <div className="border-t pt-3 border-border/50">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">{t('projects.finance.taxes_total')}</span>
                <span className="text-destructive font-bold">- {formatMoney(report.taxes.total)}</span>
              </div>
              
              {report.taxes.vat > 0 && (
                <div className="flex justify-between items-center pl-4 text-xs">
                  <span className="text-muted-foreground">{t('projects.finance.tax_vat')}</span>
                  <span className="font-medium">- {formatMoney(report.taxes.vat)}</span>
                </div>
              )}
              {report.taxes.usn > 0 && (
                <div className="flex justify-between items-center pl-4 text-xs">
                  <span className="text-muted-foreground">{t('projects.finance.tax_usn')}</span>
                  <span className="font-medium">- {formatMoney(report.taxes.usn)}</span>
                </div>
              )}
              {report.taxes.profitTax > 0 && (
                <div className="flex justify-between items-center pl-4 text-xs">
                  <span className="text-muted-foreground">{t('projects.finance.tax_profit')}</span>
                  <span className="font-medium">- {formatMoney(report.taxes.profitTax)}</span>
                </div>
              )}
              {report.taxes.insurance > 0 && (
                <div className="flex justify-between items-center pl-4 text-xs">
                  <span className="text-muted-foreground">{t('projects.finance.tax_insurance')}</span>
                  <span className="font-medium">- {formatMoney(report.taxes.insurance)}</span>
                </div>
              )}
              {report.taxes.ndfl > 0 && (
                <div className="flex justify-between items-center pl-4 text-xs">
                  <span className="text-muted-foreground">{t('projects.finance.tax_ndfl')}</span>
                  <span className="font-medium">- {formatMoney(report.taxes.ndfl)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center font-extrabold text-lg border-t pt-3 border-border/80">
              <span>{t('projects.finance.net_profit')}</span>
              <span className={report.netProfit >= 0 ? 'text-emerald-600' : 'text-destructive'}>
                {formatMoney(report.netProfit)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-medium">{t('projects.finance.net_margin')}</span>
              <span className={cn("font-bold px-2 py-0.5 rounded-full text-xs", report.netMargin >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-destructive/10 text-destructive')}>
                {report.netMargin}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Метрики */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border-border/40 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">{t('projects.finance.profitability')}</p>
                <p className="text-2xl font-extrabold tracking-tight">{report.profitability}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/40 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600">
                <Percent className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">{t('projects.finance.budget_usage')}</p>
                <p className="text-2xl font-extrabold tracking-tight">{report.budgetUsagePercent}%</p>
              </div>
            </div>
            <Progress value={report.budgetUsagePercent} className="h-2 rounded-full" />
            <p className="text-[11px] font-medium text-muted-foreground mt-2 flex justify-between">
              <span>{formatMoney(report.budgetUsed)}</span>
              <span>{t('lost.iz')} {formatMoney(report.budget)}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/40 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-600">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">{t('projects.finance.tax_load')}</p>
                <p className="text-2xl font-extrabold tracking-tight">
                  {report.revenue > 0 ? ((report.taxes.total / report.revenue) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
            <p className="text-[11px] font-medium text-muted-foreground mt-2">
              {formatMoney(report.taxes.total)} {t('lost.nalogov')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
