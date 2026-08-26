/**
 * TanStack Query хуки для управления конфигурациями отчётов
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '../api/reports.api';
import type { ReportConfigFormData } from '../types/reports.types';

/** Ключ кэша конфигураций */
const CONFIGS_KEY = ['report-configs'] as const;

/**
 * Получить список всех конфигураций (свои + shared)
 */
export const useReportConfigs = () =>
  useQuery({
    queryKey: CONFIGS_KEY,
    queryFn:  reportsApi.getConfigs,
    staleTime: 2 * 60 * 1000,  // 2 минуты
  });

/**
 * Получить конфигурацию по ID с предпросмотром
 */
export const useReportConfig = (id: string | undefined) =>
  useQuery({
    queryKey: [...CONFIGS_KEY, id],
    queryFn:  () => reportsApi.getConfig(id!),
    enabled:  Boolean(id),
    staleTime: 60 * 1000,
  });

/**
 * Создать конфигурацию
 */
export const useCreateReportConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ReportConfigFormData) => reportsApi.createConfig(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CONFIGS_KEY }); },
  });
};

/**
 * Обновить конфигурацию
 */
export const useUpdateReportConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ReportConfigFormData> }) =>
      reportsApi.updateConfig(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: CONFIGS_KEY });
      qc.invalidateQueries({ queryKey: [...CONFIGS_KEY, id] });
    },
  });
};

/**
 * Удалить конфигурацию
 */
export const useDeleteReportConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reportsApi.deleteConfig(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CONFIGS_KEY }); },
  });
};

/**
 * Дублировать конфигурацию
 */
export const useDuplicateReportConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reportsApi.duplicateConfig(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CONFIGS_KEY }); },
  });
};
