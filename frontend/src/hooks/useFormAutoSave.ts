import { useEffect } from 'react';
import { UseFormReturn, FieldValues, Path, PathValue } from 'react-hook-form';

/**
 * Хук для автосохранения состояния формы (react-hook-form) в localStorage.
 * Восстанавливает данные при монтировании и очищает при успешном сабмите (если вызвать clearAutoSave).
 */
export function useFormAutoSave<T extends FieldValues>(
  form: UseFormReturn<T>,
  formId: string,
  debounceMs: number = 1000
) {
  useEffect(() => {
    // Восстанавливаем данные при первом рендере
    const saved = localStorage.getItem(`autosave_${formId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Не перезаписываем поля, которые пользователь уже успел изменить, 
        // но в идеале вызываем это сразу после инициализации
        Object.entries(parsed).forEach(([key, value]) => {
          form.setValue(key as Path<T>, value as PathValue<T, Path<T>>, { shouldValidate: false, shouldDirty: true });
        });
      } catch (e) {
        console.error('Failed to parse autosave data', e);
      }
    }
  }, [formId, form]);

  useEffect(() => {
    // Подписываемся на изменения формы
    const subscription = form.watch((value) => {
      const handler = setTimeout(() => {
        localStorage.setItem(`autosave_${formId}`, JSON.stringify(value));
      }, debounceMs);
      return () => clearTimeout(handler);
    });
    return () => subscription.unsubscribe();
  }, [form, formId, debounceMs]);
  
  const clearAutoSave = () => {
    localStorage.removeItem(`autosave_${formId}`);
  };

  return { clearAutoSave };
}
