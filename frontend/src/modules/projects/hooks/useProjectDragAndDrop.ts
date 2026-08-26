// frontend/src/modules/projects/hooks/useProjectDragAndDrop.ts
import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import { Project } from "../types";

interface UseProjectDragAndDropReturn {
  draggedProjectId: number | null;
  handleDragStart: (e: React.DragEvent, projectId: number) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, stage: Project["stage"]) => void;
}

/**
 * Хук для реализации функционала Drag-and-Drop на канбан-доске проектов
 * 
 * @param projects - Текущий список проектов
 * @param setProjects - Функция для обновления списка проектов в стейте
 * @returns Обработчики событий Drag-and-Drop и ID перетаскиваемого проекта
 */
export function useProjectDragAndDrop(
  projects: Project[],
  setProjects: (updater: (prev: Project[]) => Project[]) => void
): UseProjectDragAndDropReturn {
  const { t } = useTranslation();
  const [draggedProjectId, setDraggedProjectId] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, projectId: number) => {
    setDraggedProjectId(projectId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, stage: Project["stage"]) => {
    e.preventDefault();
    if (!draggedProjectId) return;
    
    const project = projects.find((p) => p.id === draggedProjectId);
    if (project) {
      (async () => {
        try {
          await api.put(`/projects/${project.id}`, { ...project, stage });
          setProjects((prev) =>
            prev.map((p) => (p.id === draggedProjectId ? { ...p, stage } : p))
          );
          toast.success(t("general.toast.success.project_status_changed"));
        } catch {
          toast.error(t("general.toast.error.project_status_update"));
        }
      })();
    }
    setDraggedProjectId(null);
  };

  return {
    draggedProjectId,
    handleDragStart,
    handleDragOver,
    handleDrop,
  };
}
