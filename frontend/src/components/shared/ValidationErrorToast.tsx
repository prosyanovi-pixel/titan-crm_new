import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export interface ValidationField {
  name: string;
  label: string;
  value?: unknown;
}

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Hook to show validation errors in toast with list of required fields
 * Usage:
 * const { showValidationError, validateFields } = useValidationToast();
 * 
 * const errors = validateFields([
 *   { name: 'title', label: 'Название', value: formData.title },
 *   { name: 'type', label: 'Тип', value: formData.type },
 * ]);
 * 
 * if (errors.length > 0) {
 *   showValidationError(errors, 'Заполните обязательные поля');
 *   return;
 * }
 */

export const useValidationToast = () => {
  const { t } = useTranslation();
  
  /**
   * Validate array of fields and return list of missing/empty fields
   */
  const validateFields = (fields: ValidationField[]): ValidationError[] => {
    return fields
      .filter(field => !field.value || (typeof field.value === 'string' && !field.value.trim()))
      .map(field => ({
        field: field.name,
        message: field.label,
      }));
  };

  /**
   * Show validation error toast with list of required fields
   */
  const showValidationError = (errors: ValidationError[], title?: string) => {
    const defaultTitle = title || t('common.fill_required');
    const errorList = errors.map(e => e.message).join(', ');
    
    toast.error(
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">{defaultTitle}</span>
        </div>
        <div className="text-sm text-muted-foreground pl-6">
          {errorList}
        </div>
      </div>,
      {
        duration: 4000,
        className: 'max-w-md',
      }
    );
  };

  /**
   * Shorthand: validate fields and show error if any missing
   * Returns true if validation passed (no errors)
   */
  const validate = (fields: ValidationField[], title?: string): boolean => {
    const errors = validateFields(fields);
    if (errors.length > 0) {
      showValidationError(errors, title);
      return false;
    }
    return true;
  };

  return {
    validateFields,
    showValidationError,
    validate,
  };
};

/**
 * Component that displays validation errors as JSX for custom toast layouts
 */
export function ValidationErrorContent({
  errors,
  title,
}: {
  errors: ValidationError[];
  title?: string;
}) {
  const { t } = useTranslation();
  
  if (errors.length === 0) return null;

  const errorList = errors.map(e => e.message).join(', ');

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span className="font-medium">{title || t('common.fill_required')}</span>
      </div>
      <div className="text-sm text-muted-foreground pl-6">
        {errorList}
      </div>
    </div>
  );
}
