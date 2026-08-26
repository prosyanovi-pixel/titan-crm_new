import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Folder, RefreshCw, Save, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface MailFolder {
  id: string;
  folderName: string;
  folderType: string;
  imapFolderPath?: string;
}

interface IMAPFolder {
  name: string;
  path: string;
  folderType?: string;
  matchedFolderId?: string;
}

interface MailFolderMappingTabProps {
  accountId: string;
}

export function MailFolderMappingTab({ accountId }: MailFolderMappingTabProps) {
  const { t } = useTranslation();
  const [folders, setFolders] = useState<MailFolder[]>([]);
  const [imapFolders, setImapFolders] = useState<IMAPFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cleaningDuplicates, setCleaningDuplicates] = useState(false);

  const systemFolderTypes = new Set(['system', 'inbox', 'sent', 'drafts', 'archive', 'spam', 'trash']);

  const getCanonicalSystemKey = (folder: MailFolder) => {
    const type = (folder.folderType || '').toLowerCase();
    if (type && type !== 'system') return type;

    const name = (folder.folderName || '').toLowerCase();
    if (name === 'inbox' || name.includes('вход')) return 'inbox';
    if (name === 'sent mail' || name.includes('sent') || name.includes('отправ')) return 'sent';
    if (name === 'drafts' || name.includes('чернов')) return 'drafts';
    if (name === 'archive' || name.includes('архив') || name.includes('all mail')) return 'archive';
    if (name === 'spam' || name.includes('спам')) return 'spam';
    if (name === 'trash' || name.includes('корзин')) return 'trash';

    return `${type}:${name}`;
  };

  const dedupedSystemFolders = useMemo(() => {
    const map = new Map<string, MailFolder>();
    const systemFolders = folders.filter((f) => systemFolderTypes.has((f.folderType || '').toLowerCase()));

    for (const folder of systemFolders) {
      const key = getCanonicalSystemKey(folder);
      const existing = map.get(key);

      if (!existing || ((existing.folderType || '').toLowerCase() === 'system' && (folder.folderType || '').toLowerCase() !== 'system')) {
        map.set(key, folder);
      }
    }

    return Array.from(map.values());
  }, [folders]);

  const dedupedCustomFolders = useMemo(
    () => folders.filter((f) => !systemFolderTypes.has((f.folderType || '').toLowerCase())),
    [folders]
  );

  // Системные типы папок
  const systemTypes = [
    { value: 'inbox', label: `📥 ${t('profile.mail.folder_types.inbox')}` },
    { value: 'sent', label: `📤 ${t('profile.mail.folder_types.sent')}` },
    { value: 'drafts', label: `📝 ${t('profile.mail.folder_types.drafts')}` },
    { value: 'archive', label: `📁 ${t('profile.mail.folder_types.archive')}` },
    { value: 'spam', label: `⚠️ ${t('profile.mail.folder_types.spam')}` },
    { value: 'trash', label: `🗑️ ${t('profile.mail.folder_types.trash')}` },
    { value: 'custom', label: `📁 ${t('profile.mail.folder_types.custom')}` },
  ];

  useEffect(() => { if (accountId) {
      // eslint-disable-next-line react-hooks/immutability
      fetchFolders();
    }
  }, [accountId]);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/mail/folders/${accountId}`);
      const folderList = Array.isArray(response) ? response : (response?.data || []);
      setFolders(folderList);
      await handleSyncFolders(folderList);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast.error(t('profile.mail.folder_mapping.toast.load_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSyncFolders = async (currentFolders?: MailFolder[]) => {
    try {
      setSyncing(true);

      // Получаем IMAP папки с сервера
      const response = await api.post(`/mail/accounts/${accountId}/imap-folders`, {});

      const foldersForMatch = Array.isArray(currentFolders)
        ? currentFolders
        : Array.isArray(folders)
          ? folders
          : [];
      
      // Сопоставляем IMAP папки с существующими
      const mappedImapFolders: IMAPFolder[] = response.map((imapFolder: IMAPFolder) => {
        // Ищем соответствующую папку в БД
        const matchedFolder = foldersForMatch.find(f => 
          f.imapFolderPath === imapFolder.path || 
          f.folderName.toLowerCase() === imapFolder.name.toLowerCase()
        );
        
        return {
          ...imapFolder,
          folderType: matchedFolder?.folderType || 'custom',
          matchedFolderId: matchedFolder?.id
        };
      });
      
      setImapFolders(mappedImapFolders);
      toast.success(t('profile.mail.folder_mapping.toast.sync_success', { count: response.length }));
    } catch (error: any) {
      console.error('Error syncing folders:', error);
      const errorMsg = error.response?.data?.details || error.message || t('profile.mail.folder_mapping.toast.sync_error');
      toast.error(t('profile.mail.folder_mapping.toast.error_prefix', { message: errorMsg }));
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateFolderType = async (imapFolder: IMAPFolder, newType: string) => {
    setImapFolders(prev => prev.map(f => 
      f.path === imapFolder.path ? { ...f, folderType: newType } : f
    ));
  };

  const handleSaveMapping = async () => {
    try {
      setSaving(true);
      
      let savedCount = 0;
      
      // Сохраняем сопоставления для каждой IMAP папки
      for (const imapFolder of imapFolders) {
        if (imapFolder.matchedFolderId) {
          // Обновляем существующую папку
          await api.put(`/mail/folders/${imapFolder.matchedFolderId}`, {
            folderType: imapFolder.folderType,
            imapFolderPath: imapFolder.path
          });
          savedCount++;
        } else {
          // Создаём новую папку
          await api.post('/mail/folders', {
            accountId,
            folderName: imapFolder.name,
            folderType: imapFolder.folderType,
            imapFolderPath: imapFolder.path
          });
          savedCount++;
        }
      }
      
      toast.success(t('profile.mail.folder_mapping.toast.save_success', { count: savedCount }));
      fetchFolders(); // Обновляем список
      setImapFolders([]); // Очищаем IMAP список
    } catch (error) {
      console.error('Error saving mapping:', error);
      toast.error(t('profile.mail.folder_mapping.toast.save_error'));
    } finally {
      setSaving(false);
    }
  };

  const handleCleanupDuplicates = async () => {
    try {
      setCleaningDuplicates(true);
      const response = await api.post(`/mail/folders/${accountId}/cleanup-duplicates`, {});
      const removed = response?.removedDuplicates || 0;
      const moved = response?.movedMails || 0;
      toast.success(t('profile.mail.folder_mapping.toast.cleanup_success', { removed, moved }));
      await fetchFolders();
    } catch (error) {
      console.error('Error cleaning duplicate folders:', error);
      toast.error(t('profile.mail.folder_mapping.toast.cleanup_error'));
    } finally {
      setCleaningDuplicates(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Folder className="w-5 h-5" />
              {t('profile.mail.folder_mapping.title')}
            </CardTitle>
            <CardDescription>
              {t('profile.mail.folder_mapping.description')}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => handleSyncFolders()} 
              size="sm" 
              className="gap-2"
              disabled={syncing}
            >
              <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
              {t('profile.mail.folder_mapping.action.load_imap')}
            </Button>
            <Button
              onClick={handleCleanupDuplicates}
              size="sm"
              variant="outline"
              className="gap-2"
              disabled={cleaningDuplicates || loading}
            >
              <RefreshCw className={cn("w-4 h-4", cleaningDuplicates && "animate-spin")} />
              {t('profile.mail.folder_mapping.action.remove_duplicates')}
            </Button>
            {imapFolders.length > 0 && (
              <Button 
                onClick={handleSaveMapping} 
                size="sm" 
                className="gap-2"
                disabled={saving}
                variant="default"
              >
                <Save className="w-4 h-4" />
                {t('profile.mail.folder_mapping.action.save')}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">{t('profile.mail.folder_mapping.loading')}</div>
          </div>
        ) : imapFolders.length > 0 ? (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t('profile.mail.folder_mapping.setup_instruction')}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              {imapFolders.map((imapFolder) => (
                <div
                  key={imapFolder.path}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Folder className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{imapFolder.name}</p>
                      <p className="text-xs text-muted-foreground">
                        IMAP: {imapFolder.path}
                      </p>
                    </div>
                  </div>
                  <Select
                    value={imapFolder.folderType}
                    onValueChange={(value) => handleUpdateFolderType(imapFolder, value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {systemTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        ) : folders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{t('profile.mail.folder_mapping.empty')}</p>
            <Button 
              variant="link" 
              onClick={() => handleSyncFolders()}
              className="mt-2"
            >
              {t('profile.mail.folder_mapping.action.load_from_imap')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t('profile.mail.folder_mapping.db_loaded_instruction')}
              </AlertDescription>
            </Alert>

            {/* Системные папки */}
            <div>
              <h3 className="text-sm font-semibold mb-3">{t('profile.mail.folder_mapping.system_folders')}</h3>
              <div className="space-y-2">
                {dedupedSystemFolders.map((folder) => (
                    <div
                      key={folder.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Folder className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{folder.folderName}</p>
                          {folder.imapFolderPath && (
                            <p className="text-xs text-muted-foreground">
                              IMAP: {folder.imapFolderPath}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {systemTypes.find(t => t.value === folder.folderType)?.label || folder.folderType}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>

            {/* Пользовательские папки */}
            {dedupedCustomFolders.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3">{t('profile.mail.folder_mapping.custom_folders')}</h3>
                <div className="space-y-2">
                  {dedupedCustomFolders.map((folder) => (
                      <div
                        key={folder.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Folder className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{folder.folderName}</p>
                            {folder.imapFolderPath && (
                              <p className="text-xs text-muted-foreground">
                                IMAP: {folder.imapFolderPath}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary">{t('profile.mail.folder_mapping.custom')}</Badge>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
