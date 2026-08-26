// frontend/src/modules/projects/hooks/useProjectFilters.ts
import { useState, useMemo, useEffect } from "react";
import { Project } from "../types";

interface UseProjectFiltersReturn {
  statusFilter: string;
  priorityFilter: string;
  managerFilter: string;
  setStatusFilter: (status: string) => void;
  setPriorityFilter: (priority: string) => void;
  setManagerFilter: (manager: string) => void;
  filteredProjects: Project[];
  resetFilters: () => void;
}

interface UseProjectFiltersOptions {
  projects: Project[];
  searchQuery: string;
}

/**
 * Хук для фильтрации и древовидного отображения списка проектов
 * 
 * @param options - Объект с исходным списком проектов и строкой поиска
 * @returns Состояния фильтров, обработчики их изменения и отфильтрованный список проектов
 */
export function useProjectFilters({
  projects,
  searchQuery,
}: UseProjectFiltersOptions): UseProjectFiltersReturn {
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [managerFilter, setManagerFilter] = useState("all");

  const buildProjectTree = (items: Project[]) => {
    const map = new Map<number, Project>();
    const roots: Project[] = [];
    
    items.forEach((item) => map.set(item.id, { ...item, subProjects: [] }));
    items.forEach((item) => {
      const node = map.get(item.id)!;
      if (item.parentId && map.has(item.parentId)) {
        map.get(item.parentId)!.subProjects?.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  };

  const filteredProjects = useMemo(() => {
    const hasFilters =
      searchQuery ||
      statusFilter !== "all" ||
      priorityFilter !== "all" ||
      managerFilter !== "all";

    if (hasFilters) {
      return projects.filter((p) => {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) &&
          (statusFilter === "all" || p.status === statusFilter) &&
          (priorityFilter === "all" || p.priority === priorityFilter) &&
          (managerFilter === "all" || p.manager === managerFilter)
        );
      });
    }
    return buildProjectTree(projects);
  }, [projects, searchQuery, statusFilter, priorityFilter, managerFilter]);

  const resetFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setManagerFilter("all");
  };

  // Removed auto-reset when projects change to preserve user filters across CRUD operations

  return {
    statusFilter,
    priorityFilter,
    managerFilter,
    setStatusFilter,
    setPriorityFilter,
    setManagerFilter,
    filteredProjects,
    resetFilters,
  };
}
