import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { parseRowsPerPage } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useDataTable } from '@/hooks/useDataTable';
import { useQuotes } from './index';
import { Quote } from '../types';
import { LayoutList, FileText, Send, CheckCircle, XCircle } from 'lucide-react';

/** Вкладки страницы КП (статусы живой ленты). */
const QUOTE_TABS = [
  { id: 'all', label: 'quotes.tabs.all', icon: LayoutList, visible: true },
  { id: 'draft', label: 'quotes.tabs.draft', icon: FileText, visible: true },
  { id: 'sent', label: 'quotes.tabs.sent', icon: Send, visible: true },
  { id: 'accepted', label: 'quotes.tabs.accepted', icon: CheckCircle, visible: true },
  { id: 'rejected', label: 'quotes.tabs.rejected', icon: XCircle, visible: true },
];

/** Стартовая видимость колонок таблицы КП. */
const QUOTE_COLUMNS = {
  number: true,
  date: true,
  contractor: true,
  status: true,
  total: true,
};

/** Тип значений сортировки для таблицы КП. */
type QuoteSortKey = 'number' | 'date' | 'contractor' | 'status' | 'total';

/**
 * Хук оркестрации страницы списка КП.
 * Управляет данными, табами, поиском, сортировкой, пагинацией, выбором и bulk-операциями.
 *
 * @returns Состояния и методы для страницы списка КП
 */
export function useQuotesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: quotes = [], isLoading } = useQuotes();

  const table = useDataTable<Quote>({
    initialData: [],
    initialColumns: QUOTE_COLUMNS,
    initialTabs: QUOTE_TABS,
    storageKey: 'quotes',
    defaultRowsPerPage: '25',
  });

  const [activeTab, setActiveTab] = useState('all');

  // ── Поиск и сортировка ─────────────────────────────────────────────────
  const searchable = useMemo(() => {
    const q = table.searchQuery.trim().toLowerCase();
    return (quote: Quote) => {
      if (!q) return true;
      return (
        quote.number.toLowerCase().includes(q) ||
        (quote.contractorName || '').toLowerCase().includes(q) ||
        (quote.projectName || '').toLowerCase().includes(q)
      );
    };
  }, [table.searchQuery]);

  const sortKey = (table.sortConfig?.key ?? null) as QuoteSortKey | null;

  const sortedQuotes = useMemo(() => {
    const items = quotes
      .filter((quote) => activeTab === 'all' || quote.status === activeTab)
      .filter(searchable);
    if (!sortKey || !table.sortConfig) return items;

    const dir = table.sortConfig.direction === 'asc' ? 1 : -1;
    const byId = (a: Quote, b: Quote) => (a.id - b.id) * dir;
    return [...items].sort((a, b) => {
      switch (sortKey) {
        case 'number': return (a.number.localeCompare(b.number)) * dir;
        case 'date': return (new Date(a.date).getTime() - new Date(b.date).getTime()) * dir;
        case 'contractor': return ((a.contractorName || '').localeCompare(b.contractorName || '')) * dir;
        case 'status': return (a.status.localeCompare(b.status)) * dir;
        case 'total': return (a.totalAmount - b.totalAmount) * dir;
        default: return byId(a, b);
      }
    });
  }, [quotes, activeTab, searchable, sortKey, table.sortConfig]);

  // ── Пагинация ──────────────────────────────────────────────────────────
  const rowsPerPage = parseRowsPerPage(table.rowsPerPage);
  const totalCount = sortedQuotes.length;
  const paginatedQuotes = sortedQuotes.slice(
    (table.currentPage - 1) * rowsPerPage,
    table.currentPage * rowsPerPage
  );

  // ── Счётчики по вкладкам ───────────────────────────────────────────────
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: quotes.length };
    (['draft', 'sent', 'accepted', 'rejected'] as Quote['status'][]).forEach(s => {
      counts[s] = quotes.filter(q => q.status === s).length;
    });
    return counts;
  }, [quotes]);

  // ── При открытии страницы сбрасываем выбор ────────────────────────────
  const clearSelection = () => table.clearSelection();
  const selectedIds = table.selectedIds;

  /** Переход к контекстному меню строки: просмотр/редактирование/удаление. */
  const handleRowQuickAction = async (action: string, id: number | string) => {
    if (action === 'view' || action === 'edit') navigate(`/quotes/${id}`);
    else if (action === 'delete') {
      if (window.confirm(t('quotes.bulk.delete_confirm'))) {
        await api.post('/quotes/bulk-delete', { ids: [id] });
        queryClient.invalidateQueries({ queryKey: ['quotes'] });
        toast.success(t('common.deleted_successfully'));
        clearSelection();
      }
    }
  };

  /** Массовая смена статуса выбранных КП. */
  const handleBulkStatus = async (status: Quote['status']) => {
    try {
      await api.post('/quotes/bulk-update', {
        ids: [...selectedIds],
        patch: { status },
      });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success(t('common.saved_successfully'));
      clearSelection();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  /** Массовое удаление выбранных КП. */
  const handleBulkDelete = async () => {
    try {
      await api.post('/quotes/bulk-delete', { ids: [...selectedIds] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success(t('common.deleted_successfully'));
      clearSelection();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const columnLabels = {
    number: t('quotes.number'),
    date: t('quotes.date'),
    contractor: t('quotes.contractor'),
    status: t('quotes.status'),
    total: t('quotes.total'),
  };

  return {
    quotes: paginatedQuotes,
    totalCount,
    isLoading,
    quotesAll: quotes,
    table,
    activeTab,
    setActiveTab,
    tabCounts,
    columnLabels,
    handleRowQuickAction,
    handleBulkStatus,
    handleBulkDelete,
    clearSelection,
    navigate,
  };
}
