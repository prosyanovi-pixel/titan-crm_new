import { useState, useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useTranslation } from '@/lib/i18n';
import { useReceivablesReport, useReconciliationAct } from '../hooks/useFinance';
import { useContractorsList } from '@/modules/contractors';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, FileText, ChevronDown, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { StatsCard } from '@/components/ui/StatsCard';
import { useModuleSettings } from '@/modules/settings/hooks/useModuleSettings';

const fmt = (n: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

// ───────── Reconciliation Act Sheet ─────────
function ReconciliationActSheet({
  contractorId,
  contractorName,
  onClose,
}: {
  contractorId: string;
  contractorName: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { data: act, isLoading } = useReconciliationAct(contractorId);

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {t('finance.debts.act_title')} — {contractorName}
          </h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <FileText className="w-4 h-4 mr-1" /> {t('generated.pechat')}
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>✕</Button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : !act ? (
            <p className="text-muted-foreground text-center py-8">{t('generated.net_dannyh')}</p>
          ) : (
            <div className="space-y-6 print:text-sm">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground">{t('finance.debts.act_total_invoiced')}</div>
                  <div className="font-bold text-lg">{fmt(act.totalInvoiced)}</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground">{t('finance.debts.act_total_paid')}</div>
                  <div className="font-bold text-lg text-green-600">{fmt(act.totalPaid)}</div>
                </div>
                <div className={`p-3 rounded-lg ${act.balance > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                  <div className="text-xs text-muted-foreground">{t('finance.debts.act_balance')}</div>
                  <div className={`font-bold text-lg ${act.balance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {fmt(Math.abs(act.balance))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {act.balance > 0 ? t('finance.debts.act_debit') : t('finance.debts.act_credit')}
                  </div>
                </div>
              </div>

              {/* Invoices */}
              <div>
                <h3 className="font-semibold mb-2">{t('generated.scheta')}</h3>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2">{t('generated.nomer')}</th>
                      <th className="text-left p-2">{t('generated.data')}</th>
                      <th className="text-right p-2">{t('generated.summa')}</th>
                      <th className="text-right p-2">{t('generated.oplacheno')}</th>
                      <th className="text-right p-2">{t('generated.ostatok')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {act.invoices.map(inv => (
                      <tr key={inv.id} className="border-b hover:bg-muted/30">
                        <td className="p-2 font-mono text-xs">{inv.identifier}</td>
                        <td className="p-2">{inv.issueDate}</td>
                        <td className="p-2 text-right">{fmt(inv.amountTotal)}</td>
                        <td className="p-2 text-right text-green-600">{fmt(inv.amountPaid)}</td>
                        <td className="p-2 text-right text-destructive">{fmt(inv.amountDue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Payments */}
              <div>
                <h3 className="font-semibold mb-2">{t('generated.platezhi')}</h3>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2">{t('generated.data')}</th>
                      <th className="text-left p-2">{t('generated.schet')}</th>
                      <th className="text-left p-2">{t('generated.kommentariy')}</th>
                      <th className="text-right p-2">{t('generated.summa')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {act.payments.map(p => (
                      <tr key={p.id} className="border-b hover:bg-muted/30">
                        <td className="p-2">{p.paymentDate}</td>
                        <td className="p-2 font-mono text-xs">{p.invoiceIdentifier || t('common.no_data')}</td>
                        <td className="p-2 text-muted-foreground">{p.comment || t('common.no_data')}</td>
                        <td className={`p-2 text-right ${p.kind === 'income' ? 'text-green-600' : 'text-destructive'}`}>
                          {p.kind === 'income' ? '+' : '-'}{fmt(p.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ───────── Debt row ─────────
function DebtRow({ item }: { item: any }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const isOverdue = item.maxOverdueDays > 0;

  return (
    <div className={`border rounded-lg overflow-hidden ${isOverdue ? 'border-destructive/40' : 'border-border'}`}>
      <div
        className={`flex items-center justify-between p-4 cursor-pointer hover:bg-muted/40 transition-colors ${isOverdue ? 'bg-red-50/30 dark:bg-red-950/20' : ''}`}
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {expanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
          {isOverdue && <AlertCircle className="w-4 h-4 text-destructive shrink-0" />}
          <div className="min-w-0">
            <div className="font-medium truncate">{item.contractorName}</div>
            <div className="text-xs text-muted-foreground">{item.projectName}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {isOverdue && (
            <Badge variant="destructive" className="text-xs">
              {item.maxOverdueDays} дн.
            </Badge>
          )}
          <div className="text-right">
            <div className="font-semibold text-destructive">
              {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.totalDue)}
            </div>
            <div className="text-xs text-muted-foreground">{item.overdueCount > 0 ? `${item.overdueCount} просроч.` : 'в срок'}</div>
          </div>
        </div>
      </div>
      {expanded && (
        <div className="border-t bg-muted/20">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 pl-4">{t('generated.schet')}</th>
                <th className="text-left p-2">{t('generated.srok')}</th>
                <th className="text-right p-2 pr-4">{t('generated.ostatok')}</th>
              </tr>
            </thead>
            <tbody>
              {item.invoices?.map((inv: any) => (
                <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-2 pl-4 font-mono text-xs">{inv.identifier}</td>
                  <td className={`p-2 text-xs ${inv.isOverdue ? 'text-destructive font-medium' : ''}`}>
                    <div className="flex flex-col">
                      <span>{inv.dueDate}</span>
                      {inv.isOverdue && inv.overdueSince && (
                        <span className="text-[10px] text-destructive">
                          с {new Date(inv.overdueSince).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-2 pr-4 text-right">{new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(inv.amountDue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ───────── Main Component ─────────
export function DebtsDashboard() {
  const { t } = useTranslation();
  const [actContractorId, setActContractorId] = useState<string | null>(null);
  const [actContractorName, setActContractorName] = useState('');
  const [selectedContractorId, setSelectedContractorId] = useState('all');

  const [debtPage, setDebtPage] = useState(1);
  const [debtRowsPerPage, setDebtRowsPerPage] = useState('25');

  const { data: receivables, isLoading } = useReceivablesReport('contractor');
  const { contractors } = useContractorsList();

  const overdue = useMemo(
    () => (receivables || []).filter(r => r.maxOverdueDays > 0).sort((a, b) => b.maxOverdueDays - a.maxOverdueDays),
    [receivables]
  );
  const upcoming = useMemo(
    () => (receivables || []).filter(r => r.maxOverdueDays === 0),
    [receivables]
  );

  const filtered = useMemo(() => {
    if (selectedContractorId === 'all') return receivables || [];
    return (receivables || []).filter(r => String(r.contractorId) === selectedContractorId);
  }, [receivables, selectedContractorId]);

  const sortedFiltered = useMemo(() => {
    const overdueList = filtered.filter(r => r.maxOverdueDays > 0).sort((a, b) => b.maxOverdueDays - a.maxOverdueDays);
    const upcomingList = filtered.filter(r => r.maxOverdueDays === 0);
    return [...overdueList, ...upcomingList];
  }, [filtered]);

  const totalOverdue = overdue.reduce((s, r) => s + r.totalDue, 0);
  const totalUpcoming = upcoming.reduce((s, r) => s + r.totalDue, 0);

  const { settings } = useModuleSettings("finance");
  const showStats = settings.features?.enableStatistics !== false;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      {showStats && (
        <div className="grid grid-cols-2 gap-4">
          <StatsCard 
            title={t('finance.debts.overdue')}
            value={fmt(totalOverdue)}
            icon={TrendingDown}
            valueColor="text-destructive"
            iconColor="text-destructive bg-red-50 dark:bg-red-950"
            trendLabel={`${overdue.length} ${t('generated.kontragentov')}`}
          />
          <StatsCard 
            title={t('finance.debts.upcoming')}
            value={fmt(totalUpcoming)}
            icon={TrendingUp}
            valueColor="text-amber-600"
            iconColor="text-amber-500 bg-amber-50 dark:bg-amber-950"
            trendLabel={`${upcoming.length} ${t('generated.kontragentov')}`}
          />
        </div>
      )}

      {/* Filter + act button */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={selectedContractorId} onValueChange={setSelectedContractorId}>
          <SelectTrigger className="w-60 h-8">
            <SelectValue placeholder={t('generated.kontragent')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('generated.vse_kontragenty')}</SelectItem>
            {(contractors || []).map(c => (
              <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedContractorId !== 'all' && (
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => {
              const c = (contractors || []).find(c => String(c.id) === selectedContractorId);
              setActContractorId(selectedContractorId);
              setActContractorName(c?.name || '');
            }}
          >
            <FileText className="w-4 h-4" />
            {t('finance.debts.generate_act')}
          </Button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="titan-card p-8 text-center text-muted-foreground">
          {t('finance.debts.no_debts')}
        </div>
      ) : (
        <div className="h-[600px] border border-border rounded-lg bg-background flex flex-col">
          {overdue.length > 0 && selectedContractorId === 'all' && (
            <p className="text-xs font-medium text-destructive uppercase tracking-wide p-2 border-b bg-muted/20">
              Просроченные ({overdue.length})
            </p>
          )}
          <Virtuoso
            style={{ flex: 1 }}
            data={sortedFiltered}
            itemContent={(_, item) => (
              <div className="p-2 border-b border-border last:border-b-0">
                <DebtRow item={item} />
              </div>
            )}
          />
        </div>
      )}

      {/* Reconciliation act modal */}
      {actContractorId && (
        <ReconciliationActSheet
          contractorId={actContractorId}
          contractorName={actContractorName}
          onClose={() => setActContractorId(null)}
        />
      )}
    </div>
  );
}
