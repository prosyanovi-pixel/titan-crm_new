import { api } from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { contractorsApi } from "../api";
import { CONTRACTOR_KEYS } from "./useContractorQueries";
import { Contractor } from "../types/contractor.types";
import { ContractorsPaginatedResponse } from "../api/contractorService";

/** Тип кэша списка контрагентов в React Query */
type ContractorListCache = ContractorsPaginatedResponse | Contractor[] | undefined;

/** Параметры хука useContractorBulkActions */
interface UseContractorBulkActionsProps {
  selectedIds: Set<string | number>;
  clearSelection: () => void;
  refreshData: () => Promise<void>;
  deleteContractors: (ids: number[]) => Promise<boolean>;
}

/**
 * Хук для массовых операций над контрагентами (групповое обновление, удаление).
 * Использует оптимистичное обновление кэша React Query.
 * @returns Методы handleBulkUpdate и handleBulkDelete
 */
export function useContractorBulkActions({
  selectedIds,
  clearSelection,
  refreshData,
  deleteContractors,
}: UseContractorBulkActionsProps) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, field, value }: { ids: number[]; field: string; value: string }) =>
      contractorsApi.bulkUpdate({ ids, updates: { [field]: value } }),
    onMutate: async ({ ids, field, value }) => {
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
                ids.includes(c.id) ? { ...c, [field]: value } : c
              ),
            };
          }
          if (Array.isArray(old)) {
            return old.map((c: Contractor) =>
              ids.includes(c.id) ? { ...c, [field]: value } : c
            );
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
      toast.error(t("contractors.errors.save_failed"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CONTRACTOR_KEYS.lists() });
    },
    onSuccess: () => {
      toast.success(t("contractors.toast.bulk_updated"));
      clearSelection();
    },
  });

  const handleBulkUpdate = async (field: string, value: string) => {
    const ids = Array.from(selectedIds).filter((id): id is number => typeof id === 'number');
    if (ids.length === 0) return;
    await bulkUpdateMutation.mutateAsync({ ids, field, value });
  };

  const handleBulkDelete = async () => {
    const ok = await confirm({
      title: t('common.confirm_deletion'),
      description: t('common.confirm_deletion_text'),
      variant: 'destructive',
    });
    if (!ok) return;

    try {
      const ids = Array.from(selectedIds).filter((id): id is number => typeof id === 'number');
      if (ids.length === 0) return;
      await deleteContractors(ids);
      clearSelection();
      toast.success(t('contractors.toast.bulk_deleted'));
    } catch {
      toast.error(t('contractors.errors.delete_failed'));
    }
  };

  return {
    handleBulkUpdate,
    handleBulkDelete,
  };
}
