import { useState, useMemo } from 'react';
import { useModuleSettings } from '@/modules/settings/hooks/useModuleSettings';
import { useDataTable, TabConfig } from '@/hooks/useDataTable';
import { useServices, useServiceCategoriesTree } from '../hooks';
import { Box } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { Service, ServiceCategory } from '../types';

/**
 * Custom hook for managing services page state and data
 * @returns {Object} Services page state including services, categories, filters, table state, and tabs
 */
export function useServicesPage(): {
  services: Service[];
  categories: ServiceCategory[];
  loading: boolean;
  totalCount: number;
  refetch: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  selectedCategoryId: number | null;
  setSelectedCategoryId: (id: number | null) => void;
  tableState: ReturnType<typeof useDataTable<Service>>;
  tabsConfig: TabConfig[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  moveTab: (index: number, direction: 'up' | 'down') => void;
  reorderTab: (fromId: string, toId: string) => void;
  settings: Record<string, unknown>;
  types: Array<{id: string, name: string, color?: string}>;
  tabs: TabConfig[];
} {
  const { settings } = useModuleSettings("services");
  
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
    
    if (userTabs.length > 0) {
      tabs = tabs.map(t => {
        const ut = userTabs.find(u => u.id === t.id);
        return ut ? { ...t, visible: ut.visible, label: ut.label || t.label } : t;
      });
      tabs.sort((a, b) => {
        const idxA = userTabs.findIndex(u => u.id === a.id);
        const idxB = userTabs.findIndex(u => u.id === b.id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
      });
    }

    const visibleTabs = tabs.filter(t => t.visible);
    if (visibleTabs.length === 1 && visibleTabs[0].id === 'all') {
      tabs = tabs.map(t => t.id === 'all' ? { ...t, visible: false } : t);
    }
    return tabs;
  }, [types, userTabs]);

  const tableState = useDataTable<Service>({
    initialData: [],
    initialColumns: {
      name: true,
      category: true,
      type: true,
      base_cost: true,
      status: true,
    },
    initialTabs: [],
    storageKey: "services-table",
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

  const { data: servicesData, isLoading: loading, refetch } = useServices(serverParams);
  const responseData = servicesData as { data: Service[]; pagination?: { total: number } } | Service[] | undefined;
  const services = Array.isArray(servicesData) ? servicesData : servicesData?.data || [];
  const pagination = Array.isArray(servicesData) ? { total: servicesData.length } : servicesData?.pagination as { total: number } | undefined;
  const totalCount = pagination?.total || 0;

  const { data: categories = [], isLoading: isLoadingCategories } = useServiceCategoriesTree();

  return {
    // Data
    services,
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
