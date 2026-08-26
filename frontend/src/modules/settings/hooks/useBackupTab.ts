// frontend/src/modules/settings/hooks/useBackupTab.ts
import { useQuery } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

export interface Backup {
  name: string;
  file: string;
  size: number;
  created: string;
  type?: "standard" | "full";
  includeNodeModules?: boolean;
}

export interface BackupStatus {
  inProgress: boolean;
  type?: "create" | "restore";
  message?: string;
}

export function useBackupTab() {
  const { t } = useTranslation();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [status, setStatus] = useState<BackupStatus>({ inProgress: false });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [backupName, setBackupName] = useState("");
  const [backupType, setBackupType] = useState<"standard" | "full">("standard");

  const { isLoading: loading, refetch } = useQuery({
    queryKey: ['settings-backups-list'],
    queryFn: async () => {
      try {
        const data = await api.get("/backup/list");
        setBackups(data);
        return data;
      } catch {
        toast.error(t("settings.backup.error_loading"));
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const loadBackups = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ru });
    } catch {
      return dateString;
    }
  };

  const handleCreateBackup = async () => {
    setStatus({ inProgress: true, type: "create", message: t("settings.backup.creating") });
    setCreateDialogOpen(false);
    try {
      const endpoint = backupType === "full" ? "/backup/full" : "/backup/create";
      const result = await api.post(endpoint, { name: backupName || undefined });
      if (result.success) {
        toast.success(t("settings.backup.success_created"), {
          description: `${t("settings.backup.size")}: ${formatSize(result.backup.size)}`,
        });
        await loadBackups();
      } else {
        toast.error(t("settings.backup.error_create"));
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(t("settings.backup.error_create"), {
        description: err?.message || t("settings.backup.error_connection"),
      });
    } finally {
      setStatus({ inProgress: false });
      setBackupName("");
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;
    setStatus({
      inProgress: true,
      type: "restore",
      message: `${t("settings.backup.restoring")} ${selectedBackup.name}...`,
    });
    setRestoreDialogOpen(false);
    try {
      const result = await api.post("/backup/restore", { file: selectedBackup.file });
      if (result.success) {
        toast.success(t("settings.backup.success_restored"), {
          description: t("settings.backup.restart_recommended"),
          action: { label: t("settings.backup.reload_page"), onClick: () => window.location.reload() },
        });
      } else {
        toast.error(t("settings.backup.error_restore"));
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(t("settings.backup.error_restore"), {
        description: err?.message || t("settings.backup.error_connection"),
      });
    } finally {
      setStatus({ inProgress: false });
      setSelectedBackup(null);
    }
  };

  const handleDeleteBackup = async () => {
    if (!selectedBackup) return;
    try {
      await api.delete(`/backup/${selectedBackup.file}`);
      toast.success(t("settings.backup.success_deleted"));
      await loadBackups();
    } catch {
      toast.error(t("settings.backup.error_delete"));
    } finally {
      setDeleteDialogOpen(false);
      setSelectedBackup(null);
    }
  };

  const handleDownloadBackup = (backup: Backup) => {
    // Используем порт 5001 для бэкенда по умолчанию
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";
    const apiBase = API_URL.replace(/\/+$/g, "");
    const downloadUrl = apiBase.endsWith("/api")
      ? `${apiBase}/backup/download/${backup.file}`
      : `${apiBase}/api/backup/download/${backup.file}`;
    window.open(downloadUrl, "_blank");
    toast.success(t("settings.backup.success_download"));
  };

  return {
    backups, loading, status,
    createDialogOpen, setCreateDialogOpen,
    restoreDialogOpen, setRestoreDialogOpen,
    deleteDialogOpen, setDeleteDialogOpen,
    selectedBackup, setSelectedBackup,
    backupName, setBackupName,
    backupType, setBackupType,
    loadBackups, formatSize, formatDate,
    handleCreateBackup, handleRestoreBackup, handleDeleteBackup, handleDownloadBackup,
  };
}
