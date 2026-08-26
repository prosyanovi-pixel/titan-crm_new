import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import { Mail, MailFilterType, MailSortType } from '../types';
import { transformMailData, filterAndSortMails } from '../utils/mailUtils';

interface UseMailsProps {
  selectedAccountId: string;
  activeFolder: string;
  includeSubfolders: boolean;
  searchQuery?: string;
  showUnreadOnly?: boolean;
  showStarredOnly?: boolean;
}

interface UseMailsReturn {
  mails: Mail[];
  filteredMails: Mail[];
  selectedMail: Mail | null;
  setSelectedMail: (mail: Mail | null) => void;
  loading: boolean;
  error: Error | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  mailFilter: MailFilterType;
  setMailFilter: (filter: MailFilterType) => void;
  mailSort: MailSortType;
  setMailSort: (sort: MailSortType) => void;
  refetch: () => Promise<void>;
  markAsRead: (mailId: string, isRead: boolean) => Promise<void>;
  toggleStar: (mailId: string) => Promise<void>;
  isSearching: boolean;
}

/**
 * Хук для работы с письмами (загрузка, фильтрация, сортировка)
 */
export const useMails = ({
  selectedAccountId,
  activeFolder,
  includeSubfolders,
  searchQuery: initialSearchQuery = '',
  showUnreadOnly = false,
  showStarredOnly = false,
}: UseMailsProps): UseMailsReturn => {
  const [mails, setMails] = useState<Mail[]>([]);
  const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [mailFilter, setMailFilter] = useState<MailFilterType>('all');
  const [mailSort, setMailSort] = useState<MailSortType>('date-desc');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const { t } = useTranslation();

  // Загрузка писем
  const fetchMails = useCallback(async () => {
    console.log(`[MAIL] useEffect triggered`);
    console.log(`  - activeFolder: ${activeFolder} (${typeof activeFolder})`);
    console.log(`  - selectedAccountId: ${selectedAccountId} (${typeof selectedAccountId})`);
    console.log(`  - searchQuery: ${searchQuery}`);

    if (!activeFolder || !selectedAccountId) {
      console.log(`[MAIL] Skipping: missing activeFolder or selectedAccountId`);
      setMails([]);
      setSelectedMail(null);
      return;
    }

    try {
      setLoading(true);
      setMails([]); // Clear old mails immediately
      setSelectedMail(null);
      
      const params: Record<string, unknown> = {
        limit: 50,
        offset: 0,
      };
      
      // Если есть поисковый запрос - используем полнотекстовый поиск
      if (searchQuery && searchQuery.trim().length > 2) {
        setIsSearching(true);
        params.searchQuery = searchQuery.trim();
        params.accountId = selectedAccountId;
        params.folderId = activeFolder;
        params.includeSubfolders = includeSubfolders;
        
        console.log(`[MAIL] Full-text search with query: "${searchQuery}"`);
        console.log(`[MAIL] Search params:`, params);
      } else {
        setIsSearching(false);
        params.accountId = selectedAccountId;
        params.folderId = activeFolder;
        params.includeSubfolders = includeSubfolders;
        
        // Добавляем фильтры
        if (showUnreadOnly) {
          params.isRead = false;
        }
        if (showStarredOnly) {
          params.isStarred = true;
        }
      }

      console.log(`[MAIL] Fetching mails from API with params:`, JSON.stringify(params));

      const response = await api.get('/mail', { params });

      console.log(`[MAIL] API response:`, response);
      console.log(`[MAIL] Got ${Array.isArray(response) ? response.length : response?.mails?.length || 0} mails`);
      
      // Логируем первое письмо для отладки
      const firstMail = Array.isArray(response) ? response[0] : (response?.mails?.[0]);
      if (firstMail) {
        console.log('[MAIL] First mail date field:', firstMail.date);
        console.log('[MAIL] First mail full object:', firstMail);
      }
      
      const mailsArray = Array.isArray(response) ? response : (response?.mails || []);

      if (mailsArray.length > 0) {
        const transformedData = transformMailData(mailsArray);
        console.log(`[MAIL] Transformed ${transformedData.length} mails`);
        console.log(`[MAIL] First mail folderId:`, transformedData[0]?.folder);
        setMails(transformedData);
        // Не предвыбираем первое письмо, чтобы список не выглядел как hover/active по умолчанию.
        setSelectedMail(null);
      } else {
        console.log(`[MAIL] No mails found`);
        setMails([]);
        setSelectedMail(null);
      }
    } catch (err) {
      console.error('[MAIL] Error fetching mails:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch mails'));
      toast.error(t('mail.errors.load_mails_failed'));
      setMails([]);
      setSelectedMail(null);
    } finally {
      setLoading(false);
    }
  }, [activeFolder, selectedAccountId, searchQuery, includeSubfolders, showUnreadOnly, showStarredOnly, t]);

  // Дебаунс загрузки при изменении searchQuery
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchMails();
    }, searchQuery ? 300 : 0);

    return () => clearTimeout(timeoutId);
  }, [fetchMails, searchQuery]);

  // Фильтрация и сортировка писем (мемоизировано)
  const filteredMails = useMemo(() => {
    return filterAndSortMails(mails, {
      searchQuery,
      mailFilter,
      mailSort,
    });
  }, [mails, searchQuery, mailFilter, mailSort]);

  // Отметка письма как прочитанного/непрочитанного
  const markAsRead = useCallback(async (mailId: string, isRead: boolean) => {
    const targetMail = mails.find((mail) => mail.id === mailId);
    if (!targetMail) return;

    // Оптимистичное обновление
    setMails((prev) => prev.map((mail) =>
      mail.id === mailId ? { ...mail, isRead } : mail
    ));
    setSelectedMail((prev) =>
      prev?.id === mailId ? { ...prev, isRead } : prev
    );

    try {
      await api.patch(`/mail/${mailId}/read`, { isRead });
      toast.success(isRead ? t('mail.actions.marked_read') : t('mail.actions.marked_unread'));
    } catch (err) {
      // Откат при ошибке
      setMails((prev) => prev.map((mail) =>
        mail.id === mailId ? { ...mail, isRead: targetMail.isRead } : mail
      ));
      setSelectedMail((prev) =>
        prev?.id === mailId ? { ...prev, isRead: targetMail.isRead } : prev
      );
      toast.error(t('mail.errors.update_status_failed'));
    }
  }, [mails, t]);

  // Переключение избранного
  const toggleStar = useCallback(async (mailId: string) => {
    const targetMail = mails.find((mail) => mail.id === mailId);
    if (!targetMail) return;

    const nextStarred = !targetMail.isStarred;

    // Оптимистичное обновление
    setMails((prev) => prev.map((mail) =>
      mail.id === mailId ? { ...mail, isStarred: nextStarred } : mail
    ));
    setSelectedMail((prev) =>
      prev?.id === mailId ? { ...prev, isStarred: nextStarred } : prev
    );

    try {
      await api.patch(`/mail/${mailId}/star`, { isStarred: nextStarred });
      toast.success(nextStarred ? t('mail.actions.starred') : t('mail.actions.unstarred'));
    } catch (err) {
      // Откат при ошибке
      setMails((prev) => prev.map((mail) =>
        mail.id === mailId ? { ...mail, isStarred: targetMail.isStarred } : mail
      ));
      setSelectedMail((prev) =>
        prev?.id === mailId ? { ...prev, isStarred: targetMail.isStarred } : prev
      );
      toast.error(t('mail.errors.update_star_failed'));
    }
  }, [mails, t]);

  // Загрузка детальной информации о письме
  const loadMailDetails = useCallback(async (mail: Mail) => {
    if (!mail?.id) {
      setSelectedMail(null);
      return;
    }

    // Показываем письмо сразу, затем догружаем полные данные (включая вложения)
    setSelectedMail(mail);

    try {
      const response = await api.get(`/mail/${mail.id}`);
      const [detailedMail] = transformMailData([response]);
      if (detailedMail) {
        setSelectedMail(detailedMail);
        // Бэкенд автоматически помечает письмо прочитанным при открытии.
        // Обновляем локальный state списка, чтобы индикатор «непрочитанное» сразу пропал.
        setMails(prev => prev.map(m => m.id === mail.id ? { ...m, isRead: true } : m));
      }
    } catch (err) {
      console.error('[Mail] Failed to load detailed mail:', err);
    }
  }, []);

  const handleSetSelectedMail = useCallback((mail: Mail | null) => {
    if (mail) {
      loadMailDetails(mail);
    } else {
      setSelectedMail(null);
    }
  }, [loadMailDetails]);

  return {
    mails,
    filteredMails,
    selectedMail,
    setSelectedMail: handleSetSelectedMail,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    mailFilter,
    setMailFilter,
    mailSort,
    setMailSort,
    refetch: fetchMails,
    markAsRead,
    toggleStar,
    isSearching,
  };
};