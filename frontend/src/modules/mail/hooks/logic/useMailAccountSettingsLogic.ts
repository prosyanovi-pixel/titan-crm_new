import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { showConfirm } from "@/components/ui/confirm-dialog";
import { useTranslation } from "@/lib/i18n";

interface FormData {
  email: string;
  display_name: string;
  account_type: "gmail" | "outlook" | "mailru" | "imap";
  imap_host?: string;
  imap_port?: number;
  smtp_host?: string;
  smtp_port?: number;
  login: string;
  password: string;
  use_tls: boolean;
  sync_mode: "light" | "heavy";
  sync_enabled: boolean;
  sync_interval_minutes: number;
  include_subfolders: boolean;
}

interface MailFolder {
  id: string;
  folderName: string;
  folderType: string;
  imapFolderPath?: string;
  isVisible?: boolean;
  isSyncEnabled?: boolean;
}

interface IMAPFolder {
  name: string;
  path: string;
  folderType?: string;
  matchedFolderId?: string;
  isVisible?: boolean;
  isSyncEnabled?: boolean;
}

interface ApiErrorLike {
  message?: string;
  response?: {
    data?: {
      error?: string;
    };
  };
}

interface MailAccountPayload {
  email: string;
  displayName: string;
  accountType: FormData["account_type"];
  imapHost?: string;
  imapPort?: number;
  smtpHost?: string;
  smtpPort?: number;
  login: string;
  useTls: boolean;
  syncMode: FormData["sync_mode"];
  syncEnabled: boolean;
  syncIntervalMinutes: number;
  includeSubfolders: boolean;
  password?: string;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === "object") {
    const apiError = error as ApiErrorLike;
    return apiError.response?.data?.error || apiError.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
};

const defaultFormData: FormData = {
  email: "",
  display_name: "",
  account_type: "gmail",
  imap_host: "imap.gmail.com",
  imap_port: 993,
  smtp_host: "smtp.gmail.com",
  smtp_port: 587,
  login: "",
  password: "",
  use_tls: true,
  sync_mode: "light",
  sync_enabled: true,
  sync_interval_minutes: 10,
  include_subfolders: true,
};

export function useMailAccountSettingsLogic(accountId?: string, onSave?: () => void) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("form");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [hasExistingPassword, setHasExistingPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [connectionTested, setConnectionTested] = useState(false);
  const [folders, setFolders] = useState<MailFolder[]>([]);
  const [imapFolders, setImapFolders] = useState<IMAPFolder[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [clearingFolder, setClearingFolder] = useState<string | null>(null);

  const isEditing = !!accountId;

  const loadFoldersForAccount = useCallback(async (id: string) => {
    try {
      setLoadingFolders(true);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(t('common.timeout') || "Таймаут (45с)")), 45000)
      );

      const foldersPromise = api.get(`/mail/folders/${id}`);
      const response = await Promise.race([foldersPromise, timeoutPromise]);
      const folderList = Array.isArray(response) ? response : (response?.data || []);
      setFolders(folderList);

      const imapPromise = api.post(`/mail/accounts/${id}/imap-folders`, {});
      const imapResponse = await Promise.race([imapPromise, timeoutPromise]);
      const mappedImapFolders: IMAPFolder[] = imapResponse.map((imapFolder: IMAPFolder) => {
        const matchedFolder = folderList.find((f: MailFolder) =>
          f.imapFolderPath === imapFolder.path ||
          f.folderName.toLowerCase() === imapFolder.name.toLowerCase()
        );
        return {
          ...imapFolder,
          folderType: matchedFolder?.folderType || 'custom',
          matchedFolderId: matchedFolder?.id,
          isVisible: matchedFolder ? (matchedFolder.isVisible !== false) : true,
          isSyncEnabled: matchedFolder ? (matchedFolder.isSyncEnabled !== false) : true
        };
      });
      setImapFolders(mappedImapFolders);
    } catch (error: unknown) {
      console.error('Error loading folders:', error);
      toast.error(getErrorMessage(error, t('mail.errors.load_folders_failed') || 'Не удалось загрузить папки'));
    } finally {
      setLoadingFolders(false);
    }
  }, [t]);

  const loadAccount = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/mail/accounts/${id}`);
      const account = response?.data || response;

      if (!account) throw new Error('No account data received');

      setFormData({
        email: account.email || "",
        display_name: account.displayName || account.email || "",
        account_type: account.accountType as FormData["account_type"],
        imap_host: account.imapHost || "imap.gmail.com",
        imap_port: account.imapPort || 993,
        smtp_host: account.smtpHost || "smtp.gmail.com",
        smtp_port: account.smtpPort || 587,
        login: account.login || "",
        password: "",
        use_tls: account.useTls !== false,
        sync_mode: account.syncMode || "light",
        sync_enabled: account.syncEnabled !== false,
        sync_interval_minutes: account.syncIntervalMinutes || 10,
        include_subfolders: account.includeSubfolders !== false,
      });

      setHasExistingPassword(account.hasPassword || false);
      setConnectionTested(true);
      await loadFoldersForAccount(id);
    } catch (error: unknown) {
      console.error("Error loading account:", error);
      toast.error(t('mail.errors.load_failed'));
    } finally {
      setLoading(false);
    }
  }, [loadFoldersForAccount, t]);

  useEffect(() => {
    if (!accountId) return;

    const loadTimer = setTimeout(() => {
      void loadAccount(accountId);
    }, 0);

    return () => clearTimeout(loadTimer);
  }, [accountId, loadAccount]);

  const handleFormDataChange = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleUpdateFolderType = (imapFolder: IMAPFolder, newType: string) => {
    setImapFolders(prev => prev.map(f =>
      f.path === imapFolder.path ? { ...f, folderType: newType } : f
    ));
  };

  const handleToggleFolderSetting = (imapFolder: IMAPFolder, setting: 'isVisible' | 'isSyncEnabled') => {
    setImapFolders(prev => prev.map(f =>
      f.path === imapFolder.path ? { ...f, [setting]: !f[setting] } : f
    ));
  };

  const handleClearFolder = async (folder: IMAPFolder) => {
    if (!folder.matchedFolderId) {
      toast.error(t('mail.errors.folder_not_synced') || "Эту папку нельзя очистить");
      return;
    }

    const confirmed = await showConfirm({
      title: t('mail.settings.clear_folder_title') || 'Очистить папку локально',
      description: t('mail.settings.clear_folder_desc', { name: folder.name }) || `Вы уверены, что хотите удалить все письма в папке "${folder.name}"?`,
      confirmText: t('common.clear') || 'Очистить',
      variant: 'destructive',
    });

    if (!confirmed) return;

    try {
      setClearingFolder(folder.path);
      const response = await api.post(`/mail/folders/${folder.matchedFolderId}/clear-local`, {});
      if (response.success) {
        toast.success(t('mail.settings.folder_cleared', { count: response.localDeleted }) || `Папка "${folder.name}" очищена`);
      } else {
        throw new Error(response.error || "Ошибка при очистке");
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t('mail.errors.clear_failed')));
    } finally {
      setClearingFolder(null);
    }
  };

  const handleSyncFolders = async () => {
    if (!accountId) return;
    try {
      setLoadingFolders(true);
      const response = await api.post(`/mail/accounts/${accountId}/imap-folders`, {});
      const mappedImapFolders: IMAPFolder[] = response.map((imapFolder: IMAPFolder) => {
        const matchedFolder = folders.find((f: MailFolder) =>
          f.imapFolderPath === imapFolder.path || f.folderName.toLowerCase() === imapFolder.name.toLowerCase()
        );
        return { ...imapFolder, folderType: matchedFolder?.folderType || 'custom', matchedFolderId: matchedFolder?.id };
      });
      setImapFolders(mappedImapFolders);
      toast.success(t('mail.settings.folders_loaded', { count: response.length }) || `Загружено ${response.length} папок`);
    } catch (error: unknown) {
      toast.error(t('mail.errors.sync_failed'));
    } finally {
      setLoadingFolders(false);
    }
  };

  const handleTest = async () => {
    try {
      if (!formData.login || !formData.password) {
        toast.error(t('mail.errors.login_password_required'));
        return;
      }
      setTestingId("temp-test");
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(t('common.timeout'))), 30000)
      );
      const testPromise = api.post("/mail/test-connection", {
        login: formData.login, password: formData.password,
        imapHost: formData.imap_host, imapPort: formData.imap_port,
        smtpHost: formData.smtp_host, smtpPort: formData.smtp_port,
        useTls: formData.use_tls,
      });
      const response = await Promise.race([testPromise, timeoutPromise]);
      if (response.results) {
        const { imap, smtp } = response.results;
        if (imap.success && smtp.success) {
          toast.success(t('mail.settings.test_success') || "Все подключения успешны!");
          setConnectionTested(true);
          if (isEditing && accountId) await loadFoldersForAccount(accountId);
        } else {
          toast.warning(t('mail.settings.test_partial_success'));
        }
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t('mail.errors.connection_failed')));
    } finally {
      setTestingId(null);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.email || !formData.login) {
        toast.error(t('mail.errors.fill_required_fields'));
        setActiveTab("form");
        return;
      }
      const payload: MailAccountPayload = {
        email: formData.email, displayName: formData.display_name, accountType: formData.account_type,
        imapHost: formData.imap_host, imapPort: formData.imap_port, smtpHost: formData.smtp_host, smtpPort: formData.smtp_port,
        login: formData.login, useTls: formData.use_tls, syncMode: formData.sync_mode,
        syncEnabled: formData.sync_enabled, syncIntervalMinutes: formData.sync_interval_minutes, includeSubfolders: formData.include_subfolders,
      };
      if (formData.password) payload.password = formData.password;

      setSaving(true);
      if (isEditing) {
        await api.put(`/mail/accounts/${accountId}`, payload);
        if (imapFolders.length > 0) {
          for (const imapFolder of imapFolders) {
            if (imapFolder.matchedFolderId) {
              await api.put(`/mail/folders/${imapFolder.matchedFolderId}`, {
                folderType: imapFolder.folderType, imapFolderPath: imapFolder.path,
                isVisible: imapFolder.isVisible !== false, isSyncEnabled: imapFolder.isSyncEnabled !== false
              });
            } else {
              await api.post('/mail/folders', {
                accountId, folderName: imapFolder.name, folderType: imapFolder.folderType,
                imapFolderPath: imapFolder.path, isVisible: imapFolder.isVisible !== false, isSyncEnabled: imapFolder.isSyncEnabled !== false
              });
            }
          }
        }
        toast.success(t('mail.settings.save_success'));
      } else {
        await api.post("/mail/accounts", payload);
        toast.success(t('mail.settings.add_success'));
      }
      onSave?.();
    } catch (error: unknown) {
      toast.error(t('mail.errors.save_failed'));
    } finally {
      setSaving(false);
    }
  };

  return {
    activeTab, setActiveTab,
    loading, saving, testingId, hasExistingPassword, formData, connectionTested,
    folders, imapFolders, loadingFolders, clearingFolder,
    isEditing,
    handleFormDataChange, handleUpdateFolderType, handleToggleFolderSetting,
    handleClearFolder, handleSyncFolders, handleTest, handleSave
  };
}
