// frontend/src/modules/projects/hooks/useProjectsPage.ts
import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { List, Kanban, GanttChart, Users } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useSettings } from "@/hooks/use-settings";
import { useDataTable } from "@/hooks/useDataTable";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Contractor } from "@/modules/contractors";
import { Project, ProjectStatus, ProjectPriority, ProjectTask, OpenProjectTaskSheetRequest } from "../types";
import { useProjectCRUD } from "./useProjectCRUD";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useProjects } from "./useProjects";
import { ReferenceData } from "./useProjectsPage.types";
import { useModuleSettings } from "@/modules/settings/hooks/useModuleSettings";
import { useNavigate } from "react-router-dom";

/**
 * Состояние панели задач проекта
 */
interface TaskSheetState {
  open: boolean;
  task: ProjectTask | null;
  initialProject?: string;
  onSaved?: (task: ProjectTask) => void;
  onDeleted?: (id: string) => void;
  references?: ReferenceData;
}

/**
 * Хук для управления страницей проектов
 * 
 * Объединяет всю логику страницы проектов:
 * - Загрузка данных (проекты, контрагенты)
 * - Фильтрация и сортировка
 * - CRUD операции
 * - Drag-and-drop для канбан-доски
 * - Управление задачами проекта
 * 
 * @returns Объект со всеми функциями и состояниями для страницы проектов
 * 
 * @example
 * ```typescript
 * const page = useProjectsPage();
 * 
 * // Использовать в компоненте
 * return <ProjectList projects={page.paginatedProjects} onEdit={page.handleEditProject} />;
 * ```
 */
export function useProjectsPage() {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const { getStatusesByModule, getQuickActionsByModule, getPrioritiesByModule, getProjectStages, taxRegimes } = useSettings();
  const { settings } = useModuleSettings("projects");
  const navigate = useNavigate();

  // Используем новый хук с TanStack Query
  const { projects, loading, error, refetch } = useProjects();
  // Загрузка контрагентов
  const { data: contractors = [] } = useQuery({
    queryKey: ['projects-contractors-all'],
    queryFn: async () => {
      const res = await api.get("/contractors?all=true");
      return res as Contractor[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [managerFilter, setManagerFilter] = useState<string>("all");
  const [projectTypeFilter, setProjectTypeFilter] = useState<string>("all");
  const [hideArchived, setHideArchived] = useState<boolean>(true);
  const [isTreeView, setIsTreeView] = useState<boolean>(true);
  const [activeTabState, setActiveTabState] = useState<string>('list');

  const [taskSheetState, setTaskSheetState] = useState<TaskSheetState>({
    open: false,
    task: null,
  });

  const table = useDataTable<Project>({
    initialData: projects,
    initialColumns: {
      name: true,
      client: true,
      stage: true,
      manager: true,
      status: true,
      priority: true,
      tags: true,
      budget: true,
    },
    initialTabs: [
      { id: "list", label: "projects.tabs.list", icon: List, visible: true },
      { id: "board", label: "projects.tabs.board", icon: Kanban, visible: settings.features?.enableTasks !== false },
      { id: "gantt", label: "projects.tabs.gantt", icon: GanttChart, visible: settings.features?.enableTimeline !== false },
      { id: "resources", label: "projects.tabs.resources", icon: Users, visible: settings.features?.enableTeamMembers !== false },
    ],
    storageKey: "projects-table-v3",
    defaultRowsPerPage: String(settings.display?.itemsPerPage || "25"),
  });

  const {
    searchQuery,
    sortConfig,
    rowsPerPage,
    currentPage,
    selectedIds,
    clearSelection,
    setCurrentPage,
  } = table;

  // Создаём локальное состояние для синхронизации с useProjectCRUD
  const [localProjects, setLocalProjects] = useState<Project[]>([]);
  const crud = useProjectCRUD(localProjects, setLocalProjects, selectedIds as Set<number>, clearSelection, refetch);

  const references = useMemo(() => ({
    projectStatuses: getStatusesByModule("projects"),
    projectStages: getProjectStages(),
    priorities: getPrioritiesByModule("projects"),
    managers: Array.from(new Set(projects.map((p) => p.manager).filter(Boolean))).map(m => ({ id: m, name: m })),
    taxRegimes,
  }), [getProjectStages, getPrioritiesByModule, getStatusesByModule, projects, taxRegimes, t]);

  const projectActions = getQuickActionsByModule("projects");

  const sortedProjects = useMemo(() => {
    let filtered = [...projects];
    
    // Применяем фильтры
    if (hideArchived) filtered = filtered.filter(p => p.status !== 'archived');
    if (statusFilter !== "all") filtered = filtered.filter((p) => p.status === statusFilter);
    if (priorityFilter !== "all") filtered = filtered.filter((p) => p.priority === priorityFilter);
    if (managerFilter !== "all") filtered = filtered.filter((p) => p.manager === managerFilter);
    if (projectTypeFilter !== "all") filtered = filtered.filter((p) => p.projectType === projectTypeFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => 
        p.name.toLowerCase().includes(q) || 
        (p.client && p.client.toLowerCase().includes(q))
      );
    }

    if (!isTreeView) return filtered;

    // Строим дерево из отфильтрованных проектов
    // Если родитель отфильтрован, проект становится корневым в текущем представлении
    const buildTree = (items: Project[]): Project[] => {
      const map = new Map<number, Project & { subProjects: Project[] }>();
      const roots: Project[] = [];

      items.forEach(p => {
        map.set(p.id, { ...p, subProjects: [] });
      });

      items.forEach(p => {
        const item = map.get(p.id)!;
        if (p.parentId && map.has(p.parentId)) {
          map.get(p.parentId)!.subProjects.push(item);
        } else {
          roots.push(item);
        }
      });

      return roots;
    };

    return buildTree(filtered);
  }, [projects, statusFilter, priorityFilter, managerFilter, projectTypeFilter, searchQuery, hideArchived, isTreeView]);

  const paginatedProjects = useMemo(() => {
    const perPage = parseInt(rowsPerPage) || 25;
    if (rowsPerPage === "all") return sortedProjects;
    return sortedProjects.slice((currentPage - 1) * perPage, currentPage * perPage);
  }, [sortedProjects, currentPage, rowsPerPage]);

  const totalBudget = useMemo(() => 
    projects.reduce((acc, p) => acc + (Number(p.budget) || 0), 0), 
  [projects]);

  const handleQuickAction = async (action: string, project: Project) => {
    switch (action) {
      case "edit": crud.handleEditProject(project); break;
      case "delete": {
        const ok = await confirm({
          title: t('common.confirm_deletion'),
          description: t("common.confirm_delete_project").replace("{name}", project.name),
          variant: 'destructive',
        });
        if (ok) await crud.handleDeleteProject(project.id);
        break;
      }
      case "archive": {
        const ok = await confirm({
          title: t('projects.archive.title'),
          description: t("projects.archive.description").replace("{name}", project.name),
        });
        if (ok) await crud.handleSaveProject({ ...project, status: 'archived' });
        break;
      }
      case "create_task":
        setTaskSheetState({ open: true, task: null, initialProject: project.name });
        break;
      case "create_event":
        navigate(`/calendar?action=create&projectId=${project.id}&name=${encodeURIComponent(project.name)}`);
        break;
      default:
        toast.info(t("general.toast.info.action_completed").replace("{0}", action));
    }
  };

  const openProjectTaskSheet = useCallback((request: OpenProjectTaskSheetRequest) => {
    setTaskSheetState({
      open: true,
      task: request.task,
      initialProject: request.initialProject,
      onSaved: request.onSaved,
      onDeleted: request.onDeleted,
      references: request.references as ReferenceData
    });
  }, []);

  // Слушаем события открытия панели задач (из этапов или других мест)
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ task?: ProjectTask; initialProjectId?: number; initialStageId?: number }>;
      const { task: incomingTask, initialProjectId, initialStageId } = customEvent.detail || {};
      
      // Находим проект по ID если он передан
      const project = projects.find(p => p.id === initialProjectId);
      
      // Если это новая задача и передан stageId, создаем объект с этим ID
      const taskToOpen = incomingTask 
        ? { ...incomingTask, ...(initialStageId ? { stageId: initialStageId } : {}) }
        : (initialStageId ? { stageId: initialStageId } : null);

      openProjectTaskSheet({
        task: taskToOpen as ProjectTask,
        initialProject: project?.name || '',
        onSaved: () => refetch(), // Обновляем данные после сохранения
        onDeleted: () => refetch(),
      });
    };

    window.addEventListener('open-task-sheet', handler);
    return () => window.removeEventListener('open-task-sheet', handler);
  }, [projects, openProjectTaskSheet, refetch]);

  const handleStageChange = async (projectId: number, newStage: string) => {
    if (projectId) {
      const project = projects.find((p) => p.id === projectId);
      if (project && project.stage !== newStage) {
        await crud.handleSaveProject({ ...project, stage: newStage });
      }
    }
  };

  const handleSaveTask = async (task: Omit<ProjectTask, 'id'> & { id?: string }) => {
    try {
      const isNew = !task.id;
      const res = isNew 
        ? await api.post("/tasks", task)
        : await api.put(`/tasks/${task.id}`, task);

      toast.success(isNew ? t("general.toast.success.task_created") : t("general.toast.success.task_updated"));
      
      // Call callback from state if exists
      if (taskSheetState.onSaved) {
        taskSheetState.onSaved(res);
      }
      
      setTaskSheetState({ open: false, task: null });
    } catch (err) {
      console.error('Task save error:', err);
      toast.error(t("general.toast.error.task_save"));
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await api.delete(`/tasks/${id}`);
      toast.success(t("general.toast.success.task_deleted"));
      
      if (taskSheetState.onDeleted) {
        taskSheetState.onDeleted(id);
      }
    } catch {
      toast.error(t("general.toast.error.task_delete"));
    }
  };

  const handleTabChange = (v: string) => setActiveTabState(v);

  return {
    t, projects, activeTab: activeTabState, setActiveTab: handleTabChange,
    isTreeView, setIsTreeView,
    references, contractors, statusFilter, setStatusFilter,
    priorityFilter, setPriorityFilter, managerFilter, setManagerFilter,
    projectTypeFilter, setProjectTypeFilter,
    hideArchived, setHideArchived,
    projectActions, table,
    sheetOpen: crud.sheetOpen, setSheetOpen: crud.setSheetOpen,
    selectedProject: crud.selectedProject,
    bulkEditOpen: crud.bulkEditOpen, setBulkEditOpen: crud.setBulkEditOpen,
    taskSheetState,
    setTaskSheetState: (value?: TaskSheetState | boolean | ((prev: TaskSheetState) => TaskSheetState)) => {
      if (!value) {
        setTaskSheetState({ open: false, task: null });
        return;
      }
      if (typeof value === 'function') {
        setTaskSheetState(value as (prev: TaskSheetState) => TaskSheetState);
        return;
      }
      setTaskSheetState(value as TaskSheetState);
    },
    sortedProjects, paginatedProjects, totalBudget,
    handleSaveTask, handleDeleteTask,
    handleAddProject: crud.handleAddProject,
    handleEditProject: crud.handleEditProject,
    handleSaveProject: crud.handleSaveProject,
    handleDeleteProject: crud.handleDeleteProject,
      handleArchiveProject: crud.handleArchiveProject,
      handleDuplicateProject: crud.handleDuplicateProject,
    handleBulkDelete: crud.handleBulkDelete,
    handleBulkEdit: crud.handleBulkEdit,
    handleQuickAction, handleStageChange,
    openProjectTaskSheet, isLoading: loading,
  };
}
