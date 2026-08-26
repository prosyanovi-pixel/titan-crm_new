// frontend/src/modules/projects/hooks/useProjectTasks.ts
import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import { Project, ProjectTask, OpenProjectTaskSheetRequest } from "../types";
import type { ReferenceData } from "./useProjectsPage.types";

interface TaskSheetState {
  open: boolean;
  task: ProjectTask | null;
  initialProject?: string;
  references?: ReferenceData;
  onSaved?: (task: ProjectTask) => void;
  onDeleted?: (id: string) => void;
}

const initialTaskSheetState: TaskSheetState = { open: false, task: null };

interface UseProjectTasksReturn {
  taskSheetState: TaskSheetState;
  openQuickTaskSheet: (projectName: string, refs?: ReferenceData) => void;
  openProjectTaskSheet: (request: OpenProjectTaskSheetRequest) => void;
  closeTaskSheet: () => void;
  handleSaveTask: (task: ProjectTask) => Promise<void>;
  handleDeleteTask: (id: string) => Promise<void>;
}

/**
 * Хук для управления задачами проекта через модальную панель (TaskSheet)
 * 
 * Позволяет:
 * - Открывать панель для создания новой или редактирования существующей задачи
 * - Сохранять и удалять задачи через API
 * - Передавать коллбеки onSaved/onDeleted для обновления данных в интерфейсе
 * 
 * @returns Состояние панели задач и функции для управления ими
 */
export function useProjectTasks(): UseProjectTasksReturn {
  const { t } = useTranslation();
  const [taskSheetState, setTaskSheetState] = useState<TaskSheetState>(initialTaskSheetState);

  const openQuickTaskSheet = (projectName: string, refs?: ReferenceData) =>
    setTaskSheetState({ open: true, task: null, initialProject: projectName, references: refs });

  const openProjectTaskSheet = (request: OpenProjectTaskSheetRequest) =>
    setTaskSheetState({
      open: true,
      task: request.task as ProjectTask | null,
      initialProject: request.initialProject,
      references: request.references as ReferenceData | undefined,
      onSaved: request.onSaved,
      onDeleted: request.onDeleted,
    });

  const closeTaskSheet = () => setTaskSheetState(initialTaskSheetState);

  const handleSaveTask = async (task: ProjectTask) => {
    try {
      if (taskSheetState.task) {
        const updated = await api.put(`/tasks/${task.id}`, task);
        taskSheetState.onSaved?.(updated as ProjectTask);
      } else {
        const taskWithProject = {
          ...task,
          project: taskSheetState.initialProject || task.project || "General",
        };
        const created = await api.post("/tasks", taskWithProject);
        taskSheetState.onSaved?.(created as ProjectTask);
      }
      toast.success(t("general.toast.success.task_created"));
      closeTaskSheet();
    } catch {
      toast.error(t("general.toast.error.task_save"));
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await api.delete(`/tasks/${id}`);
      taskSheetState.onDeleted?.(id);
      toast.success(t("general.toast.success.task_deleted"));
      closeTaskSheet();
    } catch {
      toast.error(t("general.toast.error.task_delete"));
    }
  };

  return {
    taskSheetState,
    openQuickTaskSheet,
    openProjectTaskSheet,
    closeTaskSheet,
    handleSaveTask,
    handleDeleteTask,
  };
}
