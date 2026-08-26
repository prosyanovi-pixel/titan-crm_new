/**
 * Hooks для работы со статусами, тегами и приоритетами
 * 
 * Используют TanStack Query для кэширования и синхронизации данных
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import * as api from './status-system.api';
import {
  type Status,
  type Tag,
  type Priority,
  type Outcome,
  type DisplayConfig,
  type StatusCreateRequest,
  type StatusUpdateRequest,
  type TagCreateRequest,
  type TagUpdateRequest,
  type PriorityCreateRequest,
  type PriorityUpdateRequest,
  type OutcomeCreateRequest,
  type OutcomeUpdateRequest,
} from './types';
import { getContrastColor, withAlpha } from '@/lib/color';

// ─── Query Keys ─────────────────────────────────────────────────────────────

const queryKeys = {
  statuses: {
    all: ['statuses'] as const,
    lists: () => [...queryKeys.statuses.all, 'list'] as const,
    list: (module?: string) => [...queryKeys.statuses.lists(), { module }] as const,
    details: () => [...queryKeys.statuses.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.statuses.details(), id] as const,
  },
  tags: {
    all: ['tags'] as const,
    lists: () => [...queryKeys.tags.all, 'list'] as const,
    list: (module?: string) => [...queryKeys.tags.lists(), { module }] as const,
    details: () => [...queryKeys.tags.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tags.details(), id] as const,
  },
  priorities: {
    all: ['priorities'] as const,
    lists: () => [...queryKeys.priorities.all, 'list'] as const,
    list: () => [...queryKeys.priorities.lists()] as const,
    details: () => [...queryKeys.priorities.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.priorities.details(), id] as const,
  },
  outcomes: {
    all: ['outcomes'] as const,
    lists: () => [...queryKeys.outcomes.all, 'list'] as const,
    list: () => [...queryKeys.outcomes.lists()] as const,
    details: () => [...queryKeys.outcomes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.outcomes.details(), id] as const,
  },
};

// ─── Helper Functions ─────────────────────────────────────────────────────────────

/**
 * Преобразует статус в DisplayConfig
 */
function statusToDisplayConfig(status: Status): DisplayConfig {
  return {
    id: status.id,
    name: status.name,
    color: status.color,
    // Для soft/outline вариантов используем сам цвет как цвет текста —
    // насыщенный цвет отлично читается на светлом полупрозрачном фоне.
    // Для solid варианта компоненты самостоятельно вычисляют контрастный цвет.
    textColor: status.color,
    backgroundColor: withAlpha(status.color, 0.12),
    borderColor: withAlpha(status.color, 0.45),
    icon: status.icon,
    description: status.description,
    variant: status.variant,
    size: status.size,
    shape: status.shape,
    isGlass: status.isGlass,
    isGradient: status.isGradient,
    secondaryColor: status.secondaryColor,
    isAnimated: status.isAnimated,
  };
}

/**
 * Преобразует тег в DisplayConfig
 */
function tagToDisplayConfig(tag: Tag): DisplayConfig {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    textColor: tag.color,
    backgroundColor: withAlpha(tag.color, 0.12),
    borderColor: withAlpha(tag.color, 0.45),
    description: tag.description,
    variant: tag.variant,
    size: tag.size,
    shape: tag.shape,
    icon: tag.icon,
    isGlass: tag.isGlass,
    isGradient: tag.isGradient,
    secondaryColor: tag.secondaryColor,
    isAnimated: tag.isAnimated,
  };
}

/**
 * Преобразует приоритет в DisplayConfig
 */
function priorityToDisplayConfig(priority: Priority): DisplayConfig {
  return {
    id: priority.id,
    name: priority.name,
    color: priority.color,
    textColor: priority.color,
    backgroundColor: withAlpha(priority.color, 0.12),
    borderColor: withAlpha(priority.color, 0.45),
    icon: priority.icon,
    description: priority.description,
    variant: priority.variant,
    size: priority.size,
    shape: priority.shape,
    isGlass: priority.isGlass,
    isGradient: priority.isGradient,
    secondaryColor: priority.secondaryColor,
    isAnimated: priority.isAnimated,
  };
}

/**
 * Преобразует результат дела в DisplayConfig
 */
function outcomeToDisplayConfig(outcome: Outcome): DisplayConfig {
  return {
    id: outcome.id,
    name: outcome.name,
    color: outcome.color,
    textColor: outcome.color,
    backgroundColor: withAlpha(outcome.color, 0.12),
    borderColor: withAlpha(outcome.color, 0.45),
    description: outcome.description,
    variant: outcome.variant,
    size: outcome.size,
    shape: outcome.shape,
    icon: outcome.icon,
    isGlass: outcome.isGlass,
    isGradient: outcome.isGradient,
    secondaryColor: outcome.secondaryColor,
    isAnimated: outcome.isAnimated,
  };
}

// ─── Status Hooks ─────────────────────────────────────────────────────────────

export interface UseStatusesOptions {
  module?: string;
  enabled?: boolean;
}

/**
 * Хук для получения всех статусов
 */
export function useStatuses(options: UseStatusesOptions = {}) {
  const { module, enabled = true } = options;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.statuses.list(module),
    queryFn: () => api.get_statuses(module),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 минут
    gcTime: 10 * 60 * 1000, // 10 минут
  });

  const getStatusById = useCallback(
    (id: string, statusModule?: string): Status | undefined => {
      return data?.find((s) => s.id === id && (!statusModule || s.module === statusModule));
    },
    [data]
  );

  const getStatusDisplay = useCallback(
    (id: string, statusModule?: string): DisplayConfig | undefined => {
      const status = getStatusById(id, statusModule);
      return status ? statusToDisplayConfig(status) : undefined;
    },
    [getStatusById]
  );

  const statuses = useMemo(() => data || [], [data]);

  return {
    statuses,
    isLoading,
    error,
    getStatusById,
    getStatusDisplay,
    refetch,
  };
}

/**
 * Хук для создания статуса
 */
export function useCreateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StatusCreateRequest) => api.create_status(data),
    onSuccess: (newStatus) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.statuses.lists() });
      queryClient.setQueryData(
        queryKeys.statuses.detail(newStatus.id),
        newStatus
      );
    },
  });
}

/**
 * Хук для обновления статуса
 */
export function useUpdateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StatusUpdateRequest) => api.update_status(data),
    onSuccess: (updatedStatus) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.statuses.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.statuses.detail(updatedStatus.id),
      });
    },
  });
}

/**
 * Хук для удаления статуса
 */
export function useDeleteStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete_status(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.statuses.lists() });
      queryClient.removeQueries({
        queryKey: queryKeys.statuses.detail(id),
      });
    },
  });
}

// ─── Tag Hooks ─────────────────────────────────────────────────────────────

export interface UseTagsOptions {
  module?: string;
  enabled?: boolean;
}

/**
 * Хук для получения всех тегов
 */
export function useTags(options: UseTagsOptions = {}) {
  const { module, enabled = true } = options;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.tags.list(module),
    queryFn: () => api.get_tags(module),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const getTagById = useCallback(
    (id: string, tagModule?: string): Tag | undefined => {
      return data?.find((t) => (t.id === id || t.name === id) && (!tagModule || t.module === tagModule));
    },
    [data]
  );

  const getTagDisplay = useCallback(
    (id: string, tagModule?: string): DisplayConfig | undefined => {
      const tag = getTagById(id, tagModule);
      return tag ? tagToDisplayConfig(tag) : undefined;
    },
    [getTagById]
  );

  const tags = useMemo(() => data || [], [data]);

  return {
    tags,
    isLoading,
    error,
    getTagById,
    getTagDisplay,
    refetch,
  };
}

/**
 * Хук для создания тега
 */
export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TagCreateRequest) => api.create_tag(data),
    onSuccess: (newTag) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.lists() });
      queryClient.setQueryData(queryKeys.tags.detail(newTag.id), newTag);
    },
  });
}

/**
 * Хук для обновления тега
 */
export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TagUpdateRequest) => api.update_tag(data),
    onSuccess: (updatedTag) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tags.detail(updatedTag.id),
      });
    },
  });
}

/**
 * Хук для удаления тега
 */
export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete_tag(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.lists() });
      queryClient.removeQueries({
        queryKey: queryKeys.tags.detail(id),
      });
    },
  });
}

// ─── Priority Hooks ─────────────────────────────────────────────────────────────

/**
 * Хук для получения всех приоритетов
 */
export function usePriorities() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.priorities.list(),
    queryFn: api.get_priorities,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const getPriorityById = useCallback(
    (id: string): Priority | undefined => {
      return data?.find((p) => p.id === id);
    },
    [data]
  );

  const getPriorityDisplay = useCallback(
    (id: string): DisplayConfig | undefined => {
      const priority = getPriorityById(id);
      return priority ? priorityToDisplayConfig(priority) : undefined;
    },
    [getPriorityById]
  );

  const priorities = useMemo(() => data || [], [data]);

  return {
    priorities,
    isLoading,
    error,
    getPriorityById,
    getPriorityDisplay,
    refetch,
  };
}

/**
 * Хук для создания приоритета
 */
export function useCreatePriority() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PriorityCreateRequest) => api.create_priority(data),
    onSuccess: (newPriority) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.priorities.lists() });
      queryClient.setQueryData(
        queryKeys.priorities.detail(newPriority.id),
        newPriority
      );
    },
  });
}

/**
 * Хук для обновления приоритета
 */
export function useUpdatePriority() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PriorityUpdateRequest) => api.update_priority(data),
    onSuccess: (updatedPriority) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.priorities.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.priorities.detail(updatedPriority.id),
      });
    },
  });
}

/**
 * Хук для удаления приоритета
 */
export function useDeletePriority() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete_priority(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.priorities.lists() });
      queryClient.removeQueries({
        queryKey: queryKeys.priorities.detail(id),
      });
    },
  });
}

// ─── Outcome Hooks ─────────────────────────────────────────────────────────────

/**
 * Хук для получения всех результатов дел
 */
export function useOutcomes() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.outcomes.list(),
    queryFn: () => api.get_outcomes(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const getOutcomeById = useCallback(
    (id: string): Outcome | undefined => {
      return data?.find((o) => o.id === id);
    },
    [data]
  );

  const getOutcomeDisplay = useCallback(
    (id: string): DisplayConfig | undefined => {
      const outcome = getOutcomeById(id);
      return outcome ? outcomeToDisplayConfig(outcome) : undefined;
    },
    [getOutcomeById]
  );

  const outcomes = useMemo(() => data || [], [data]);

  return {
    outcomes,
    isLoading,
    error,
    getOutcomeById,
    getOutcomeDisplay,
    refetch,
  };
}

/**
 * Хук для создания результата
 */
export function useCreateOutcome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: OutcomeCreateRequest) => api.create_outcome(data),
    onSuccess: (newOutcome) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.outcomes.lists() });
      queryClient.setQueryData(
        queryKeys.outcomes.detail(newOutcome.id),
        newOutcome
      );
    },
  });
}

/**
 * Хук для обновления результата
 */
export function useUpdateOutcome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: OutcomeUpdateRequest) => api.update_outcome(data),
    onSuccess: (updatedOutcome) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.outcomes.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.outcomes.detail(updatedOutcome.id),
      });
    },
  });
}

/**
 * Хук для удаления результата
 */
export function useDeleteOutcome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete_outcome(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.outcomes.lists() });
      queryClient.removeQueries({
        queryKey: queryKeys.outcomes.detail(id),
      });
    },
  });
}
