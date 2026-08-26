import { useState, useMemo } from "react";

export interface UseBulkSelectionOptions<T> {
  /** Все данные (весь массив) */
  allData: T[];
  /** Данные на текущей странице */
  pageData: T[];
  /** ID выбранных записей */
  selectedIds: Set<string | number>;
  /** Установить выбранные ID */
  setSelectedIds: (ids: Set<string | number>) => void;
  /** Ключ для получения ID из записи */
  getId?: (item: T) => string | number;
}

export interface UseBulkSelectionReturn {
  /** Выбранные ID */
  selectedIds: Set<string | number>;
  /** Установить выбранные ID */
  setSelectedIds: (ids: Set<string | number>) => void;
  /** Выбраны ли все записи на текущей странице */
  isCurrentPageSelected: boolean;
  /** Выбраны ли все записи (все страницы) */
  isAllSelected: boolean;
  /** Выбраны ли некоторые записи на текущей странице */
  isSomeSelected: boolean;
  /** Переключить выбор текущей страницы */
  toggleCurrentPage: () => void;
  /** Переключить выбор всех страниц */
  toggleAllPages: () => void;
  /** Переключить выбор отдельной записи */
  toggleOne: (id: string | number) => void;
  /** Очистить выбор */
  clearSelection: () => void;
  /** Выбрать только текущую страницу */
  selectCurrentPageOnly: () => void;
  /** Количество выбранных записей */
  selectedCount: number;
  /** Количество записей на текущей странице */
  currentPageCount: number;
  /** Общее количество записей */
  totalCount: number;
}

/**
 * Хук для управления множественным выбором с поддержкой "выбора всех страниц"
 * 
 * @example
 * ```tsx
 * const {
 *   isCurrentPageSelected,
 *   isAllSelected,
 *   isSomeSelected,
 *   toggleCurrentPage,
 *   toggleAllPages,
 *   toggleOne,
 *   clearSelection,
 *   selectedCount,
 * } = useBulkSelection({
 *   allData: allContractors,
 *   pageData: paginatedContractors,
 *   selectedIds,
 *   setSelectedIds,
 * });
 * ```
 */
export function useBulkSelection<T>({
  allData,
  pageData,
  selectedIds,
  setSelectedIds,
  getId = (item: T) => (item as Record<string, unknown>).id as string | number,
}: UseBulkSelectionOptions<T>): UseBulkSelectionReturn {
  const [selectAllMode, setSelectAllMode] = useState(false);

  // Получаем все ID (с защитой от undefined)
  const allIds = useMemo(() => {
    if (!allData || !Array.isArray(allData)) return new Set<string | number>();
    return new Set(allData.map(getId));
  }, [allData, getId]);
  
  const currentPageIds = useMemo(() => {
    if (!pageData || !Array.isArray(pageData)) return new Set<string | number>();
    return new Set(pageData.map(getId));
  }, [pageData, getId]);

  // Проверяем состояния выбора
  const isCurrentPageSelected = useMemo(() => {
    if (currentPageIds.size === 0) return false;
    return Array.from(currentPageIds).every(id => selectedIds.has(id));
  }, [selectedIds, currentPageIds]);

  const isAllSelected = useMemo(() => {
    if (allIds.size === 0) return false;
    return allIds.size === selectedIds.size;
  }, [selectedIds, allIds]);

  const isSomeSelected = useMemo(() => {
    return selectedIds.size > 0 && !isAllSelected;
  }, [selectedIds.size, isAllSelected]);

  const selectedCount = selectedIds.size;
  const currentPageCount = pageData.length;
  const totalCount = allData.length;

  // Переключить выбор текущей страницы
  const toggleCurrentPage = () => {
    const newSelected = new Set(selectedIds);
    if (isCurrentPageSelected) {
      // Снять выделение со всех на текущей странице
      currentPageIds.forEach(id => newSelected.delete(id));
    } else {
      // Выделить все на текущей странице
      currentPageIds.forEach(id => newSelected.add(id));
    }
    setSelectedIds(newSelected);
    setSelectAllMode(false);
  };

  // Переключить выбор всех страниц
  const toggleAllPages = () => {
    if (isAllSelected) {
      // Снять выделение со всех
      setSelectedIds(new Set());
      setSelectAllMode(false);
    } else {
      // Выделить все
      setSelectedIds(allIds);
      setSelectAllMode(true);
    }
  };

  // Переключить выбор отдельной записи
  const toggleOne = (id: string | number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    setSelectAllMode(false);
  };

  // Очистить выбор
  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectAllMode(false);
  };

  // Выбрать только текущую страницу
  const selectCurrentPageOnly = () => {
    setSelectedIds(currentPageIds);
    setSelectAllMode(false);
  };

  return {
    selectedIds,
    setSelectedIds,
    isCurrentPageSelected,
    isAllSelected,
    isSomeSelected,
    toggleCurrentPage,
    toggleAllPages,
    toggleOne,
    clearSelection,
    selectCurrentPageOnly,
    selectedCount,
    currentPageCount,
    totalCount,
  };
}
