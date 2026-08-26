import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import { MailCategorySettings, defaultCategories } from '../../context/mailCategories';

interface UseMailCategoriesReturn {
  categories: MailCategorySettings;
  updateCategories: (newCategories: MailCategorySettings) => Promise<void>;
  loading: boolean;
}

/**
 * Хук для управления категориями писем
 * ~80 строк
 */
export function useMailCategories(): UseMailCategoriesReturn {
  const [categories, setCategories] = useState<MailCategorySettings>(defaultCategories);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  // Загрузка категорий из настроек пользователя
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const response = await api.get('/user-settings/mail_categories');
        if (response?.value) {
          setCategories(response.value);
        }
      } catch (err) {
        console.warn('Failed to load categories, using defaults');
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  const updateCategories = useCallback(async (newCategories: MailCategorySettings) => {
    setCategories(newCategories);
    try {
      await api.post('/user-settings', {
        key: 'mail_categories',
        value: newCategories
      });
      toast.success(t('mail.settings.categories_saved'));
    } catch (err) {
      toast.error(t('mail.errors.save_settings_failed'));
    }
  }, [t]);

  return {
    categories,
    updateCategories,
    loading,
  };
}
