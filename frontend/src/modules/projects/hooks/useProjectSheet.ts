// frontend/src/modules/projects/hooks/useProjectSheet.ts
import { useState, useRef, useEffect } from "react";
import { Project, ProjectTask, OpenProjectTaskSheetRequest } from "../types";
import { Contractor } from "@/modules/contractors";
import { ReferenceData } from "./useProjectsPage.types";
import { api } from "@/lib/api";

/**
 * Опции для хука useProjectSheet
 */
interface UseProjectSheetOptions {
  project: Project | null;
  open: boolean;
  references?: ReferenceData;
  onOpenTaskSheet?: (request: OpenProjectTaskSheetRequest) => void;
}

/**
 * Возвращаемый тип хука useProjectSheet
 */
interface UseProjectSheetReturn {
  formData: Partial<Project>;
  projectTasks: ProjectTask[];
  contractorSheetOpen: boolean;
  pendingContractorName: string;
  handleInputChange: (field: keyof Project, value: unknown) => void;
  handleCreateContractor: (name: string) => Promise<string>;
  handleContractorSaved: (contractor: Contractor) => void;
  handleContractorSheetOpenChange: (open: boolean) => void;
  handleCreateTask: () => void;
  handleEditTask: (task: ProjectTask) => void;
  setProjectTasks: React.Dispatch<React.SetStateAction<ProjectTask[]>>;
}

/**
 * Хук для управления панелью проекта (ProjectSheet)
 * 
 * Управляет:
 * - Формой данных проекта
 * - Задачами проекта
 * - Быстрым созданием контрагента
 * - Открытием панели задач
 * 
 * @param options - Опции хука (проект, состояние открытия, ссылки, колбэки)
 * @returns Объект с данными формы, задачами и обработчиками событий
 * 
 * @example
 * ```typescript
 * const { formData, handleInputChange, handleCreateTask } = useProjectSheet({
 *   project: selectedProject,
 *   open: sheetOpen,
 *   references,
 *   onOpenTaskSheet: openTaskSheet
 * });
 * ```
 */
export function useProjectSheet({
  project,
  open,
  references,
  onOpenTaskSheet,
}: UseProjectSheetOptions): UseProjectSheetReturn {
  const [formData, setFormData] = useState<Partial<Project>>({});
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  
  // Contractor quick-create (Promise-resolver pattern)
  const contractorResolverRef = useRef<{ resolve: (name: string) => void; reject: () => void } | null>(null);
  const [contractorSheetOpen, setContractorSheetOpen] = useState(false);
  const [pendingContractorName, setPendingContractorName] = useState('');

  const handleCreateContractor = (name: string): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      contractorResolverRef.current = { resolve, reject };
      setPendingContractorName(name);
      setContractorSheetOpen(true);
    });
  };

  const handleContractorSaved = (contractor: Contractor) => {
    contractorResolverRef.current?.resolve(contractor.name);
    contractorResolverRef.current = null;
    setContractorSheetOpen(false);
  };

  const handleContractorSheetOpenChange = (o: boolean) => {
    if (!o) {
      contractorResolverRef.current?.reject();
      contractorResolverRef.current = null;
    }
    setContractorSheetOpen(o);
  };

  // Load tasks for this project
  useEffect(() => {
    if (project) {
      // Ensure manager field is populated from project data
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        ...project,
        manager: project.manager || localStorage.getItem('titan_user_name') || '',
        status: project.status || 'pending',
        stage: project.stage || 'todo',
      });
      api.get('/tasks')
        .then(allTasks => {
          const relevant = allTasks.filter((t: ProjectTask) => t.project === project.name);
           
          setProjectTasks(relevant);
        })
        .catch(console.error);
    } else {
      // Get current user for default manager
      const currentUserName = localStorage.getItem('titan_user_name') || '';
      const today = new Date();
      const formattedDate = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;

       
      setFormData({
        name: "",
        client: "",
        manager: currentUserName,
        status: "pending",
        stage: "todo",
        priority: "Medium",
        budget: 0,
        budgetUsed: 0,
        deadline: formattedDate,
        tasksCount: 0,
        completedTasks: 0,
        subProjects: [],
        parentId: null
      });
       
      setProjectTasks([]);
    }
  }, [project, open]);

  // Synchronize tasks via events
  useEffect(() => {
    const handleCreated = (e: Event) => {
      const task = (e as CustomEvent<ProjectTask>).detail;
      if (task && task.project === formData.name) {
        setProjectTasks(prev => [task, ...prev]);
      }
    };
    const handleUpdated = (e: Event) => {
      const task = (e as CustomEvent<ProjectTask>).detail;
      if (task && task.project === formData.name) {
        setProjectTasks(prev => prev.map(t => t.id === task.id ? task : t));
      }
    };

    window.addEventListener('task:created', handleCreated);
    window.addEventListener('task:updated', handleUpdated);
    return () => {
      window.removeEventListener('task:created', handleCreated);
      window.removeEventListener('task:updated', handleUpdated);
    };
  }, [formData.name]);

  const handleInputChange = (field: keyof Project, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateTask = () => {
    onOpenTaskSheet?.({
      task: null,
      initialProject: formData.name || project?.name || "General",
      references,
      onSaved: (savedTask) => {
        setProjectTasks(prev => [savedTask, ...prev]);
      },
    });
  };

  const handleEditTask = (task: ProjectTask) => {
    onOpenTaskSheet?.({
      task,
      initialProject: formData.name || project?.name || "General",
      references,
      onSaved: (savedTask) => {
        setProjectTasks(prev => prev.map(t => t.id === savedTask.id ? savedTask : t));
      },
      onDeleted: (id) => {
        setProjectTasks(prev => prev.filter(t => t.id !== id));
      },
    });
  };

  return {
    formData,
    projectTasks,
    contractorSheetOpen,
    pendingContractorName,
    handleInputChange,
    handleCreateContractor,
    handleContractorSaved,
    handleContractorSheetOpenChange,
    handleCreateTask,
    handleEditTask,
    setProjectTasks,
  };
}
