import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import { Contractor, ReferenceData } from "../types/contractor.types";
import { contractorService, ContractorsPaginatedResponse } from "../api/contractorService";
import { contractorsApi, ContractorsQueryParams } from "../api";
import { CreateContractorRequest, UpdateContractorRequest } from "../types/api.types";

/** Ключи React Query для запросов модуля контрагентов */
export const CONTRACTOR_KEYS = {
  all: ["contractors"] as const,
  lists: () => [...CONTRACTOR_KEYS.all, "list"] as const,
  list: (params: ContractorsQueryParams) =>
    [...CONTRACTOR_KEYS.lists(), { params }] as const,
  details: () => [...CONTRACTOR_KEYS.all, "detail"] as const,
  detail: (id: number) => [...CONTRACTOR_KEYS.details(), id] as const,
  references: ["contractors", "references"] as const,
};

type ContractorListCache = ContractorsPaginatedResponse | Contractor[] | undefined;

/**
 * Хук для получения списка контрагентов с серверной пагинацией/фильтрацией
 * 
 * @param params - Параметры запроса (страница, лимит, поиск, фильтры)
 * @returns Результат запроса TanStack Query со списком контрагентов
 */
export function useContractors(params: ContractorsQueryParams = {}) {
  return useQuery({
    queryKey: CONTRACTOR_KEYS.list(params),
    queryFn: () => contractorService.getAll(params),
  });
}

/**
 * Хук для получения справочных данных модуля контрагентов
 * 
 * @returns Результат запроса справочников (статусы, менеджеры, типы и т.д.)
 */
export function useContractorReferences() {
  return useQuery({
    queryKey: CONTRACTOR_KEYS.references,
    queryFn: () => contractorService.getReferences(),
    staleTime: 1000 * 60 * 30, // 30 минут, так как справочники меняются редко
  });
}

/**
 * Хук для получения данных графика активности
 */
export function useContractorActivityChart(id: number | null) {
  return useQuery({
    queryKey: [...CONTRACTOR_KEYS.detail(id || 0), "activityChart"],
    queryFn: () => id ? contractorService.getActivityChart(id) : [],
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Хук для выполнения мутаций (создание, обновление, удаление) контрагентов
 * 
 * Содержит:
 * - createMutation: создание нового контрагента
 * - updateMutation: обновление существующего (с оптимистичным обновлением)
 * - deleteMutation: удаление одного контрагента
 * - bulkDeleteMutation: массовое удаление
 * - bulkUpdateMutation: массовое обновление
 * 
 * @returns Объект с мутациями
 */
export function useContractorMutations() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const createMutation = useMutation({
    mutationFn: (data: Partial<Contractor>) => 
      contractorService.create(data as CreateContractorRequest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTRACTOR_KEYS.lists() });
      toast.success(t("general.toast.success.contractor_created"));
    },
    onError: () => {
      toast.error(t("general.toast.error.contractor_save"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Contractor> }) => 
      contractorService.update(id, { id, ...data } as UpdateContractorRequest),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: CONTRACTOR_KEYS.all });
      const previousLists = queryClient.getQueriesData({ queryKey: CONTRACTOR_KEYS.all });

      queryClient.setQueriesData(
        { queryKey: CONTRACTOR_KEYS.all },
        (old: ContractorListCache) => {
          if (!old) return old;
          if ('data' in old && Array.isArray(old.data)) {
            return {
              ...old,
              data: old.data.map((c: Contractor) =>
                c.id === id ? { ...c, ...data } : c
              ),
            };
          }
          if (Array.isArray(old)) {
            return old.map((c: Contractor) =>
              c.id === id ? { ...c, ...data } : c
            );
          }
          return old;
        }
      );

      queryClient.setQueryData(CONTRACTOR_KEYS.detail(id), (old: Contractor | null | undefined) => {
        if (!old) return old;
        return { ...old, ...data };
      });

      return { previousLists };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(t("general.toast.error.contractor_save"));
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: CONTRACTOR_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: CONTRACTOR_KEYS.detail(id) });
    },
    onSuccess: () => {
      toast.success(t("general.toast.success.contractor_updated"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => contractorService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: CONTRACTOR_KEYS.lists() });
      toast.success(t("general.toast.success.contractor_deleted"), {
        action: {
          label: t('common.actions.undo'),
          onClick: () => {
            fetch(`/api/trash/contractors/${id}/restore`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'x-user-id': localStorage.getItem('user_id') || ''
              }
            }).then(() => {
              queryClient.invalidateQueries({ queryKey: CONTRACTOR_KEYS.lists() });
              toast.success(t('common.messages.restored'));
            }).catch(() => {
              toast.error(t('common.errors.general'));
            });
          }
        }
      });
    },
    onError: () => {
      toast.error(t("general.toast.error.contractor_delete"));
    },
  });

  /**
   * Массовое удаление — отправляет один запрос POST /contractors/bulk-delete
   * вместо N отдельных DELETE-запросов
   */
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => contractorsApi.bulkDelete(ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: CONTRACTOR_KEYS.all });
      const previousLists = queryClient.getQueriesData({ queryKey: CONTRACTOR_KEYS.all });

      queryClient.setQueriesData(
        { queryKey: CONTRACTOR_KEYS.all },
        (old: ContractorListCache) => {
          if (!old) return old;
          if ('data' in old && Array.isArray(old.data)) {
            return {
              ...old,
              data: old.data.filter((c: Contractor) => !ids.includes(c.id)),
              pagination: {
                ...old.pagination,
                total: Math.max(0, (old.pagination?.total || 0) - ids.length),
              },
            };
          }
          if (Array.isArray(old)) {
            return old.filter((c: Contractor) => !ids.includes(c.id));
          }
          return old;
        }
      );

      return { previousLists };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(t("general.toast.error.contractors_bulk_delete"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CONTRACTOR_KEYS.lists() });
    },
    onSuccess: () => {
      toast.success(t("contractors.toast.bulk_deleted"));
    },
  });

  /**
   * Массовое обновление — отправляет один запрос POST /contractors/bulk-update
   */
  const bulkUpdateMutation = useMutation({
    mutationFn: (data: { ids: number[]; updates: Record<string, unknown> }) =>
      contractorsApi.bulkUpdate(data),
    onMutate: async ({ ids, updates }) => {
      await queryClient.cancelQueries({ queryKey: CONTRACTOR_KEYS.all });
      const previousLists = queryClient.getQueriesData({ queryKey: CONTRACTOR_KEYS.all });

      queryClient.setQueriesData(
        { queryKey: CONTRACTOR_KEYS.all },
        (old: ContractorListCache) => {
          if (!old) return old;
          if ('data' in old && Array.isArray(old.data)) {
            return {
              ...old,
              data: old.data.map((c: Contractor) =>
                ids.includes(c.id) ? { ...c, ...updates } : c
              ),
            };
          }
          if (Array.isArray(old)) {
            return old.map((c: Contractor) =>
              ids.includes(c.id) ? { ...c, ...updates } : c
            );
          }
          return old;
        }
      );

      ids.forEach((id) => {
        queryClient.setQueryData(CONTRACTOR_KEYS.detail(id), (old: Contractor | null | undefined) => {
          if (!old) return old;
          return { ...old, ...updates };
        });
      });

      return { previousLists };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(t("general.toast.error.contractors_bulk_delete"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CONTRACTOR_KEYS.lists() });
    },
    onSuccess: () => {
      toast.success(t("contractors.toast.bulk_updated"));
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    bulkDeleteMutation,
    bulkUpdateMutation,
  };
}
