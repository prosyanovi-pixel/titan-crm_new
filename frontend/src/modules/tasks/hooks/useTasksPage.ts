import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "@/lib/i18n";
import { useSettings } from "@/hooks/use-settings";
import { useDataTable } from "@/hooks/useDataTable";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { usePersistedTab } from "@/hooks/usePersistedTab";
import { useModuleSettings } from "@/modules/settings/hooks/useModuleSettings";
import { api } from "@/lib/api";
import { parseRowsPerPage } from "@/lib/utils";
import { toast } from "sonner";
import { List, LayoutGrid } from "lucide-react";
import { Task } from "../types";
import { useTasksList, useTaskReferences, useTaskUsers, useTaskMutations, TASK_KEYS } from "./useTaskQueries";
import { useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "../api/tasks.api";

interface ReferenceOption {
  id: string;
  name: string;
}

export interface TaskReferences {
  priorities: ReferenceOption[];
  taskStatuses: ReferenceOption[];
}

export interface TaskUser {
  id: string;
  name: string;
}

/**
 * Основной хук для управления страницей задач.
 * Инкапсулирует логику загрузки данных, фильтрации, сортировки, пагинации
 * и обработки пользовательских действий (CRUD, Drag-and-Drop, массовые операции).
 * 
 * @returns Объект с состоянием и методами управления страницей задач
 */
export function useTasksPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();
  const { getStatusesByModule, getPrioritiesByModule, getQuickActionsByModule } =
    useSettings();
  const { settings } = useModuleSettings("tasks");

  const { data: tasksData, isLoading: isTasksLoading } = useTasksList();
  const tasks = useMemo(() => Array.isArray(tasksData) ? tasksData : [], [tasksData]);
  
  const { data: usersData, isLoading: isUsersLoading } = useTaskUsers();
  const users = useMemo(() => usersData || [], [usersData]);
  
  const { data: refsData, isLoading: isRefsLoading } = useTaskReferences();
  const references = useMemo(() => refsData || { priorities: [], taskStatuses: [] }, [refsData]);
  
  const { createMutation, updateMutation, deleteMutation, bulkDeleteMutation } = useTaskMutations();
  const isNewFromUrl = searchParams.get('new') === 'true';
  const [isSheetOpen, setIsSheetOpen] = useState(isNewFromUrl);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = usePersistedTab<string>("tab:tasks", "list");
  
  // Автоматически очищаем URL параметр после монтирования
  useEffect(() => {
    if (isNewFromUrl) {
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
  }, [isNewFromUrl, searchParams, setSearchParams]);
  
  const loading = isTasksLoading || isUsersLoading || isRefsLoading;

  // Filters
  const [statusFilter, _setStatusFilter] = useState("all");
  const [hideArchived, setHideArchived] = useState(true);
  const [priorityFilter, _setPriorityFilter] = useState("all");
  const [assigneeFilter, _setAssigneeFilter] = useState("all");
  const [completedTaskId, setCompletedTaskId] = useState<string | null>(null);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);

  const taskActions = getQuickActionsByModule("tasks");

  useEffect(() => {
    const onRefs = (e: Event) => {
      const detail = (e as CustomEvent<TaskReferences>).detail;
      if (detail) {
        queryClient.setQueryData(TASK_KEYS.references, detail);
      }
    };
    window.addEventListener("references:updated", onRefs as EventListener);
    return () =>
      window.removeEventListener("references:updated", onRefs as EventListener);
  }, [queryClient]);

  const {
    searchQuery,
    setSearchQuery,
    selectedIds,
    setSelectedIds,
    visibleColumns,
    columnOrder,
    sortConfig,
    tabsConfig,
    handleSort,
    toggleSelection,
    toggleAllSelection,
    clearSelection,
    moveTab,
    reorderTab,
    moveColumn,
    reorderColumn,
    toggleTabVisibility,
    toggleColumnVisibility,
    columnWidths,
    setColumnWidth,
    rowsPerPage,
    setRowsPerPage,
    currentPage,
    setCurrentPage,
  } = useDataTable<Task>({
    initialData: [],
    initialColumns: {
      id: true,
      title: true,
      status: true,
      priority: true,
      assignee: true,
      dueDate: true,
    },
    initialTabs: [
      { id: "list", label: "tasks.tabs.list", icon: List, visible: true },
      { id: "board", label: "tasks.tabs.board", icon: LayoutGrid, visible: true },
    ],
    storageKey: "tasks-table",
    defaultRowsPerPage: String(settings.display?.itemsPerPage || "25"),
  });

  const filteredTasks = useMemo(() => {
    const result = tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.identifier &&
          task.identifier.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;
      const matchesAssignee =
        assigneeFilter === "all" || task.assignee === assigneeFilter;
      const matchesArchived = !hideArchived || task.status !== 'archived';
      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && matchesArchived;
    });
    
    if (sortConfig) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key as keyof Task];
        const valB = b[sortConfig.key as keyof Task];
        
        if (valA === undefined || valB === undefined) return 0;
        
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [tasks, searchQuery, sortConfig, statusFilter, priorityFilter, assigneeFilter, hideArchived]);

  // Reset page when filters change
  const setStatusFilter = useCallback((v: string) => {
    _setStatusFilter(v);
    setCurrentPage(1);
  }, [setCurrentPage]);

  const setPriorityFilter = useCallback((v: string) => {
    _setPriorityFilter(v);
    setCurrentPage(1);
  }, [setCurrentPage]);

  const setAssigneeFilter = useCallback((v: string) => {
    _setAssigneeFilter(v);
    setCurrentPage(1);
  }, [setCurrentPage]);

  const updateSearchQuery = useCallback((q: string) => {
    setSearchQuery(q);
    setCurrentPage(1);
  }, [setSearchQuery, setCurrentPage]);

  const perPage = parseRowsPerPage(rowsPerPage);
  const paginatedTasks = useMemo(() => 
    filteredTasks.slice((currentPage - 1) * perPage, currentPage * perPage),
  [filteredTasks, currentPage, perPage]);

  const handleAddTask = () => {
    setSelectedTask(null);
    setIsSheetOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsSheetOpen(true);
  };

  const handleSaveTask = async (task: Task) => {
    if (selectedTask) {
      await updateMutation.mutateAsync({ id: task.id, data: task });
    } else {
      await createMutation.mutateAsync(task);
    }
    setIsSheetOpen(false);
  };

  const handleDeleteTask = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    const ok = await confirm({
      title: t('common.confirm_deletion'),
      description: t("tasks.confirm.delete_selected_tasks", { count: selectedIds.size }),
      variant: 'destructive',
    });

    if (ok) {
      const ids = Array.from(selectedIds);
      await bulkDeleteMutation.mutateAsync(ids as string[]);
      clearSelection();
    }
  };

  const handleBulkStatusChange = async (field: string, value: string) => {
    try {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;

      // Если поле - исполнитель, нам нужно передать ИМЯ, а не ID
      let finalValue = value;
      if (field === 'assignee') {
        const user = users.find(u => String(u.id) === String(value));
        if (user) {
          finalValue = user.name;
        }
      }

      // Используем новый API для массового обновления
      await tasksApi.bulkUpdate(ids as string[], field, finalValue);

      queryClient.invalidateQueries({ queryKey: TASK_KEYS.all });
      toast.success(t('tasks.toast.updated'));
      clearSelection();
      setBulkEditOpen(false);
    } catch (e) {
      console.error(e);
      toast.error(t('tasks.toast.save_error'));
    }
  };

  const handleStatusChange = async (
    taskId: string,
    newStatus: Task["status"],
  ) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      await updateMutation.mutateAsync({ id: taskId, data: { ...task, status: newStatus } });
      if (newStatus === "Done") {
        setCompletedTaskId(taskId);
        setTimeout(() => setCompletedTaskId(null), 1000);
      }
    }
  };

  const handleQuickAction = async (action: string, taskId: string | number) => {
    const task = tasks.find((t) => t.id === String(taskId));
    if (!task) return;
    
    switch (action) {
      case "archive": {
        const ok = await confirm({
          title: t('tasks.archive.title'),
          description: t('tasks.archive.description').replace('{name}', task.title),
        });
        if (ok) {
          handleSaveTask({ ...task, status: 'archived' as Task['status'] });
        }
        break;
      }
      case "create_task":
        setSelectedTask(null);
        setIsSheetOpen(true);
        break;
      case "assign_task":
      case "change_status":
      case "edit":
        setSelectedTask(task);
        setIsSheetOpen(true);
        break;
      case "add_comment":
        toast.info(t("tasks.toast.add_comment") + ": " + task.title);
        break;
      case "attach_file":
        toast.info(t("tasks.toast.attach_file") + ": " + task.title);
        break;
      case "delete": {
        const ok = await confirm({
          title: t('common.confirm_deletion'),
          description: t("tasks.confirm.delete_task", { name: task.title }),
          variant: 'destructive',
        });
        if (ok) {
          handleDeleteTask(task.id);
        }
        break;
      }
      case "create_event":
        navigate(`/calendar?action=create&name=${encodeURIComponent(task.title)}`);
        break;
      default:
        toast.info(
          t("common.actions") + ": " + action,
        );
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, status: Task["status"]) => {
    e.preventDefault();
    if (draggedTaskId) {
      handleStatusChange(draggedTaskId, status);
      setDraggedTaskId(null);
    }
  };

  return {
    t,
    getStatusesByModule,
    getPrioritiesByModule,
    // Data
    tasks,
    users,
    references,
    loading,
    taskActions,
    // Sheet
    isSheetOpen,
    setIsSheetOpen,
    selectedTask,
    // Tab
    activeTab,
    setActiveTab,
    // Filters
    statusFilter,
    setStatusFilter,
    hideArchived,
    setHideArchived,
    priorityFilter,
    setPriorityFilter,
    assigneeFilter,
    setAssigneeFilter,
    rowsPerPage,
    setRowsPerPage,
    completedTaskId,
    // Table
    searchQuery,
    setSearchQuery: updateSearchQuery,
    selectedIds,
    visibleColumns,
    columnOrder,
    sortConfig,
    tabsConfig,
    handleSort,
    toggleSelection,
    toggleAllSelection,
    clearSelection,
    moveTab,
    reorderTab,
    moveColumn,
    reorderColumn,
    toggleTabVisibility,
    toggleColumnVisibility,
    columnWidths,
    setColumnWidth,
    // Derived
    filteredTasks,
    paginatedTasks,
    currentPage,
    setCurrentPage,
    // Handlers
    handleAddTask,
    handleEditTask,
    handleSaveTask,
    handleDeleteTask,
    handleBulkDelete,
    handleBulkStatusChange,
    handleStatusChange,
    handleQuickAction,
    handleDragStart,
    handleDragOver,
    handleDrop,
    // Bulk edit dialog
    bulkEditOpen,
    setBulkEditOpen,
  };
}
