import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { 
  Plus, FolderOpen, ChevronLeft, Calendar, Clock, DollarSign, ListChecks, Rocket, 
  Calendar as CalendarIcon, CheckCircle, Info, X, CheckSquare, Users, Flag, AlignLeft,
  Trash2, Bell, Tag, MoreVertical, Edit
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProjectStage, ProjectStageWithTasks, CreateProjectStageDTO, UpdateProjectStageDTO, ProjectTask, ProjectSubTask, OpenProjectTaskSheetRequest, ProjectTaskStatus, ProjectTaskPriority } from '../../types';
import { useProjectStages } from '../../hooks/useProjectStages';
import { useProjectConfirmations } from '../../hooks/useProjectConfirmations';
import { useDataTable } from '@/hooks/useDataTable';
import { EmptyState } from '@/components/ui/empty-state';
import { validateForm, createProjectStageSchema } from '../../validations/project.validations';

import { ProjectStagesSummary } from './stages/ProjectStagesSummary';
import { ProjectStagesTable } from './stages/ProjectStagesTable';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { GridColorPicker } from '@/components/ui/GridColorPicker';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { UserSelect } from '@/components/shared';
import { Progress } from '@/components/ui/progress';
import { useSettings } from '@/hooks/use-settings';

interface ProjectStagesTabProps {
  projectId?: number;
  projectName?: string;
  onOpenTaskSheet?: (request: OpenProjectTaskSheetRequest) => void;
}

type ViewMode = 'list' | 'edit-stage' | 'edit-task';

export function ProjectStagesTab({ projectId, projectName, onOpenTaskSheet }: ProjectStagesTabProps) {
  const { t } = useTranslation();
  const { getStatusesByModule, getPrioritiesByModule } = useSettings();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  
  const table = useDataTable<ProjectStage>({
    initialData: [],
    initialColumns: {
      name: true,
      dates: true,
      progress: true,
      budget: true,
      status: true,
    },
    storageKey: `project-stages-table-${projectId}`,
  });
  
  const {
    stages,
    summary,
    isLoading,
    createStage,
    updateStage,
    deleteStage,
    completeStage,
    reorderStage,
    loadStages,
    loadSummary,
  } = useProjectStages({ projectId });

  const { confirmDeleteStage, confirmCompleteStage } = useProjectConfirmations();

  // Stage Form State
  const [editingStage, setEditingStage] = useState<ProjectStage | null>(null);
  const [stageFormData, setStageFormData] = useState<Partial<ProjectStage>>({
    name: '',
    type: 'stage',
    description: '',
    startDate: format(new Date(), 'dd.MM.yyyy'),
    endDate: format(new Date(), 'dd.MM.yyyy'),
    plannedStartDate: '',
    plannedEndDate: '',
    budget: 0,
    isCompleted: false,
    progress: 0,
    color: '',
  });

  // Task Form State
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [taskFormData, setTaskFormData] = useState<Partial<ProjectTask>>({});
  const [newSubTask, setNewSubTask] = useState("");
  const [targetStageId, setTargetStageId] = useState<number | null>(null);

  const [expandedStageIds, setExpandedStageIds] = useState<Set<number>>(new Set());

  const toggleStageExpand = (stageId: number) => {
    const newExpanded = new Set(expandedStageIds);
    if (newExpanded.has(stageId)) {
      newExpanded.delete(stageId);
    } else {
      newExpanded.add(stageId);
    }
    setExpandedStageIds(newExpanded);
  };

  useEffect(() => {
    const handleTaskUpdate = () => {
      if (projectId) {
        loadStages();
        loadSummary();
      }
    };
    window.addEventListener('task:updated', handleTaskUpdate);
    window.addEventListener('task:created', handleTaskUpdate);
    return () => {
      window.removeEventListener('task:updated', handleTaskUpdate);
      window.removeEventListener('task:created', handleTaskUpdate);
    };
  }, [projectId, loadStages, loadSummary]);

  // STAGE HANDLERS
  const handleOpenCreateStage = () => {
    setEditingStage(null);
    setStageFormData({
      name: '',
      type: 'stage',
      description: '',
      startDate: format(new Date(), 'dd.MM.yyyy'),
      endDate: format(new Date(), 'dd.MM.yyyy'),
      plannedStartDate: '',
      plannedEndDate: '',
      budget: 0,
      isCompleted: false,
      progress: 0,
      color: '',
    });
    setViewMode('edit-stage');
  };

  const handleOpenEditStage = (stage: ProjectStage) => {
    setEditingStage(stage);
    setStageFormData({
      name: stage.name,
      type: stage.type || 'stage',
      description: stage.description || '',
      startDate: stage.startDate,
      endDate: stage.endDate,
      plannedStartDate: stage.plannedStartDate || '',
      plannedEndDate: stage.plannedEndDate || '',
      budget: stage.budget || 0,
      isCompleted: stage.isCompleted,
      progress: stage.progress,
      color: stage.color || '',
    });
    setViewMode('edit-stage');
  };

  const handleSaveStage = async () => {
    const validationResult = validateForm(createProjectStageSchema(t), {
      name: stageFormData.name,
      type: stageFormData.type,
      description: stageFormData.description,
      startDate: stageFormData.startDate,
      endDate: stageFormData.endDate,
      plannedStartDate: stageFormData.plannedStartDate || '',
      plannedEndDate: stageFormData.plannedEndDate || '',
      budget: stageFormData.budget || 0,
      progress: stageFormData.progress || 0,
      isCompleted: stageFormData.isCompleted || false,
      color: stageFormData.color || '',
    });

    if ('errors' in validationResult) {
      toast.error(validationResult.errors[0].message);
      return;
    }

    if (editingStage) {
      if (stageFormData.isCompleted && !editingStage.isCompleted) {
        const stageWithTasks = stages.find(s => s.id === editingStage.id) as ProjectStageWithTasks;
        const tasks = (stageWithTasks?.tasks || []) as ProjectTask[];
        if (tasks.filter(t => t.status !== 'Done').length > 0) {
          toast.error(t('projects.stages.error.unfinished_tasks', { count: tasks.filter(t => t.status !== 'Done').length }));
          return;
        }
      }
      
      const updateData: UpdateProjectStageDTO = {
        name: stageFormData.name,
        type: stageFormData.type,
        description: stageFormData.description,
        startDate: stageFormData.startDate,
        endDate: stageFormData.endDate,
        plannedStartDate: stageFormData.plannedStartDate,
        plannedEndDate: stageFormData.plannedEndDate,
        budget: stageFormData.budget,
        isCompleted: stageFormData.isCompleted,
        progress: stageFormData.isCompleted ? 100 : (editingStage.progress || 0),
        color: stageFormData.color,
      };
      await updateStage(editingStage.id, updateData);
      await loadStages();
    } else {
      const created = await createStage(stageFormData as CreateProjectStageDTO);
      if (created && created.id) {
        await loadStages();
        // Автоматически разворачиваем созданный этап
        setExpandedStageIds(prev => new Set([...prev, created.id]));
      }
    }
    setViewMode('list');
    await loadSummary();
  };

  // TASK HANDLERS
  const handleOpenAddTask = (stageId: number, stageName?: string) => {
    const currentUserName = localStorage.getItem('titan_user_name') || '';
    const today = new Date();
    const formattedDate = format(today, 'dd.MM.yyyy');

    setEditingTask(null);
    setTargetStageId(stageId);
    setTaskFormData({
      title: stageName ? `Задача: ${stageName}` : "",
      status: "To Do",
      priority: "Medium",
      assignee: currentUserName,
      dueDate: formattedDate,
      subTasks: [],
      description: "",
      project: projectName || "",
      projectId: projectId,
      stageId: stageId
    });
    setViewMode('edit-task');
  };

  const handleOpenEditTask = (task: ProjectTask) => {
    setEditingTask(task);
    setTargetStageId(task.stageId || null);
    setTaskFormData({ ...task });
    setViewMode('edit-task');
  };

  const handleSaveTask = async () => {
    if (!taskFormData.title?.trim()) {
      toast.error(t('validation.title_required'));
      return;
    }

    try {
      let savedTask;
      if (editingTask?.id) {
        savedTask = await api.put(`/tasks/${editingTask.id}`, taskFormData);
        toast.success(t('projects.stages.toast.task_updated'));
        window.dispatchEvent(new CustomEvent('task:updated', { detail: savedTask }));
      } else {
        savedTask = await api.post('/tasks', taskFormData);
        toast.success(t('projects.stages.toast.task_created'));
        window.dispatchEvent(new CustomEvent('task:created', { detail: savedTask }));
      }
      await loadStages();
      await loadSummary();
      setViewMode('list');
    } catch (error) {
      console.error('Failed to save task:', error);
      toast.error(t('projects.stages.error.save_task'));
    }
  };

  const handleDeleteTask = async (task: ProjectTask) => {
    if (confirm(t('tasks.confirm.delete_task').replace('{0}', task.title))) {
      try {
        await api.delete(`/tasks/${task.id}`);
        toast.success(t('projects.stages.toast.task_deleted'));
        await loadStages();
        await loadSummary();
        if (viewMode === 'edit-task') setViewMode('list');
      } catch {
        toast.error(t('projects.stages.error.delete'));
      }
    }
  };

  const handleAddSubTask = () => {
    if (!newSubTask.trim()) return;
    const sub: ProjectSubTask = {
        id: Math.random().toString(),
        title: newSubTask,
        completed: false
    };
    setTaskFormData({ ...taskFormData, subTasks: [...(taskFormData.subTasks || []), sub] });
    setNewSubTask("");
  };

  const toggleSubTask = (id: string) => {
    const updated = (taskFormData.subTasks || []).map(s => 
        s.id === id ? { ...s, completed: !s.completed } : s
    );
    
    const allCompleted = updated.length > 0 && updated.every(s => s.completed);
    
    if (allCompleted && taskFormData.status !== 'Done') {
      if (confirm(t('tasks.confirm.complete_task_all_subtasks') || 'Все подзадачи выполнены. Отметить задачу как выполненную?')) {
        setTaskFormData({ ...taskFormData, subTasks: updated, status: 'Done' });
        return;
      }
    }
    
    setTaskFormData({ ...taskFormData, subTasks: updated });
  };

  const removeSubTask = (id: string) => {
    const updated = (taskFormData.subTasks || []).filter(s => s.id !== id);
    setTaskFormData({ ...taskFormData, subTasks: updated });
  };

  const completedCount = taskFormData.subTasks?.filter(s => s.completed).length || 0;
  const totalCount = taskFormData.subTasks?.length || 0;
  const subtaskProgress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleDeleteStage = async (stage: ProjectStage) => {
    const ok = await confirmDeleteStage(stage);
    if (!ok) return;
    await deleteStage(stage.id);
    setViewMode('list');
  };

  const handleCompleteStageAction = async (stage: ProjectStage) => {
    const stageWithTasks = stages.find(s => s.id === stage.id) as ProjectStageWithTasks;
    const tasks = (stageWithTasks?.tasks || []) as ProjectTask[];
    if (tasks.filter(t => t.status !== 'Done').length > 0) {
      const ok = await confirmCompleteStage(stage, tasks.filter(t => t.status !== 'Done').length);
      if (!ok) return;
    }
    await completeStage(stage.id, 100);
    await loadStages();
    await loadSummary();
  };

  const handleMoveUp = async (stage: ProjectStage) => {
    const currentIndex = stages.findIndex(s => s.id === stage.id);
    if (currentIndex > 0) {
      await reorderStage(stage.id, currentIndex - 1);
      await loadStages();
    }
  };

  const handleMoveDown = async (stage: ProjectStage) => {
    const currentIndex = stages.findIndex(s => s.id === stage.id);
    if (currentIndex < stages.length - 1) {
      await reorderStage(stage.id, currentIndex + 1);
      await loadStages();
    }
  };

  /**
   * Moves a task to a different stage (called by drag-and-drop).
   * PATCHes the task's stageId on the server then reloads stages.
   */
  const handleTaskMove = async (taskId: string, newStageId: number) => {
    try {
      await api.put(`/tasks/${taskId}`, { stageId: newStageId });
      toast.success(t('projects.stages.toast.task_moved'));
      await loadStages();
      await loadSummary();
    } catch (error) {
      console.error('Failed to move task:', error);
      toast.error(t('projects.stages.error.save_task'));
    }
  };

  const stageTypeOptions = [
    { value: "stage", label: t('projects.stages.stage_type_options.stage'), icon: ListChecks, color: "text-blue-500" },
    { value: "milestone", label: t('projects.stages.stage_type_options.milestone'), icon: Rocket, color: "text-orange-500" },
    { value: "meeting", label: t('projects.stages.stage_type_options.meeting'), icon: CalendarIcon, color: "text-purple-500" },
    { value: "delivery", label: t('projects.stages.stage_type_options.delivery'), icon: CheckCircle, color: "text-green-500" },
  ];

  if (!projectId) {
    return (
      <EmptyState
        icon={<FolderOpen className="w-12 h-12" />}
        title={t('projects.stages.no_project_selected')}
        description={t('projects.stages.empty')}
        minHeight="h-64"
      />
    );
  }

  // --- EDIT STAGE VIEW ---
  if (viewMode === 'edit-stage') {
    return (
      <div className="space-y-6 pb-10">
        <div className="flex items-center justify-between border-b pb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setViewMode('list')}
            className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('projects.stages.back_to_list')}
          </Button>
          <div className="flex gap-2">
            {editingStage && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleDeleteStage(editingStage)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                {t('common.delete')}
              </Button>
            )}
            <Button size="sm" onClick={handleSaveStage} disabled={!stageFormData.name || !stageFormData.startDate || !stageFormData.endDate}>
              {t('common.save')}
            </Button>
          </div>
        </div>

        {/* Группа 1: Основная информация */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between gap-4">
             <Input 
                value={stageFormData.name} 
                onChange={(e) => setStageFormData({ ...stageFormData, name: e.target.value })}
                placeholder={t('projects.stages.placeholder.name')}
                className="text-lg font-semibold border-none p-0 focus-visible:ring-0 h-auto placeholder:text-muted-foreground/50 flex-1"
              />
              <GridColorPicker 
                value={stageFormData.color} 
                onChange={(color) => setStageFormData({ ...stageFormData, color })} 
                className="h-8 px-2 shrink-0 border-none bg-muted/30"
              />
          </div>
          
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <Label className="text-[15px] font-medium text-foreground/80">{t('projects.stages.stage_type')}</Label>
            <Select 
              value={stageFormData.type || 'stage'} 
              onValueChange={(value) => setStageFormData({ ...stageFormData, type: value })}
            >
              <SelectTrigger className="w-auto border-none p-0 h-auto focus:ring-0 text-foreground font-medium bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stageTypeOptions
                  .filter((opt) => opt.value !== undefined && opt.value !== null && String(opt.value) !== '')
                  .map(opt => (
                  <SelectItem key={String(opt.value)} value={String(opt.value)}>
                    <div className="flex items-center gap-2">
                      <opt.icon className={cn("w-4 h-4", opt.color)} />
                      <span>{opt.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Группа 2: Сроки (Факт) */}
        <div className="space-y-1.5">
          <Label className="px-1 text-[11px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3 h-3" /> {t('projects.stages.actual_dates')}
          </Label>
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="grid grid-cols-2 divide-x">
              <div className="px-4 py-2.5 flex items-center justify-between">
                <Label className="text-[14px] font-medium text-foreground/80">{t('projects.stages.actual_start')}</Label>
                <DatePicker
                  value={stageFormData.startDate}
                  onChange={(v) => setStageFormData({ ...stageFormData, startDate: v })}
                  className="border-none p-0 h-auto font-medium text-primary hover:bg-transparent focus:ring-0"
                />
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between">
                <Label className="text-[14px] font-medium text-foreground/80 pl-1">{t('projects.stages.actual_end')}</Label>
                <DatePicker
                  value={stageFormData.endDate}
                  onChange={(v) => setStageFormData({ ...stageFormData, endDate: v })}
                  className="border-none p-0 h-auto font-medium text-primary hover:bg-transparent focus:ring-0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Группа 3: Сроки (План) */}
        <div className="space-y-1.5">
          <Label className="px-1 text-[11px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> {t('projects.stages.planned_dates')}
          </Label>
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="grid grid-cols-2 divide-x">
              <div className="px-4 py-2.5 flex items-center justify-between">
                <Label className="text-[14px] font-medium text-foreground/80/70 italic">{t('projects.stages.planned_start_label')}</Label>
                <DatePicker
                  value={stageFormData.plannedStartDate}
                  onChange={(v) => setStageFormData({ ...stageFormData, plannedStartDate: v })}
                  className="border-none p-0 h-auto font-medium text-muted-foreground hover:bg-transparent focus:ring-0"
                  placeholder="—"
                />
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between">
                <Label className="text-[14px] font-medium text-foreground/80/70 italic pl-1">{t('projects.stages.planned_end_label')}</Label>
                <DatePicker
                  value={stageFormData.plannedEndDate}
                  onChange={(v) => setStageFormData({ ...stageFormData, plannedEndDate: v })}
                  className="border-none p-0 h-auto font-medium text-muted-foreground hover:bg-transparent focus:ring-0"
                  placeholder="—"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Группа 4: Финансы и Статус */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden divide-y">
          <div className="px-4 py-3 flex items-center justify-between">
            <Label className="text-[15px] font-medium text-foreground/80">{t('projects.stages.field.budget')}</Label>
            <div className="flex-1 max-w-[150px]">
              <MoneyInput
                value={stageFormData.budget || 0}
                onValueChange={(v) => setStageFormData({ ...stageFormData, budget: v })}
                className="border-none text-right font-semibold focus-visible:ring-0 h-auto p-0 bg-transparent"
              />
            </div>
          </div>
          
          <div className="px-4 py-3 flex items-center justify-between">
            <Label className="text-[15px] font-medium text-foreground/80">{t('projects.stages.field.status')}</Label>
            <div className="flex items-center gap-3">
              <span className={cn(
                "text-sm font-medium",
                stageFormData.isCompleted ? "text-green-600" : "text-muted-foreground"
              )}>
                {stageFormData.isCompleted ? t('projects.stages.status.completed') : t('projects.stages.status.pending')}
              </span>
              <input
                type="checkbox"
                id="isCompleted-stage-drill"
                checked={stageFormData.isCompleted || false}
                onChange={(e) => setStageFormData({ ...stageFormData, isCompleted: e.target.checked })}
                className="h-5 w-5 rounded-full border-gray-300 text-primary focus:ring-primary transition-all cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Группа 5: Описание */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="px-4 py-3">
            <Label className="text-[15px] font-medium text-foreground/80 block mb-2">{t('projects.stages.stage_description')}</Label>
            <Textarea 
              value={stageFormData.description} 
              onChange={(e) => setStageFormData({ ...stageFormData, description: e.target.value })}
              placeholder={t('projects.stages.placeholder.description')}
              className="min-h-[150px] border-none p-0 focus-visible:ring-0 resize-y bg-transparent placeholder:text-muted-foreground/40 text-sm" 
            />
          </div>
        </div>
      </div>
    );
  }

  // --- EDIT TASK VIEW (APPLE STYLE) ---
  if (viewMode === 'edit-task') {
    const taskStatuses = getStatusesByModule('tasks');
    const taskPriorities = getPrioritiesByModule('tasks');

    return (
      <div className="space-y-6 pb-10">
        <div className="flex items-center justify-between border-b pb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setViewMode('list')}
            className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('projects.stages.back_to_list')}
          </Button>
          <div className="flex gap-2">
            {editingTask && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleDeleteTask(editingTask)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                {t('common.delete')}
              </Button>
            )}
            <Button size="sm" onClick={handleSaveTask} disabled={!taskFormData.title?.trim()}>
              {t('common.save')}
            </Button>
          </div>
        </div>

        {/* Группа 1: Основная информация */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="px-4 py-3">
            <Input 
              value={taskFormData.title || ""} 
              onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
              placeholder={t('projects.stages.task_title_placeholder')}
              className="text-lg font-semibold border-none p-0 focus-visible:ring-0 h-auto placeholder:text-muted-foreground/50"
            />
          </div>
          <div className="px-4 py-3 border-t">
            <Textarea 
              value={taskFormData.description || ""}
              onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
              placeholder={t('projects.stages.task_notes')}
              className="text-sm border-none p-0 focus-visible:ring-0 bg-transparent min-h-[100px] resize-y placeholder:text-muted-foreground/50"
            />
          </div>
        </div>

        {/* Группа 2: Статус и Приоритет */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden divide-y">
          <div className="px-4 py-3 flex items-center justify-between">
            <Label className="text-[15px] font-medium text-foreground/80">{t('common.status')}</Label>
            <Select 
              value={taskFormData.status} 
              onValueChange={(v) => setTaskFormData({ ...taskFormData, status: v as ProjectTaskStatus })}
            >
              <SelectTrigger className="w-auto border-none p-0 h-auto focus:ring-0 text-foreground font-medium bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {taskStatuses.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="px-4 py-3 flex items-center justify-between">
            <Label className="text-[15px] font-medium text-foreground/80">{t('common.priority')}</Label>
            <Select 
              value={taskFormData.priority} 
              onValueChange={(v) => setTaskFormData({ ...taskFormData, priority: v as ProjectTaskPriority })}
            >
              <SelectTrigger className="w-auto border-none p-0 h-auto focus:ring-0 text-foreground font-medium bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {taskPriorities.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Группа 3: Срок и Исполнитель */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden divide-y">
          <div className="px-4 py-3 flex items-center justify-between">
            <Label className="text-[15px] font-medium text-foreground/80">{t('projects.stages.due_date_label')}</Label>
            <DatePicker 
              value={taskFormData.dueDate || ""}
              onChange={(date) => setTaskFormData({ ...taskFormData, dueDate: date })}
              className="border-none p-0 h-auto font-medium text-primary hover:bg-transparent focus:ring-0"
            />
          </div>
          <div className="px-4 py-3">
            <Label className="text-[15px] font-medium text-foreground/80 block mb-2">{t('common.assignee')}</Label>
            <UserSelect 
              value={taskFormData.assignee || ""}
              onValueChange={(v) => setTaskFormData({ ...taskFormData, assignee: v })}
              className="h-9 border-none bg-muted/30 focus:ring-1"
            />
          </div>
        </div>

        {/* Группа 4: Подзадачи (Checklist) */}
        <div className="space-y-1.5">
          <div className="px-1 flex items-center justify-between">
            <Label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
              <ListChecks className="w-3 h-3" /> {t('projects.stages.checklist')}
            </Label>
            {totalCount > 0 && <span className="text-[10px] font-bold text-muted-foreground">{completedCount}/{totalCount}</span>}
          </div>
          
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            {totalCount > 0 && <Progress value={subtaskProgress} className="h-1 rounded-none bg-muted/50" />}
            
            <div className="divide-y">
              {taskFormData.subTasks?.map((sub) => (
                <div key={sub.id} className="flex items-center px-4 py-2.5 group">
                  <div className="flex-1 flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={sub.completed}
                      onChange={() => toggleSubTask(sub.id)}
                      className="h-4 w-4 rounded-full border-gray-300 text-primary focus:ring-primary transition-all cursor-pointer"
                    />
                    <span className={`text-sm ${sub.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {sub.title}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeSubTask(sub.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
              <div className="px-4 py-2 flex gap-2 bg-muted/5">
                <Input 
                  placeholder={t('projects.stages.add_item')}
                  value={newSubTask}
                  onChange={(e) => setNewSubTask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubTask()}
                  className="h-8 text-sm border-none bg-transparent shadow-none focus-visible:ring-0 p-0"
                />
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary" onClick={handleAddSubTask}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && stages.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (stages.length === 0) {
    return (
      <div className="space-y-4">
        <ProjectStagesSummary summary={summary} />
        <ProjectStagesTable 
          stages={[]}
          expandedStageIds={new Set()}
          toggleStageExpand={() => {}}
          handleOpenAddTask={() => {}}
          handleOpenEditTask={() => {}}
          handleDeleteTask={async () => {}}
          handleMoveUp={() => {}}
          handleMoveDown={() => {}}
          handleOpenEdit={() => {}}
          handleComplete={() => {}}
          handleDelete={() => {}}
          onAddClick={handleOpenCreateStage}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ProjectStagesSummary summary={summary} />

      <ProjectStagesTable 
        stages={stages}
        expandedStageIds={expandedStageIds}
        toggleStageExpand={toggleStageExpand}
        handleOpenAddTask={handleOpenAddTask}
        handleOpenEditTask={handleOpenEditTask}
        handleDeleteTask={handleDeleteTask}
        handleMoveUp={handleMoveUp}
        handleMoveDown={handleMoveDown}
        handleOpenEdit={handleOpenEditStage}
        handleComplete={handleCompleteStageAction}
        handleDelete={handleDeleteStage}
        columnWidths={table.columnWidths}
        onColumnResize={table.setColumnWidth}
        onAddClick={handleOpenCreateStage}
        onTaskMove={handleTaskMove}
      />
    </div>
  );
}
