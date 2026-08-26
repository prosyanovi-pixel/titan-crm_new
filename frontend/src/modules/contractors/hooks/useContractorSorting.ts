import { useMemo } from "react";
import { Contractor } from "../types/contractor.types";
import { SortConfig } from "@/hooks/useDataTable";

interface UseContractorSortingProps {
  filteredContractors: Contractor[];
  sortConfig: SortConfig<Contractor> | null;
}

/**
 * Хук для сортировки списка контрагентов на клиенте.
 * @returns Отсортированный массив контрагентов
 */
export function useContractorSorting({
  filteredContractors,
  sortConfig,
}: UseContractorSortingProps) {
  return useMemo(() => {
    if (!sortConfig) return filteredContractors;
    
    const getSortableValue = (c: Contractor, key: keyof Contractor): string | number => {
      if (key === "tags") return (c.tags || []).join(", ").toLowerCase();
      const val = c[key];
      if (typeof val === 'string') return val.toLowerCase();
      if (typeof val === 'number') return val;
      return String(val ?? "");
    };

    return [...filteredContractors].sort((a, b) => {
      const aValue = getSortableValue(a, sortConfig.key);
      const bValue = getSortableValue(b, sortConfig.key);
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredContractors, sortConfig]);
}
