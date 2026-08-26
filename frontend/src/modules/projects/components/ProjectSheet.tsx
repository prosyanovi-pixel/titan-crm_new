import { useState, useEffect, useRef, useCallback } from "react";
import { ResizableSheet, SheetTabSettings } from "@/components/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { CheckCircle2, Trash2, FolderKanban, Info, ListChecks, DollarSign, Wallet, Calculator, CheckSquare, Activity, MessageSquare } from "lucide-react";
import { OpenProjectTaskSheetRequest, Project, ProjectTask } from "../types";
import { ProjectGeneralTab } from "./tabs/ProjectGeneralTab";
import { ProjectTasksTab } from "./tabs/ProjectTasksTab";
import { ProjectStagesTab } from "./tabs/ProjectStagesTab";
import { ProjectRevenuesTab } from "./tabs/ProjectRevenuesTab";
import { ProjectExpensesTab } from "./tabs/ProjectExpensesTab";
import { ProjectFinanceTab } from "./tabs/ProjectFinanceTab";
import { ProjectContractsTab } from "./tabs/ProjectContractsTab";
import { ProjectDashboardTab } from "./tabs/ProjectDashboardTab";
import ActivityList from '@/components/shared/ActivityList';
import { CommentsSection } from '@/components/shared/CommentsSection';
import { Contractor, ContractorSheet } from "@/modules/contractors";
import { api } from "@/lib/api";
import { useSheetTabs } from "@/hooks/useSheetTabs";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useSheetWidth } from "@/hooks/useSheetWidth";
import type { ReferenceData } from "../hooks/useProjectsPage.types";
import { useProjectSheet } from "../hooks/useProjectSheet";
import { useModuleSettings } from "@/modules/settings/hooks/useModuleSettings";
import { validateForm, createProjectSchema } from "../validations/project.validations";
import { ZodIssue } from 'zod';

/**
 * Свойства компонента ProjectSheet
 */
interface ProjectSheetProps {
  /** Текущий проект для редактирования (null для создания нового) */
  project: Project | null;
  /** Все проекты для выбора родительского */
  allProjects?: Project[];
  /** Состояние открытия панели */
  open: boolean;
  /** Обработчик изменения состояния открытия */
  onOpenChange: (open: boolean) => void;
  /** Обработчик сохранения проекта */
  onSave: (project: Project) => void;
  /** Обработчик удаления проекта (опционально) */
  onDelete?: (id: number) => void;
  /** Список контрагентов */
  contractors: Contractor[];
  /** Обработчик добавления контрагента (опционально) */
  onAddContractor?: () => void;
  /** Справочные данные (статусы, приоритеты и т.д.) */
  references?: ReferenceData;
  /** Обработчик открытия панели задач */
  onOpenTaskSheet?: (request: OpenProjectTaskSheetRequest) => void;
}

/**
 * ProjectSheet — панель для создания и редактирования проекта
 * 
 * Компонент предоставляет интерфейс для:
 * - Создания нового проекта
 * - Редактирования существующего проекта
 * - Управления задачами проекта
 * - Просмотра этапов, доходов и расходов
 * 
 * Включает в себя:
 * - Основную форму с полями проекта
 * - Вкладки для переключения между разделами
 * - Быстрое создание контрагента
 * - Управление задачами проекта
 * 
 * @param props - Свойства компонента
 * @returns React-компонент панели проекта
 * 
 * @example
 * ```tsx
 * <ProjectSheet
 *   project={selectedProject}
 *   open={sheetOpen}
 *   onOpenChange={setSheetOpen}
 *   onSave={handleSave}
 *   contractors={contractors}
 * />
 * ```
 */
export function ProjectSheet({
  project,
  allProjects = [],
  open,
  onOpenChange,
  onSave,
  onDelete,
  contractors,
  references,
  onOpenTaskSheet,
}: ProjectSheetProps) {
  const { t } = useTranslation();
  const { confirm, alert } = useConfirm();

  // Use custom hook for project sheet logic
  const {
    formData,
    projectTasks,
    setProjectTasks,
    contractorSheetOpen,
    pendingContractorName,
    handleInputChange,
    handleCreateContractor,
    handleContractorSaved,
    handleContractorSheetOpenChange,
    handleCreateTask,
    handleEditTask,
  } = useProjectSheet({
    project,
    open,
    references,
    onOpenTaskSheet,
  });

  const { settings } = useModuleSettings("projects");

  // Tab Management with Persistence
  const { tabs, toggleTab, moveTab } = useSheetTabs([
    { id: "dashboard", label: "Дашборд", icon: Activity, visible: true },
    { id: "general", label: "sheet.tabs.overview", icon: Info, visible: true },
    { id: "comments", label: "components.comments.title", icon: MessageSquare, visible: true },
    { id: "stages", label: "sheet.tabs.stages", icon: ListChecks, visible: settings.features?.enableMilestones !== false },
    { id: "contracts", label: "sheet.tabs.contracts", icon: FolderKanban, visible: true },
    { id: "revenues", label: "sheet.tabs.revenues", icon: DollarSign, visible: settings.features?.enableBudgeting !== false },
    { id: "expenses", label: "sheet.tabs.expenses", icon: Wallet, visible: settings.features?.enableBudgeting !== false },
    { id: "finance", label: "sheet.tabs.finance", icon: Calculator, visible: settings.features?.enableBudgeting !== false },
    { id: "activity", label: "sheet.tabs.activity", icon: Activity, visible: settings.features?.showActivityLog !== false },
  ], "project-sheet");

  const [activeTab, setActiveTab] = useState("dashboard");

  // Ensure active tab is visible
  useEffect(() => {
    const currentTab = tabs.find(t => t.id === activeTab);
    if (currentTab && !currentTab.visible) {
      const firstVisible = tabs.find(t => t.visible);
      if (firstVisible) {
        setTimeout(() => setActiveTab(firstVisible.id), 0);
      }
    }
  }, [tabs, activeTab]);

  const handleSave = async () => {
    // Валидация с помощью Zod
    const validationResult = validateForm(createProjectSchema(t), {
      name: formData.name ?? '',
      client: formData.client ?? '',
      manager: formData.manager ?? '',
      status: formData.status || 'pending',
      priority: formData.priority || 'Medium',
      budget: Number(formData.budget || 0),
      deadline: formData.deadline ?? '',
      description: formData.description ?? '',
      parentId: formData.parentId ? Number(formData.parentId) : null,
      taxRegimeId: formData.taxRegimeId ?? null,
    });

    if (!validationResult.success) {
      // Показываем первую ошибку
      const firstError = (validationResult as { success: false; errors: ZodIssue[] }).errors[0];
      await alert({
        title: t('common.error'),
        description: firstError.message,
      });
      return;
    }

    const newProject: Project = {
      id: project?.id || 0,
      parentId: formData.parentId || null,
      name: (formData.name ?? '').trim(),
      client: (formData.client ?? '').trim(),
      manager: formData.manager ?? '',
      status: formData.status || "pending",
      stage: formData.stage || "todo",
      priority: formData.priority || "Medium",
      budget: formData.budget || 0,
      budgetUsed: formData.budgetUsed || 0,
      deadline: formData.deadline ?? '',
      taxRegimeId: formData.taxRegimeId ?? null,
      tasksCount: formData.tasksCount || 0,
      completedTasks: formData.completedTasks || 0,
      subProjects: formData.subProjects || [],
      tags: formData.tags || []
    };
    onSave(newProject);
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!project || !onDelete) return;

    // Проверяем наличие активных задач
    const activeTasks = projectTasks.filter(t => t.status !== 'Done');
    let warningMessage = t('projects.confirm_delete');

    if (activeTasks.length > 0) {
      warningMessage = t('projects.confirm_delete_with_tasks', { count: activeTasks.length });
    }

    if (await confirm({
      title: t('common.confirm_deletion'),
      description: warningMessage,
      variant: 'destructive'
    })) {
      onDelete(project.id);
      onOpenChange(false);
    }
  };

  return (
    <>
      <ResizableSheet
        open={open}
        onOpenChange={onOpenChange}
        moduleKey="projects"
        defaultWidth="lg"
        title={project ? t('projects.edit_project') : t('projects.new_project')}
        description={project ? project.name : t('projects.new_project_description')}
        onSave={handleSave}
        onDelete={project && onDelete ? handleDelete : undefined}
        showDeleteButton={!!project && !!onDelete}
      >
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between gap-2 mt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-w-0">
              <TabsList className="w-full justify-start overflow-x-auto hide-scrollbar">
                {tabs.map(tab => {
                  if (!tab.visible) return null;
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                      <Icon className="w-3.5 h-3.5" />
                      {t(tab.label)}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>

            <SheetTabSettings
              tabs={tabs}
              onToggle={toggleTab}
              onMove={moveTab}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "dashboard" && (
            <ProjectDashboardTab 
              project={project || formData as Project}
              onNavigate={(tab) => setActiveTab(tab)}
              onUpdateField={handleInputChange}
            />
          )}

          {activeTab === "general" && (
            <ProjectGeneralTab
              formData={formData}
              handleChange={handleInputChange}
              contractors={contractors}
              onCreateContractor={handleCreateContractor}
              references={references}
              allProjects={allProjects}
              currentProjectId={project?.id}
            />
          )}

          {activeTab === "comments" && (
            project ? (
              <div className="pt-4">
                <CommentsSection entityType="project" entityId={String(project.id)} />
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                {t('components.comments.save_to_add_comments')}
              </div>
            )
          )}

          {activeTab === "stages" && project && (
            <ProjectStagesTab
              projectId={project.id}
              projectName={project.name}
              onOpenTaskSheet={onOpenTaskSheet}
            />
          )}

          {activeTab === "revenues" && project && (
            <ProjectRevenuesTab projectId={project.id} />
          )}

          {activeTab === "expenses" && project && (
            <ProjectExpensesTab projectId={project.id} />
          )}
          {activeTab === "finance" && project && (
            <ProjectFinanceTab projectId={project.id} />
          )}
          {activeTab === "contracts" && project && (
            <ProjectContractsTab project={project} />
          )}
          {activeTab === "activity" && (
            project ? (
              <div>
                <ActivityList
                  queryKey={['project-activity', project.id]}
                  fetchPath={`/projects/${project.id}/activity`}
                  emptyMessage={'projects.activity.empty'}
                />
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">{t('contractor_sheet.placeholder.activity')}</div>
            )
          )}
        </div>
      </ResizableSheet>

      <ContractorSheet
        open={contractorSheetOpen}
        onOpenChange={handleContractorSheetOpenChange}
        contractor={null}
        onSave={handleContractorSaved}
        initialName={pendingContractorName}
      />
    </>
  );
}
