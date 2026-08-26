/**
 * API-методы модуля Reports
 * Все запросы к /api/reports/*
 */

import { api } from '@/lib/api';
import type {
  ReportConfig,
  ReportConfigFormData,
  ReportConfigWithPreview,
  ReportFilters,
  ReportPreviewData,
  ReportType,
} from '../types/reports.types';

export const reportsApi = {
  // ── Конфигурации ──────────────────────────────────────────────────────────

  /**
   * Получить список конфигураций (свои + shared)
   */
  getConfigs: (): Promise<ReportConfig[]> =>
    api.get('/reports/configs') as Promise<ReportConfig[]>,

  /**
   * Получить конфигурацию по ID + предпросмотр данных
   */
  getConfig: (id: string): Promise<ReportConfigWithPreview> =>
    api.get(`/reports/configs/${id}`) as Promise<ReportConfigWithPreview>,

  /**
   * Создать конфигурацию
   */
  createConfig: (data: ReportConfigFormData): Promise<ReportConfig> =>
    api.post('/reports/configs', data) as Promise<ReportConfig>,

  /**
   * Обновить конфигурацию
   */
  updateConfig: (id: string, data: Partial<ReportConfigFormData>): Promise<ReportConfig> =>
    api.put(`/reports/configs/${id}`, data) as Promise<ReportConfig>,

  /**
   * Удалить конфигурацию
   */
  deleteConfig: (id: string): Promise<void> =>
    api.delete(`/reports/configs/${id}`) as Promise<void>,

  /**
   * Дублировать конфигурацию
   */
  duplicateConfig: (id: string): Promise<ReportConfig> =>
    api.post(`/reports/configs/${id}/duplicate`, {}) as Promise<ReportConfig>,

  // ── Данные отчётов ────────────────────────────────────────────────────────

  /**
   * Получить данные финансового отчёта
   */
  getFinanceReport: (
    subtype: 'pl' | 'dds' | 'receivables' | 'register',
    filters: ReportFilters = {}
  ) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v != null && v !== '') params.set(k, String(v));
    });
    return api.get(`/reports/finance/${subtype}?${params.toString()}`) as Promise<unknown[]>;
  },

  /**
   * Получить данные отчёта по типу (для конструктора)
   */
  getReportData: async (type: ReportType, filters: ReportFilters = {}, page = 1, limit = 10, sortBy?: string, sortDir?: string): Promise<ReportPreviewData> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v != null && v !== '') params.set(k, String(v));
    });
    params.set('page', String(page));
    params.set('limit', String(limit));
    params.set('reportType', type);
    if (sortBy) params.set('sortBy', sortBy);
    if (sortDir) params.set('sortDir', sortDir);

    const res = await api.get(`/reports/preview?${params.toString()}`);

    // Теперь бэкенд возвращает { data: [], totalRows: 0 }
    let rawData = res?.data || [];
    const totalRows = res?.totalRows || 0;

    // Обработка сложных ответов для приведения к плоскому массиву строк
    if (type === 'finance_pl' && rawData && typeof rawData === 'object' && 'byCategory' in rawData) {
      rawData = (rawData as any).byCategory || [];
    }

    if (type === 'finance_receivables' && Array.isArray(rawData)) {
      const flattened: Record<string, unknown>[] = [];
      rawData.forEach((group: Record<string, any>) => {
        if (group.invoices && Array.isArray(group.invoices)) {
          group.invoices.forEach((inv: Record<string, any>) => {
            flattened.push({
              ...inv,
              contractorName: group.contractorName,
              projectName: group.projectName,
            });
          });
        } else {
           flattened.push(group);
        }
      });
      rawData = flattened;
    }

    return {
      data: Array.isArray(rawData) ? rawData : [],
      totalRows
    };
  },
};
