import { renderHook, act, waitFor } from '@testing-library/react';
import { useDataTable } from '../useDataTable';
import { api } from '@/lib/api';
import { List } from 'lucide-react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

// Mock API
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

type MockItem = {
  id: number;
  name: string;
  status: string;
};

const mockInitialData: MockItem[] = [
  { id: 1, name: 'Item 1', status: 'active' },
  { id: 2, name: 'Item 2', status: 'inactive' },
  { id: 3, name: 'Item 3', status: 'active' },
];

const mockColumns = {
  name: true,
  status: true,
  actions: true,
};

const mockTabs = [
  { id: 'list', label: 'List', icon: List, visible: true },
  { id: 'board', label: 'Board', icon: List, visible: false },
];

describe('useDataTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as Mock).mockResolvedValue(null);
    (api.post as Mock).mockResolvedValue({});
  });

  describe('Initial state', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockInitialData,
          initialColumns: mockColumns,
        })
      );

      expect(result.current.searchQuery).toBe('');
      expect(result.current.selectedIds.size).toBe(0);
      expect(result.current.rowsPerPage).toBe('25');
      expect(result.current.currentPage).toBe(1);
      expect(result.current.visibleColumns).toEqual(mockColumns);
    });

    it('should accept custom rows per page', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockInitialData,
          initialColumns: mockColumns,
          defaultRowsPerPage: '50',
        })
      );

      expect(result.current.rowsPerPage).toBe('50');
    });
  });

  describe('Search', () => {
    it('should update search query', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockInitialData,
          initialColumns: mockColumns,
        })
      );

      act(() => {
        result.current.setSearchQuery('test');
      });

      expect(result.current.searchQuery).toBe('test');
    });
  });

  describe('Selection', () => {
    it('should toggle item selection', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockInitialData,
          initialColumns: mockColumns,
        })
      );

      act(() => {
        result.current.toggleSelection(1);
      });

      expect(result.current.selectedIds.has(1)).toBe(true);
      expect(result.current.selectedIds.size).toBe(1);
    });

    it('should toggle off item selection', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockInitialData,
          initialColumns: mockColumns,
        })
      );

      act(() => {
        result.current.toggleSelection(1);
        result.current.toggleSelection(1);
      });

      expect(result.current.selectedIds.has(1)).toBe(false);
      expect(result.current.selectedIds.size).toBe(0);
    });

    it('should toggle all selection', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockInitialData,
          initialColumns: mockColumns,
        })
      );

      act(() => {
        result.current.toggleAllSelection(mockInitialData);
      });

      expect(result.current.selectedIds.size).toBe(3);
    });

    it('should clear selection', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockInitialData,
          initialColumns: mockColumns,
        })
      );

      act(() => {
        result.current.toggleSelection(1);
        result.current.clearSelection();
      });

      expect(result.current.selectedIds.size).toBe(0);
    });
  });

  describe('Sorting', () => {
    it('should set ascending sort', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockInitialData,
          initialColumns: mockColumns,
        })
      );

      act(() => {
        result.current.handleSort('name');
      });

      expect(result.current.sortConfig).toEqual({
        key: 'name',
        direction: 'asc',
      });
    });

    it('should toggle to descending sort on second click', () => {
      const { result, rerender } = renderHook(
        ({ data }) =>
          useDataTable({
            initialData: data,
            initialColumns: mockColumns,
          }),
        {
          initialProps: { data: mockInitialData },
        }
      );

      act(() => {
        result.current.handleSort('name');
      });

      // Перерендериваем хук с тем же состоянием
      rerender({ data: mockInitialData });

      act(() => {
        result.current.handleSort('name');
      });

      expect(result.current.sortConfig?.direction).toBe('desc');
    });
  });

  describe('Column visibility', () => {
    it('should toggle column visibility', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockInitialData,
          initialColumns: mockColumns,
        })
      );

      act(() => {
        result.current.toggleColumnVisibility('status', false);
      });

      expect(result.current.visibleColumns.status).toBe(false);
    });

    it('should update visible columns state', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockInitialData,
          initialColumns: mockColumns,
        })
      );

      act(() => {
        result.current.setVisibleColumns({
          ...mockColumns,
          status: false,
        });
      });

      expect(result.current.visibleColumns.status).toBe(false);
    });
  });

  describe('Column ordering', () => {
    it('should move column up', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockInitialData,
          initialColumns: {
            col1: true,
            col2: true,
            col3: true,
          },
        })
      );

      act(() => {
        result.current.moveColumn('col2', 'up');
      });

      expect(result.current.columnOrder).toEqual(['col2', 'col1', 'col3']);
    });

    it('should move column down', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockInitialData,
          initialColumns: {
            col1: true,
            col2: true,
            col3: true,
          },
        })
      );

      act(() => {
        result.current.moveColumn('col1', 'down');
      });

      expect(result.current.columnOrder).toEqual(['col2', 'col1', 'col3']);
    });

    it('should reorder column to new position', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockInitialData,
          initialColumns: {
            col1: true,
            col2: true,
            col3: true,
          },
        })
      );

      act(() => {
        result.current.reorderColumn('col1', 'col3');
      });

      expect(result.current.columnOrder).toEqual(['col2', 'col3', 'col1']);
    });
  });

  describe('Pagination', () => {
    it('should update rows per page', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockInitialData,
          initialColumns: mockColumns,
        })
      );

      act(() => {
        result.current.setRowsPerPage('100');
      });

      expect(result.current.rowsPerPage).toBe('100');
    });

    it('should update current page', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockInitialData,
          initialColumns: mockColumns,
        })
      );

      act(() => {
        result.current.setCurrentPage(5);
      });

      expect(result.current.currentPage).toBe(5);
    });
  });

  describe('Tabs management (when provided)', () => {
    it('should initialize with tabs', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockInitialData,
          initialColumns: mockColumns,
          initialTabs: mockTabs,
        })
      );

      expect(result.current.tabsConfig.length).toBe(2);
      expect(result.current.tabsConfig[0].visible).toBe(true);
      expect(result.current.tabsConfig[1].visible).toBe(false);
    });

    it('should toggle tab visibility', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockInitialData,
          initialColumns: mockColumns,
          initialTabs: mockTabs,
        })
      );

      act(() => {
        result.current.toggleTabVisibility('board', true);
      });

      expect(result.current.tabsConfig[1].visible).toBe(true);
    });

    it('should move tab up', () => {
      const tabs = [
        { id: 'tab1', label: 'Tab 1', icon: List, visible: true },
        { id: 'tab2', label: 'Tab 2', icon: List, visible: true },
        { id: 'tab3', label: 'Tab 3', icon: List, visible: true },
      ];

      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockInitialData,
          initialColumns: mockColumns,
          initialTabs: tabs,
        })
      );

      act(() => {
        result.current.moveTab(1, 'up');
      });

      expect(result.current.tabsConfig[0].id).toBe('tab2');
      expect(result.current.tabsConfig[1].id).toBe('tab1');
    });

    it('should move tab down', () => {
      const tabs = [
        { id: 'tab1', label: 'Tab 1', icon: List, visible: true },
        { id: 'tab2', label: 'Tab 2', icon: List, visible: true },
      ];

      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockInitialData,
          initialColumns: mockColumns,
          initialTabs: tabs,
        })
      );

      act(() => {
        result.current.moveTab(0, 'down');
      });

      expect(result.current.tabsConfig[0].id).toBe('tab2');
      expect(result.current.tabsConfig[1].id).toBe('tab1');
    });

    it('should reorder tabs by id', () => {
      const tabs = [
        { id: 'tab1', label: 'Tab 1', icon: List, visible: true },
        { id: 'tab2', label: 'Tab 2', icon: List, visible: true },
        { id: 'tab3', label: 'Tab 3', icon: List, visible: true },
      ];

      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockInitialData,
          initialColumns: mockColumns,
          initialTabs: tabs,
        })
      );

      act(() => {
        result.current.reorderTab('tab1', 'tab2');
      });

      expect(result.current.tabsConfig[0].id).toBe('tab2');
      expect(result.current.tabsConfig[1].id).toBe('tab1');
    });
  });

  describe('API persistence (with storageKey)', () => {
    it('should load settings from API', async () => {
      (api.get as Mock).mockImplementation((key: string) => {
        if (key.includes('columns')) return Promise.resolve({ name: true, status: false });
        if (key.includes('column-order')) return Promise.resolve(['status', 'name']);
        if (key.includes('tabs')) return Promise.resolve([{ id: 'list', visible: true }]);
        if (key.includes('pagination')) return Promise.resolve({ rowsPerPage: '100' });
        return Promise.resolve(null);
      });

      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockInitialData,
          initialColumns: mockColumns,
          storageKey: 'test',
        })
      );

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/user-settings/test-columns');
        expect(result.current.visibleColumns.status).toBe(false);
        expect(result.current.rowsPerPage).toBe('100');
      });
    });

    it('should save column visibility to API', async () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockInitialData,
          initialColumns: mockColumns,
          storageKey: 'test',
        })
      );

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.visibleColumns).toBeDefined();
      });

      act(() => {
        result.current.toggleColumnVisibility('status', false);
      });

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/user-settings',
          expect.objectContaining({
            key: 'test-columns',
          })
        );
      });
    });

    it('should save tabs visibility to API', async () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockInitialData,
          initialColumns: mockColumns,
          initialTabs: mockTabs,
          storageKey: 'test',
        })
      );

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.tabsConfig).toBeDefined();
      });

      act(() => {
        result.current.toggleTabVisibility('board', true);
      });

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/user-settings',
          expect.objectContaining({
            key: 'test-tabs',
          })
        );
      });
    });

    it('should save pagination to API', async () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockInitialData,
          initialColumns: mockColumns,
          storageKey: 'test',
        })
      );

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.rowsPerPage).toBeDefined();
      });

      act(() => {
        result.current.setRowsPerPage('100');
      });

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/user-settings',
          expect.objectContaining({
            key: 'test-pagination',
            value: { rowsPerPage: '100' },
          })
        );
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty data', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: [],
          initialColumns: mockColumns,
        })
      );

      expect(result.current.selectedIds.size).toBe(0);
      expect(result.current.currentPage).toBe(1);
    });

    it('should handle API errors gracefully', async () => {
      (api.get as Mock).mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockInitialData,
          initialColumns: mockColumns,
          storageKey: 'test',
        })
      );

      await waitFor(() => {
        expect(result.current.visibleColumns).toEqual(mockColumns);
      });
    });
  });
});
