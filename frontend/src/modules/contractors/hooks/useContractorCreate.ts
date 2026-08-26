import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Contractor } from "../types/contractor.types";
import { useContractorForm } from "./useContractorForm";
import { mapTypeToLegalDetails } from "../utils/contractor-utils";

/** Тип формы контрагента (организация, ИП, физ лицо или иностранное юр. лицо) */
export type ContractorType = "private" | "individual" | "legal" | "foreign";

interface TaxRegime {
  id: number;
  name: string;
}

interface UseContractorCreateProps {
  initialName?: string;
  onSave?: (contractor: Contractor) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

/**
 * Хук для управления созданием нового контрагента.
 * Обеспечивает поиск по ИНН, выбор типа, работу с тегами и налоговыми режимами.
 * @returns Состояние формы, обработчики ввода ИНН, выбора типа и сохранения
 */
export function useContractorCreate({
  initialName,
  onSave,
  onOpenChange,
  open,
}: UseContractorCreateProps) {
  const { t } = useTranslation();
  
  const [selectedType, setSelectedType] = useState<ContractorType>("legal");
  const [inn, setInn] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagSearch, setTagSearch] = useState("");

  // Form management
  const form = useContractorForm({
    initialContractor: null,
    initialName,
    initialLegalEntityType: selectedType,
    initialInn: inn.trim() || undefined,
    onSave,
  });

  const { setFormData, handleChange, handleSubmit } = form;

  // Load tax regimes
  const { data: taxRegimesList = [] } = useQuery({
    queryKey: ['contractors-tax-regimes'],
    queryFn: async () => {
      const res = await api.get('/references');
      return res?.taxRegimes || [];
    },
    enabled: open,
    staleTime: 24 * 60 * 60 * 1000,
  });

  // Reset when sheet closes
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setSelectedType("legal");
        setInn("");
        setError(null);
        setTagSearch("");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleLookupByInn = useCallback(async (forcedInn?: string) => {
    const trimmedInn = (forcedInn || inn).trim();
    if (!trimmedInn) return;

    const innRegex = /^\d{10}$|^\d{12}$/;
    if (!innRegex.test(trimmedInn)) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get(`/enrichment/lookup-by-inn/${trimmedInn}`);
      
      if (response?.data) {
        const data = response.data;
        let detectedType: ContractorType = "legal";
        if (data.legalEntityType === "individual") detectedType = "individual";
        else if (data.legalEntityType === "foreign") detectedType = "foreign";
        else if (data.legalEntityType === "private") detectedType = "private";
        
        setSelectedType(detectedType);
        
        setFormData(prev => ({
          ...prev,
          name: data.name || prev.name || '',
          fullName: data.fullName || prev.fullName || '',
          inn: data.inn || trimmedInn,
          kpp: data.kpp || prev.kpp || '',
          ogrn: data.ogrn || prev.ogrn || '',
          legalAddress: data.legalAddress || prev.legalAddress || '',
          director: data.director || prev.director || '',
          directorPosition: data.directorPosition || prev.directorPosition || '',
          okved: data.okved || prev.okved || '',
          okvedName: data.okvedName || prev.okvedName || '',
          legalEntityType: data.legalEntityType || detectedType,
          legalForm: data.legalForm || prev.legalForm,
          okpo: data.okpo || prev.okpo || '',
          okato: data.okato || prev.okato || '',
          phone: data.phone || prev.phone || '',
          email: data.email || prev.email || '',
        }));

        toast.success(t("contractor_sheet.lookup_success"));
      }
    } catch (err) {
      console.error("Failed to lookup by INN:", err);
      setError(t("contractor_type.error.lookup_failed"));
    } finally {
      setIsLoading(false);
    }
  }, [inn, setFormData, t]);

  const handleInnChange = useCallback((value: string) => {
    const val = value.replace(/\D/g, "");
    setInn(val);
    handleChange("inn", val);
    setError(null);
    
    if ((val.length === 10 || val.length === 12) && selectedType !== "private") {
      handleLookupByInn(val);
    }
  }, [handleChange, handleLookupByInn, selectedType]);

  const handleTypeSelect = useCallback((type: ContractorType) => {
    setSelectedType(type);
    setError(null);
    const { entityType, form: legalForm } = mapTypeToLegalDetails(type);
    handleChange("legalEntityType", entityType);
    handleChange("legalForm", legalForm);

    if (type === "foreign") {
      setInn("");
      handleChange("inn", "");
    }
  }, [handleChange]);

  const handleSave = useCallback(() => {
    if (selectedType !== "foreign" && selectedType !== "private" && !inn.trim()) {
      setError(t("contractor_type.error.inn_required"));
      return;
    }
    handleSubmit();
    onOpenChange(false);
  }, [selectedType, inn, handleSubmit, onOpenChange, t]);

  const handleAddCustomTag = useCallback(() => {
    if (!tagSearch.trim()) return;
    const current = form.formData.tags || [];
    if (!current.includes(tagSearch.trim())) {
      handleChange("tags", [...current, tagSearch.trim()]);
    }
    setTagSearch("");
  }, [tagSearch, form.formData.tags, handleChange]);

  return {
    ...form,
    selectedType,
    inn,
    isLoading,
    error,
    tagSearch,
    setTagSearch,
    taxRegimesList,
    handleInnChange,
    handleTypeSelect,
    handleSave,
    handleAddCustomTag,
    handleLookupByInn,
  };
}
