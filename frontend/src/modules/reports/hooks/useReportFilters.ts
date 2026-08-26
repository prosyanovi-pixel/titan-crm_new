/**
 * Хук управления состоянием фильтров отчёта
 * Поддерживает быстрые preset'ы периода
 */

import { useState, useCallback } from 'react';
import type { ReportFilters } from '../types/reports.types';

/** Быстрые preset'ы периода */
export type DatePreset = 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'custom';

/**
 * Сформировать даты по пресету
 */
function getPresetDates(preset: DatePreset): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  switch (preset) {
    case 'this_month': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { dateFrom: fmt(from), dateTo: fmt(to) };
    }
    case 'last_month': {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to   = new Date(now.getFullYear(), now.getMonth(), 0);
      return { dateFrom: fmt(from), dateTo: fmt(to) };
    }
    case 'this_quarter': {
      const q = Math.floor(now.getMonth() / 3);
      const from = new Date(now.getFullYear(), q * 3, 1);
      const to   = new Date(now.getFullYear(), q * 3 + 3, 0);
      return { dateFrom: fmt(from), dateTo: fmt(to) };
    }
    case 'this_year': {
      return {
        dateFrom: `${now.getFullYear()}-01-01`,
        dateTo:   `${now.getFullYear()}-12-31`,
      };
    }
    default:
      return { dateFrom: '', dateTo: '' };
  }
}

export interface UseReportFiltersReturn {
  filters:       ReportFilters;
  activePreset:  DatePreset | null;
  setFilter:     (key: keyof ReportFilters, value: unknown) => void;
  setPreset:     (preset: DatePreset) => void;
  resetFilters:  () => void;
  setFilters:    (filters: ReportFilters) => void;
}

/**
 * Хук управления состоянием фильтров с поддержкой пресетов
 * @param initialFilters - начальные значения фильтров
 */
export function useReportFilters(initialFilters: ReportFilters = {}): UseReportFiltersReturn {
  const [filters, setFiltersState] = useState<ReportFilters>(initialFilters);
  const [activePreset, setActivePreset] = useState<DatePreset | null>(null);

  const setFilter = useCallback((key: keyof ReportFilters, value: unknown) => {
    setFiltersState(prev => ({ ...prev, [key]: value }));
    // Если меняется дата вручную — сбросить пресет
    if (key === 'dateFrom' || key === 'dateTo') {
      setActivePreset(null);
    }
  }, []);

  const setPreset = useCallback((preset: DatePreset) => {
    const { dateFrom, dateTo } = getPresetDates(preset);
    setFiltersState(prev => ({ ...prev, dateFrom, dateTo }));
    setActivePreset(preset);
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState({});
    setActivePreset(null);
  }, []);

  const setFilters = useCallback((newFilters: ReportFilters) => {
    setFiltersState(newFilters);
    setActivePreset(null);
  }, []);

  return { filters, activePreset, setFilter, setPreset, resetFilters, setFilters };
}
