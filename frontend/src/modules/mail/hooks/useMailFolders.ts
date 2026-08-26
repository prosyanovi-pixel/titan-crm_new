import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import { ApiMailFolder } from '../types';

interface UseMailFoldersReturn {
  folders: ApiMailFolder[];
  activeFolder: string;
  setActiveFolder: (folder: string) => void;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Хук для управления почтовыми папками
 */
export const useMailFolders = (selectedAccountId: string): UseMailFoldersReturn => {
  const [folders, setFolders] = useState<ApiMailFolder[]>([]);
  const [activeFolder, setActiveFolder] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { t } = useTranslation();

  const fetchFolders = useCallback(async () => {
    if (!selectedAccountId) {
      setFolders([]);
      setActiveFolder('');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`[MAIL] Fetching folders for account: ${selectedAccountId}`);
      const response = await api.get(`/mail/folders/${selectedAccountId}`);
      console.log(`[MAIL] Got ${response.length} folders from API:`, response);
      
      setFolders(response);
      
      if (response.length > 0) {
        // Сначала ищем Inbox
        const inboxFolder = response.find((f: ApiMailFolder) => f.folderType === 'inbox');
        
        // Если Inbox есть и в ней есть письма, выбираем её
        if (inboxFolder && inboxFolder.totalCount > 0) {
          console.log(`[MAIL] Folder selection logic:`);
          console.log(`  - Inbox found: ${inboxFolder.folderName} with ${inboxFolder.totalCount} mails, id: ${inboxFolder.id}`);
          console.log(`  - Selecting folder: ${inboxFolder.id}`);
          setActiveFolder(inboxFolder.id);
          return;
        }
        
        // Ищем первую папку с письмами (totalCount > 0)
        const folderWithMails = response.find((f: ApiMailFolder) => f.totalCount > 0);
        if (folderWithMails) {
          console.log(`[MAIL] Folder selection logic:`);
          console.log(`  - Inbox empty or not found, selecting first folder with mails: ${folderWithMails.folderName} (${folderWithMails.totalCount} mails)`);
          console.log(`  - Selecting folder: ${folderWithMails.id}`);
          setActiveFolder(folderWithMails.id);
          return;
        }
        
        // Если все папки пустые, выбираем первую системную папку или первую любую
        const systemFolders = response.filter((f: ApiMailFolder) => f.folderType === 'system');
        const folderToSelect = inboxFolder?.id || systemFolders[0]?.id || response[0].id;
        
        console.log(`[MAIL] Folder selection logic:`);
        console.log(`  - Inbox found: ${inboxFolder?.folderName || 'no'}`);
        console.log(`  - System folders: ${systemFolders.length}`);
        console.log(`  - All folders empty, selecting: ${folderToSelect}`);
        console.log(`[MAIL] Setting activeFolder to: ${folderToSelect}`);
        
        setActiveFolder(folderToSelect);
      } else {
        setActiveFolder('');
      }
    } catch (err) {
      console.error('Error fetching folders:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch folders'));
      toast.error(t('mail.errors.load_folders_failed'));
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId, t]);

  // Загрузка папок при изменении selectedAccountId
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFolders();
  }, [fetchFolders]);

  const handleSetActiveFolder = useCallback((folder: string) => {
    setActiveFolder(folder);
  }, []);

  return {
    folders,
    activeFolder,
    setActiveFolder: handleSetActiveFolder,
    loading,
    error,
    refetch: fetchFolders,
  };
};