// frontend/src/modules/projects/hooks/useProjectFilters.ts
import { useState, useMemo } from "react";
import { Project } from "../types";

interface UseProjectFiltersReturn {
  statusFilter: string;
  priorityFilter: string;
  managerFilter: string;
  projectTypeFilter: string;
  setStatusFilter: (status: string) => void;
  setPriorityFilter: (priority: string) => void;
  setManagerFilter: (manager: string) => void;
  setProjectTypeFilter: (type: string) => void;
  filteredProjects: Project[];
  resetFilters: () => void;
}

interface UseProjectFiltersOptions {
  projects: Project[];
  searchQuery: string;
}

export function useProjectFilters({
  projects,
  searchQuery,
}: UseProjectFiltersOptions): UseProjectFiltersReturn {
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [managerFilter, setManagerFilter] = useState("all");
  const [projectTypeFilter, setProjectTypeFilter] = useState("all");

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
      managerFilter !== "all" ||
      projectTypeFilter !== "all";

    if (hasFilters) {
      return projects.filter((p) => {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) &&
          (statusFilter === "all" || p.status === statusFilter) &&
          (priorityFilter === "all" || p.priority === priorityFilter) &&
          (managerFilter === "all" || p.manager === managerFilter) &&
          (projectTypeFilter === "all" || p.projectType === projectTypeFilter)
        );
      });
    }
    return buildProjectTree(projects);
  }, [projects, searchQuery, statusFilter, priorityFilter, managerFilter, projectTypeFilter]);

  const resetFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setManagerFilter("all");
    setProjectTypeFilter("all");
  };

  return {
    statusFilter,
    priorityFilter,
    managerFilter,
    projectTypeFilter,
    setStatusFilter,
    setPriorityFilter,
    setManagerFilter,
    setProjectTypeFilter,
    filteredProjects,
    resetFilters,
  };
}
