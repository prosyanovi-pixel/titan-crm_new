/**
 * Хук загрузки данных отчёта с debounce для предотвращения лишних запросов
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { reportsApi } from '../api/reports.api';
import type { ReportType, ReportFilters } from '../types/reports.types';

/**
 * Загрузить данные для конкретного типа отчёта
 * @param type - тип отчёта
 * @param filters - фильтры
 * @param page - страница
 * @param limit - кол-во на страницу
 * @param enabled - включить запрос
 */
export const useReportData = (
  type: ReportType | undefined,
  filters: ReportFilters = {},
  page = 1,
  limit = 10,
  enabled = true,
  sortBy?: string,
  sortDir?: 'asc' | 'desc'
) => {
  return useQuery({
    queryKey: ['report-data', type, filters, page, limit, sortBy, sortDir],
    queryFn:  () => reportsApi.getReportData(type!, filters, page, limit, sortBy, sortDir),
    enabled:  enabled && Boolean(type),
    staleTime: 5 * 60 * 1000,  // 5 минут
    placeholderData: keepPreviousData,
  });
};
