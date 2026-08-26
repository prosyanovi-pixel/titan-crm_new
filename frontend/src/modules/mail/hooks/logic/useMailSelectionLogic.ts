import { useState, useCallback, useMemo, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import { Mail, ApiMailFolder } from '../../types';

interface UseMailSelectionProps {
  mails: Mail[];
  folders: ApiMailFolder[];
  onMailsUpdated?: () => void;
}

interface UseMailSelectionReturn {
  selectedMailIds: string[];
  toggleSelectMail: (mailId: string) => void;
  selectAll: () => void;
  selectUnread: (folderId?: string, onFolderSwitch?: (folderId: string) => void) => void;
  clearSelection: () => void;
  isAllSelected: boolean;
  showMassActions: boolean;
  handleMassDelete: () => Promise<void>;
  handleMassRead: () => Promise<void>;
  handleMassUnread: () => Promise<void>;
  handleMassArchive: () => Promise<void>;
  handleMassSpam: () => Promise<void>;
  handleMassMoveToFolder: (folderId: string) => Promise<void>;
}

/**
 * Хук для управления массовыми операциями с письмами
 * ~180 строк
 */
export const useMailSelectionLogic = ({
  mails,
  folders,
  onMailsUpdated,
}: UseMailSelectionProps): UseMailSelectionReturn => {
  const { t } = useTranslation();
  const [selectedMailIds, setSelectedMailIds] = useState<string[]>([]);
  const [showMassActions, setShowMassActions] = useState<boolean>(false);
  const [pendingSelection, setPendingSelection] = useState<'unread' | null>(null);

  // Эффект для автоматического выбора после загрузки писем (при смене папки)
  useEffect(() => {
    if (pendingSelection === 'unread' && mails.length > 0) {
      const applyTimer = setTimeout(() => {
        const unreadIds = mails.filter(m => !m.isRead).map(m => m.id);
        if (unreadIds.length > 0) {
          setSelectedMailIds(unreadIds);
          setShowMassActions(true);
        }
        setPendingSelection(null);
      }, 0);

      return () => clearTimeout(applyTimer);
    }
  }, [mails, pendingSelection]);

  // Проверка, все ли письма выбраны
  const isAllSelected = useMemo(() => {
    return mails.length > 0 && selectedMailIds.length === mails.length;
  }, [mails, selectedMailIds]);

  // Переключение выбора письма
  const toggleSelectMail = useCallback((mailId: string) => {
    setSelectedMailIds(prev => {
      const newSelected = prev.includes(mailId)
        ? prev.filter(id => id !== mailId)
        : [...prev, mailId];
      setShowMassActions(newSelected.length > 0);
      return newSelected;
    });
  }, []);

  // Выбрать все письма
  const selectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedMailIds([]);
      setShowMassActions(false);
    } else {
      setSelectedMailIds(mails.map(m => m.id));
      setShowMassActions(true);
    }
  }, [mails, isAllSelected]);

  // Выбрать только непрочитанные
  const selectUnread = useCallback((folderId?: string, onFolderSwitch?: (folderId: string) => void) => {
    // Если передан folderId и он не совпадает с текущим активным (нужно знать активную папку, но мы можем просто вызвать switch)
    if (folderId && onFolderSwitch) {
      onFolderSwitch(folderId);
      setPendingSelection('unread');
      return;
    }

    const unreadIds = mails.filter(m => !m.isRead).map(m => m.id);
    if (unreadIds.length > 0) {
      setSelectedMailIds(unreadIds);
      setShowMassActions(true);
    } else {
      toast.info(t('mail.context.toast.no_unread_in_list'));
    }
  }, [mails, t]);

  // Очистить выделение
  const clearSelection = useCallback(() => {
    setSelectedMailIds([]);
    setShowMassActions(false);
  }, []);

  // Массовое удаление
  const handleMassDelete = useCallback(async () => {
    if (selectedMailIds.length === 0) return;
    
    try {
      await api.post('/mail/bulk/delete', { mailIds: selectedMailIds });
      toast.success(t('mail.context.toast.bulk_delete_success', { count: selectedMailIds.length }));
      clearSelection();
      onMailsUpdated?.();
    } catch (error) {
      console.error('Error mass delete:', error);
      toast.error(t('mail.context.toast.bulk_delete_error'));
    }
  }, [selectedMailIds, clearSelection, onMailsUpdated]);

  // Массовая отметка как прочитанное
  const handleMassRead = useCallback(async () => {
    if (selectedMailIds.length === 0) return;
    
    try {
      await api.post('/mail/bulk/read', { mailIds: selectedMailIds, isRead: true });
      toast.success(t('mail.context.toast.bulk_read_success', { count: selectedMailIds.length }));
      clearSelection();
      onMailsUpdated?.();
    } catch (error) {
      console.error('Error mass read:', error);
      toast.error(t('mail.context.toast.bulk_read_error'));
    }
  }, [selectedMailIds, clearSelection, onMailsUpdated]);

  // Массовая отметка как непрочитанное
  const handleMassUnread = useCallback(async () => {
    if (selectedMailIds.length === 0) return;
    
    try {
      await api.post('/mail/bulk/read', { mailIds: selectedMailIds, isRead: false });
      toast.success(t('mail.context.toast.bulk_unread_success', { count: selectedMailIds.length }));
      clearSelection();
      onMailsUpdated?.();
    } catch (error) {
      console.error('Error mass unread:', error);
      toast.error(t('mail.context.toast.bulk_unread_error'));
    }
  }, [selectedMailIds, clearSelection, onMailsUpdated]);

  const handleMassArchive = useCallback(async () => {
    if (selectedMailIds.length === 0) return;
    
    const archiveFolder = folders.find(f => f.folderType === 'archive')
      || folders.find(f => {
        const name = (f.folderName || '').toLowerCase();
        return name.includes('archive') || name.includes('all mail') || name.includes('архив');
      });
    if (!archiveFolder) {
      toast.error(t('mail.context.toast.archive_folder_not_found'));
      return;
    }
    
    try {
      await api.post('/mail/bulk/move', { mailIds: selectedMailIds, folderId: archiveFolder.id });
      toast.success(t('mail.context.toast.bulk_archive_success', { count: selectedMailIds.length }));
      clearSelection();
      onMailsUpdated?.();
    } catch (error) {
      console.error('Error mass archive:', error);
      toast.error(t('mail.context.toast.bulk_archive_error'));
    }
  }, [selectedMailIds, folders, clearSelection, onMailsUpdated]);

  // Массовое перемещение в спам
  const handleMassSpam = useCallback(async () => {
    if (selectedMailIds.length === 0) return;
    
    const spamFolder = folders.find(f => 
      (f.folderType || '').toLowerCase() === 'spam' || 
      (f.folderName || '').toLowerCase().includes('spam') ||
      (f.folderName || '').toLowerCase().includes('спам')
    );
    if (!spamFolder) {
      toast.error(t('mail.context.toast.spam_folder_not_found'));
      return;
    }
    
    try {
      await api.post('/mail/bulk/move', { mailIds: selectedMailIds, folderId: spamFolder.id });
      toast.success(t('mail.context.toast.bulk_spam_success', { count: selectedMailIds.length }));
      clearSelection();
      onMailsUpdated?.();
    } catch (error) {
      console.error('Error mass spam:', error);
      toast.error(t('mail.context.toast.bulk_spam_error'));
    }
  }, [selectedMailIds, folders, clearSelection, onMailsUpdated]);

  // Массовое перемещение в папку по выбору
  const handleMassMoveToFolder = useCallback(async (folderId: string) => {
    if (selectedMailIds.length === 0) return;
    
    try {
      await api.post('/mail/bulk/move', { mailIds: selectedMailIds, folderId });
      toast.success(t('mail.context.toast.bulk_archive_success', { count: selectedMailIds.length }));
      clearSelection();
      onMailsUpdated?.();
    } catch (error) {
      console.error('Error mass move to folder:', error);
      toast.error(t('mail.context.toast.bulk_archive_error'));
    }
  }, [selectedMailIds, clearSelection, onMailsUpdated, t]);

  return {
    selectedMailIds,
    toggleSelectMail,
    selectAll,
    selectUnread,
    clearSelection,
    isAllSelected,
    showMassActions,
    handleMassDelete,
    handleMassRead,
    handleMassUnread,
    handleMassArchive,
    handleMassSpam,
    handleMassMoveToFolder,
  };
};
