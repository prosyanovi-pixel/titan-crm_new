
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/lib/i18n";
import { CheckSquare, Info, Activity, MessageSquare } from "lucide-react";
import ActivityList from '@/components/shared/ActivityList';
import { CommentsSection } from '@/components/shared/CommentsSection';
import { Task, TaskProjectRef } from "../types";
import { TaskGeneralTab } from "./tabs/TaskGeneralTab";
import { useSheetTabs } from "@/hooks/useSheetTabs";
import { SheetTabSettings, ResizableSheet } from "@/components/shared";
import { useModuleSettings } from "@/modules/settings/hooks/useModuleSettings";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { useConfirm } from "@/components/ui/confirm-dialog";

interface ReferenceOption {
  id: string;
  name: string;
}

interface TaskReferences {
  priorities?: ReferenceOption[];
  taskStatuses?: ReferenceOption[];
}

interface TaskSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (task: Task) => void;
  onDelete?: (id: string) => void;
  initialProject?: string;
  references?: TaskReferences;
}

export function TaskSheet({
  task,
  open,
  onOpenChange,
  onSave,
  onDelete,
  initialProject,
  references
  }: TaskSheetProps) {
  const { t } = useTranslation();
  const { confirm, alert } = useConfirm();
  const { settings } = useModuleSettings("tasks");
  const [formData, setFormData] = useState<Partial<Task>>({});
  const [projects, setProjects] = useState<TaskProjectRef[]>([]);

  // Tab Management
  const { tabs, toggleTab, moveTab } = useSheetTabs([
    { id: "general", label: "sheet.tabs.overview", icon: Info, visible: true },
    { id: "comments", label: "components.comments.title", icon: MessageSquare, visible: true },
    { id: "activity", label: "sheet.tabs.activity", icon: Activity, visible: settings.features?.enableStatistics !== false },
  ], "task-sheet");

  
  const [activeTab, setActiveTab] = useState("general");

  // Ensure active tab is visible
  useEffect(() => {
      const currentTab = tabs.find(t => t.id === activeTab);
      if (currentTab && !currentTab.visible) {
          const firstVisible = tabs.find(t => t.visible);
          // eslint-disable-next-line react-hooks/set-state-in-effect
          if (firstVisible) setActiveTab(firstVisible.id);
      }
  }, [tabs, activeTab]);

  // Fetch projects for dropdown
  useEffect(() => {
      if (open) {
          api.get('/projects').then(data => {
               
              setProjects(data);
          }).catch(err => console.error("Failed to fetch projects for task sheet", err));
      }
  }, [open]);

  useEffect(() => {
    if (task && task.id) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData(task);
    } else {
        // Получаем текущего пользователя для assignee по умолчанию
        const currentUserName = localStorage.getItem('titan_user_name') || '';
        const today = new Date();
        const formattedDate = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;
        
         
        setFormData({
            title: "",
            status: "To Do",
            priority: "Medium",
            assignee: currentUserName,
            assigneeInitials: currentUserName ? currentUserName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : "",
            project: initialProject || "",
            dueDate: formattedDate,
            subTasks: [],
            description: "",
            ...(task || {}) // Merge stageId or other pre-filled fields
        });
    }
  }, [task, open, initialProject]);

  const handleInputChange = (field: keyof Task, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.title || formData.title.trim() === '') {
      await alert({
        title: t('common.error'),
        description: t('tasks.validation.title_required'),
      });
      return;
    }

    // For meeting tasks, ensure due date is set
    if (formData.description && formData.description.includes(t('tasks.keywords.meeting')) && (!formData.dueDate || formData.dueDate.trim() === '')) {
      await alert({
        title: t('common.warning'),
        description: t('tasks.validation.due_date_required_for_meeting'),
      });
      return;
    }

    const newTask: Task = {
        ...(task?.id ? { id: task.id } : {}),
        identifier: task?.identifier || '',
        title: formData.title.trim(),
        project: formData.project || t('tasks.general_project'),
        assignee: formData.assignee || t('tasks.unassigned'),
        assigneeInitials: formData.assignee ? formData.assignee.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : t('tasks.unassigned_initials'),
        priority: formData.priority || "Medium",
        status: formData.status || "To Do",
        dueDate: formData.dueDate || format(new Date(), "dd.MM.yyyy"),
        subTasks: formData.subTasks || [],
        description: formData.description || "",
        projectId: formData.projectId,
        stageId: formData.stageId
    } as Task;
    onSave(newTask);
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (task && onDelete) {
      if (!await confirm({
        title: t('common.confirm_deletion'),
        description: t("tasks.confirm.delete_task", { name: task.title }),
      })) return;
      onDelete(task.id);
      onOpenChange(false);
    }
  };

  return (
    <ResizableSheet
      open={open}
      onOpenChange={onOpenChange}
      onSave={handleSave}
      onDelete={task ? handleDelete : undefined}
      title={task ? t('task_sheet.title_edit') : t('task_sheet.title_new')}
      description={formData.title || t('task_sheet.description')}
      moduleKey="task-sheet"
      defaultWidth="md"
      showDeleteButton={!!task}
      saveButtonLabel="common.save"
      cancelButtonLabel="common.cancel"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
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

        {activeTab === "general" && (
          <TaskGeneralTab 
            formData={formData} 
            handleChange={handleInputChange} 
            projects={projects} 
            references={references}
          />
        )}

        {activeTab === "comments" && (
          task ? (
            <div className="pt-4">
              <CommentsSection entityType="task" entityId={task.id} />
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              {t('components.comments.save_to_add_comments')}
            </div>
          )
        )}

        {activeTab === "activity" && (
          task ? (
            <ActivityList
              queryKey={[ 'task-activity', task.id ]}
              fetchPath={`/tasks/${task.id}/activity`}
              deletePath={(id: number) => `/tasks/${task.id}/activity/${id}`}
              emptyMessage={'contractor_sheet.placeholder.activity'}
            />
          ) : (
            <div className="text-center text-muted-foreground py-8">
              {t('contractor_sheet.placeholder.activity')}
            </div>
          )
        )}
      </div>
    </ResizableSheet>
  );
}

