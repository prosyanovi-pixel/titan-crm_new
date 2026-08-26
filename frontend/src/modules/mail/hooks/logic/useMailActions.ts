import { useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import { Mail as MailType, ApiMailFolder } from "../../types";

interface UseMailActionsProps {
  folders: ApiMailFolder[];
  refetchMails: () => Promise<void>;
  refetchFolders: () => Promise<void>;
  selectedMail: MailType | null;
  setSelectedMail: (mail: MailType | null) => void;
  activeFolder: string;
  setActiveFolder: (folderId: string) => void;
  setSearchQuery: (query: string) => void;
  selectAll: () => void;
  markAsRead: (mailId: string, isRead: boolean) => Promise<void>;
  toggleStar: (mailId: string) => Promise<void>;
  setDeleteConfirmDialog: (state: { open: boolean; mail: MailType | null }) => void;
  setClearFolderDialog: (state: { open: boolean; folderId: string | null; folderName: string | null }) => void;
  setCreateLabelDialog: (state: { open: boolean; mail: MailType | null }) => void;
  setCreateEventDialog: (state: { open: boolean; mail: MailType | null }) => void;
  setCreateFilterDialog: (state: { open: boolean; mail: MailType | null; filterName: string; fromEmail: string }) => void;
  labels: string[];
  setLabels: (labels: string[]) => void;
  onRenameFolderOpen?: (folder: ApiMailFolder) => void;
  onCreateSubfolderOpen?: (parentFolder: ApiMailFolder) => void;
  onDeleteFolderConfirm?: (folder: ApiMailFolder) => void;
}

export function useMailActions({
  folders,
  refetchMails,
  refetchFolders,
  selectedMail,
  setSelectedMail,
  activeFolder,
  setActiveFolder,
  setSearchQuery,
  selectAll,
  markAsRead,
  toggleStar,
  setDeleteConfirmDialog,
  setClearFolderDialog,
  setCreateLabelDialog,
  setCreateEventDialog,
  setCreateFilterDialog,
  labels,
  setLabels,
  onRenameFolderOpen,
  onCreateSubfolderOpen,
  onDeleteFolderConfirm,
}: UseMailActionsProps) {
  const { t } = useTranslation();

  const handleMarkAllRead = useCallback(async (folderId: string) => {
    try {
      await api.patch(`/mail/folders/${folderId}/read-all`, {});
      toast.success(t('mail.context.toast.mark_all_read_success'));
      refetchMails();
      refetchFolders();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || t('mail.context.toast.mark_all_read_error'));
    }
  }, [refetchMails, refetchFolders, t]);

  const handleClearFolder = useCallback(async (folder: ApiMailFolder) => {
    setClearFolderDialog({
      open: true,
      folderId: folder.id,
      folderName: folder.folderName
    });
  }, [setClearFolderDialog]);

  const handleRenameFolder = useCallback((folder: ApiMailFolder) => {
    if (onRenameFolderOpen) {
      onRenameFolderOpen(folder);
    }
  }, [onRenameFolderOpen]);

  const handleCreateSubfolder = useCallback((folder: ApiMailFolder) => {
    if (onCreateSubfolderOpen) {
      onCreateSubfolderOpen(folder);
    }
  }, [onCreateSubfolderOpen]);

  const handleDeleteFolder = useCallback((folder: ApiMailFolder) => {
    if (onDeleteFolderConfirm) {
      onDeleteFolderConfirm(folder);
    }
  }, [onDeleteFolderConfirm]);

  const handleArchive = useCallback(async (mail: MailType) => {
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
      await api.patch(`/mail/${mail.id}/move`, { folderId: archiveFolder.id });
      toast.success(t('mail.context.toast.archive_success'));
      refetchMails();
      refetchFolders();
    } catch (error) {
      console.error('Error archiving mail:', error);
      toast.error(t('mail.context.toast.archive_error'));
    }
  }, [folders, refetchMails, refetchFolders, t]);

  const handleSpam = useCallback(async (mail: MailType) => {
    const spamFolder = folders.find(f => f.folderType === 'spam')
      || folders.find(f => (f.folderName || '').toLowerCase().includes('spam') || (f.folderName || '').toLowerCase().includes('спам'));
    if (!spamFolder) {
      toast.error(t('mail.context.toast.spam_folder_not_found'));
      return;
    }

    try {
      await api.patch(`/mail/${mail.id}/move`, { folderId: spamFolder.id });
      toast.success(t('mail.context.toast.spam_success'));
      refetchMails();
      refetchFolders();
    } catch (error) {
      console.error('Error moving to spam:', error);
      toast.error(t('mail.context.toast.spam_error'));
    }
  }, [folders, refetchMails, refetchFolders, t]);

  const handleDelete = useCallback(async (mail: MailType) => {
    const trashFolder = folders.find(f => f.folderType === 'trash')
      || folders.find(f => (f.folderName || '').toLowerCase().includes('trash') || (f.folderName || '').toLowerCase().includes('корзин'));

    const isInTrash = mail.folder === trashFolder?.id || mail.folder === 'trash' || (mail.folder || '').toLowerCase().includes('trash') || (mail.folder || '').toLowerCase().includes('корзин');
    const spamFolder = folders.find(f => f.folderType === 'spam') || folders.find(f => (f.folderName || '').toLowerCase().includes('spam'));
    const isInSpam = mail.folder === spamFolder?.id || mail.folder === 'spam' || (mail.folder || '').toLowerCase().includes('spam') || (mail.folder || '').toLowerCase().includes('спам');

    if (isInTrash) {
      setDeleteConfirmDialog({ open: true, mail });
    } else if (trashFolder) {
      try {
        await api.patch(`/mail/${mail.id}/move`, { folderId: trashFolder.id });
        toast.success(t('mail.context.toast.trash_success'));
        refetchMails();
        refetchFolders();
      } catch (error) {
        console.error('Error moving to trash:', error);
        toast.error(t('mail.context.toast.trash_error'));
      }
    }
  }, [folders, refetchMails, refetchFolders, setDeleteConfirmDialog, t]);

  const handleContextMenuAction = useCallback(async (action: string, mail: MailType, data?: unknown) => {
    switch (action) {
      case 'open':
        setSelectedMail(mail);
        break;
      case 'archive':
        handleArchive(mail);
        break;
      case 'delete':
        handleDelete(mail);
        break;
      case 'spam':
        handleSpam(mail);
        break;
      case 'openNewTab':
        window.open(`/mail?id=${mail.id}`, '_blank');
        break;
      case 'selectAll':
        selectAll();
        break;
      case 'markRead':
        await markAsRead(mail.id, !mail.isRead);
        break;
      case 'star':
      case 'toggleStar':
        await toggleStar(mail.id);
        break;
      case 'moveToFolder': {
        const folderId = typeof data === 'string' ? data : (data as { folderId?: string } | undefined)?.folderId;
        if (folderId) {
          await api.patch(`/mail/${mail.id}/move`, { folderId });
          toast.success(t('mail.context.toast.move_success'));
          refetchMails();
          refetchFolders();
        }
        break;
      }
      case 'createEvent':
        setCreateEventDialog({ open: true, mail });
        break;
      case 'createFilter': {
        const fromEmail = typeof mail.sender === 'object' ? mail.sender?.email : (typeof mail.sender === 'string' ? mail.sender : '');
        setCreateFilterDialog({
          open: true,
          mail,
          filterName: t('mail.filters.default_name', { email: fromEmail || '' }),
          fromEmail: fromEmail || ''
        });
        break;
      }
      case 'findSimilar': {
        const senderEmail = typeof mail.sender === 'object' ? mail.sender?.email : (typeof mail.sender === 'string' ? mail.sender : '');
        if (senderEmail) {
          setSearchQuery(senderEmail);
          toast.success(t('mail.context.toast.search_by_sender', { email: senderEmail }));
        }
        break;
      }
      case 'print':
        window.print();
        break;
      case 'forwardAsAttachment':
        // Будет реализовано через открытие compose с вложением-письмом
        toast.info(t('mail.context.toast.forward_in_development'));
        break;
    }
  }, [setSelectedMail, handleArchive, handleDelete, handleSpam, markAsRead, toggleStar, refetchMails, refetchFolders, setCreateEventDialog, setCreateFilterDialog, setSearchQuery, selectAll, t]);

  return {
    handleArchive,
    handleDelete,
    handleSpam,
    handleContextMenuAction,
    handleMarkAllRead,
    handleRenameFolder,
    handleCreateSubfolder,
    handleDeleteFolder,
    handleClearFolder,
  };
}
