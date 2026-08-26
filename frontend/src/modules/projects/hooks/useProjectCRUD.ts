// frontend/src/modules/projects/hooks/useProjectCRUD.ts
import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { Project, CreateProjectRequest, UpdateProjectRequest } from "../types";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useProjectMutations } from "./useProjectQueries";
import { projectsApi } from "../api/projects.api";

/**
 * Возвращаемый тип хука useProjectCRUD
 */
interface UseProjectCRUDReturn {
  selectedProject: Project | null;
  sheetOpen: boolean;
  bulkEditOpen: boolean;
  setSelectedProject: (project: Project | null) => void;
  setSheetOpen: (open: boolean) => void;
  setBulkEditOpen: (open: boolean) => void;
  handleAddProject: () => void;
  handleEditProject: (project: Project) => void;
  handleSaveProject: (project: Project) => Promise<void>;
  handleDeleteProject: (id: number) => Promise<void>;
    handleArchiveProject: (id: number) => Promise<void>;
    handleDuplicateProject: (id: number) => Promise<void>;
  handleBulkDelete: () => Promise<void>;
  handleBulkEdit: (field: string, value: string) => Promise<void>;
  setProjectsState?: React.Dispatch<React.SetStateAction<Project[]>>;
  refetch: () => void;
}

/**
 * Хук для CRUD операций с проектами
 * 
 * Управляет состоянием sheet-панели, массовыми операциями и сохранением проектов.
 * Использует TanStack Query для мутаций.
 * 
 * @param projectsState - Текущее состояние списка проектов
 * @param setProjectsState - Функция обновления состояния
 * @param selectedIds - Выбранные ID проектов для массовых операций
 * @param clearSelection - Функция очистки выделения
 * @param refetch - Функция обновления данных из useProjects
 * 
 * @returns Объект с функциями и состояниями для управления проектами
 * 
 * @example
 * ```typescript
 * const crud = useProjectCRUD(projects, setProjects, selectedIds, clearSelection, refetch);
 * 
 * // Открыть панель для нового проекта
 * crud.handleAddProject();
 * 
 * // Сохранить проект
 * await crud.handleSaveProject(projectData);
 * ```
 */
export function useProjectCRUD(
  projectsState: Project[],
  setProjectsState: React.Dispatch<React.SetStateAction<Project[]>>,
  selectedIds: Set<number>,
  clearSelection: () => void,
  refetch?: () => void
): UseProjectCRUDReturn {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const { createProject, updateProject, deleteProject } = useProjectMutations();
  
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);

  const handleAddProject = () => {
    setSelectedProject(null);
    setSheetOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setSheetOpen(true);
  };

  const handleSaveProject = async (project: Project) => {
    try {
      if (selectedProject) {
        await updateProject({ 
          id: project.id, 
          data: project as UpdateProjectRequest 
        });
      } else {
        await createProject(project as CreateProjectRequest);
      }
      
      // Обновляем локальное состояние и данные сервера
      if (setProjectsState) {
        setProjectsState((prev) => {
          if (selectedProject) {
            return prev.map((p) => (p.id === project.id ? { ...p, ...project } : p));
          }
          return [project, ...prev];
        });
      }
      
      refetch?.();
      setSheetOpen(false);
    } catch (error) {
      // Ошибка уже обработана в мутации
      console.error('Project save error:', error);
    }
  };

    const handleArchiveProject = async (id: number) => {
      const project = projectsState.find(p => p.id === id);
    
      const ok = await confirm({
        title: t('projects.archive_project'),
        description: t('projects.confirm_archive_project', { name: project?.name || '' }),
      });
    
      if (!ok) return;

      try {
        await updateProject({ 
          id, 
          data: { ...project, archived: true } as UpdateProjectRequest 
        });
        if (setProjectsState) {
          setProjectsState((prev) => 
            prev.map((p) => (p.id === id ? { ...p, archived: true } : p))
          );
        }
        refetch?.();
      } catch (error) {
        console.error('Project archive error:', error);
      }
    };

    const handleDuplicateProject = async (id: number) => {
      const project = projectsState.find(p => p.id === id);
      if (!project) return;

      try {
        const duplicatedProject = {
          ...project,
          name: `${project.name} (${t('common.copy')})`,
          id: undefined, // Удаляем ID чтобы создался новый
        };
      
        await createProject(duplicatedProject as CreateProjectRequest);
        refetch?.();
      } catch (error) {
        console.error('Project duplicate error:', error);
      }
    };

  const handleDeleteProject = async (id: number) => {
    const project = projectsState.find(p => p.id === id);
    
    const ok = await confirm({
      title: t('common.confirm_deletion'),
      description: t('projects.confirm_delete_project', { name: project?.name || '' }),
      variant: 'destructive',
    });
    
    if (!ok) return;

    try {
      await deleteProject(id);
      if (setProjectsState) {
        setProjectsState((prev) => prev.filter((p) => p.id !== id));
      }
      refetch?.();
    } catch (error) {
      // Ошибка уже обработана в мутации
      console.error('Project delete error:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    // Проверяем, есть ли среди выбранных проекты, у которых есть под-проекты
    const hasSubProjects = projectsState.some(p => 
      selectedIds.has(p.id) && 
      (
        (p.subProjects && p.subProjects.length > 0) || 
        projectsState.some(sub => sub.parentId === p.id || String(sub.parentId) === String(p.id))
      )
    );
    
    const description = hasSubProjects 
      ? t("projects.confirm_bulk_delete_with_subprojects", { count: selectedIds.size })
      : t("common.confirm_bulk_deletion_text", { count: selectedIds.size });

    const ok = await confirm({
      title: t('common.confirm_deletion'),
      description,
      variant: 'destructive',
    });
    
    if (!ok) return;

    try {
      await projectsApi.bulkDelete(Array.from(selectedIds));
      if (setProjectsState) {
        setProjectsState((prev) => prev.filter((p) => !selectedIds.has(p.id)));
      }
      refetch?.();
      clearSelection();
    } catch (error) {
      console.error('Bulk delete error:', error);
    }
  };

  const handleBulkEdit = async (field: string, value: string) => {
    try {
      const ids = Array.from(selectedIds);
      await projectsApi.bulkUpdate(ids, field, value);
      
      if (setProjectsState) {
        setProjectsState((prev) =>
          prev.map((p) => (selectedIds.has(p.id) ? { ...p, [field]: value } : p))
        );
      }
      refetch?.();
      clearSelection();
    } catch (error) {
      console.error('Bulk edit error:', error);
    }
  };

  return {
    selectedProject,
    sheetOpen,
    bulkEditOpen,
    setSelectedProject,
    setSheetOpen,
    setBulkEditOpen,
    handleAddProject,
    handleEditProject,
    handleSaveProject,
    handleDeleteProject,
      handleArchiveProject,
      handleDuplicateProject,
    handleBulkDelete,
    handleBulkEdit,
    setProjectsState,
    refetch: refetch || (() => {}),
  };
}
