import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Mail, MailAccount, ApiMailFolder, MailApiItem } from '../types';
import { transformMailData } from '../utils/mailUtils';

/**
 * Ключи для кэша React Query
 */
export const mailKeys = {
  all: ['mail'] as const,
  accounts: () => [...mailKeys.all, 'accounts'] as const,
  folders: (accountId: string) => [...mailKeys.all, 'folders', accountId] as const,
  mails: (accountId: string, folderId: string, filters: unknown) => [...mailKeys.all, 'list', accountId, folderId, filters] as const,
  mail: (mailId: string) => [...mailKeys.all, 'detail', mailId] as const,
  thread: (mailId: string) => [...mailKeys.all, 'thread', mailId] as const,
};

/**
 * Получение списка почтовых аккаунтов
 */
export const useMailAccountsQuery = (options = {}) => {
  return useQuery<MailAccount[]>({
    queryKey: mailKeys.accounts(),
    queryFn: async () => {
      const response = await api.get('/mail/accounts');
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 минут
    ...options,
  });
};

/**
 * Получение списка папок аккаунта
 */
export const useMailFoldersQuery = (accountId: string, options = {}) => {
  return useQuery<ApiMailFolder[]>({
    queryKey: mailKeys.folders(accountId),
    queryFn: async () => {
      if (!accountId) return [];
      
      // Virtual folders for "All Inboxes" mode
      if (accountId === 'all') {
        return [
          { id: 'virtual_inbox', folderName: 'Входящие', folderType: 'inbox', accountId: 'all', unseenCount: 0, totalCount: 0, isVisible: true, isSyncEnabled: true, displayOrder: 1, imapFolderPath: 'INBOX' },
          { id: 'virtual_sent', folderName: 'Отправленные', folderType: 'sent', accountId: 'all', unseenCount: 0, totalCount: 0, isVisible: true, isSyncEnabled: true, displayOrder: 2, imapFolderPath: 'Sent' },
          { id: 'virtual_drafts', folderName: 'Черновики', folderType: 'drafts', accountId: 'all', unseenCount: 0, totalCount: 0, isVisible: true, isSyncEnabled: true, displayOrder: 3, imapFolderPath: 'Drafts' },
          { id: 'virtual_spam', folderName: 'Спам', folderType: 'spam', accountId: 'all', unseenCount: 0, totalCount: 0, isVisible: true, isSyncEnabled: true, displayOrder: 4, imapFolderPath: 'Spam' },
          { id: 'virtual_trash', folderName: 'Корзина', folderType: 'trash', accountId: 'all', unseenCount: 0, totalCount: 0, isVisible: true, isSyncEnabled: true, displayOrder: 5, imapFolderPath: 'Trash' },
        ] as ApiMailFolder[];
      }

      const response = await api.get(`/mail/folders/${accountId}`);
      return response;
    },
    enabled: !!accountId,
    staleTime: 1 * 60 * 1000,
    ...options,
  });
};

/**
 * Получение списка писем (с бесконечной прокруткой)
 */
export const useMailsInfiniteQuery = (accountId: string, folderId: string, filters: unknown, options = {}) => {
  return useInfiniteQuery({
    queryKey: mailKeys.mails(accountId, folderId, filters),
    queryFn: async ({ pageParam = 0 }): Promise<{ mails: Mail[]; total: number; nextOffset: number; hasMore: boolean }> => {
      if (!accountId || !folderId) return { mails: [], total: 0, nextOffset: 0, hasMore: false };
      
      const isAll = accountId === 'all';
      const folderType = isAll && folderId.startsWith('virtual_') ? folderId.replace('virtual_', '') : undefined;
      const actualFolderId = isAll ? undefined : folderId;
      
      const response = await api.get('/mail', {
        params: {
          accountId,
          folderId: actualFolderId,
          folderType,
          offset: pageParam,
          limit: 50,
          ...(typeof filters === 'object' && filters ? filters : {})
        }
      });
      
      const mailsArray = Array.isArray(response) ? response : (response?.mails || []);
      const total = Number(response?.total || mailsArray.length);
      const transformed = transformMailData(mailsArray);
      
      return {
        mails: transformed,
        total,
        nextOffset: pageParam + mailsArray.length,
        hasMore: total > pageParam + mailsArray.length
      };
    },
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextOffset : undefined,
    initialPageParam: 0,
    enabled: !!accountId && !!folderId,

    ...options,
  });
};

/**
 * Получение деталей письма
 */
export const useMailDetailQuery = (mailId: string) => {
  return useQuery<Mail>({
    queryKey: mailKeys.mail(mailId),
    queryFn: async () => {
      const response = await api.get(`/mail/${mailId}`);
      const [transformed] = transformMailData([response]);
      return transformed;
    },
    enabled: !!mailId,
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Мутация для обновления статуса прочтения (Оптимистичная)
 */
export const useMarkReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mailId, isRead }: { mailId: string; isRead: boolean }) => {
      return api.patch(`/mail/${mailId}/read`, { isRead });
    },
    onMutate: async ({ mailId, isRead }) => {
      // Отменяем исходящие запросы, чтобы не перезаписать оптимистичное обновление
      await queryClient.cancelQueries({ queryKey: mailKeys.all });

      // Сохраняем предыдущее состояние для отката
      const previousMails = queryClient.getQueryData(mailKeys.all);

      // Обновляем в кэше (упрощенно, нужно искать во всех списках)
      // В реальности здесь лучше использовать частичное обновление через setQueriesData
      
      return { previousMails };
    },
    onSettled: () => {
      // После завершения инвалидируем папки (для счетчиков) и списки
      queryClient.invalidateQueries({ queryKey: mailKeys.all });
    }
  });
};
