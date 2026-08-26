import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/lib/i18n';
import { useDDSReport } from '../hooks/useFinance';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings2, TrendingDown, TrendingUp } from 'lucide-react';
import { StatsCard } from '@/components/ui/StatsCard';

const fmt = (n: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

// ─────────── Bar chart (pure CSS) ───────────
function CategoryBar({
  name,
  amount,
  max,
  color,
  kind,
}: {
  name: string;
  amount: number;
  max: number;
  color: string | null;
  kind: 'income' | 'expense';
}) {
  const pct = max > 0 ? Math.max(2, (amount / max) * 100) : 0;
  const barColor = color || (kind === 'income' ? '#22C55E' : '#EF4444');

  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-40 truncate text-muted-foreground shrink-0">{name}</div>
      <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
      <div className="w-28 text-right font-medium shrink-0">{fmt(amount)}</div>
    </div>
  );
}

// ─────────── Main Tab ───────────
export function DDSTab({
  dateFrom = '',
  dateTo = '',
  showCategories = false,
}: {
  dateFrom?: string;
  dateTo?: string;
  showCategories?: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: ddsRows, isLoading } = useDDSReport(
    dateFrom || dateTo ? { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined } : undefined
  );

  const income = useMemo(() => (ddsRows || []).filter(r => r.kind === 'income'), [ddsRows]);
  const expense = useMemo(() => (ddsRows || []).filter(r => r.kind === 'expense'), [ddsRows]);

  const totalIncome  = income.reduce((s, r) => s + Number(r.total), 0);
  const totalExpense = expense.reduce((s, r) => s + Number(r.total), 0);
  const profit = totalIncome - totalExpense;

  const maxIncome  = Math.max(...income.map(r => Number(r.total)), 1);
  const maxExpense = Math.max(...expense.map(r => Number(r.total)), 1);

  const goToSettings = () => {
    navigate('/settings?section=finance&tab=categories');
  };

  return (
    <div className="space-y-4">
      {showCategories && (
        <div className="flex items-center justify-between p-4 bg-muted/30 border rounded-lg mb-4">
          <div className="space-y-1">
            <h3 className="text-sm font-medium">{t('finance.dds.categories')}</h3>
            <p className="text-xs text-muted-foreground">Управление статьями доходов и расходов перенесено в настройки модуля</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={goToSettings}>
            <Settings2 className="w-4 h-4" />
            Перейти в настройки
          </Button>
        </div>
      )}

      {/* Profit summary */}
      <StatsCard 
        title={t('finance.dds.profit')}
        value={`${profit >= 0 ? '+' : ''}${fmt(profit)}`}
        valueColor={profit >= 0 ? 'text-green-600' : 'text-destructive'}
        className={profit >= 0 ? '' : 'border-destructive/40'}
      />

      {/* Two-column layout: income | expense */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-8" />)}</div>
          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-8" />)}</div>
        </div>
      ) : !ddsRows || ddsRows.length === 0 ? (
        <div className="titan-card p-8 text-center text-muted-foreground">
          {t('finance.dds.no_data')}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Income column */}
          <div className="titan-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <h3 className="font-semibold text-green-600">{t('finance.dds.income')}</h3>
              </div>
              <span className="text-lg font-bold text-green-600">{fmt(totalIncome)}</span>
            </div>
            {income.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('generated.net_dannyh')}</p>
            ) : income.map((r, idx) => (
              <CategoryBar
                key={idx}
                name={r.categoryName || t('finance.messages.no_article')}
                amount={Number(r.total)}
                max={maxIncome}
                color={r.categoryColor}
                kind="income"
              />
            ))}
          </div>

          {/* Expense column */}
          <div className="titan-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-destructive" />
                <h3 className="font-semibold text-destructive">{t('finance.dds.expense')}</h3>
              </div>
              <span className="text-lg font-bold text-destructive">{fmt(totalExpense)}</span>
            </div>
            {expense.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('generated.net_dannyh')}</p>
            ) : expense.map((r, idx) => (
              <CategoryBar
                key={idx}
                name={r.categoryName || t('finance.messages.no_article')}
                amount={Number(r.total)}
                max={maxExpense}
                color={r.categoryColor}
                kind="expense"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
