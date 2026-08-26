import { useState, useRef } from 'react';
import { parseRowsPerPage } from '@/lib/utils';
import { TableFooterPagination } from '@/components/shared';
import { useTranslation } from '@/lib/i18n';
import {
  useBankStatements,
  useStatementLines,
  useImportStatement,
  useReconcileStatement,
  useUpdateStatementLine,
  useDeleteStatement,
  useCategories,
} from '../hooks/useFinance';
import { useInvoices } from '../hooks/useFinance';
import { BankStatement, StatementLine, ExpenseCategory } from '../types/finance.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Upload, RefreshCw, Trash2, ChevronDown, ChevronRight,
  CheckCircle, AlertCircle, Link as LinkIcon, Tag,
} from 'lucide-react';
import { toast } from 'sonner';
import { ImportPreviewDialog } from '../components/ImportPreviewDialog';

const SUPPORTED_IMPORT_EXTENSIONS = ['csv', 'txt'];

const fmt = (n: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

// ───────── Line row ─────────
function StatementLineRow({
  line,
  invoices,
  categories,
}: {
  line: StatementLine;
  invoices: Array<{ id: string | number; identifier: string }>;
  categories: ExpenseCategory[];
}) {
  const { t } = useTranslation();
  const updateLine = useUpdateStatementLine();
  const [mode, setMode] = useState<'idle' | 'invoice' | 'category'>('idle');
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [showPurposeDialog, setShowPurposeDialog] = useState(false);

  const handleLinkInvoice = async () => {
    if (!selectedInvoice) {
      toast.error(t('finance.statement.select_invoice_first'));
      return;
    }
    try {
      await updateLine.mutateAsync({ lineId: line.id, data: { invoiceId: selectedInvoice } });
      toast.success(t('finance.statement.invoice_linked'));
      setMode('idle');
    } catch (error: unknown) {
      toast.error(t('general.toast.error.data_load') + ': ' + (error instanceof Error ? error.message : "Неизвестная ошибка"));
    }
  };

  const handleUnlinkInvoice = async () => {
    try {
      await updateLine.mutateAsync({ lineId: line.id, data: { invoiceId: null } });
      toast.success(t('finance.statement.invoice_unlinked'));
      setShowUnlinkConfirm(false);
    } catch (error: unknown) {
      toast.error(t('general.toast.error.data_load') + ': ' + (error instanceof Error ? error.message : "Неизвестная ошибка"));
    }
  };

  const handleLinkCategory = async () => {
    if (!selectedCategory) {
      toast.error(t('finance.statement.select_category_first'));
      return;
    }
    try {
      await updateLine.mutateAsync({ lineId: line.id, data: { categoryId: selectedCategory } });
      toast.success(t('finance.statement.category_linked'));
      setMode('idle');
    } catch (error: unknown) {
      toast.error(t('general.toast.error.data_load') + ': ' + (error instanceof Error ? error.message : "Неизвестная ошибка"));
    }
  };

  const statusColor = {
    unmatched: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    auto: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    manual: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  }[line.reconcileStatus] || '';

  const statusLabel = {
    unmatched: t('finance.statement.line_unmatched'),
    auto: t('finance.statement.line_auto'),
    manual: t('finance.statement.line_manual'),
  }[line.reconcileStatus] || line.reconcileStatus;

  const isUnmatched = line.reconcileStatus === 'unmatched';
  const relevantCategories = categories.filter(c =>
    line.direction === 'credit' ? c.kind === 'income' : c.kind === 'expense'
  );

  return (
    <>
      <tr className="border-b hover:bg-muted/30 text-sm">
        <td className="p-2 text-xs text-muted-foreground">{line.lineDate}</td>
        <td className={`p-2 font-medium ${line.direction === 'credit' ? 'text-green-600' : 'text-destructive'}`}>
          {line.direction === 'credit' ? '+' : '-'}{fmt(line.amount)}
        </td>
        <td className="p-2">
          <Badge variant="outline" className={`text-xs ${line.direction === 'credit' ? 'border-green-400' : 'border-red-400'}`}>
            {line.direction === 'credit' ? t('finance.statement.line_credit') : t('finance.statement.line_debit')}
          </Badge>
        </td>
        <td className="p-2 max-w-32 truncate text-muted-foreground">{line.counterparty || t('common.no_data')}</td>
        <td className="p-2 max-w-64">
          {line.purpose ? (
            <div
              className="text-xs text-muted-foreground line-clamp-2 cursor-pointer hover:text-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowPurposeDialog(true);
              }}
              title="Нажмите для просмотра полного текста"
            >
              {line.purpose}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </td>
        {/* Номер платежного поручения */}
        <td className="p-2">
          {line.reference ? (
            <span className="font-mono text-xs text-muted-foreground">{line.reference}</span>
          ) : '—'}
        </td>
        {/* Категория */}
        <td className="p-2">
          {line.categoryName ? (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: line.categoryColor ? `${line.categoryColor}22` : undefined, color: line.categoryColor || undefined }}
            >
              {line.categoryName}
            </span>
          ) : '—'}
        </td>
        {/* Счёт */}
        <td className="p-2">
          {line.invoiceIdentifier ? (
            <div className="flex items-center gap-1">
              <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{line.invoiceIdentifier}</span>
              {/* Кнопка отвязки счета */}
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUnlinkConfirm(true);
                }}
                title={t('finance.statement.unlink_invoice')}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ) : '—'}
        </td>
        <td className="p-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>{statusLabel}</span>
        </td>
        {/* Действия */}
        <td className="p-2 min-w-[180px]">
          {isUnmatched && mode === 'idle' && (
            <div className="flex items-center gap-1 flex-wrap">
              {/* Категория — для всех */}
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setMode('category')}>
                <Tag className="w-3 h-3" />
                {t('generated.kategoriya')}
              </Button>
              {/* Счёт — только для прихода */}
              {line.direction === 'credit' && (
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setMode('invoice')}>
                  <LinkIcon className="w-3 h-3" />
                  {t('finance.statement.assign')}
                </Button>
              )}
            </div>
          )}
          {mode === 'invoice' && (
            <div className="flex items-center gap-1 flex-wrap">
              <Select value={selectedInvoice} onValueChange={setSelectedInvoice}>
                <SelectTrigger className="h-7 w-36 text-xs">
                  <SelectValue placeholder={t('generated.schet')} />
                </SelectTrigger>
                <SelectContent>
                  {invoices.map(inv => (
                    <SelectItem key={inv.id} value={String(inv.id)}>
                      {inv.identifier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" className="h-7 text-xs px-2" onClick={handleLinkInvoice} disabled={!selectedInvoice || updateLine.isPending}>
                <CheckCircle className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setMode('idle')}>✕</Button>
            </div>
          )}
          {mode === 'category' && (
            <div className="flex items-center gap-1 flex-wrap">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-7 w-40 text-xs">
                  <SelectValue placeholder={t('generated.kategoriya')} />
                </SelectTrigger>
                <SelectContent>
                  {relevantCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" className="h-7 text-xs px-2" onClick={handleLinkCategory} disabled={!selectedCategory || updateLine.isPending}>
                <CheckCircle className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setMode('idle')}>✕</Button>
            </div>
          )}
        </td>
      </tr>

      {/* Диалог подтверждения отвязки счета */}
      <Dialog open={showUnlinkConfirm} onOpenChange={setShowUnlinkConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('finance.statement.unlink_invoice')}</DialogTitle>
            <DialogDescription>
              {t('finance.statement.unlink_invoice_confirm')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnlinkConfirm(false)}>
              {t('generated.otmena')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleUnlinkInvoice}
              disabled={updateLine.isPending}
            >
              {t('generated.udalit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог просмотра назначения платежа */}
      <Dialog open={showPurposeDialog} onOpenChange={setShowPurposeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('finance.statement.line_purpose')}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm whitespace-pre-wrap">{line.purpose}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPurposeDialog(false)}>
              {t('finance.messages.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ───────── Statement row ─────────
function StatementRow({
  stmt,
  invoices,
}: {
  stmt: BankStatement;
  invoices: Array<{ id: string | number; identifier: string }>;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [linePage, setLinePage] = useState(1);
  const [lineRowsPerPage, setLineRowsPerPage] = useState('25');
  const [showReconcileDialog, setShowReconcileDialog] = useState(false);
  const reconcile = useReconcileStatement();
  const deleteStmt = useDeleteStatement();

  const { data: lines, isLoading: linesLoading } = useStatementLines(expanded ? stmt.id : null);
  const { data: categories = [] } = useCategories();

  const linePerPage = parseRowsPerPage(lineRowsPerPage);
  const paginatedLines = (lines || []).slice((linePage - 1) * linePerPage, linePage * linePerPage);

  const handleReconcile = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // Открываем диалог выбора счёта
    setShowReconcileDialog(true);
  };

  const handleReconcileWithAccount = async (account: string | null) => {
    await reconcile.mutateAsync({ id: stmt.id, account: account || undefined });
    setShowReconcileDialog(false);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(t('finance.statement.delete_confirm'))) return;
    await deleteStmt.mutateAsync(stmt.id);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="flex flex-wrap items-center justify-between p-4 cursor-pointer hover:bg-muted/40 transition-colors gap-2"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <div>
            <div className="font-medium text-sm">{stmt.fileName || t('finance.messages.import')}</div>
            <div className="text-xs text-muted-foreground">
              {stmt.importType.toUpperCase()} | {stmt.dateFrom} — {stmt.dateTo}
              {stmt.account && ` | ${stmt.account}`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-green-600 font-medium">+{fmt(stmt.totalCredit)}</span>
            {' / '}
            <span className="text-destructive font-medium">-{fmt(stmt.totalDebit)}</span>
          </div>
          <Badge variant={stmt.status === 'reconciled' ? 'default' : 'secondary'} className="text-xs">
            {stmt.status === 'reconciled'
              ? t('finance.statement.status_reconciled')
              : t('finance.statement.status_pending')}
          </Badge>
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            {stmt.status !== 'reconciled' && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={handleReconcile}
                disabled={reconcile.isPending}
              >
                <RefreshCw className={`w-3 h-3 ${reconcile.isPending ? 'animate-spin' : ''}`} />
                {t('finance.statement.reconcile')}
              </Button>
            )}
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={handleDelete}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t">
          {linesLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-8" />)}
            </div>
          ) : !lines || lines.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">{t('generated.net_strok')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left p-2 text-xs font-medium">{t('finance.statement.line_date')}</th>
                    <th className="text-left p-2 text-xs font-medium">{t('finance.statement.line_amount')}</th>
                    <th className="text-left p-2 text-xs font-medium">{t('finance.statement.line_direction')}</th>
                    <th className="text-left p-2 text-xs font-medium">{t('finance.statement.line_counterparty')}</th>
                    <th className="text-left p-2 text-xs font-medium">{t('finance.statement.line_purpose')}</th>
                    <th className="text-left p-2 text-xs font-medium">{t('finance.statement.line_reference')}</th>
                    <th className="text-left p-2 text-xs font-medium">{t('generated.kategoriya')}</th>
                    <th className="text-left p-2 text-xs font-medium">{t('finance.statement.line_invoice')}</th>
                    <th className="text-left p-2 text-xs font-medium">{t('finance.statement.line_status')}</th>
                    <th className="text-left p-2 text-xs font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {paginatedLines.map(line => (
                    <StatementLineRow key={line.id} line={line} invoices={invoices as unknown as { id: string | number; identifier: string; }[]} categories={categories} />
                  ))}
                </tbody>
              </table>
              <TableFooterPagination
                shownCount={paginatedLines.length}
                totalCount={(lines || []).length}
                rowsPerPage={lineRowsPerPage}
                onRowsPerPageChange={(v) => { setLineRowsPerPage(v); setLinePage(1); }}
                currentPage={linePage}
                onPageChange={setLinePage}
                className="flex items-center justify-between px-3 py-2 border-t border-border"
              />
            </div>
          )}
        </div>
      )}
      
      {/* Диалог выбора счёта для авто-реконсиляции */}
      {showReconcileDialog && (
        <ReconcileDialog
          open={showReconcileDialog}
          onOpenChange={setShowReconcileDialog}
          onConfirm={handleReconcileWithAccount}
          defaultAccount={stmt.account || undefined}
          isPending={reconcile.isPending}
        />
      )}
    </div>
  );
}

// ───────── Dialog for account selection in auto-reconcile ─────────
function ReconcileDialog({
  open,
  onOpenChange,
  onConfirm,
  defaultAccount,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (account: string | null) => void;
  defaultAccount?: string;
  isPending: boolean;
}) {
  const { t } = useTranslation();
  const [account, setAccount] = useState(defaultAccount || '');

  const handleStart = () => {
    onConfirm(account || null);
  };

  const handleSkip = () => {
    onConfirm(null); // Без счёта — искать по контрагенту
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            {t('finance.statement.reconcile_title')}
          </DialogTitle>
          <DialogDescription>
            {t('finance.statement.reconcile_description') || 
              'Выберите счёт для автоматической разноски платежей'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium block mb-2">
              {t('finance.statement.account_number')}
            </label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              placeholder="40702810001990005180"
              value={account}
              onChange={e => setAccount(e.target.value)}
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('finance.statement.reconcile_hint') || 
                'Оставьте пустым для поиска по контрагенту'}
            </p>
          </div>

          <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <p className="text-sm text-muted-foreground">
              {t('finance.statement.reconcile_info') || 
                'Система автоматически привяжет платежи к счетам по сумме'}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleSkip} disabled={isPending}>
            {t('finance.statement.without_account')}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleStart} disabled={isPending} className="gap-2">
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {t('finance.statement.reconciling')}
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                {t('finance.statement.reconcile')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ───────── Import dialog ─────────
function ImportDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const importFn = useImportStatement();
  const [importType, setImportType] = useState<'csv' | '1c_txt'>('csv');
  const [account, setAccount] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [rawFile, setRawFile] = useState<File | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [preview, setPreview] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /** Извлекает номер счёта из имени файла */
  const extractAccountFromFileName = (name: string): string | null => {
    const match = name.match(/(\d{20})/);
    return match ? match[1] : null;
  };

  /** Декодирует файл с учётом кодировки: 1C TXT → windows-1251, остальное → UTF-8 */
  const decodeFile = (file: File, type: 'csv' | '1c_txt') => {
    const reader = new FileReader();
    reader.onload = ev => {
      const buffer = ev.target?.result as ArrayBuffer;
      const encoding = type === '1c_txt' ? 'windows-1251' : 'utf-8';
      try {
        const decoder = new TextDecoder(encoding);
        setFileContent(decoder.decode(buffer));
      } catch {
        // fallback
        const fallback = new TextDecoder('utf-8');
        setFileContent(fallback.decode(buffer));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !SUPPORTED_IMPORT_EXTENSIONS.includes(extension)) {
      toast.error('Поддерживаются только CSV и TXT файлы');
      e.target.value = '';
      return;
    }
    setFileName(file.name);
    setRawFile(file);
    // Автоопределение типа по имени файла
    const lowerName = file.name.toLowerCase();
    const detectedType: 'csv' | '1c_txt' =
      lowerName.endsWith('.txt') || lowerName.includes('1c') ? '1c_txt' : 'csv';
    setImportType(detectedType);
    
    // Автозаполнение счёта из имени файла
    const extractedAccount = extractAccountFromFileName(file.name);
    if (extractedAccount) {
      setAccount(extractedAccount);
    }
    
    decodeFile(file, detectedType);
  };

  // При смене типа — перечитываем файл с нужной кодировкой
  const handleTypeChange = (v: string) => {
    const type = v as 'csv' | '1c_txt';
    setImportType(type);
    if (rawFile) decodeFile(rawFile, type);
  };

  // Предварительный просмотр
  const handlePreview = async () => {
    if (!fileContent) {
      toast.error(t('generated.vyberite_fayl'));
      return;
    }
    try {
      const result = await importFn.mutateAsync({
        content: fileContent,
        fileName,
        importType,
        account: account || undefined,
        draft: true, // Предпросмотр
      });
      
      if (result.mode === 'preview' && result.preview) {
        setPreview(result.preview);
        setShowPreview(true);
      }
    } catch {
      // handled in hook
    }
  };

  // Подтверждение импорта
  const handleConfirm = async () => {
    if (!fileContent) return;
    try {
      await importFn.mutateAsync({
        content: fileContent,
        fileName,
        importType,
        account: account || undefined,
        draft: false, // Реальный импорт
      });
      setShowPreview(false);
      setPreview(null);
      onClose();
    } catch {
      // handled in hook
    }
  };

  const handleReject = () => {
    setShowPreview(false);
    setPreview(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
        <div className="bg-background rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t('finance.statement.import')}</h2>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium block mb-1">{t('finance.statement.import_type')}</label>
              <Select value={importType} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">{t('finance.statement.import_type_csv')}</SelectItem>
                  <SelectItem value="1c_txt">{t('finance.statement.import_type_1c')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">{t('finance.statement.account')}</label>
              <input
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                placeholder={t('generated.raschetnyy_schet_bank_optsional_no')}
                value={account}
                onChange={e => setAccount(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">{t('finance.statement.file_name')}</label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {fileName ? (
                  <div className="text-sm font-medium">{fileName}</div>
                ) : (
                  <div className="text-muted-foreground text-sm">
                    <Upload className="w-6 h-6 mx-auto mb-2" />
                    {t('generated.nazhmite_dlya_vybora_fayla_csv_txt')}
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>{t('generated.otmena')}</Button>
            <Button variant="secondary" onClick={handlePreview} disabled={importFn.isPending || !fileContent}>
              👁️ Предпросмотр
            </Button>
            <Button onClick={handleConfirm} disabled={importFn.isPending || !fileContent}>
              {importFn.isPending ? 'Импорт…' : 'Импортировать'}
            </Button>
          </div>
        </div>
      </div>

      {/* Диалог подтверждения */}
      {showPreview && preview && (
        <ImportPreviewDialog
          open={showPreview}
          onOpenChange={(open) => {
            if (!open) {
              setShowPreview(false);
              setPreview(null);
            }
          }}
          preview={preview}
          report={undefined} // Можно добавить из результата preview
          onConfirm={handleConfirm}
          onReject={handleReject}
          isPending={importFn.isPending}
        />
      )}
    </>
  );
}

// ───────── Main Tab ─────────
export function BankStatementsTab() {
  const { t } = useTranslation();
  const { data: statements, isLoading } = useBankStatements();
  const { data: invoices } = useInvoices();
  const [showImport, setShowImport] = useState(false);
  const [stmtPage, setStmtPage] = useState(1);
  const [stmtRowsPerPage, setStmtRowsPerPage] = useState('10');

  const stmtPerPage = parseRowsPerPage(stmtRowsPerPage);
  const paginatedStatements = (statements || []).slice((stmtPage - 1) * stmtPerPage, stmtPage * stmtPerPage);

  const invoiceOptions = (invoices || [])
    .filter(i => i.status !== 'paid')
    .map(i => ({ id: i.id, identifier: i.identifier }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold">{t('finance.statement.title')}</h2>
        <Button className="gap-2" onClick={() => setShowImport(true)}>
          <Upload className="w-4 h-4" />
          {t('finance.statement.import')}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : !statements || statements.length === 0 ? (
        <div className="titan-card p-8 text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">{t('finance.statement.no_statements')}</p>
          <Button className="mt-4 gap-2" variant="outline" onClick={() => setShowImport(true)}>
            <Upload className="w-4 h-4" />
            {t('finance.statement.import')}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedStatements.map(stmt => (
            <StatementRow key={stmt.id} stmt={stmt} invoices={invoiceOptions} />
          ))}
          <TableFooterPagination
            shownCount={paginatedStatements.length}
            totalCount={(statements || []).length}
            rowsPerPage={stmtRowsPerPage}
            onRowsPerPageChange={(v) => { setStmtRowsPerPage(v); setStmtPage(1); }}
            currentPage={stmtPage}
            onPageChange={setStmtPage}
            className="flex items-center justify-between p-2 border border-border rounded-lg"
          />
        </div>
      )}

      {showImport && <ImportDialog onClose={() => setShowImport(false)} />}
    </div>
  );
}
