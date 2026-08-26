import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { Contractor, BankAccount, LegalForm } from "../types/contractor.types";
import { validateBIK } from "@/lib/validators";
import { detectLegalFormFromName } from "../utils/contractor-utils";
import { LegalFormItem } from "@/modules/settings/types/settings.types";

interface UseContractorOverviewProps {
  formData: Partial<Contractor>;
  handleChange: (field: keyof Contractor, value: unknown) => void;
  isSheetOpen: boolean;
  legalFormsList: LegalFormItem[];
}

/** Система налогообложения (налоговый режим) */
export interface TaxRegime {
  id: number;
  code?: string;
  name: string;
  isActive?: boolean;
  is_active?: boolean;
  appliesToLegalForms?: string[];
  applies_to_legal_forms?: string[];
}

const LEGAL_FORM_ALIASES: Record<string, LegalForm> = {
  ooo: "ooo",
  "ооо": "ooo",
  pao: "pao",
  "пао": "pao",
  ao: "ao",
  "ао": "ao",
  zao: "zao",
  "зао": "zao",
  oao: "oao",
  "оао": "oao",
  ano: "ano",
  "ано": "ano",
  np: "np",
  "нп": "np",
  gup: "gup",
  "гуп": "gup",
  mup: "mup",
  "муп": "mup",
  ip: "ip",
  "ип": "ip",
  self: "self",
  "самозанятый": "self",
  private: "private",
  "физическое лицо": "private",
  foreign: "foreign",
  "иностранное": "foreign",
};

const normalizeLegalFormCode = (value?: string | null): LegalForm | null => {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  return LEGAL_FORM_ALIASES[normalized] ?? null;
};

const EMPTY_BANK: Partial<BankAccount> = { currency: "RUB", isPrimary: false };

/**
 * Хук для управления вкладкой «Обзор» карточки контрагента.
 * Обеспечивает обогащение данных по ИНН, работу с банковскими реквизитами и налоговыми режимами.
 * @returns Состояние вкладки, обработчики банковских реквизитов и сравнения данных
 */
export function useContractorOverview({
  formData,
  handleChange,
  isSheetOpen,
  legalFormsList,
}: UseContractorOverviewProps) {
  const { t } = useTranslation();

  const [taxRegimes, setTaxRegimes] = useState<TaxRegime[]>([]);
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [changedFields, setChangedFields] = useState<Set<string>>(new Set());
  const [tagSearch, setTagSearch] = useState("");
  const [isBankSheetOpen, setIsBankSheetOpen] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [bankForm, setBankForm] = useState<Partial<BankAccount>>(EMPTY_BANK);
  const [comparisonData, setComparisonData] = useState<Partial<Contractor> | null>(null);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  useEffect(() => {
    if (!isSheetOpen) {
      setTimeout(() => {
        setChangedFields(new Set());
        setComparisonData(null);
        setIsComparisonOpen(false);
        setTagSearch("");
      }, 0);
    }
  }, [isSheetOpen]);

  useEffect(() => {
    const loadTaxRegimes = async () => {
      try {
        const regimes = await api.get("/finance/settings/tax-regimes");
        setTaxRegimes(Array.isArray(regimes) ? regimes : []);
      } catch (error) {
        console.error(t('logs.tax_regimes_load_error'), error);
      }
    };

    loadTaxRegimes();
  }, []);

  const resolveTaxRegimeId = useCallback(
    (legalForm?: string | null, legalEntityType?: string | null, taxSystem?: string | null): number | null => {
      if (!Array.isArray(taxRegimes) || taxRegimes.length === 0) return null;

      const fallbackByEntityType: Record<string, string[]> = {
        individual: ["ip", "self", "private"],
        legal: ["ooo", "ao", "pao", "nano", "ano", "np", "gup", "mup"],
        foreign: ["foreign"],
        private: ["private", "self"],
      };

      const fallbackForms = legalEntityType ? (fallbackByEntityType[String(legalEntityType)] || []) : [];
      const normalizedLegalForm = normalizeLegalFormCode(legalForm);
      if (taxSystem) {
        const ts = String(taxSystem).toLowerCase();
        const exactMatch = taxRegimes.find((r) => 
          (r.isActive ?? r.is_active ?? true) && 
          (String(r.code).toLowerCase() === ts || String(r.name).toLowerCase().includes(ts))
        );
        if (exactMatch?.id != null) return Number(exactMatch.id);
      }

      return null;
    },
    [taxRegimes]
  );

  const handleLookupCurrentContractor = async () => {
    if (!formData.id || String(formData.id).includes(".")) {
      toast.info(t('toast.save_card_first'));
      return;
    }

    if (!formData.inn) {
      toast.error(t('toast.inn_not_specified'));
      return;
    }

    setIsLookupLoading(true);
    try {
      const response = await api.get(`/enrichment/lookup/${formData.id}`);
      const data = response?.raw as Record<string, unknown> | undefined;

      if (!data || typeof data !== "object") {
        toast.info(t("generated.vse_dannye_aktual_ny"));
        return;
      }

      const rawLegalForm = typeof data.legalForm === "string" ? data.legalForm : null;
      const rawLegalEntityType = typeof data.legalEntityType === "string" ? data.legalEntityType : null;
      const rawTaxSystem =
        typeof data.taxSystem === "string"
          ? data.taxSystem
          : typeof data.taxRegimeCode === "string"
            ? data.taxRegimeCode
            : typeof data.taxRegimeName === "string"
              ? data.taxRegimeName
              : null;

      const newValues: Partial<Contractor> = {
        name: (data.name as string) || formData.name || "",
        fullName: (data.fullName as string) || formData.fullName || "",
        inn: (data.inn as string) || formData.inn || "",
        kpp: (data.kpp as string) || formData.kpp || "",
        ogrn: (data.ogrn as string) || formData.ogrn || "",
        legalAddress: (data.legalAddress as string) || formData.legalAddress || "",
        director: (data.director as string) || formData.director || "",
        directorPosition: (data.directorPosition as string) || formData.directorPosition || "",
        okved: (data.okved as string) || formData.okved || "",
        okvedName: (data.okvedName as string) || formData.okvedName || "",
        legalEntityType: (rawLegalEntityType as Contractor["legalEntityType"]) || formData.legalEntityType,
        authorizedCapital:
          typeof data.authorizedCapital === "number"
            ? data.authorizedCapital
            : formData.authorizedCapital,
      };

      const normalizedLegalForm = normalizeLegalFormCode(rawLegalForm);
      if (normalizedLegalForm) {
        newValues.legalForm = normalizedLegalForm;
      } else if (newValues.fullName) {
        const detected = detectLegalFormFromName(newValues.fullName, legalFormsList);
        if (detected) {
          newValues.legalForm = detected.id as LegalForm;
          newValues.groupId = detected.groupId;
        }
      }

      const resolvedTaxRegimeId =
        (typeof data.taxRegimeId === "number" ? data.taxRegimeId : null) ??
        resolveTaxRegimeId(newValues.legalForm, newValues.legalEntityType, rawTaxSystem);

      if (resolvedTaxRegimeId != null) {
        newValues.taxRegimeId = Number(resolvedTaxRegimeId);
      }

      const hasChanges = Object.keys(newValues).some((key) => {
        const oldValue = String((formData as Record<string, unknown>)[key] || "").trim();
        const fetchedValue = String((newValues as Record<string, unknown>)[key] || "").trim();
        return fetchedValue !== "" && oldValue !== fetchedValue;
      });

      if (!hasChanges) {
        toast.info(t("generated.vse_dannye_aktual_ny"));
        return;
      }

      setComparisonData(newValues);
      setIsComparisonOpen(true);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error ||
        (error as Error)?.message ||
        t("contractor_sheet.enrichment.error_search");
      toast.error(message);
    } finally {
      setIsLookupLoading(false);
    }
  };

  const applyComparison = () => {
    if (!comparisonData) return;
    const updated = new Set(changedFields);

    Object.keys(comparisonData).forEach((key) => {
      const newValue = (comparisonData as Record<string, unknown>)[key];
      const oldValue = (formData as Record<string, unknown>)[key];

      if (newValue !== undefined && newValue !== oldValue) {
        handleChange(key as keyof Contractor, newValue);
        updated.add(key);
      }
    });

    if (comparisonData.legalForm) {
      const form = legalFormsList.find((f) => f.id === comparisonData.legalForm);
      if (form?.groupId) {
        handleChange("groupId", form.groupId);
        updated.add("groupId");
      }
    }

    setChangedFields(updated);
    setIsComparisonOpen(false);
    setComparisonData(null);
    toast.success(t("contractor_sheet.action.comparison.success_enriched"));
  };

  const toggleEdit = (field: string | null) => setEditingField(editingField === field ? null : field);

  const openAddBank = () => {
    setEditingBankId(null);
    setBankForm(EMPTY_BANK);
    setIsBankSheetOpen(true);
  };

  const openEditBank = (account: BankAccount) => {
    setEditingBankId(account.id);
    setBankForm({ ...account });
    setIsBankSheetOpen(true);
  };

  const handleSaveBank = () => {
    if (!bankForm.bankName || !bankForm.accountNumber || !bankForm.bik) {
      toast.error(t("common.fill_required"));
      return;
    }

    if (!validateBIK(bankForm.bik)) {
      toast.error(t("contractor_type.error.invalid_bik"));
      return;
    }

    const currentAccounts = formData.bankAccounts || [];
    if (editingBankId) {
      const updated = currentAccounts.map((acc) =>
        acc.id === editingBankId
          ? {
              ...acc,
              bankName: bankForm.bankName!,
              bik: bankForm.bik!,
              accountNumber: bankForm.accountNumber!,
              correspondentAccount: bankForm.correspondentAccount || "",
              currency: bankForm.currency || "RUB",
            } as BankAccount
          : acc
      );
      handleChange("bankAccounts", updated);
    } else {
      const account: BankAccount = {
        id: `ba_${Date.now()}`,
        bankName: bankForm.bankName!,
        bik: bankForm.bik!,
        accountNumber: bankForm.accountNumber!,
        correspondentAccount: bankForm.correspondentAccount || "",
        currency: bankForm.currency || "RUB",
        isPrimary: currentAccounts.length === 0,
      };
      handleChange("bankAccounts", [...currentAccounts, account]);
    }
    setIsBankSheetOpen(false);
    setBankForm(EMPTY_BANK);
    setEditingBankId(null);
  };

  const removeBank = (id: string) => {
    handleChange("bankAccounts", (formData.bankAccounts || []).filter((acc) => acc.id !== id));
  };

  return {
    taxRegimes,
    isLookupLoading,
    editingField,
    changedFields,
    tagSearch,
    setTagSearch,
    isBankSheetOpen,
    setIsBankSheetOpen,
    editingBankId,
    bankForm,
    setBankForm,
    comparisonData,
    isComparisonOpen,
    setIsComparisonOpen,
    handleLookupCurrentContractor,
    applyComparison,
    toggleEdit,
    openAddBank,
    openEditBank,
    handleSaveBank,
    removeBank,
  };
}
