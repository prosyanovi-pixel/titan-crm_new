import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertCircle,
  CheckCircle,
  Users,
  Building,
  CreditCard,
  AlertTriangle,
  FileText,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface ImportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview: {
    fileName: string;
    importType: string;
    account: string | null;
    dateFrom: string | null;
    dateTo: string | null;
    totalCredit: number;
    totalDebit: number;
    linesCount: number;
    summary: {
      incomeCount: number;
      expenseCount: number;
      uniqueContractors: number;
    };
  };
  report?: {
    contractors: {
      total: number;
      new: number;
      updated: number;
      newAccounts: number;
    };
    newContractors: Array<{ id: string; name: string; changes: string[] }>;
    updatedContractors: Array<{ id: string; name: string; changes: string[] }>;
    newAccounts: Array<{ contractorName: string; accountInfo: string }>;
    warnings: Array<{ warning: string; contractorName?: string }>;
    suggestions: string[];
  };
  onConfirm: () => void;
  onReject: () => void;
  isPending?: boolean;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

export function ImportPreviewDialog({
  open,
  onOpenChange,
  preview,
  report,
  onConfirm,
  onReject,
  isPending,
}: ImportPreviewDialogProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'summary' | 'contractors' | 'warnings'>('summary');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {t('finance.statement.import_preview_title')}
          </DialogTitle>
          <DialogDescription>
            {preview.fileName} • {preview.dateFrom} — {preview.dateTo}
            {preview.account && ` • ${preview.account}`}
          </DialogDescription>
        </DialogHeader>

        {/* Вкладки */}
        <div className="flex gap-2 border-b pb-2">
          <Button
            variant={activeTab === 'summary' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('summary')}
          >
            📊 {t('finance.statement.preview_summary')}
          </Button>
          <Button
            variant={activeTab === 'contractors' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('contractors')}
            disabled={!report}
          >
            👥 {t('finance.statement.preview_contractors')}
          </Button>
          <Button
            variant={activeTab === 'warnings' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('warnings')}
            disabled={!report || (report?.warnings?.length || 0) === 0}
          >
            ⚠️ {t('finance.statement.preview_warnings')}
          </Button>
        </div>

        {/* Контент */}
        <ScrollArea className="flex-1 max-h-96">
          {activeTab === 'summary' && (
            <div className="space-y-4 py-2">
              {/* Суммы */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-sm font-medium">{t('finance.statement.preview_incomes')}</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                    {fmt(preview.totalCredit)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t('finance.statement.preview_operations', { count: preview.summary.incomeCount })}
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950/20">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <TrendingDown className="w-5 h-5" />
                    <span className="text-sm font-medium">{t('finance.statement.preview_expenses')}</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
                    {fmt(preview.totalDebit)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t('finance.statement.preview_operations', { count: preview.summary.expenseCount })}
                  </div>
                </div>
              </div>

              {/* Статистика */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 border rounded-lg">
                  <div className="text-sm text-muted-foreground">{t('finance.statement.preview_total_lines')}</div>
                  <div className="text-xl font-bold">{preview.linesCount}</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="text-sm text-muted-foreground">{t('finance.statement.preview_unique_contractors')}</div>
                  <div className="text-xl font-bold">{preview.summary.uniqueContractors}</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="text-sm text-muted-foreground">{t('finance.statement.preview_type')}</div>
                  <div className="text-xl font-bold">{preview.importType.toUpperCase()}</div>
                </div>
              </div>

              {/* Отчёт если есть */}
              {report && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{t('finance.statement.preview_contractors')}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Badge variant="secondary" className="justify-center">
                      {t('finance.statement.preview_new_badge', { count: report.contractors.new })}
                    </Badge>
                    <Badge variant="secondary" className="justify-center">
                      {t('finance.statement.preview_updated_badge', { count: report.contractors.updated })}
                    </Badge>
                    <Badge variant="secondary" className="justify-center">
                      {t('finance.statement.preview_accounts_badge', { count: report.contractors.newAccounts })}
                    </Badge>
                  </div>

                  {report.newContractors.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs text-muted-foreground mb-2">{t('finance.statement.preview_new_contractors')}</div>
                      <div className="space-y-1">
                        {report.newContractors.slice(0, 5).map((c, i) => (
                          <div key={i} className="text-sm flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            {c.name}
                          </div>
                        ))}
                        {report.newContractors.length > 5 && (
                          <div className="text-xs text-muted-foreground">
                            {t('finance.statement.preview_more', { count: report.newContractors.length - 5 })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {report && report.warnings.length > 0 && (
                <div className="p-3 border border-amber-300 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {t('finance.statement.preview_warnings_count', { count: report.warnings.length })}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t('finance.statement.preview_warning_attention')}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'contractors' && report && (
            <div className="space-y-4 py-2">
              {report.newContractors.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    {t('finance.statement.preview_new_title', { count: report.newContractors.length })}
                  </h4>
                  <div className="space-y-2">
                    {report.newContractors.map((c, i) => (
                      <div key={i} className="p-2 border rounded-lg text-sm">
                        <div className="font-medium">{c.name}</div>
                        {c.changes.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {c.changes.map((change, j) => (
                              <div key={j}>• {change}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {report.updatedContractors.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-600" />
                    {t('finance.statement.preview_updated_title', { count: report.updatedContractors.length })}
                  </h4>
                  <div className="space-y-2">
                    {report.updatedContractors.map((c, i) => (
                      <div key={i} className="p-2 border rounded-lg text-sm">
                        <div className="font-medium">{c.name}</div>
                        {c.changes.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {c.changes.map((change, j) => (
                              <div key={j}>• {change}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {report.newAccounts.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    {t('finance.statement.preview_new_accounts_title', { count: report.newAccounts.length })}
                  </h4>
                  <div className="space-y-2">
                    {report.newAccounts.map((a, i) => (
                      <div key={i} className="p-2 border rounded-lg text-sm">
                        <div className="font-medium">{a.contractorName}</div>
                        <div className="text-xs text-muted-foreground mt-1">{a.accountInfo}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'warnings' && report && report.warnings.length > 0 && (
            <div className="space-y-3 py-2">
              {report.warnings.map((w, i) => (
                <div key={i} className="p-3 border border-amber-300 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      {w.contractorName && (
                        <div className="text-sm font-medium mb-1">{w.contractorName}</div>
                      )}
                      <div className="text-sm text-amber-800 dark:text-amber-300">{w.warning}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Футер с кнопками */}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onReject} disabled={isPending}>
            {t('general.cancel')}
          </Button>
          <Button onClick={onConfirm} disabled={isPending} className="gap-2">
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {t('finance.statement.importing')}
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                {t('finance.statement.import_confirm')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
