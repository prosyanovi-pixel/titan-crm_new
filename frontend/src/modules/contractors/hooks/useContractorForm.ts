import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Contractor, LegalForm, LegalEntityType } from "../types/contractor.types";
import { validateINN, validateKPP, validateOGRN } from "@/lib/validators";
import { useModuleSettings } from "@/modules/settings/hooks/useModuleSettings";
import { useTranslation } from "@/lib/i18n";

/** Параметры хука useContractorForm */
interface UseContractorFormProps {
  initialContractor?: Contractor | null;
  initialName?: string;
  initialLegalEntityType?: string;
  initialInn?: string;
  onSave?: (contractor: Contractor) => void;
}

/** Возвращаемое значение хука useContractorForm */
interface UseContractorFormReturn {
  formData: Partial<Contractor>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Contractor>>>;
  handleChange: (field: keyof Contractor, value: unknown) => void;
  handleSubmit: () => Contractor;
  isValid: boolean;
  errors: Record<string, string>;
}

const isContractorStatus = (value: unknown): value is Contractor["status"] => {
  return value === "active" || value === "pending" || value === "vip" || value === "paused";
};

/**
 * Хук для управления состоянием формы контрагента
 * 
 * Основные функции:
 * - Инициализация данных при создании или редактировании
 * - Валидация полей (ИНН, КПП, ОГРН и др.)
 * - Автоматическое определение legalEntityType на основе legalForm
 * - Управление изменениями и отправка данных
 * 
 * @param props - Параметры конфигурации формы (начальные данные, коллбеки)
 * @returns Состояние формы, методы управления и данные валидации
 */
export function useContractorForm({
  initialContractor,
  initialName,
  initialLegalEntityType,
  initialInn,
  onSave,
}: UseContractorFormProps): UseContractorFormReturn {
  const { t } = useTranslation();
  const { settings } = useModuleSettings("contractors");

  const [formData, setFormData] = useState<Partial<Contractor>>({
    status: settings.defaults?.status || "active",
    type: settings.defaults?.type || "client",
    currency: settings.defaults?.currency || "RUB",
    legalForm: "ooo",
    bankAccounts: [],
    contacts: [],
    tags: [],
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const lastInitializedId = useRef<number | null | undefined>(undefined);

  useEffect(() => {
    if (initialContractor) {
      // Инициализируем если ID изменился ИЛИ если у нас нет данных в форме
      // (Мы не хотим затирать изменения пользователя при фоновом обновлении списка, 
      // но хотим показать свежие данные при первом открытии или после успешного сохранения)
      const isNewContractor = lastInitializedId.current !== initialContractor.id;
      
      if (isNewContractor) {
        setFormData({
          ...initialContractor,
          status: initialContractor.status || settings.defaults?.status || "active",
          tags: initialContractor.tags || [],
          bankAccounts: initialContractor.bankAccounts || [],
          contacts: initialContractor.contacts || [],
          statusName: initialContractor.statusName,
        });
        lastInitializedId.current = initialContractor.id;
      }
    } else {
      // Инициализируем только если форма пустая (первая загрузка) или мы переключились с редактирования на создание
      if (lastInitializedId.current !== null) {
        const currentUserName = typeof window !== 'undefined' ? localStorage.getItem('titan_user_name') || '' : '';
        
        let legalForm: LegalForm = "ooo";
        let legalEntityType: LegalEntityType | undefined = undefined;
        if (initialLegalEntityType) {
          legalEntityType = initialLegalEntityType as LegalEntityType;
          if (initialLegalEntityType === 'individual') {
            legalForm = 'ip';
          } else if (initialLegalEntityType === 'private') {
            legalForm = 'private';
          } else if (initialLegalEntityType === 'foreign') {
            legalForm = 'foreign';
          } else {
            legalForm = 'ooo';
          }
        }
        
        setFormData({
          name: initialName || '',
          status: settings.defaults?.status || "active",
          type: settings.defaults?.type || "client",
          currency: settings.defaults?.currency || "RUB",
          legalForm,
          legalEntityType,
          inn: initialInn || '',
          manager: currentUserName,
          bankAccounts: [],
          contacts: [],
          tags: [],
        });
        lastInitializedId.current = null;
      }
    }
    setFormErrors({});
  }, [initialContractor, initialInn, initialLegalEntityType, initialName, settings.defaults]);

  const handleChange = useCallback((field: keyof Contractor, value: unknown) => {
    setFormData((prev) => { 
      const newData = { ...prev, [field]: value };
      
      // Автоматически заполняем legalEntityType на основе legalForm
      if (field === 'legalForm') {
        const lf = String(value);
        if (lf === 'ip') newData.legalEntityType = 'individual';
        else if (lf === 'self' || lf === 'private') newData.legalEntityType = 'private';
        else if (lf === 'foreign') newData.legalEntityType = 'foreign';
        else newData.legalEntityType = 'legal';
      }

      if (field === 'status') {
        delete newData.statusName;
      }
      
      return newData;
    });

    // Очистка ошибки при изменении поля
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [formErrors]);

  const validate = useCallback(() => {
    const errors: Record<string, string> = {};

    if (!formData.name || formData.name.trim() === "") {
      errors.name = t("contractor_type.error.name_required");
    }

    if (formData.inn && !validateINN(formData.inn)) {
      errors.inn = t("contractor_type.error.invalid_inn");
    }

    if (formData.kpp && !validateKPP(formData.kpp)) {
      errors.kpp = t("contractor_type.error.invalid_kpp");
    }

    if (formData.ogrn && !validateOGRN(formData.ogrn)) {
      errors.ogrn = t("contractor_type.error.invalid_ogrn");
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, t]);

  const handleSubmit = useCallback((): Contractor => {
    if (!validate()) {
      throw new Error(t("contractor_type.error.form_has_errors"));
    }

    const contractor: Contractor = {
      ...formData,
      id: initialContractor?.id || Math.floor(Math.random() * 10000),
      name: formData.name || "",
      tags: formData.tags || [],
      status: isContractorStatus(formData.status) ? formData.status : "active",
      phone: formData.phone || "",
      manager: formData.manager || "",
    } as Contractor;

    if (onSave) {
      onSave(contractor);
    }

    return contractor;
  }, [formData, initialContractor, onSave, validate]);

  const isValid = useMemo(() => {
    return Boolean(formData.name && formData.name.trim() !== "" && Object.keys(formErrors).length === 0);
  }, [formData.name, formErrors]);

  return {
    formData,
    setFormData,
    handleChange,
    handleSubmit,
    isValid,
    errors: formErrors,
  };
}
