import { useMemo } from "react";
import { useTranslation } from "@/lib/i18n";
import { Project } from "../types/project.types";
import { useProjectsList } from "./useProjectQueries";

/**
 * Возвращаемый тип хука useProjects
 */
interface UseProjectsReturn {
  /** Список проектов */
  projects: Project[];
  /** Флаг загрузки */
  loading: boolean;
  /** Ошибка загрузки */
  error: Error | null;
  /** Функция для принудительного обновления данных */
  refetch: () => void;
}

/**
 * Хук для получения списка проектов
 * 
 * Использует TanStack Query для кэширования и автоматического обновления данных.
 * 
 * @returns Объект с состоянием загрузки, списком проектов и функциями управления
 * 
 * @example
 * ```typescript
 * const { projects, loading, error, refetch } = useProjects();
 * 
 * if (loading) return <Skeleton />;
 * if (error) return <Error message={error.message} />;
 * 
 * return <ProjectList projects={projects} />;
 * ```
 */
export function useProjects(): UseProjectsReturn {
  const { t } = useTranslation();
  const { data: projectsData, isLoading, error, refetch } = useProjectsList();
  const rawProjects = Array.isArray(projectsData) ? projectsData : [];

  // Deduplicate projects by id. If duplicates with different payloads appear,
  // keep the first and warn to help trace the root cause (API/backend or client-side mutation).
  const projects = useMemo(() => {
    const map = new Map<number, Project>();
    rawProjects.forEach((p) => {
      const existing = map.get(p.id);
      if (!existing) {
        map.set(p.id, p);
      } else if (JSON.stringify(existing) !== JSON.stringify(p)) {
         
        console.warn(`Duplicate project id ${p.id} with differing payloads`, { first: existing, second: p });
      }
    });
    return Array.from(map.values());
  }, [rawProjects]);

  return {
    projects,
    loading: isLoading,
    error: error instanceof Error ? error : new Error(String(error)),
    refetch,
  };
}
