// frontend/src/modules/documents/hooks/useDocumentsPage.ts
import { useState, useMemo, useEffect, useCallback } from "react";
import { DragEndEvent } from "@dnd-kit/core";
import { toast } from "sonner";
import { useValidationToast } from "@/components/shared";
import { useTranslation } from "@/lib/i18n";
import { api, getAuthToken } from "@/lib/api";
import { parseRowsPerPage } from "@/lib/utils";
import { useDataTable } from "@/hooks/useDataTable";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useModuleSettings } from "@/modules/settings/hooks/useModuleSettings";
import { FileItem, FolderStats } from "../types";

export function useDocumentsPage() {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const { validate } = useValidationToast();
  const { settings } = useModuleSettings("documents");

  const [files, setFiles] = useState<FileItem[]>([]);
  const [stats, setStats] = useState<FolderStats>({
    used: 0,
    total: 50 * 1024 * 1024 * 1024,
    percentage: 0,
    filesCount: 0,
    categories: {
      documents: 0,
      images: 0,
      others: 0
    }
  });

  const table = useDataTable<FileItem>({
    initialData: [],
    initialColumns: {
      name: true,
      size: true,
      date: true,
    },
    storageKey: "documents-table",
    defaultRowsPerPage: String(settings.display?.itemsPerPage || "25"),
  });
  const [filter, _setFilter] = useState<"all" | "recent" | "starred" | "trash" | "templates">("all");
  const setFilter = useCallback((f: "all" | "recent" | "starred" | "trash" | "templates") => {
    _setFilter(f);
    table.setCurrentPage(1);
  }, [table]);

  const [currentFolderId, _setCurrentFolderId] = useState<string | null>(null);
  const setCurrentFolderId = useCallback((id: string | null) => {
    _setCurrentFolderId(id);
    table.setCurrentPage(1);
  }, [table]);

  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    return (localStorage.getItem("documents-view-mode") as "grid" | "list") || "grid";
  });

  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; name: string }>>([]);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [versionFile, setVersionFile] = useState<FileItem | null>(null);

  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isBulkMoveOpen, setIsBulkMoveOpen] = useState(false);
  const [isBulkRenameOpen, setIsBulkRenameOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [bulkMoveParentId, setBulkMoveParentId] = useState<string>("root");
  const [bulkRenameBaseName, setBulkRenameBaseName] = useState("");

  const refreshFiles = useCallback(async () => {
    try {
      let url = "/documents";
      const params = new URLSearchParams();
      
      if (table.searchQuery) {
        params.append("search", table.searchQuery);
      } else if (filter === "trash") {
        params.append("filter", "trash");
      } else {
        if (currentFolderId) params.append("parentId", currentFolderId);
      }
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const data = await api.get(url);
      setFiles(data);
    } catch (error) {
      console.error("Failed to fetch documents", error);
      toast.error(t("general.toast.error.documents_load"));
    }
  }, [currentFolderId, filter, t, table.searchQuery]);

  const refreshStats = useCallback(async () => {
    try {
      const data = await api.get("/documents/stats");
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  }, []);

  useEffect(() => {
    const loadFiles = async () => {
      await refreshFiles();
    };

    void loadFiles();
  }, [refreshFiles]);

  useEffect(() => {
    const fetchPath = async () => {
      if (filter !== "all" || !currentFolderId) {
        setBreadcrumbs([]);
        return;
      }
      try {
        const data = await api.get(`/documents/path/${currentFolderId}`);
        setBreadcrumbs(data);
      } catch (err) {
        console.error("Failed to fetch folder path", err);
      }
    };
    fetchPath();
  }, [currentFolderId, filter]);

  useEffect(() => {
    const loadStats = async () => {
      await refreshStats();
    };

    void loadStats();
  }, [refreshStats]);

  useEffect(() => {
    localStorage.setItem("documents-view-mode", viewMode);
  }, [viewMode]);

  const currentFolderName = useMemo(() => {
    if (filter === "trash") return t("documents.categories.trash");
    if (filter === "templates") return t("documents.filters.templates");
    if (!currentFolderId) return t("documents.categories.all");
    const folder = files.find((f) => f.id === currentFolderId);
    if (folder) return folder.name;
    // Fallback if folder is not in current list (e.g. on direct navigation)
    const currentBC = breadcrumbs[breadcrumbs.length - 1];
    return currentBC ? currentBC.name : t("documents.categories.all");
  }, [currentFolderId, files, t, filter, breadcrumbs]);

  const filteredAndSortedFiles = useMemo(() => {
    const activeFiles = filter === "trash"
      ? files.filter((file) => Boolean(file.deletedAt))
      : files.filter((file) => !file.deletedAt);

    let result = [...activeFiles];

    if (table.searchQuery) {
      // При поиске мы доверяем результатам с бэкенда (так как там и поиск по контенту)
      result = [...files];
    } else if (filter === "starred") {
      result = result.filter((file) => file.starred);
    } else if (filter === "templates") {
      result = result.filter((file) => file.isTemplate);
    } else if (filter === "recent") {
      result = result.slice(0, 7);
    } else if (filter !== "trash") {
      result = result.filter(
        (file) =>
          file.parentId === currentFolderId ||
          (file.parentId == null && currentFolderId == null)
      );
    }

    result.sort((a, b) => {
      // Всегда папки вверху
      if (a.type === "folder" && b.type !== "folder") return -1;
      if (a.type !== "folder" && b.type === "folder") return 1;

      if (!table.sortConfig) return 0;
      const { key, direction } = table.sortConfig;
      let comparison = 0;

      switch (key) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "size": {
          const sizeA = a.type === 'folder' ? 0 : Number(a.size) || 0;
          const sizeB = b.type === 'folder' ? 0 : Number(b.size) || 0;
          comparison = sizeA - sizeB;
          break;
        }
        default:
          break;
      }

      return direction === "asc" ? comparison : -comparison;
    });

    return result;
  }, [files, currentFolderId, table.searchQuery, filter, table.sortConfig]);

  const folderOptions = useMemo(
    () => files.filter((file) => file.type === "folder" && !file.deletedAt),
    [files]
  );

  const selectedDocuments = useMemo(
    () => files.filter((file) => table.selectedIds.has(file.id)),
    [files, table.selectedIds]
  );

  // Removed set-state-in-effect for pagination, handled by setters & useDataTable

  const perPage = parseRowsPerPage(table.rowsPerPage);
  const paginatedFiles = filteredAndSortedFiles.slice(
    (table.currentPage - 1) * perPage,
    table.currentPage * perPage
  );

  const handleFileClick = (file: FileItem) => {
    if (file.type === "folder") {
      setCurrentFolderId(file.id);
      setFilter("all");
    } else {
      setPreviewFile(file);
    }
  };

  const handleToggleStar = async (id: string) => {
    try {
      const file = files.find((f) => f.id === id);
      if (!file) return;
      const next = !file.starred;
      setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, starred: next } : f)));
      await api.patch(`/documents/${id}/star`, { starred: next });
      toast.success(next ? t("documents.toast.star_success_added") : t("documents.toast.star_success_removed"));
    } catch {
      setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, starred: !f.starred } : f)));
      toast.error(t("documents.toast.star_error"));
    }
  };

  const handleToggleTemplate = async (id: string) => {
    try {
      const file = files.find((f) => f.id === id);
      if (!file) return;
      const next = !file.isTemplate;
      setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, isTemplate: next } : f)));
      await api.patch(`/documents/${id}/template`, { isTemplate: next });
      toast.success(next ? t("documents.toast.template_success_added") : t("documents.toast.template_success_removed"));
    } catch {
      setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, isTemplate: !f.isTemplate } : f)));
      toast.error(t("documents.toast.template_error"));
    }
  };

  const handleCreateFolder = async () => {
    if (!validate([{ name: "folderName", label: t("documents.dialog.folder_name"), value: newFolderName }])) return;
    try {
      const newFolderId = `folder-${Date.now()}`;
      const newFolder: FileItem = {
        id: newFolderId,
        name: newFolderName,
        type: "folder",
        date: new Date().toISOString().split("T")[0],
        parentId: currentFolderId,
        starred: false,
      };
      await api.post("/documents/folder", { name: newFolderName, parentId: currentFolderId });
      setFiles((prev) => [...prev, newFolder]);
      setIsCreateFolderOpen(false);
      setNewFolderName("");
      toast.success(t("documents.toast.folder_create_success"));
    } catch {
      toast.error(t("documents.toast.folder_create_error"));
    }
  };

  const handleUploadFiles = async () => {
    if (!validate([{ name: "files", label: t("documents.dialog.select_files"), value: selectedFiles?.length }])) return;
    let successCount = 0;
    for (let i = 0; i < selectedFiles!.length; i++) {
      const file = selectedFiles![i];
      const formData = new FormData();
      formData.append("file", file);
      if (currentFolderId) formData.append("folderId", currentFolderId);
      try {
        await api.post("/documents/upload", formData);
        successCount++;
      } catch {
        toast.error(t("documents.toast.file_upload_error", { name: file.name }));
      }
    }
    setIsUploadOpen(false);
    setSelectedFiles(null);
    if (successCount > 0) toast.success(t("documents.toast.files_upload_success", { count: successCount }));
    await refreshFiles();
    await refreshStats();
  };

  const handleDeleteFiles = async (ids: string[]) => {
    const ok = await confirm({
      title: t("common.confirm_deletion"),
      description: ids.length > 1
        ? t("common.confirm_bulk_deletion_text", { count: ids.length })
        : t("common.confirm_delete_file", { name: files.find((file) => file.id === ids[0])?.name ?? "" }),
      variant: "destructive",
    });

    if (!ok) return;

    try {
      const endpoint = filter === "trash" ? "/documents/trash/delete" : "/documents/delete";
      await api.post(endpoint, { ids });
      toast.success(t("documents.toast.delete_success", { count: ids.length }));
      table.clearSelection();
      await refreshFiles();
      await refreshStats();
    } catch {
      toast.error(t("documents.toast.delete_error"));
    }
  };

  const handleRestoreFiles = async (ids: string[]) => {
    try {
      await api.post("/documents/restore", { ids });
      toast.success(t("documents.toast.restore_success", { count: ids.length }));
      table.clearSelection();
      await refreshFiles();
      await refreshStats();
    } catch {
      toast.error(t("documents.toast.restore_error"));
    }
  };

  const handleClearTrash = async () => {
    const trashCount = files.filter((file) => file.deletedAt).length;
    if (trashCount === 0) return;

    const ok = await confirm({
      title: t("documents.trash.clear_title"),
      description: t("documents.trash.clear_description", { count: trashCount }),
      variant: "destructive",
    });

    if (!ok) return;

    try {
      await api.post("/documents/trash/clear");
      toast.success(t("documents.trash.clear_success"));
      table.clearSelection();
      await refreshFiles();
      await refreshStats();
    } catch {
      toast.error(t("documents.trash.clear_error"));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || filter === "trash") return;

    const activeId = String(active.id);
    const targetFolderId = String(over.id);

    // Собираем все ID для перемещения (если тянем один из выделенных - тащим всех)
    const movingIds = table.selectedIds.has(activeId)
      ? Array.from(table.selectedIds).map(id => String(id))
      : [activeId];

    // Нельзя переместить в самого себя или в дочерний элемент (упрощенная проверка на фронте)
    if (movingIds.includes(targetFolderId)) {
      toast.error(t("documents.bulk.move_invalid_target"));
      return;
    }

    try {
      // Оптимистичное обновление: меняем parentId у всех перемещаемых элементов
      setFiles((prev) => prev.map((file) => 
        movingIds.includes(file.id) ? { ...file, parentId: targetFolderId === "root" ? null : targetFolderId } : file
      ));

      await api.post("/documents/bulk-move", { 
        ids: movingIds, 
        parentId: targetFolderId === "root" ? null : targetFolderId 
      });

      table.clearSelection();
      toast.success(t("documents.bulk.move_success"));
    } catch {
      toast.error(t("documents.bulk.move_error"));
      await refreshFiles(); // Откат при ошибке
    }
  };

  const handleBulkMoveFiles = async () => {
    const ids = Array.from(table.selectedIds).map((id) => String(id));
    if (ids.length === 0) return;

    const nextParentId = bulkMoveParentId === "root" ? null : bulkMoveParentId;
    if (nextParentId && ids.includes(nextParentId)) {
      toast.error(t("documents.bulk.move_invalid_target"));
      return;
    }

    try {
      await api.post("/documents/bulk-move", { ids, parentId: nextParentId });
      setFiles((prev) => prev.map((file) => (ids.includes(file.id) ? { ...file, parentId: nextParentId } : file)));
      table.clearSelection();
      setIsBulkMoveOpen(false);
      toast.success(t("documents.bulk.move_success"));
    } catch {
      toast.error(t("documents.bulk.move_error"));
    }
  };

  const handleBulkRenameFiles = async () => {
    const ids = Array.from(table.selectedIds).map((id) => String(id));
    if (ids.length === 0) return;

    const baseName = bulkRenameBaseName.trim();
    if (!baseName) {
      toast.error(t("documents.bulk.rename_required"));
      return;
    }

    const selectedInOrder = files.filter((file) => ids.includes(file.id));
    const renameItems = selectedInOrder.map((file, index) => ({
      id: file.id,
      name: selectedInOrder.length > 1 ? `${baseName} ${index + 1}` : baseName,
    }));

    try {
      await api.post("/documents/bulk-rename", { items: renameItems });
      setFiles((prev) => prev.map((file) => {
        const nextName = renameItems.find((item) => item.id === file.id)?.name;
        return nextName ? { ...file, name: nextName } : file;
      }));
      table.clearSelection();
      setIsBulkRenameOpen(false);
      setBulkRenameBaseName("");
      toast.success(t("documents.bulk.rename_success"));
    } catch {
      toast.error(t("documents.bulk.rename_error"));
    }
  };

  const openBulkMoveDialog = () => {
    setBulkMoveParentId("root");
    setIsBulkMoveOpen(true);
  };

  const openBulkRenameDialog = () => {
    const firstSelected = selectedDocuments[0];
    setBulkRenameBaseName(firstSelected?.name ?? "");
    setIsBulkRenameOpen(true);
  };

  const handleDownloadFile = async (file: FileItem) => {
    try {
      const blob = await api.get(`/documents/download/${file.id}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", file.name);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error(t("documents.toast.download_error"));
    }
  };

  const handleShareFile = async (file: FileItem) => {
    try {
      const { shareUrl } = await api.get(`/documents/share/${file.id}`);
      const token = getAuthToken();
      const authenticatedUrl = `${shareUrl}${token ? `?token=${token}` : ""}`;
      
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(authenticatedUrl);
        toast.success(t("documents.toast.share_success"));
      } else {
        window.open(authenticatedUrl, "_blank");
      }
    } catch {
      toast.error(t("documents.toast.share_error"));
    }
  };

  return {
    files,
    stats,
    currentFolderId,
    viewMode,
    setViewMode,
    filter,
    setFilter,
    isCreateFolderOpen,
    setIsCreateFolderOpen,
    isUploadOpen,
    setIsUploadOpen,
    isBulkMoveOpen,
    setIsBulkMoveOpen,
    isBulkRenameOpen,
    setIsBulkRenameOpen,
    newFolderName,
    setNewFolderName,
    selectedFiles,
    setSelectedFiles,
    bulkMoveParentId,
    setBulkMoveParentId,
    bulkRenameBaseName,
    setBulkRenameBaseName,
    folderOptions,
    selectedDocuments,
    currentFolderName,
    breadcrumbs,
    previewFile,
    setPreviewFile,
    versionFile,
    setVersionFile,
    filteredAndSortedFiles,
    paginatedFiles,
    handleFileClick,
    handleDragEnd,
    handleBreadcrumbClick: (id: string | null) => {
      setCurrentFolderId(id);
      setFilter("all");
    },
    handleToggleStar,
    handleToggleTemplate,
    handleNavigateToRoot: () => {
      setCurrentFolderId(null);
      setFilter("all");
    },
    handleCreateFolder,
    handleUploadFiles,
    handleDeleteFiles,
    handleRestoreFiles,
    handleClearTrash,
    handleBulkMoveFiles,
    handleBulkRenameFiles,
    openBulkMoveDialog,
    openBulkRenameDialog,
    handleDownloadFile,
    handleShareFile,
    handleSort: (field: string) => table.handleSort(field as never),
    getSortDirection: (field: string) => table.getSortDirection(field),
    refreshStats,
    table,
  };
}
