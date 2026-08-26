
import { useState, useEffect, useRef } from "react";
import { LucideIcon } from "lucide-react";
import { api } from "@/lib/api";

export interface TabConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  visible: boolean;
  columns?: Record<string, boolean>; // Optional per-tab column overrides
}

export interface SortConfig<T> {
  key: keyof T;
  direction: 'asc' | 'desc';
}

interface UseDataTableProps<T> {
  initialData: T[];
  initialColumns: Record<string, boolean>;
  initialTabs?: TabConfig[];
  storageKey?: string; // New prop for persistence
  defaultRowsPerPage?: string;
  defaultColumnWidths?: Record<string, number>;
}

interface SavedTabConfig {
  id: string;
  visible: boolean;
}

export function useDataTable<T extends { id: string | number }>({
  initialData,
  initialColumns,
  initialTabs = [],
  storageKey,
  defaultRowsPerPage = "25",
  defaultColumnWidths = {},
}: UseDataTableProps<T>) {
  const initialColumnsRef = useRef<Record<string, boolean>>(initialColumns);
  const initialTabsRef = useRef<TabConfig[]>(initialTabs);
  
  // Update refs when props change
  useEffect(() => {
    initialColumnsRef.current = initialColumns;
  }, [initialColumns]);
  
  useEffect(() => {
    initialTabsRef.current = initialTabs;
  }, [initialTabs]);

  const lastSavedColumnsRef = useRef<string | null>(null);
  const lastSavedTabsRef = useRef<string | null>(null);
  const lastSavedOrderRef = useRef<string | null>(null);
  const lastSavedPaginationRef = useRef<string | null>(null);
  const lastSavedWidthsRef = useRef<string | null>(null);
  // Map of tabId → saved visible value, for dynamic tabs loaded after initial API fetch
  const savedTabVisibilityRef = useRef<Record<string, boolean>>({});

  // Search & Filter Basics
  const [searchQuery, _setSearchQuery] = useState("");
  const setSearchQuery = (query: string) => {
    _setSearchQuery(query);
    setCurrentPage(1);
  };
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  // Sorting
  const [sortConfig, _setSortConfig] = useState<SortConfig<T> | null>(null);
  const setSortConfig = (config: SortConfig<T> | null) => {
    _setSortConfig(config);
    setCurrentPage(1);
  };

  // Visibility & Config state
  const [visibleColumns, setVisibleColumns] = useState(initialColumns);
  const [columnOrder, setColumnOrder] = useState<string[]>(Object.keys(initialColumns));
  const [tabsConfig, setTabsConfig] = useState<TabConfig[]>(initialTabs);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(defaultColumnWidths);

  // Pagination
  const [rowsPerPage, _setRowsPerPage] = useState<string>(defaultRowsPerPage);
  const setRowsPerPage = (rows: string) => {
    _setRowsPerPage(rows);
    setCurrentPage(1);
  };
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Initialize as "loaded" if no storageKey (no async loading needed)
  const [isLoaded, setIsLoaded] = useState(!storageKey);

  // Load Settings from API
  useEffect(() => {
    if (storageKey) {
        const loadSettings = async () => {
            try {
                // Load Columns
                const savedCols = await api.get(`/user-settings/${storageKey}-columns`);
                if (savedCols) {
                  setVisibleColumns({ ...initialColumnsRef.current, ...savedCols });
                  lastSavedColumnsRef.current = JSON.stringify({ ...initialColumnsRef.current, ...savedCols });
                } else {
                  lastSavedColumnsRef.current = JSON.stringify(initialColumnsRef.current);
                }

                // Load Column Order
                const savedOrder = await api.get(`/user-settings/${storageKey}-column-order`);
                if (savedOrder && Array.isArray(savedOrder)) {
                  const initialKeys = Object.keys(initialColumnsRef.current || {});
                  // Keep saved order, append any new keys not in saved order
                  const merged = [
                    ...(savedOrder as string[]).filter(k => initialKeys.includes(k)),
                    ...initialKeys.filter(k => !(savedOrder as string[]).includes(k)),
                  ];
                  setColumnOrder(merged);
                  lastSavedOrderRef.current = JSON.stringify(merged);
                } else {
                  lastSavedOrderRef.current = JSON.stringify(Object.keys(initialColumnsRef.current || {}));
                }

                // Load Tabs
                if (initialTabsRef.current && initialTabsRef.current.length > 0) {
                    const savedTabs = await api.get(`/user-settings/${storageKey}-tabs`);
                    if (savedTabs && Array.isArray(savedTabs)) {
                      // Store all saved visibility in ref so dynamic tabs added later can use it
                      const visMap: Record<string, boolean> = {};
                      (savedTabs as SavedTabConfig[]).forEach((s) => { visMap[s.id] = s.visible; });
                      savedTabVisibilityRef.current = visMap;
                      // Reconstruct tabs in saved order, preserving visibility; append new tabs not in saved data
                      setTabsConfig(prev => {
                        const savedOrder = (savedTabs as SavedTabConfig[]).map(s => s.id);
                        return [
                          ...savedOrder
                            .map(id => prev.find(t => t.id === id))
                            .filter((t): t is TabConfig => !!t)
                            .map(tab => ({ ...tab, visible: visMap[tab.id] ?? tab.visible })),
                          ...prev.filter(t => !savedOrder.includes(t.id)),
                        ];
                      });
                      lastSavedTabsRef.current = JSON.stringify(
                        (savedTabs as SavedTabConfig[]).map(({ id, visible }) => ({ id, visible }))
                      );
                    } else {
                      lastSavedTabsRef.current = JSON.stringify((initialTabsRef.current || []).map(({ id, visible }) => ({ id, visible })));
                    }
                }

                // Load Pagination (rowsPerPage preference)
                const savedPagination = await api.get(`/user-settings/${storageKey}-pagination`);
                if (savedPagination && typeof savedPagination === 'object' && 'rowsPerPage' in savedPagination) {
                  setRowsPerPage((savedPagination as { rowsPerPage: string }).rowsPerPage);
                  lastSavedPaginationRef.current = JSON.stringify({ rowsPerPage: (savedPagination as { rowsPerPage: string }).rowsPerPage });
                } else {
                  lastSavedPaginationRef.current = JSON.stringify({ rowsPerPage: defaultRowsPerPage });
                }

                // Load Column Widths
                const savedWidths = await api.get(`/user-settings/${storageKey}-column-widths`);
                if (savedWidths && typeof savedWidths === 'object') {
                  setColumnWidths({ ...defaultColumnWidths, ...savedWidths });
                  lastSavedWidthsRef.current = JSON.stringify({ ...defaultColumnWidths, ...savedWidths });
                } else {
                  lastSavedWidthsRef.current = JSON.stringify(defaultColumnWidths);
                }
            } catch (e) {
                console.error("Failed to load table settings", e);
                lastSavedColumnsRef.current = JSON.stringify(initialColumnsRef.current || {});
                lastSavedOrderRef.current = JSON.stringify(Object.keys(initialColumnsRef.current || {}));
                lastSavedTabsRef.current = JSON.stringify((initialTabsRef.current || []).map(({ id, visible }) => ({ id, visible })));
                lastSavedPaginationRef.current = JSON.stringify({ rowsPerPage: defaultRowsPerPage });
                lastSavedWidthsRef.current = JSON.stringify(defaultColumnWidths);
            } finally {
                // Defer state update to avoid immediate setState in finally block
                setTimeout(() => setIsLoaded(true), 0);
            }
        };
        loadSettings();
    }
  }, [storageKey]);

  // Persist Columns
  useEffect(() => {
    if (storageKey && isLoaded) {
        const serialized = JSON.stringify(visibleColumns);

        if (serialized === lastSavedColumnsRef.current) {
            return;
        }

        api.post('/user-settings', {
            key: `${storageKey}-columns`,
            value: visibleColumns
        })
          .then(() => {
            lastSavedColumnsRef.current = serialized;
          })
          .catch(console.error);
    }
  }, [visibleColumns, storageKey, isLoaded]);

  // Persist Column Order
  useEffect(() => {
    if (storageKey && isLoaded) {
      const serialized = JSON.stringify(columnOrder);
      if (serialized === lastSavedOrderRef.current) return;
      api.post('/user-settings', { key: `${storageKey}-column-order`, value: columnOrder })
        .then(() => { lastSavedOrderRef.current = serialized; })
        .catch(console.error);
    }
  }, [columnOrder, storageKey, isLoaded]);

  // Persist Tabs
  useEffect(() => {
    if (storageKey && isLoaded) {
        const toSave = tabsConfig.map(({ id, visible }) => ({ id, visible }));
        const serialized = JSON.stringify(toSave);

        if (serialized === lastSavedTabsRef.current) {
            return;
        }

        api.post('/user-settings', {
            key: `${storageKey}-tabs`,
            value: toSave
        })
          .then(() => {
            lastSavedTabsRef.current = serialized;
          })
          .catch(console.error);
    }
  }, [tabsConfig, storageKey, isLoaded]);

  // Persist Pagination (rowsPerPage only)
  useEffect(() => {
    if (storageKey && isLoaded) {
      const toSave = { rowsPerPage };
      const serialized = JSON.stringify(toSave);
      if (serialized === lastSavedPaginationRef.current) return;
      api.post('/user-settings', { key: `${storageKey}-pagination`, value: toSave })
        .then(() => { lastSavedPaginationRef.current = serialized; })
        .catch(console.error);
    }
  }, [rowsPerPage, storageKey, isLoaded]);

  // Persist Column Widths
  useEffect(() => {
    if (storageKey && isLoaded) {
      const serialized = JSON.stringify(columnWidths);
      if (serialized === lastSavedWidthsRef.current) return;
      api.post('/user-settings', { key: `${storageKey}-column-widths`, value: columnWidths })
        .then(() => { lastSavedWidthsRef.current = serialized; })
        .catch(console.error);
    }
  }, [columnWidths, storageKey, isLoaded]);

  // Handlers
  const handleSort = (key: keyof T) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortDirection = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return undefined;
    return sortConfig.direction;
  };

  const toggleSelection = (id: string | number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleAllSelection = (items: T[]) => {
    if (selectedIds.size === items.length && items.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(i => i.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Tab Management
  const moveTab = (index: number, direction: 'up' | 'down') => {
    const newConfig = [...tabsConfig];
    if (direction === 'up' && index > 0) {
        [newConfig[index], newConfig[index - 1]] = [newConfig[index - 1], newConfig[index]];
    } else if (direction === 'down' && index < newConfig.length - 1) {
        [newConfig[index], newConfig[index + 1]] = [newConfig[index + 1], newConfig[index]];
    }
    setTabsConfig(newConfig);
  };

  const toggleTabVisibility = (id: string, checked: boolean) => {
    setTabsConfig(prev => {
      const newConfig = prev.map(tab =>
          tab.id === id ? { ...tab, visible: checked } : tab
      );
      
      // Обновляем savedTabVisibilityRef
      savedTabVisibilityRef.current[id] = checked;
      
      // Сохраняем в API
      if (storageKey) {
        const toSave = newConfig.map(({ id, visible, columns }) => ({ id, visible, columns }));
        api.post('/user-settings', {
          key: `${storageKey}-tabs`,
          value: toSave
        }).catch(console.error);
      }
      
      return newConfig;
    });
  };

  /** Инъекция колонок из активной вкладки (если они там заданы) */
  const injectTabColumns = (tabId: string) => {
    const tab = tabsConfig.find(t => t.id === tabId);
    if (tab?.columns) {
      setVisibleColumns(prev => ({ ...prev, ...tab.columns }));
    }
  };

  const toggleColumnVisibility = (column: string, checked: boolean) => {
    setVisibleColumns(prev => ({ ...prev, [column]: checked }));
  };

  const setColumnWidth = (key: string, width: number) => {
    setColumnWidths(prev => ({ ...prev, [key]: width }));
  };

  const moveColumn = (key: string, direction: 'up' | 'down') => {
    setColumnOrder(prev => {
      const idx = prev.indexOf(key);
      if (idx === -1) return prev;
      const next = [...prev];
      if (direction === 'up' && idx > 0)
        [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
      else if (direction === 'down' && idx < next.length - 1)
        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const reorderColumn = (fromKey: string, toKey: string) => {
    setColumnOrder(prev => {
      const fromIdx = prev.indexOf(fromKey);
      const toIdx = prev.indexOf(toKey);
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return prev;
      const next = [...prev];
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, fromKey);
      return next;
    });
  };

  /** Drag-to-reorder вкладок: меняет местами вкладки по id */
  const reorderTab = (fromId: string, toId: string) => {
    setTabsConfig(prev => {
      const fromIdx = prev.findIndex(t => t.id === fromId);
      const toIdx = prev.findIndex(t => t.id === toId);
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return prev;
      const next = [...prev];
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, prev[fromIdx]);
      return next;
    });
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedIds,
    setSelectedIds,
    sortConfig,
    setSortConfig,
    visibleColumns,
    setVisibleColumns,
    columnOrder,
    setColumnOrder,
    tabsConfig,
    setTabsConfig,
    columnWidths,
    setColumnWidths,
    setColumnWidth,
    savedTabVisibilityRef,
    rowsPerPage,
    setRowsPerPage,
    currentPage,
    setCurrentPage,
    handleSort,
    getSortDirection,
    toggleSelection,
    toggleAllSelection,
    clearSelection,
    moveTab,
    reorderTab,
    toggleTabVisibility,
    injectTabColumns,
    toggleColumnVisibility,
    moveColumn,
    reorderColumn,
  };
}
