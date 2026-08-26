import { useState, useMemo, useEffect, useCallback } from 'react';
import { parseRowsPerPage } from '@/lib/utils';
import { TableFooterPagination, SortableTableHead } from '@/components/shared';
import { useTranslation } from '@/lib/i18n';
import { usePLReport, useCalendarPayments, usePaymentRegister, useCategories } from '../hooks/useFinance';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, TrendingUp, TrendingDown, Calendar, FileText } from 'lucide-react';
import { useDataTable } from '@/hooks/useDataTable';
import { StatsCard } from '@/components/ui/StatsCard';
import { useModuleSettings } from '@/modules/settings/hooks/useModuleSettings';

const fmt = (n: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

// ───────── CSV export helper ─────────
function exportCsv(rows: Record<string, unknown>[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(';'),
    ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(';')),
  ];
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════
// P&L Report
// ═══════════════════════════════════
function PLReport({
  dateFrom = '',
  dateTo = '',
  onExportReady,
}: {
  dateFrom?: string;
  dateTo?: string;
  onExportReady?: (fn: (() => void) | null) => void;
}) {
  const { t } = useTranslation();
  
  const table = useDataTable<any>({
    initialData: [],
    initialColumns: {
      category: true,
      kind: true,
      amount: true,
      share: true,
    },
    storageKey: "finance-pl-table",
  });

  const [categoryId, _setCategoryId] = useState<string>('all');
  const setCategoryId = useCallback((val: string) => {
    _setCategoryId(val);
    table.setCurrentPage(1);
  }, [table]);
  const { data: categories = [] } = useCategories();

  const filters = useMemo(() => ({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    categoryId: categoryId !== 'all' ? categoryId : undefined,
  }), [dateFrom, dateTo, categoryId]);

  const { data, isLoading } = usePLReport(filters);

  // Reset page when external date filters change via derived state
  const [prevDates, setPrevDates] = useState({ dateFrom, dateTo });
  if (dateFrom !== prevDates.dateFrom || dateTo !== prevDates.dateTo) {
    setPrevDates({ dateFrom, dateTo });
    table.setCurrentPage(1);
  }

  const sortedByCategory = useMemo(
    () => [...(data?.byCategory || [])].sort((a, b) => b.total - a.total),
    [data]
  );
  
  const plPerPage = parseRowsPerPage(table.rowsPerPage);
  const paginatedByCategory = sortedByCategory.slice((table.currentPage - 1) * plPerPage, table.currentPage * plPerPage);

  const handleExport = useCallback(() => {
    if (!data?.byCategory) return;
    exportCsv(
      data.byCategory.map(c => ({
        'Статья': c.categoryName,
        'Тип': c.kind === 'income' ? 'Доход' : 'Расход',
        'Сумма': c.total,
      })),
      `pl_report_${dateFrom || 'all'}_${dateTo || 'all'}.csv`
    );
  }, [data, dateFrom, dateTo]);

  useEffect(() => {
    onExportReady?.(data ? handleExport : null);
  }, [data, handleExport, onExportReady]);

  const columnLabels: Record<string, string> = {
    category: t('generated.stat_ya'),
    kind: t('generated.tip'),
    amount: t('generated.summa'),
    share: t('generated.dolya'),
  };

  const { settings } = useModuleSettings("finance");
  const showStats = settings.features?.enableStatistics !== false;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder={t('finance.dds.category')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('generated.vse_kategorii')}</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}</div>
      ) : !data ? (
        <div className="titan-card p-8 text-center text-muted-foreground">{t('finance.reports.no_pl_data')}</div>
      ) : (
        <>
          {/* Summary */}
          {showStats && (
            <div className="grid grid-cols-3 gap-4">
              <StatsCard 
              title={t('finance.reports.pl_income')}
              value={fmt(data.totalIncome)}
              icon={TrendingUp}
              valueColor="text-green-600"
              iconColor="text-green-500 bg-green-50 dark:bg-green-950"
            />
            <StatsCard 
              title={t('finance.reports.pl_expense')}
              value={fmt(data.totalExpense)}
              icon={TrendingDown}
              valueColor="text-destructive"
              iconColor="text-destructive bg-red-50 dark:bg-red-950"
            />
            <StatsCard 
              title={data.profit >= 0 ? t('finance.reports.pl_profit') : t('finance.reports.pl_loss')}
              value={`${data.profit >= 0 ? '+' : ''}${fmt(data.profit)}`}
              valueColor={data.profit >= 0 ? 'text-green-600' : 'text-destructive'}
              className={data.profit >= 0 ? '' : 'border-destructive/50'}
            />
          </div>
          )}

          {/* Breakdown table */}
          {data.byCategory && data.byCategory.length > 0 && (
            <div className="titan-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {['category', 'kind', 'amount', 'share'].map(key => (
                        <SortableTableHead
                          key={key}
                          label={columnLabels[key]}
                          width={table.columnWidths?.[key]}
                          onResize={(w) => table.setColumnWidth(key, w)}
                          className={key === 'amount' || key === 'share' ? 'text-right' : ''}
                          onSort={() => {}}
                          direction={null}
                        />
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedByCategory.map((cat, idx) => {
                      const base = cat.kind === 'income' ? data.totalIncome : data.totalExpense;
                      const pct = base > 0 ? ((cat.total / base) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={idx} className="border-t hover:bg-muted/30">
                          <td className="p-3" style={{ width: table.columnWidths?.category }}>{cat.categoryName}</td>
                          <td className="p-3" style={{ width: table.columnWidths?.kind }}>
                            <Badge
                              variant="outline"
                              className={`text-xs ${cat.kind === 'income' ? 'border-green-400 text-green-700' : 'border-red-400 text-red-700'}`}
                            >
                              {cat.kind === 'income' ? 'Доход' : 'Расход'}
                            </Badge>
                          </td>
                          <td className={`p-3 text-right font-medium ${cat.kind === 'income' ? 'text-green-600' : 'text-destructive'}`} style={{ width: table.columnWidths?.amount }}>
                            {fmt(cat.total)}
                          </td>
                          <td className="p-3 text-right text-muted-foreground" style={{ width: table.columnWidths?.share }}>{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <TableFooterPagination
                shownCount={paginatedByCategory.length}
                totalCount={sortedByCategory.length}
                rowsPerPage={table.rowsPerPage}
                onRowsPerPageChange={table.setRowsPerPage}
                currentPage={table.currentPage}
                onPageChange={table.setCurrentPage}
                className="flex items-center justify-between p-3 border-t border-border"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════
// Payment Calendar
// ═══════════════════════════════════
function PaymentCalendar() {
  const { t } = useTranslation();
  const [range, setRange] = useState<'week' | 'month'>('month');
  const { data: calPays, isLoading } = useCalendarPayments(range);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{t('generated.period')}</span>
        <div className="flex rounded-md border overflow-hidden">
          {(['week', 'month'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-1.5 text-sm transition-colors ${range === r ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              {r === 'week' ? '7 дней' : '30 дней'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14" />)}</div>
      ) : !calPays || calPays.length === 0 ? (
        <div className="titan-card p-8 text-center">
          <Calendar className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">{t('generated.net_planovyh_platezhey')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {calPays.map((pay, idx) => {
            const isOverdue = !pay.isUpcoming && new Date(pay.paymentDate) < new Date();
            return (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-lg border ${isOverdue ? 'border-destructive/40 bg-red-50/30 dark:bg-red-950/10' : 'border-border'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`text-sm font-mono px-2 py-1 rounded ${isOverdue ? 'bg-destructive/10 text-destructive' : 'bg-muted'}`}>
                    {pay.paymentDate}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{pay.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono text-xs">{pay.kind}</Badge>
                  <div className={`font-semibold ${isOverdue ? 'text-destructive' : ''}`}>
                    {fmt(pay.amount)}
                  </div>
                  {isOverdue && (
                    <Badge variant="destructive" className="text-xs">{t('generated.prosrochen')}</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════
// Payment Register
// ═══════════════════════════════════
function PaymentRegister({
  dateFrom = '',
  dateTo = '',
  onExportReady,
}: {
  dateFrom?: string;
  dateTo?: string;
  onExportReady?: (fn: (() => void) | null) => void;
}) {
  const { t } = useTranslation();

  const table = useDataTable<any>({
    initialData: [],
    initialColumns: {
      date: true,
      kind: true,
      contractor: true,
      category: true,
      invoice: true,
      amount: true,
    },
    storageKey: "finance-register-table",
  });

  const [kind, _setKind] = useState<'all' | 'income' | 'expense'>('all');
  const setKind = useCallback((val: 'all' | 'income' | 'expense') => {
    _setKind(val);
    table.setCurrentPage(1);
  }, [table]);

  const [categoryId, _setCategoryId] = useState<string>('all');
  const setCategoryId = useCallback((val: string) => {
    _setCategoryId(val);
    table.setCurrentPage(1);
  }, [table]);
  const { data: categories = [] } = useCategories();

  const filters = useMemo(() => ({
    kind: kind !== 'all' ? kind : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    categoryId: categoryId !== 'all' ? categoryId : undefined,
  }), [kind, dateFrom, dateTo, categoryId]);

  const { data: payments, isLoading } = usePaymentRegister(filters);

  // Reset page when external date filters change via derived state
  const [prevDates, setPrevDates] = useState({ dateFrom, dateTo });
  if (dateFrom !== prevDates.dateFrom || dateTo !== prevDates.dateTo) {
    setPrevDates({ dateFrom, dateTo });
    table.setCurrentPage(1);
  }

  const regPerPage = parseRowsPerPage(table.rowsPerPage);
  const paginatedPayments = (payments || []).slice((table.currentPage - 1) * regPerPage, table.currentPage * regPerPage);

  const totalIncome  = (payments || []).filter(p => p.kind === 'income').reduce((s, p) => s + Number(p.amount), 0);
  const totalExpense = (payments || []).filter(p => p.kind === 'expense').reduce((s, p) => s + Number(p.amount), 0);

  const handleExport = useCallback(() => {
    if (!payments) return;
    exportCsv(
      payments.map(p => ({
        'Дата': p.paymentDate,
        'Тип': p.kind === 'income' ? 'Доход' : 'Расход',
        'Контрагент': p.contractorName || '',
        'Проект': p.projectName || '',
        'Счёт': p.invoiceIdentifier || '',
        'Статья': p.categoryName || '',
        'Способ оплаты': p.method || '',
        'Сумма': p.amount,
        'Комментарий': p.comment || '',
      })),
      `payment_register_${dateFrom || 'all'}.csv`
    );
  }, [payments, dateFrom]);

  useEffect(() => {
    onExportReady?.(payments?.length ? handleExport : null);
  }, [payments, handleExport, onExportReady]);

  const columnLabels: Record<string, string> = {
    date: t('generated.data'),
    kind: t('generated.tip'),
    contractor: t('generated.kontragent'),
    category: t('generated.stat_ya'),
    invoice: t('generated.schet'),
    amount: t('generated.summa'),
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex rounded-md border overflow-hidden text-sm">
          {(['all', 'income', 'expense'] as const).map(k => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`px-3 py-1.5 transition-colors ${kind === k ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              {k === 'all' ? 'Все' : k === 'income' ? 'Доходы' : 'Расходы'}
            </button>
          ))}
        </div>
        <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-[240px]">
                <SelectValue placeholder={t('finance.dds.category')} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">{t('generated.vse_kategorii')}</SelectItem>
                {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                </SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>

      {payments && payments.length > 0 && (
        <div className="flex gap-4 text-sm">
          <span className="text-green-600 font-medium">Доходы: {fmt(totalIncome)}</span>
          <span className="text-destructive font-medium">Расходы: {fmt(totalExpense)}</span>
          <span className={`font-bold ${totalIncome - totalExpense >= 0 ? 'text-green-600' : 'text-destructive'}`}>
            Итого: {totalIncome - totalExpense >= 0 ? '+' : ''}{fmt(totalIncome - totalExpense)}
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10" />)}</div>
      ) : !payments || payments.length === 0 ? (
        <div className="titan-card p-8 text-center text-muted-foreground">{t('finance.reports.no_register_data')}</div>
      ) : (
        <div className="titan-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {['date', 'kind', 'contractor', 'category', 'invoice', 'amount'].map(key => (
                    <SortableTableHead
                      key={key}
                      label={columnLabels[key]}
                      width={table.columnWidths?.[key]}
                      onResize={(w) => table.setColumnWidth(key, w)}
                      className={key === 'amount' ? 'text-right' : ''}
                      onSort={() => {}}
                      direction={null}
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedPayments.map((p, idx) => (
                  <tr key={idx} className="border-t hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs" style={{ width: table.columnWidths?.date }}>{p.paymentDate}</td>
                    <td className="p-3" style={{ width: table.columnWidths?.kind }}>
                      <Badge
                        variant="outline"
                        className={`text-xs ${p.kind === 'income' ? 'border-green-400 text-green-700' : 'border-red-400 text-red-700'}`}
                      >
                        {p.kind === 'income' ? 'Доход' : 'Расход'}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground" style={{ width: table.columnWidths?.contractor }}>{p.contractorName || t('common.no_data')}</td>
                    <td className="p-3 text-muted-foreground text-xs" style={{ width: table.columnWidths?.category }}>{p.categoryName || t('common.no_data')}</td>
                    <td className="p-3 font-mono text-xs" style={{ width: table.columnWidths?.invoice }}>{p.invoiceIdentifier || t('common.no_data')}</td>
                    <td className={`p-3 text-right font-medium ${p.kind === 'income' ? 'text-green-600' : 'text-destructive'}`} style={{ width: table.columnWidths?.amount }}>
                      {p.kind === 'income' ? '+' : '-'}{fmt(Number(p.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TableFooterPagination
            shownCount={paginatedPayments.length}
            totalCount={(payments || []).length}
            rowsPerPage={table.rowsPerPage}
            onRowsPerPageChange={table.setRowsPerPage}
            currentPage={table.currentPage}
            onPageChange={table.setCurrentPage}
            className="flex items-center justify-between p-3 border-t border-border"
          />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════
// Main Reports Tab
// ═══════════════════════════════════
export function ReportsTab({
  dateFrom = '',
  dateTo = '',
  onExportReady,
}: {
  dateFrom?: string;
  dateTo?: string;
  onExportReady?: (fn: (() => void) | null) => void;
}) {
  const { t } = useTranslation();
  const [activeReport, setActiveReport] = useState('pl');

  const handleTabChange = (tab: string) => {
    setActiveReport(tab);
    if (tab === 'calendar') onExportReady?.(null);
  };

  return (
    <Tabs value={activeReport} onValueChange={handleTabChange} className="space-y-4">
      <TabsList>
        <TabsTrigger value="pl" className="gap-2">
          <TrendingUp className="w-4 h-4" />
          {t('finance.reports.pl_title')}
        </TabsTrigger>
        <TabsTrigger value="calendar" className="gap-2">
          <Calendar className="w-4 h-4" />
          {t('finance.reports.calendar_title')}
        </TabsTrigger>
        <TabsTrigger value="register" className="gap-2">
          <FileText className="w-4 h-4" />
          {t('finance.reports.register_title')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pl">
        <PLReport dateFrom={dateFrom} dateTo={dateTo} onExportReady={activeReport === 'pl' ? onExportReady : undefined} />
      </TabsContent>

      <TabsContent value="calendar">
        <PaymentCalendar />
      </TabsContent>

      <TabsContent value="register">
        <PaymentRegister dateFrom={dateFrom} dateTo={dateTo} onExportReady={activeReport === 'register' ? onExportReady : undefined} />
      </TabsContent>
    </Tabs>
  );
}
