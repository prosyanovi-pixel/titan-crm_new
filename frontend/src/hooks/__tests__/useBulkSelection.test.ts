import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBulkSelection } from '../useBulkSelection';

// Mock data
interface MockItem {
  id: number;
  name: string;
}

const mockAllData: MockItem[] = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
  { id: 3, name: 'Item 3' },
  { id: 4, name: 'Item 4' },
  { id: 5, name: 'Item 5' },
];

const mockPageData: MockItem[] = mockAllData.slice(0, 3);

describe('useBulkSelection', () => {
  let setSelectedIdsMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setSelectedIdsMock = vi.fn();
  });

  describe('Initial state', () => {
    it('should initialize with empty selection', () => {
      const { result } = renderHook(() =>
        useBulkSelection({
          allData: mockAllData,
          pageData: mockPageData,
          selectedIds: new Set(),
          setSelectedIds: setSelectedIdsMock as unknown as (ids: Set<string | number>) => void,
        })
      );

      expect(result.current.selectedIds.size).toBe(0);
      expect(result.current.isCurrentPageSelected).toBe(false);
      expect(result.current.isAllSelected).toBe(false);
      expect(result.current.isSomeSelected).toBe(false);
      expect(result.current.selectedCount).toBe(0);
    });

    it('should return correct counts', () => {
      const { result } = renderHook(() =>
        useBulkSelection({
          allData: mockAllData,
          pageData: mockPageData,
          selectedIds: new Set(),
          setSelectedIds: setSelectedIdsMock as unknown as (ids: Set<string | number>) => void,
        })
      );

      expect(result.current.currentPageCount).toBe(3);
      expect(result.current.totalCount).toBe(5);
    });
  });

  describe('Selection state detection', () => {
    it('should detect when all items on current page are selected', () => {
      const selectedIds = new Set<number>([1, 2, 3]);

      const { result } = renderHook(() =>
        useBulkSelection({
          allData: mockAllData,
          pageData: mockPageData,
          selectedIds,
          setSelectedIds: setSelectedIdsMock as unknown as (ids: Set<string | number>) => void,
        })
      );

      expect(result.current.isCurrentPageSelected).toBe(true);
      expect(result.current.isSomeSelected).toBe(true);
    });

    it('should detect when all items across all pages are selected', () => {
      const selectedIds = new Set<number>([1, 2, 3, 4, 5]);

      const { result } = renderHook(() =>
        useBulkSelection({
          allData: mockAllData,
          pageData: mockPageData,
          selectedIds,
          setSelectedIds: setSelectedIdsMock as unknown as (ids: Set<string | number>) => void,
        })
      );

      expect(result.current.isAllSelected).toBe(true);
      expect(result.current.isSomeSelected).toBe(false);
    });

    it('should detect partial selection', () => {
      const selectedIds = new Set<number>([1, 2]);

      const { result } = renderHook(() =>
        useBulkSelection({
          allData: mockAllData,
          pageData: mockPageData,
          selectedIds,
          setSelectedIds: setSelectedIdsMock as unknown as (ids: Set<string | number>) => void,
        })
      );

      expect(result.current.isCurrentPageSelected).toBe(false);
      expect(result.current.isAllSelected).toBe(false);
      expect(result.current.isSomeSelected).toBe(true);
    });
  });

  describe('toggleOne', () => {
    it('should add item to selection', () => {
      const selectedIds = new Set<number>([1]);

      const { result } = renderHook(() =>
        useBulkSelection({
          allData: mockAllData,
          pageData: mockPageData,
          selectedIds,
          setSelectedIds: setSelectedIdsMock as unknown as (ids: Set<string | number>) => void,
        })
      );

      act(() => {
        result.current.toggleOne(2);
      });

      expect(setSelectedIdsMock).toHaveBeenCalledWith(new Set([1, 2]));
    });

    it('should remove item from selection', () => {
      const selectedIds = new Set<number>([1, 2, 3]);

      const { result } = renderHook(() =>
        useBulkSelection({
          allData: mockAllData,
          pageData: mockPageData,
          selectedIds,
          setSelectedIds: setSelectedIdsMock as unknown as (ids: Set<string | number>) => void,
        })
      );

      act(() => {
        result.current.toggleOne(2);
      });

      expect(setSelectedIdsMock).toHaveBeenCalledWith(new Set([1, 3]));
    });

    it('should work with string IDs', () => {
      const selectedIds = new Set<string>(['a', 'b']);

      const { result } = renderHook(() =>
        useBulkSelection({
          allData: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
          pageData: [{ id: 'a' }, { id: 'b' }],
          selectedIds,
          setSelectedIds: setSelectedIdsMock as unknown as (ids: Set<string | number>) => void,
        })
      );

      act(() => {
        result.current.toggleOne('c');
      });

      expect(setSelectedIdsMock).toHaveBeenCalledWith(new Set(['a', 'b', 'c']));
    });
  });

  describe('toggleCurrentPage', () => {
    it('should select all items on current page if none selected', () => {
      const { result } = renderHook(() =>
        useBulkSelection({
          allData: mockAllData,
          pageData: mockPageData,
          selectedIds: new Set(),
          setSelectedIds: setSelectedIdsMock as unknown as (ids: Set<string | number>) => void,
        })
      );

      act(() => {
        result.current.toggleCurrentPage();
      });

      expect(setSelectedIdsMock).toHaveBeenCalledWith(new Set([1, 2, 3]));
    });

    it('should deselect all items on current page if all selected', () => {
      const selectedIds = new Set<number>([1, 2, 3, 4, 5]);

      const { result } = renderHook(() =>
        useBulkSelection({
          allData: mockAllData,
          pageData: mockPageData,
          selectedIds,
          setSelectedIds: setSelectedIdsMock as unknown as (ids: Set<string | number>) => void,
        })
      );

      act(() => {
        result.current.toggleCurrentPage();
      });

      expect(setSelectedIdsMock).toHaveBeenCalledWith(new Set([4, 5]));
    });
  });

  describe('toggleAllPages', () => {
    it('should select all items across all pages', () => {
      const selectedIds = new Set<number>([1, 2]);

      const { result } = renderHook(() =>
        useBulkSelection({
          allData: mockAllData,
          pageData: mockPageData,
          selectedIds,
          setSelectedIds: setSelectedIdsMock as unknown as (ids: Set<string | number>) => void,
        })
      );

      act(() => {
        result.current.toggleAllPages();
      });

      expect(setSelectedIdsMock).toHaveBeenCalledWith(new Set([1, 2, 3, 4, 5]));
    });

    it('should clear selection if all items already selected', () => {
      const selectedIds = new Set<number>([1, 2, 3, 4, 5]);

      const { result } = renderHook(() =>
        useBulkSelection({
          allData: mockAllData,
          pageData: mockPageData,
          selectedIds,
          setSelectedIds: setSelectedIdsMock as unknown as (ids: Set<string | number>) => void,
        })
      );

      act(() => {
        result.current.toggleAllPages();
      });

      expect(setSelectedIdsMock).toHaveBeenCalledWith(new Set());
    });
  });

  describe('clearSelection', () => {
    it('should clear all selections', () => {
      const selectedIds = new Set<number>([1, 2, 3]);

      const { result } = renderHook(() =>
        useBulkSelection({
          allData: mockAllData,
          pageData: mockPageData,
          selectedIds,
          setSelectedIds: setSelectedIdsMock as unknown as (ids: Set<string | number>) => void,
        })
      );

      act(() => {
        result.current.clearSelection();
      });

      expect(setSelectedIdsMock).toHaveBeenCalledWith(new Set());
    });
  });

  describe('selectCurrentPageOnly', () => {
    it('should select only items from current page', () => {
      const selectedIds = new Set<number>([4, 5]);

      const { result } = renderHook(() =>
        useBulkSelection({
          allData: mockAllData,
          pageData: mockPageData,
          selectedIds,
          setSelectedIds: setSelectedIdsMock as unknown as (ids: Set<string | number>) => void,
        })
      );

      act(() => {
        result.current.selectCurrentPageOnly();
      });

      expect(setSelectedIdsMock).toHaveBeenCalledWith(new Set([1, 2, 3]));
    });
  });

  describe('Edge cases', () => {
    it('should handle empty data arrays', () => {
      const { result } = renderHook(() =>
        useBulkSelection({
          allData: [],
          pageData: [],
          selectedIds: new Set(),
          setSelectedIds: setSelectedIdsMock as unknown as (ids: Set<string | number>) => void,
        })
      );

      expect(result.current.isCurrentPageSelected).toBe(false);
      expect(result.current.isAllSelected).toBe(false);
      expect(result.current.currentPageCount).toBe(0);
      expect(result.current.totalCount).toBe(0);
    });

    it('should handle custom getId function', () => {
      interface CustomItem {
        customId: string;
        name: string;
      }

      const customAllData: CustomItem[] = [
        { customId: 'a', name: 'Item A' },
        { customId: 'b', name: 'Item B' },
      ];

      const customPageData: CustomItem[] = [customAllData[0]];
      const selectedIds = new Set<string>(['a']);

      const { result } = renderHook(() =>
        useBulkSelection({
          allData: customAllData,
          pageData: customPageData,
          selectedIds,
          setSelectedIds: setSelectedIdsMock as unknown as (ids: Set<string | number>) => void,
          getId: (item) => item.customId,
        })
      );

      expect(result.current.currentPageCount).toBe(1);
      expect(result.current.isCurrentPageSelected).toBe(true);
    });
  });
});
