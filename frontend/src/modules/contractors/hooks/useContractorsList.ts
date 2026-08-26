import { useCallback } from "react";
import { useContractors, useContractorMutations } from "./useContractorQueries";
import { Contractor } from "../types/contractor.types";
import { CreateContractorRequest } from "../types/api.types";

/**
 * Совместимый хук для внешних модулей (finance, projects, contracts).
 * Предоставляет старый интерфейс { contractors, fetchContractors, createContractor }
 * поверх TanStack Query useContractors + useContractorMutations.
 *
 * @deprecated Для новых компонентов используйте useContractors() + useContractorMutations() напрямую.
 *
 * @example
 * // Вместо:
 * const { contractors, fetchContractors } = useContractors();
 *
 * // Используйте:
 * const { data: contractors, refetch } = useContractors();
 */
export function useContractorsList() {
  const { data: contractorsData, isLoading: loading, error, refetch } = useContractors();
  const contractors = Array.isArray(contractorsData?.data) ? contractorsData.data : [];
  const { createMutation } = useContractorMutations();

  const fetchContractors = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const createContractor = useCallback(
    async (data: Partial<Contractor>): Promise<Contractor | null> => {
      try {
        return await createMutation.mutateAsync(data);
      } catch {
        return null;
      }
    },
    [createMutation]
  );

  return {
    contractors,
    loading,
    error,
    fetchContractors,
    createContractor,
    refetch,
  };
}
