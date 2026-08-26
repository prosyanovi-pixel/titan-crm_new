import { useState, useMemo } from 'react';
import { useModuleSettings } from '@/modules/settings/hooks/useModuleSettings';
import { useDataTable, TabConfig } from '@/hooks/useDataTable';
import { useProducts, useProductCategories } from '../hooks';
import { Box } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { Product, ProductCategory } from '../types';

/**
 * Custom hook for managing products page state and data
 * @returns {Object} Products page state including products, categories, filters, table state, and tabs
 */
export function useProductsPage(): {
  products: Product[];
  categories: ProductCategory[];
  loading: boolean;
  totalCount: number;
  refetch: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  selectedCategoryId: number | null;
  setSelectedCategoryId: (id: number | null) => void;
  tableState: ReturnType<typeof useDataTable<Product>>;
  tabsConfig: TabConfig[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  moveTab: (index: number, direction: 'up' | 'down') => void;
  reorderTab: (fromId: string, toId: string) => void;
  settings: Record<string, unknown>;
  types: Array<{id: string, name: string, color?: string}>;
  tabs: TabConfig[];
} {
  const { settings } = useModuleSettings("products");
  
  const types = (settings?.types || []) as Array<{id: string, name: string, color?: string}>;
  const userTabs = (settings?.tabs || []) as Array<{id: string, label: string, icon?: string, visible: boolean}>;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  
  const [activeTab, setActiveTab] = useState("all");

  const computedTabsConfig = useMemo(() => {
    let tabs = [{ id: "all", label: "common.all", icon: Box, visible: true }];
    if (types.length > 0) {
      const typeTabs = types.map(t => ({
        id: t.id,
        label: t.name,
        icon: Box,
        visible: true,
      }));
      tabs = [...tabs, ...typeTabs];
    }
    
    // Apply user saved tabs visibility/order if available
    if (userTabs.length > 0) {
      tabs = tabs.map(t => {
        const ut = userTabs.find(u => u.id === t.id);
        return ut ? { ...t, visible: ut.visible, label: ut.label || t.label } : t;
      });
      // order by userTabs
      tabs.sort((a, b) => {
        const idxA = userTabs.findIndex(u => u.id === a.id);
        const idxB = userTabs.findIndex(u => u.id === b.id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
      });
    }

    // Hide "All" tab if it's the only visible tab
    const visibleTabs = tabs.filter(t => t.visible);
    if (visibleTabs.length === 1 && visibleTabs[0].id === 'all') {
      tabs = tabs.map(t => t.id === 'all' ? { ...t, visible: false } : t);
    }
    return tabs;
  }, [types, userTabs]);

  const tableState = useDataTable<Product>({
    initialData: [],
    initialColumns: {
      name: true,
      category: true,
      sku_internal: true,
      type: true,
      purchase_price: true,
      status: true,
    },
    initialTabs: [],
    storageKey: "products-table",
    defaultRowsPerPage: String(settings.display?.itemsPerPage || "25"),
  });

  const serverParams = useMemo(() => {
    const params: Record<string, string | number> = {
      page: tableState.currentPage,
      limit: parseInt(tableState.rowsPerPage),
    };

    if (searchQuery && searchQuery.trim()) {
      params.search = searchQuery.trim();
    }

    if (statusFilter && statusFilter !== "all") {
      params.status = statusFilter;
    }

    if (selectedCategoryId) {
      params.categoryId = selectedCategoryId;
    }

    if (activeTab && activeTab !== "all") {
      params.type = activeTab;
    }

    if (tableState.sortConfig) {
      params.sortField = tableState.sortConfig.key;
      params.sortOrder = tableState.sortConfig.direction;
    }

    return params;
  }, [tableState.currentPage, tableState.rowsPerPage, searchQuery, statusFilter, selectedCategoryId, activeTab, tableState.sortConfig]);

  const { data: productsData, isLoading: loading, refetch } = useProducts(serverParams);
  const responseData = productsData as { data: Product[]; pagination?: { total: number } } | Product[] | undefined;
  const products = Array.isArray(productsData) ? productsData : productsData?.data || [];
  const pagination = Array.isArray(productsData) ? { total: productsData.length } : productsData?.pagination;
  const totalCount = pagination?.total || 0;

  const { data: categories = [], isLoading: isLoadingCategories } = useProductCategories();

  return {
    // Data
    products,
    categories,
    loading: loading || isLoadingCategories,
    totalCount,
    refetch,
    
    // Pagination (removed standalone props, use tableState)
    
    // Filters
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedCategoryId,
    setSelectedCategoryId,
    
    // Table
    tableState,
    
    // Tabs
    tabsConfig: computedTabsConfig,
    activeTab,
    setActiveTab,
    moveTab: tableState.moveTab,
    reorderTab: tableState.reorderTab,
    
    // Settings
    settings,
    types,
    tabs: computedTabsConfig,
  };
}
