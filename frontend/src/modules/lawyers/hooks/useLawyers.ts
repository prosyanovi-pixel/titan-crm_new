import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import { Lawyer, LegalCase, LawyerFilters, CaseFilters } from "../types/lawyer.types";
import { CreateLawyerRequest, CreateCaseRequest } from "../types/api.types";
import { lawyerService } from "../api/lawyerService";

interface UseLawyersReturn {
  lawyers: Lawyer[];
  loading: boolean;
  error: Error | null;
  fetchLawyers: () => Promise<void>;
  createLawyer: (data: Partial<Lawyer>) => Promise<Lawyer | null>;
  updateLawyer: (id: string, data: Partial<Lawyer>) => Promise<Lawyer | null>;
  deleteLawyer: (id: string) => Promise<boolean>;
}

export function useLawyers(): UseLawyersReturn {
  const { t } = useTranslation();
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLawyers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await lawyerService.getAllLawyers();
      setLawyers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      toast.error(t("general.toast.error.lawyer_load"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const createLawyer = useCallback(
    async (data: Partial<Lawyer>): Promise<Lawyer | null> => {
      try {
        const newLawyer = await lawyerService.createLawyer(data as unknown as CreateLawyerRequest);
        setLawyers((prev) => [newLawyer, ...prev]);
        toast.success(t("general.toast.success.lawyer_created"));
        return newLawyer;
      } catch (err) {
        toast.error(t("general.toast.error.lawyer_save"));
        return null;
      }
    },
    [t]
  );

  const updateLawyer = useCallback(
    async (id: string, data: Partial<Lawyer>): Promise<Lawyer | null> => {
      try {
        const updatedLawyer = await lawyerService.updateLawyer(id, { id, ...data });
        setLawyers((prev) =>
          prev.map((l) => (l.id === id ? updatedLawyer : l))
        );
        toast.success(t("general.toast.success.lawyer_updated"));
        return updatedLawyer;
      } catch (err) {
        toast.error(t("general.toast.error.lawyer_save"));
        return null;
      }
    },
    [t]
  );

  const deleteLawyer = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await lawyerService.deleteLawyer(id);
        setLawyers((prev) => prev.filter((l) => l.id !== id));
        toast.success(t("general.toast.success.lawyer_deleted"));
        return true;
      } catch (err) {
        toast.error(t("general.toast.error.lawyer_delete"));
        return false;
      }
    },
    [t]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
  fetchLawyers();
  }, [fetchLawyers]);

  return {
    lawyers,
    loading,
    error,
    fetchLawyers,
    createLawyer,
    updateLawyer,
    deleteLawyer,
  };
}

interface UseCasesReturn {
  cases: LegalCase[];
  loading: boolean;
  error: Error | null;
  fetchCases: () => Promise<void>;
  createCase: (data: Partial<LegalCase>) => Promise<LegalCase | null>;
  updateCase: (id: string, data: Partial<LegalCase>) => Promise<LegalCase | null>;
  deleteCase: (id: string) => Promise<boolean>;
}

export function useCases(): UseCasesReturn {
  const { t } = useTranslation();
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      const data = await lawyerService.getAllCases();
      setCases(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      toast.error(t("general.toast.error.cases_load"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const createCase = useCallback(
    async (data: Partial<LegalCase>): Promise<LegalCase | null> => {
      try {
        const newCase = await lawyerService.createCase(data as unknown as CreateCaseRequest);
        setCases((prev) => [newCase, ...prev]);
        toast.success(t("general.toast.success.case_created"));
        return newCase;
      } catch (err) {
        toast.error(t("general.toast.error.case_save"));
        return null;
      }
    },
    [t]
  );

  const updateCase = useCallback(
    async (id: string, data: Partial<LegalCase>): Promise<LegalCase | null> => {
      try {
        const updatedCase = await lawyerService.updateCase(id, { id, ...data });
        setCases((prev) =>
          prev.map((c) => (c.id === id ? updatedCase : c))
        );
        toast.success(t("general.toast.success.case_updated"));
        return updatedCase;
      } catch (err) {
        toast.error(t("general.toast.error.case_save"));
        return null;
      }
    },
    [t]
  );

  const deleteCase = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await lawyerService.deleteCase(id);
        setCases((prev) => prev.filter((c) => c.id !== id));
        toast.success(t("general.toast.success.case_deleted"));
        return true;
      } catch (err) {
        toast.error(t("general.toast.error.case_delete"));
        return false;
      }
    },
    [t]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
  fetchCases();
  }, [fetchCases]);

  return {
    cases,
    loading,
    error,
    fetchCases,
    createCase,
    updateCase,
    deleteCase,
  };
}
