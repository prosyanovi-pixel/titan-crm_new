import { useState, useCallback } from "react";
import { useTranslation } from "@/lib/i18n";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ContractorType } from "../components/ContractorCreateSheet";

interface LookupResult {
  name?: string;
  fullName?: string;
  inn?: string;
  kpp?: string;
  ogrn?: string;
  legalAddress?: string;
  director?: string;
  directorPosition?: string;
  okved?: string;
  okvedName?: string;
  legalEntityType?: ContractorType;
  legalForm?: string;
  okpo?: string;
  okato?: string;
  phone?: string;
  email?: string;
}

interface UseInnLookupReturn {
  isLoading: boolean;
  error: string | null;
  performLookup: (inn: string) => Promise<LookupResult | null>;
}

/**
 * Hook for handling INN lookup and contractor data enrichment.
 * Encapsulates all API interaction logic for INN-based lookups.
 */
export function useInnLookup(): UseInnLookupReturn {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performLookup = useCallback(
    async (inn: string): Promise<LookupResult | null> => {
      const trimmedInn = inn.trim();
      if (!trimmedInn) return null;

      const innRegex = /^\d{10}$|^\d{12}$/;
      if (!innRegex.test(trimmedInn)) {
        setError(t("contractor_type.error.invalid_inn_format"));
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await api.get(
          `/enrichment/lookup-by-inn/${trimmedInn}`
        );

        if (response?.data) {
          toast.success(t("contractor_sheet.lookup_success"));
          return response.data;
        }

        setError(t("contractor_type.error.lookup_failed"));
        return null;
      } catch (err) {
        console.error("Failed to lookup by INN:", err);
        setError(t("contractor_type.error.lookup_failed"));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [t]
  );

  return { isLoading, error, performLookup };
}
