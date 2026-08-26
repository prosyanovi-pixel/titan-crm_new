import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import { FileItem, FolderStats } from "../types/document.types";
import { documentService } from "../api/documentService";

interface UseDocumentsReturn {
  files: FileItem[];
  stats: FolderStats;
  loading: boolean;
  error: Error | null;
  fetchFiles: (parentId?: string | null) => Promise<void>;
  fetchStats: () => Promise<void>;
  createFolder: (name: string, parentId?: string | null) => Promise<FileItem | null>;
  uploadFile: (file: File, parentId?: string | null) => Promise<FileItem | null>;
  deleteFile: (id: string) => Promise<boolean>;
  toggleStar: (id: string, starred: boolean) => Promise<boolean>;
}

export function useDocuments(): UseDocumentsReturn {
  const { t } = useTranslation();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [stats, setStats] = useState<FolderStats>({
    used: 0,
    total: 10 * 1024 * 1024 * 1024,
    percentage: 0,
    filesCount: 0,
    categories: {
      documents: 0,
      images: 0,
      others: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFiles = useCallback(async (parentId?: string | null) => {
    try {
      setLoading(true);
      const data = await documentService.getAll(parentId);
      setFiles(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      toast.error(t("general.toast.error.files_load"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await documentService.getStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  }, []);

  const createFolder = useCallback(
    async (name: string, parentId?: string | null): Promise<FileItem | null> => {
      try {
        const newFolder = await documentService.createFolder({ name, parentId });
        setFiles((prev) => [newFolder, ...prev]);
        toast.success(t("general.toast.success.folder_created"));
        return newFolder;
      } catch (err) {
        toast.error(t("general.toast.error.folder_create"));
        return null;
      }
    },
    [t]
  );

  const uploadFile = useCallback(
    async (file: File, parentId?: string | null): Promise<FileItem | null> => {
      try {
        const uploadedFile = await documentService.uploadFile({ file, parentId });
        setFiles((prev) => [uploadedFile, ...prev]);
        toast.success(t("general.toast.success.file_uploaded"));
        return uploadedFile;
      } catch (err) {
        toast.error(t("general.toast.error.file_upload"));
        return null;
      }
    },
    [t]
  );

  const deleteFile = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await documentService.deleteFile(id);
        setFiles((prev) => prev.filter((f) => f.id !== id));
        toast.success(t("general.toast.success.file_deleted"));
        return true;
      } catch (err) {
        toast.error(t("general.toast.error.file_delete"));
        return false;
      }
    },
    [t]
  );

  const toggleStar = useCallback(
    async (id: string, starred: boolean): Promise<boolean> => {
      try {
        await documentService.toggleStar(id, starred);
        setFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, starred } : f))
        );
        return true;
      } catch (err) {
        toast.error(t("general.toast.error.file_update"));
        return false;
      }
    },
    [t]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFiles();
    fetchStats();
  }, [fetchFiles, fetchStats]);

  return {
    files,
    stats,
    loading,
    error,
    fetchFiles,
    fetchStats,
    createFolder,
    uploadFile,
    deleteFile,
    toggleStar,
  };
}
