import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { parseRowsPerPage } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useDataTable } from '@/hooks/useDataTable';
import { usePriceLists } from './index';
import { useModuleSettings } from '@/modules/settings/hooks/useModuleSettings';
import { PriceList } from '../types';
import { LayoutList, CheckCircle2, Circle } from 'lucide-react';

/** Вкладки страницы прайс-листов (по активности). */
const PRICE_LIST_TABS = [
  { id: 'all', label: 'price_lists.tabs.all', icon: LayoutList, visible: true },
  { id: 'active', label: 'price_lists.tabs.active', icon: CheckCircle2, visible: true },
  { id: 'inactive', label: 'price_lists.tabs.inactive', icon: Circle, visible: true },
];

/** Стартовая видимость колонок таблицы прайс-листов. */
const PRICE_LIST_COLUMNS = {
  name: true,
  currency: true,
  isActive: true,
  isDefault: true,
};

/** Тип значений сортировки для таблицы прайс-листов. */
type PriceListSortKey = 'name' | 'currency' | 'isActive';

/**
 * Хук оркестрации страницы прайс-листов.
 * Управляет данными, табами, поиском, сортировкой, пагинацией, выбором и bulk-операциями.
 *
 * @returns Состояния и методы для страницы прайс-листов
 */
export function usePriceListsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: priceLists = [], isLoading } = usePriceLists();
  const { settings } = useModuleSettings("price_lists");

  const table = useDataTable<PriceList>({
    initialData: [],
    initialColumns: PRICE_LIST_COLUMNS,
    initialTabs: PRICE_LIST_TABS,
    storageKey: 'price_lists',
    defaultRowsPerPage: String(settings?.display?.itemsPerPage || '25'),
  });

  const [activeTab, setActiveTab] = useState('all');

  // ── Поиск и сортировка ─────────────────────────────────────────────────
  const searchable = useMemo(() => {
    const q = table.searchQuery.trim().toLowerCase();
    return (pl: PriceList) => {
      if (!q) return true;
      return pl.name.toLowerCase().includes(q);
    };
  }, [table.searchQuery]);

  const sortKey = (table.sortConfig?.key ?? null) as PriceListSortKey | null;

  const sortedPriceLists = useMemo(() => {
    const items = priceLists
      .filter((pl) => {
        if (activeTab === 'active') return pl.isActive;
        if (activeTab === 'inactive') return !pl.isActive;
        return true;
      })
      .filter(searchable);
    if (!sortKey || !table.sortConfig) return items;

    const dir = table.sortConfig.direction === 'asc' ? 1 : -1;
    return [...items].sort((a, b) => {
      switch (sortKey) {
        case 'name': return (a.name.localeCompare(b.name)) * dir;
        case 'currency': return (a.currency.localeCompare(b.currency)) * dir;
        case 'isActive': return ((a.isActive === b.isActive ? 0 : a.isActive ? 1 : -1)) * dir;
        default: return (a.id - b.id) * dir;
      }
    });
  }, [priceLists, activeTab, searchable, sortKey, table.sortConfig]);

  // ── Пагинация ──────────────────────────────────────────────────────────
  const rowsPerPage = parseRowsPerPage(table.rowsPerPage);
  const totalCount = sortedPriceLists.length;
  const paginatedPriceLists = sortedPriceLists.slice(
    (table.currentPage - 1) * rowsPerPage,
    table.currentPage * rowsPerPage
  );

  // ── Счётчики по вкладкам ───────────────────────────────────────────────
  const tabCounts = useMemo(() => ({
    all: priceLists.length,
    active: priceLists.filter(pl => pl.isActive).length,
    inactive: priceLists.filter(pl => !pl.isActive).length,
  }), [priceLists]);

  const selectedIds = table.selectedIds;
  const clearSelection = () => table.clearSelection();

  /** Переход к контекстному меню строки: просмотр/редактирование/удаление. */
  const handleRowQuickAction = async (action: string, id: number | string) => {
    if (action === 'delete') {
      if (window.confirm(t('price_lists.bulk.delete_confirm'))) {
        await api.post('/price-lists/bulk-delete', { ids: [id] });
        queryClient.invalidateQueries({ queryKey: ['price_lists'] });
        toast.success(t('common.deleted_successfully'));
        clearSelection();
      }
    }
    // view / edit пока недоступны (нет страницы прайс-листа) — позже можно добавить
  };

  /** Применить массовое изменение к выбранным прайс-листам. */
  const applyBulkPatch = async (patch: Partial<Pick<PriceList, 'isActive' | 'isDefault'>>) => {
    try {
      await api.post('/price-lists/bulk-update', {
        ids: [...selectedIds],
        patch,
      });
      queryClient.invalidateQueries({ queryKey: ['price_lists'] });
      toast.success(t('common.saved_successfully'));
      clearSelection();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleBulkActivate = () => applyBulkPatch({ isActive: true });
  const handleBulkDeactivate = () => applyBulkPatch({ isActive: false });
  const handleBulkMakeDefault = () => applyBulkPatch({ isDefault: true });

  /** Массовое удаление выбранных прайс-листов. */
  const handleBulkDelete = async () => {
    try {
      await api.post('/price-lists/bulk-delete', { ids: [...selectedIds] });
      queryClient.invalidateQueries({ queryKey: ['price_lists'] });
      toast.success(t('common.deleted_successfully'));
      clearSelection();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const columnLabels = {
    name: t('common.name'),
    currency: t('common.currency'),
    isActive: t('common.status'),
    isDefault: t('price_lists.is_default'),
  };

  return {
    priceLists: paginatedPriceLists,
    totalCount,
    isLoading,
    table,
    activeTab,
    setActiveTab,
    tabCounts,
    columnLabels,
    handleRowQuickAction,
    handleBulkActivate,
    handleBulkDeactivate,
    handleBulkMakeDefault,
    handleBulkDelete,
  };
}
