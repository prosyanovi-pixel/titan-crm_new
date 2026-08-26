import React, { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/lib/i18n';
import { Mail, MailAccount, ApiMailFolder, MailFilterType, MailSortType, MailSyncStatus } from '../types';
import { 
  mailKeys, 
  useMailAccountsQuery, 
  useMailFoldersQuery, 
  useMailsInfiniteQuery 
} from '../hooks/queries';
import { useMailViewLogic } from '../hooks/logic/useMailViewLogic';
import { useMailSelectionLogic } from '../hooks/logic/useMailSelectionLogic';
import { useMailSearch } from '../hooks/logic/useMailSearch';
import { useMailViewState } from '../hooks/logic/useMailViewState';
import { useMailCategories } from '../hooks/logic/useMailCategories';
import { MailCategorySettings } from './mailCategories';
import { useMailActions, useMailDialogs } from '../hooks/logic';
import { useWebSocket } from '@/hooks/useWebSocket';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { showConfirm } from '@/components/ui/confirm-dialog';

interface MailContextType {
  // Accounts
  accounts: MailAccount[];
  selectedAccountId: string;
  setSelectedAccountId: (id: string) => void;
  accountsLoading: boolean;
  refetchAccounts: () => Promise<void>;
  handleAccountChange: (id: string) => void;

  // Folders
  folders: ApiMailFolder[];
  activeFolder: string;
  setActiveFolder: (id: string) => void;
  foldersLoading: boolean;
  refetchFolders: () => Promise<void>;
  moveFolder: (folderId: string, targetParentId: string | null, newOrder: number) => Promise<void>;

  // Mails
  mails: Mail[];
  filteredMails: Mail[];
  selectedMail: Mail | null;
  setSelectedMail: (mail: Mail | null) => void;
  mailsLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  mailFilter: MailFilterType;
  setMailFilter: (filter: MailFilterType) => void;
  mailSort: MailSortType;
  setMailSort: (sort: MailSortType) => void;
  refetchMails: () => Promise<void>;
  markAsRead: (mailId: string, isRead: boolean) => Promise<void>;
  toggleStar: (mailId: string) => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  total: number;
  loadingMore: boolean;

  // Selection
  selectedMailIds: string[];
  toggleSelectMail: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isAllSelected: boolean;
  showMassActions: boolean;
  handleMassDelete: () => Promise<void>;
  handleMassRead: () => Promise<void>;
  handleMassUnread: () => Promise<void>;
  handleMassArchive: () => Promise<void>;
  handleMassSpam: () => Promise<void>;
  handleMassMoveToFolder: (folderId: string) => Promise<void>;

  // View & UI
  viewMode: 'list' | 'mail' | 'compose' | 'settings';
  setViewMode: (mode: 'list' | 'mail' | 'compose' | 'settings') => void;
  composeOpen: boolean;
  setComposeOpen: (open: boolean) => void;
  isComposeMinimized: boolean;
  setIsComposeMinimized: (minimized: boolean) => void;
  settingsTab: string;
  setSettingsTab: (tab: string) => void;
  replyToMail: Mail | null;
  forwardMail: Mail | null;
  isReplyAll: boolean;
  syncStatus: MailSyncStatus | null;
  labels: string[];
  setLabels: React.Dispatch<React.SetStateAction<string[]>>;
  
  // Categories
  categories: MailCategorySettings;
  updateCategories: (newCategories: MailCategorySettings) => Promise<void>;

  // Dialogs & Actions
  dialogs: ReturnType<typeof useMailDialogs>;
  actions: ReturnType<typeof useMailActions> & {
    handleReply: (mail: Mail) => void;
    handleReplyAll: (mail: Mail) => void;
    handleForward: (mail: Mail) => void;
    handleDeleteConfirm: () => Promise<void>;
    handleClearFolderConfirm: () => Promise<void>;
    handleCreateEventConfirm: (data: Record<string, unknown>) => Promise<void>;
    handleFolderConfirm: () => Promise<void>;
  };
}

const MailContext = createContext<MailContextType | undefined>(undefined);

/**
 * MailContextProvider - основной провайдер контекста почты
 * Комбинирует все отдельные хуки в единый контекст для обратной совместимости
 * ~350 строк
 */
export const MailProvider: React.FC<{ children: React.ReactNode, minimal?: boolean }> = ({ 
  children, 
  minimal = false 
}) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [labels, setLabels] = useState<string[]>([]);
  
  // Ленивая инициализация из localStorage - читается ОДИН РАЗ при создании компонента
  const getInitialAccountId = () => {
    if (minimal) return '';
    const saved = localStorage.getItem('mail-selected-account-id');
    return saved || '';
  };
  
  const [selectedAccountId, setSelectedAccountIdState] = useState<string>(getInitialAccountId);
  const [activeFolder, setActiveFolderState] = useState<string>('');
  const [settingsTab, setSettingsTab] = useState('general');

  const setSelectedAccountId = useCallback((id: string) => {
    setSelectedAccountIdState(id);
    localStorage.setItem('mail-selected-account-id', id);
  }, []);

  // 1. Подключаем все отдельные хуки
  const dialogs = useMailDialogs();
  const searchState = useMailSearch();
  const viewLogic = useMailViewLogic();
  const categoriesState = useMailCategories();
  
  // Автоматический выбор первого аккаунта
  const { data: accounts = [], isLoading: accountsLoading } = useMailAccountsQuery({ enabled: !minimal });
  
  // Проверка актуальности выбранного аккаунта
  useEffect(() => {
    if (!minimal && selectedAccountId && selectedAccountId !== 'all' && accounts.length > 0) {
      const accountExists = accounts.some(a => a.id === selectedAccountId);
      if (!accountExists) {
        setTimeout(() => {
          setSelectedAccountIdState('');
          localStorage.removeItem('mail-selected-account-id');
        }, 0);
      }
    }
  }, [accounts, selectedAccountId, minimal]);
  
  useEffect(() => {
    // Выбираем первый аккаунт только если:
    // 1. Нет сохранённого аккаунта в localStorage (selectedAccountId пуст)
    // 2. Есть доступные аккаунты
    if (!minimal && accounts.length > 0 && !selectedAccountId) {
      const timer = setTimeout(() => {
        setSelectedAccountId(accounts.length > 1 ? 'all' : accounts[0].id);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [accounts, selectedAccountId, minimal, setSelectedAccountId]);

  // 2. Загрузка папок
  const { data: folders = [], isLoading: foldersLoading } = useMailFoldersQuery(selectedAccountId, { 
    enabled: !minimal && !!selectedAccountId 
  });

  // Автоматический выбор папки "Входящие"
  const setActiveFolder = useCallback((id: string) => {
    setActiveFolderState(id);
    searchState.setMailFilter('all');
  }, [searchState]);

  useEffect(() => {
    if (!minimal && folders.length > 0 && !activeFolder) {
      const inbox = folders.find(f => 
        f.folderType === 'inbox' || 
        f.folderName.toLowerCase() === 'inbox' || 
        f.folderName.toLowerCase().includes('входящие')
      );
      if (inbox) {
        const timer = setTimeout(() => {
          setActiveFolder(inbox.id);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [folders, activeFolder, minimal, setActiveFolder]);

  // 3. Фильтры для запроса писем
  const mailsFilters = useMemo(() => {
    const isCategoryFilter = categoriesState.categories.some(c => c.id === searchState.mailFilter);
    return {
      searchQuery: searchState.searchQuery,
      filter: isCategoryFilter ? 'all' : searchState.mailFilter,
      sort: searchState.mailSort
    };
  }, [searchState.searchQuery, searchState.mailFilter, searchState.mailSort, categoriesState.categories]);

  // 4. Загрузка писем
  const {
    data: mailsData,
    isLoading: mailsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMailsInfiniteQuery(selectedAccountId, activeFolder, mailsFilters, { 
    enabled: !minimal && !!selectedAccountId && !!activeFolder 
  });

  const allMails = useMemo(() => 
    mailsData?.pages.flatMap(page => page.mails) || [], 
  [mailsData]);

  // 5. Состояние выбранного письма и фильтрация
  const viewState = useMailViewState({
    allMails,
    mailFilter: searchState.mailFilter,
    categories: categoriesState.categories,
  });

  const totalMailsCount = mailsData?.pages[0]?.total || 0;

  // 6. Выбор писем (selection)
  const selection = useMailSelectionLogic({
    mails: allMails,
    folders,
    onMailsUpdated: async () => {
      await refetchMails();
      await refetchFolders();
    },
  });

  // 7. Методы рефетча (React Query)
  const refetchAccounts = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: mailKeys.accounts() });
  }, [queryClient]);

  const refetchFolders = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: mailKeys.folders(selectedAccountId) });
  }, [queryClient, selectedAccountId]);

  const refetchMails = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: mailKeys.mails(selectedAccountId, activeFolder, mailsFilters) });
  }, [queryClient, selectedAccountId, activeFolder, mailsFilters]);

  const moveFolder = useCallback(async (folderId: string, targetParentId: string | null, newOrder: number) => {
    const folder = folders.find(f => f.id === folderId);
    const isNestingChange = folder && folder.parentFolderId !== targetParentId;

    if (isNestingChange) {
      const confirmed = await showConfirm({
        title: t('mail.context.confirm.move_folder_title'),
        description: t('mail.context.confirm.move_folder_desc', { name: folder.folderName }),
        confirmText: t('mail.context.confirm.move_folder_btn'),
        variant: 'default',
      });
      if (!confirmed) {
        await refetchFolders();
        return;
      }
    }

    try {
      await api.put(`/mail/folders/${folderId}`, {
        parentFolderId: targetParentId,
        displayOrder: newOrder
      });
      toast.success(t('mail.context.toast.folder_moved'));
      await refetchFolders();
    } catch (err) {
      const errorMessage = err instanceof Error && 'response' in err ? (err as any).response?.data?.error : undefined;
      toast.error(errorMessage || t('mail.context.toast.folder_move_error'));
      await refetchFolders();
    }
  }, [folders, refetchFolders, t]);

  // 8. Обработчики действий
  const handleAccountChange = useCallback((accountId: string) => {
    setSelectedAccountId(accountId);
    setActiveFolderState('');
    viewState.setSelectedMail(null);
    viewLogic.setViewMode('list');
  }, [viewState, viewLogic]);

  // 9. Обработчики mark as read (оптимистичные обновления)
  const markAsRead = useCallback(async (mailId: string, isRead: boolean) => {
    const mail = viewState.selectedMail?.id === mailId ? viewState.selectedMail : allMails.find(m => m.id === mailId);
    if (!mail) return;

    const wasRead = mail.isRead;
    if (wasRead === isRead) return;

    await queryClient.cancelQueries({ queryKey: ['mail', 'list'], exact: false });
    await queryClient.cancelQueries({ queryKey: ['mail', 'detail', mailId], exact: true });

    if (viewState.selectedMail && viewState.selectedMail.id === mailId) {
      const updatedMail = viewState.selectedMail ? { ...viewState.selectedMail, isRead } : null;
      viewState.setSelectedMail(updatedMail);
    }
    
    queryClient.setQueriesData({ queryKey: ['mail', 'list'], exact: false }, (oldData: any) => {
      if (!oldData || !oldData.pages) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          mails: page.mails.map((m: any) => 
            m.id === mailId ? { ...m, isRead } : m
          )
        }))
      };
    });

    queryClient.setQueriesData({ queryKey: ['mail', 'detail', mailId] }, (oldData: any) => {
      if (!oldData) return oldData;
      return { ...oldData, isRead };
    });

    const folderId = mail.folder;
    const countChange = isRead ? -1 : 1;
    
    if (selectedAccountId) {
      queryClient.setQueriesData({ queryKey: mailKeys.folders(selectedAccountId) }, (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((f: any) => 
          f.id === folderId ? { ...f, unseenCount: Math.max(0, (f.unseenCount || 0) + countChange) } : f
        );
      });
    }

    queryClient.setQueriesData({ queryKey: ['mail', 'folders'], exact: false }, (oldData: any) => {
      if (!oldData || !Array.isArray(oldData)) return oldData;
      return oldData.map((f: any) => 
        f.id === folderId ? { ...f, unseenCount: Math.max(0, (f.unseenCount || 0) + countChange) } : f
      );
    });

    try {
      await api.patch(`/mail/${mailId}/read`, { isRead });
    } catch (err) {
      console.error('[MailContext] Failed to mark as read:', err);
      refetchMails();
      refetchFolders();
    }
  }, [viewState.selectedMail, allMails, selectedAccountId, queryClient, refetchFolders, refetchMails, viewState]);

  // 10. Массовая отметка как прочитанное
  const markMultipleAsRead = useCallback(async (mailIds: string[], isRead: boolean) => {
    if (!mailIds.length) return;

    await queryClient.cancelQueries({ queryKey: ['mail', 'list'], exact: false });
    await queryClient.cancelQueries({ queryKey: ['mail', 'folders'], exact: false });

    if (viewState.selectedMail && mailIds.includes(viewState.selectedMail.id)) {
      const updatedMail = viewState.selectedMail ? { ...viewState.selectedMail, isRead } : null;
      viewState.setSelectedMail(updatedMail);
    }

    queryClient.setQueriesData({ queryKey: ['mail', 'list'], exact: false }, (oldData: any) => {
      if (!oldData || !oldData.pages) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          mails: page.mails.map((m: any) => 
            mailIds.includes(m.id) ? { ...m, isRead } : m
          )
        }))
      };
    });

    mailIds.forEach(id => {
      queryClient.setQueriesData({ queryKey: ['mail', 'detail', id] }, (oldData: any) => {
        if (!oldData) return oldData;
        return { ...oldData, isRead };
      });
    });

    const folderUpdates: Record<string, number> = {};
    mailIds.forEach(id => {
      const mail = allMails.find(m => m.id === id);
      if (mail && mail.isRead !== isRead) {
        const folderId = mail.folder;
        if (folderId) {
          folderUpdates[folderId] = (folderUpdates[folderId] || 0) + (isRead ? -1 : 1);
        }
      }
    });

    Object.entries(folderUpdates).forEach(([folderId, change]) => {
      queryClient.setQueriesData({ queryKey: ['mail', 'folders'], exact: false }, (oldData: any) => {
        if (!oldData || !Array.isArray(oldData)) return oldData;
        return oldData.map((f: any) => 
          f.id === folderId ? { ...f, unseenCount: Math.max(0, (f.unseenCount || 0) + change) } : f
        );
      });
    });

    try {
      await api.post('/mail/bulk/read', { mailIds, isRead });
    } catch (err) {
      console.error('[MailContext] Failed to bulk mark as read:', err);
      refetchMails();
      refetchFolders();
    }
  }, [viewState.selectedMail, allMails, queryClient, refetchFolders, refetchMails, viewState]);

  // 11. Toggle star (оптимистичные обновления)
  const toggleStar = useCallback(async (mailId: string) => {
    const currentMail = viewState.selectedMail?.id === mailId ? viewState.selectedMail : allMails.find(m => m.id === mailId);
    if (!currentMail) return;
    
    const nextStarred = !currentMail.isStarred;

    await queryClient.cancelQueries({ queryKey: ['mail', 'list'], exact: false });
    await queryClient.cancelQueries({ queryKey: ['mail', 'detail', mailId], exact: true });

    if (viewState.selectedMail && viewState.selectedMail.id === mailId) {
      const updatedMail = viewState.selectedMail ? { ...viewState.selectedMail, isStarred: nextStarred } : null;
      viewState.setSelectedMail(updatedMail);
    }

    queryClient.setQueriesData({ queryKey: ['mail', 'list'], exact: false }, (oldData: any) => {
      if (!oldData || !oldData.pages) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          mails: page.mails.map((m: any) => 
            m.id === mailId ? { ...m, isStarred: nextStarred } : m
          )
        }))
      };
    });

    queryClient.setQueriesData({ queryKey: ['mail', 'detail', mailId] }, (oldData: any) => {
      if (!oldData) return oldData;
      return { ...oldData, isStarred: nextStarred };
    });

    try {
      await api.patch(`/mail/${mailId}/star`, { isStarred: nextStarred });
    } catch (err) {
      console.error('[MailContext] Failed to toggle star:', err);
      refetchMails();
    }
  }, [viewState.selectedMail, allMails, queryClient, refetchMails, viewState]);

  // 12. Диалоги подтверждения
  const handleDeleteConfirm = useCallback(async () => {
    const mail = dialogs.deleteConfirmDialog.mail;
    if (!mail) return;
    try {
      await api.delete(`/mail/${mail.id}`);
      toast.success(t('mail.context.toast.mail_deleted'));
      dialogs.setDeleteConfirmDialog({ open: false, mail: null });
      refetchMails();
      refetchFolders();
      if (viewState.selectedMail?.id === mail.id) viewState.setSelectedMail(null);
    } catch (err) {
      toast.error(t('mail.context.toast.mail_delete_error'));
    }
  }, [dialogs, refetchMails, refetchFolders, viewState, t]);

  const handleClearFolderConfirm = useCallback(async () => {
    const folderId = dialogs.clearFolderDialog.folderId;
    if (!folderId) return;
    try {
      if (folderId === activeFolder) {
        queryClient.setQueriesData({ queryKey: ['mail', 'list'], exact: false }, (oldData: any) => {
          if (!oldData || !oldData.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              mails: [],
              total: 0
            }))
          };
        });
      }

      queryClient.setQueriesData({ queryKey: ['mail', 'folders'], exact: false }, (oldData: any) => {
        if (!oldData || !Array.isArray(oldData)) return oldData;
        return oldData.map((f: any) => 
          f.id === folderId ? { ...f, totalCount: 0, unseenCount: 0 } : f
        );
      });

      await api.post(`/mail/folders/${folderId}/clear`, {});
      toast.success(t('mail.context.toast.folder_cleared'));
      dialogs.setClearFolderDialog({ open: false, folderId: null, folderName: null });
      refetchMails();
      refetchFolders();
    } catch (err) {
      toast.error(t('mail.context.toast.folder_clear_error'));
    }
  }, [dialogs, activeFolder, queryClient, refetchMails, refetchFolders, t]);

  const handleCreateEventConfirm = useCallback(async (data: Record<string, unknown>) => {
    try {
      await api.post('/calendar/events', data);
      toast.success(t('mail.context.toast.event_created'));
      dialogs.setCreateEventDialog({ open: false, mail: null });
    } catch (err) {
      toast.error(t('mail.context.toast.event_create_error'));
    }
  }, [dialogs, t]);

  const handleFolderConfirm = useCallback(async () => {
    const { mode, folder } = dialogs.folderDialog;
    const name = dialogs.folderDialogName;
    if (!name.trim()) return;

    try {
      if (mode === 'create') {
        await api.post('/mail/folders', {
          accountId: selectedAccountId,
          folderName: name,
          parentFolderId: folder?.id || null
        });
        toast.success(t('mail.context.toast.folder_created'));
      } else if (folder) {
        await api.put(`/mail/folders/${folder.id}`, {
          folderName: name
        });
        toast.success(t('mail.context.toast.folder_renamed'));
      }
      dialogs.setFolderDialog({ open: false, mode: 'create', folder: null });
      dialogs.setFolderDialogName('');
      refetchFolders();
    } catch (err) {
      toast.error(t('mail.context.toast.folder_op_error'));
    }
  }, [dialogs, selectedAccountId, refetchFolders, t]);

  // 13. Actions hook
  const userId = localStorage.getItem('titan_user_id') || '';
  const { syncStatus } = useWebSocket({ userId, enabled: !minimal });

  const rawActions = useMailActions({
    folders,
    refetchMails,
    refetchFolders,
    selectedMail: viewState.selectedMail,
    setSelectedMail: viewState.setSelectedMail,
    activeFolder,
    setActiveFolder,
    setSearchQuery: searchState.setSearchQuery,
    selectAll: selection.selectAll,
    labels,
    setLabels,
    markAsRead,
    toggleStar,
    setDeleteConfirmDialog: dialogs.setDeleteConfirmDialog,
    setClearFolderDialog: dialogs.setClearFolderDialog,
    setCreateLabelDialog: dialogs.setCreateLabelDialog,
    setCreateEventDialog: dialogs.setCreateEventDialog,
    setCreateFilterDialog: dialogs.setCreateFilterDialog,
    onRenameFolderOpen: (folder) => {
      dialogs.setFolderDialog({ open: true, mode: 'rename', folder });
      dialogs.setFolderDialogName(folder.folderName);
    },
    onCreateSubfolderOpen: (folder) => {
      dialogs.setFolderDialog({ open: true, mode: 'create', folder });
      dialogs.setFolderDialogName('');
    },
    onDeleteFolderConfirm: async (folder) => {
      const confirmed = await showConfirm({
        title: t('mail.context.confirm.delete_folder_title'),
        description: t('mail.context.confirm.delete_folder_desc', { name: folder.folderName }),
        confirmText: t('mail.context.confirm.delete_folder_btn'),
        variant: 'destructive'
      });
      if (confirmed) {
        try {
          await api.delete(`/mail/folders/${folder.id}`);
          toast.success(t('mail.context.toast.folder_deleted'));
          refetchFolders();
        } catch (err) {
          toast.error(t('mail.context.toast.folder_delete_error'));
        }
      }
    },
  });

  const actions = useMemo(() => ({
    ...rawActions,
    handleReply: viewLogic.handleReply,
    handleReplyAll: viewLogic.handleReplyAll,
    handleForward: viewLogic.handleForward,
    handleDeleteConfirm,
    handleClearFolderConfirm,
    handleCreateEventConfirm,
    handleFolderConfirm,
  }), [
    rawActions, viewLogic.handleReply, viewLogic.handleReplyAll, viewLogic.handleForward, 
    handleDeleteConfirm, handleClearFolderConfirm, handleCreateEventConfirm, handleFolderConfirm
  ]);

  // 14. Собираем финальное значение контекста
  const value = useMemo(() => ({
    accounts,
    selectedAccountId,
    setSelectedAccountId,
    accountsLoading,
    refetchAccounts,
    handleAccountChange,

    folders,
    activeFolder,
    setActiveFolder,
    foldersLoading,
    refetchFolders,
    moveFolder,

    mails: allMails,
    filteredMails: viewState.filteredMails,
    selectedMail: viewState.selectedMail,
    setSelectedMail: viewState.setSelectedMail,
    mailsLoading,
    searchQuery: searchState.searchQuery,
    setSearchQuery: searchState.setSearchQuery,
    mailFilter: searchState.mailFilter,
    setMailFilter: searchState.setMailFilter,
    mailSort: searchState.mailSort,
    setMailSort: searchState.setMailSort,
    refetchMails,
    markAsRead,
    toggleStar,
    loadMore: async () => { await fetchNextPage(); },
    hasMore: !!hasNextPage,
    total: totalMailsCount,
    loadingMore: isFetchingNextPage,

    ...selection,
    handleMassRead: () => markMultipleAsRead(selection.selectedMailIds, true),
    handleMassUnread: () => markMultipleAsRead(selection.selectedMailIds, false),
    handleMassMoveToFolder: selection.handleMassMoveToFolder,
    viewMode: viewLogic.viewMode,
    setViewMode: viewLogic.setViewMode,
    composeOpen: viewLogic.composeOpen,
    setComposeOpen: viewLogic.setComposeOpen,
    isComposeMinimized: viewLogic.isComposeMinimized,
    setIsComposeMinimized: viewLogic.setIsComposeMinimized,
    settingsTab,
    setSettingsTab,
    replyToMail: viewLogic.replyToMail,
    forwardMail: viewLogic.forwardMail,
    isReplyAll: viewLogic.isReplyAll,
    syncStatus: syncStatus as unknown as MailSyncStatus | null,
    labels,
    setLabels,
    categories: categoriesState.categories,
    updateCategories: categoriesState.updateCategories,
    dialogs,
    actions
  }), [
    accounts, selectedAccountId, accountsLoading, folders, activeFolder, 
    foldersLoading, allMails, viewState.filteredMails, viewState.selectedMail, mailsLoading, 
    searchState.searchQuery, searchState.mailFilter, searchState.mailSort, totalMailsCount, 
    hasNextPage, isFetchingNextPage, selection, viewLogic, syncStatus, labels, 
    categoriesState, dialogs, actions, handleAccountChange, markAsRead, markMultipleAsRead, 
    toggleStar, refetchAccounts, refetchFolders, refetchMails, fetchNextPage, settingsTab, 
    setActiveFolder, moveFolder, viewState
  ]);

  return <MailContext.Provider value={value}>{children}</MailContext.Provider>;
};

/**
 * Хук для использования контекста почты
 * Обеспечивает обратную совместимость с существующим API
 */
export function useMailContext(): MailContextType {
  const context = useContext(MailContext);
  if (!context) {
    throw new Error('useMailContext must be used within MailProvider');
  }
  return context;
}

export { MailContext };
