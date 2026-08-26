import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';

/** Налоговый режим для справочника */
export interface TaxRegime {
  id: number;
  code: string;
  name: string;
  description?: string;
  requiresNds: boolean;
  maxIncomeLimit?: number;
  maxEmployeesLimit?: number;
  requiresOnlineCashier: boolean;
}

/** Активный налог контрагента */
export interface ActiveTax {
  type: string;
  name: string;
  rate: number;
  validFrom: string;
  calculation?: {
    base: number;
    amount: number;
    period: string;
  };
}

/** Запись истории смены налогового режима */
export interface TaxHistoryEntry {
  date: string;
  oldRegime?: {
    id: number;
    code?: string;
    name: string;
  } | null;
  newRegime?: {
    id: number;
    code?: string;
    name: string;
  } | null;
  reason?: string;
  changedBy: string;
}

/** Налоговая информация по контрагенту */
export interface ContractorTaxInfo {
  contractorId: number;
  legalForm: string;
  taxRegime: TaxRegime;
  activeTaxes: ActiveTax[];
  limitsCheck?: {
    passed: boolean;
    warnings: string[];
    details: Record<string, unknown>;
  };
  history?: TaxHistoryEntry[];
}

/**
 * Хук для работы с налогами конкретного контрагента.
 */
export function useContractorTaxes(contractorId?: number) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // Получение основной налоговой информации
  const query = useQuery({
    queryKey: ['contractorTaxes', contractorId],
    queryFn: async () => {
      if (!contractorId) return null;
      return api.get(`/contractors/${contractorId}/taxes`, {
        params: { include: 'history,limits,calculations' }
      }) as Promise<ContractorTaxInfo>;
    },
    enabled: !!contractorId,
  });

  // Смена системы налогообложения
  const updateTaxSystem = useMutation({
    mutationFn: async (data: { regimeId: number; reason?: string; effectiveFrom?: string }) => {
      return api.patch(`/contractors/${contractorId}/tax-system`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractorTaxes', contractorId] });
      toast.success(t('toast.tax_system_updated_success'));
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || t('toast.tax_system_updated_error'));
    }
  });

  // Расчёт налогов
  const calculateTaxes = async (params: { year?: number; quarter?: number; estimatedIncome?: number }) => {
    return api.get(`/contractors/${contractorId}/taxes/calculate`, { params });
  };

  return {
    ...query,
    updateTaxSystem,
    calculateTaxes,
  };
}
