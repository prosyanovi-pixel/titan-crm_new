// frontend/src/modules/projects/hooks/useProjectData.ts
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import { Project } from "../types";
import type { ReferenceData } from "./useProjectsPage.types";
import type { Contractor } from "@/modules/contractors/types/contractor.types";

interface UseProjectDataReturn {
  projects: Project[];
  loading: boolean;
  references: ReferenceData;
  contractors: Contractor[];
  refreshProjects: () => Promise<void>;
}

/**
 * Хук для получения и управления основными данными проектов
 * 
 * Загружает:
 * - Список проектов
 * - Справочные данные (статусы, этапы, приоритеты, менеджеры)
 * - Список контрагентов
 * 
 * @returns Объект с данными проектов, справочниками, контрагентами и функцией обновления
 */
export function useProjectData(): UseProjectDataReturn {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [references, setReferences] = useState<ReferenceData>({
    projectStatuses: [],
    projectStages: [],
    priorities: [],
    managers: [],
  });
  const [contractors, setContractors] = useState<Contractor[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [projectsData, refData, contractorsData] = await Promise.all([
        api.get("/projects"),
        api.get("/references"),
        api.get("/contractors?all=true"),
      ]);
      setProjects(projectsData);
      setReferences(refData);
      setContractors(contractorsData);
    } catch {
      toast.error(t("general.toast.error.project_load"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();

    const onRefs = (e: Event) => {
      const detail = (e as CustomEvent<ReferenceData>).detail;
      if (detail) setReferences(detail);
    };
    window.addEventListener("references:updated", onRefs as EventListener);
    return () => window.removeEventListener("references:updated", onRefs as EventListener);
  }, [fetchData]);

  return {
    projects,
    loading,
    references,
    contractors,
    refreshProjects: fetchData,
  };
}
