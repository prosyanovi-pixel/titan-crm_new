
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, ListChecks } from "lucide-react";
import { UserSelect } from "@/components/shared";
import { EntityCombobox } from "@/components/shared/EntityCombobox";
import type { ComboboxOption } from "@/components/shared/EntityCombobox";
import { useTranslation } from "@/lib/i18n";
import { Task, SubTask, TaskProjectRef } from "../../types";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { DatePicker } from "@/components/ui/date-picker";
import { useSettings } from "@/hooks/use-settings";
import { useModuleSettings } from "@/modules/settings/hooks/useModuleSettings";
import { SmartMetadataGrid } from "@/components/shared";
import { FolderKanban, Calendar, User } from "lucide-react";

interface ReferenceOption {
    id: string;
    name: string;
}

interface TaskReferences {
    priorities?: ReferenceOption[];
    taskStatuses?: ReferenceOption[];
}

interface TaskGeneralTabProps {
  formData: Partial<Task>;
    handleChange: (field: keyof Task, value: unknown) => void;
    projects?: TaskProjectRef[];
    references?: TaskReferences;
}

export function TaskGeneralTab({ formData, handleChange, projects = [], references }: TaskGeneralTabProps) {
  const { t } = useTranslation();
  const [newSubTask, setNewSubTask] = useState("");
  const { getStatusesByModule, getPrioritiesByModule } = useSettings();
  const { settings } = useModuleSettings("tasks");
  const [editingField, setEditingField] = useState<string | null>(null);

  const statuses = getStatusesByModule('tasks');
  const priorities = getPrioritiesByModule('tasks');

  const showAssignee = settings.features?.enableAssignees !== false;
  const showPriority = settings.features?.enablePriorities !== false;
  const showDueDate = settings.features?.enableDueDates !== false;
  const showSubtasks = settings.features?.enableSubtasks !== false;

  const handleAddSubTask = () => {
    if (!newSubTask.trim()) return;
    const sub: SubTask = {
        id: Math.random().toString(),
        title: newSubTask,
        completed: false
    };
    handleChange("subTasks", [...(formData.subTasks || []), sub]);
    setNewSubTask("");
  };

  const toggleSubTask = (id: string) => {
    const updated = (formData.subTasks || []).map(s => 
        s.id === id ? { ...s, completed: !s.completed } : s
    );
    
    const allCompleted = updated.length > 0 && updated.every(s => s.completed);
    
    if (allCompleted && formData.status !== 'Done') {
      if (confirm(t('tasks.confirm.complete_task_all_subtasks'))) {
        // Обновляем статус и подзадачи вместе
        handleChange("status", 'Done');
        handleChange("subTasks", updated);
        return;
      }
    }
    
    handleChange("subTasks", updated);
  };

  const removeSubTask = (id: string) => {
    const updated = (formData.subTasks || []).filter(s => s.id !== id);
    handleChange("subTasks", updated);
  };

  const completedCount = formData.subTasks?.filter(s => s.completed).length || 0;
  const totalCount = formData.subTasks?.length || 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-6">
        <div className="space-y-2">
            <Label htmlFor="title">{t('task_sheet.field.title')}</Label>
            <Input 
                id="title" 
                value={formData.title || ""} 
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder={t('task_sheet.title_placeholder')} 
            />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>{t('task_sheet.field.status')}</Label>
                <Select 
                    value={formData.status} 
                    onValueChange={(v) => handleChange("status", v)}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {statuses.length > 0 ? (
                            statuses.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))
                        ) : (
                            // Fallback
                            references?.taskStatuses?.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            )) || (
                                <>
                                    <SelectItem value="To Do">{t('tasks.status.todo')}</SelectItem>
                                    <SelectItem value="In Progress">{t('tasks.status.in_progress')}</SelectItem>
                                    <SelectItem value="Done">{t('tasks.status.done')}</SelectItem>
                                </>
                            )
                        )}
                    </SelectContent>
                </Select>
            </div>
            {showPriority && (
                <div className="space-y-2">
                    <Label>{t('task_sheet.field.priority')}</Label>
                    <Select 
                        value={formData.priority} 
                        onValueChange={(v) => handleChange("priority", v)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {priorities.length > 0 ? (
                                priorities.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))
                            ) : (
                                references?.priorities?.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                )) || (
                                    <>
                                        <SelectItem value="High">{t('common.priority_high')}</SelectItem>
                                        <SelectItem value="Medium">{t('common.priority_medium')}</SelectItem>
                                        <SelectItem value="Low">{t('common.priority_low')}</SelectItem>
                                    </>
                                )
                            )}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>

        <SmartMetadataGrid items={[
          ...(showDueDate ? [{
            id: 'dueDate',
            label: t('task_sheet.field.due_date'),
            value: editingField === 'dueDate' ? '__editing__' : (formData.dueDate ? new Date(formData.dueDate).toLocaleDateString() : null),
            icon: <Calendar className="w-4 h-4 text-orange-500" />,
            isCritical: true,
            onClick: () => setEditingField('dueDate'),
            onClickPlaceholder: () => setEditingField('dueDate'),
            renderCustomBadge: editingField === 'dueDate' ? () => (
              <div className="min-w-[200px]">
                <DatePicker 
                  value={formData.dueDate || ""}
                  onChange={(date) => { handleChange("dueDate", date); setEditingField(null); }}
                  placeholder={t('task_sheet.placeholder.due_date')}
                />
              </div>
            ) : undefined
          }] : []),
          {
            id: 'project',
            label: t('task_sheet.field.project'),
            value: editingField === 'project' ? '__editing__' : (formData.project || null),
            icon: <FolderKanban className="w-4 h-4 text-blue-500" />,
            onClick: () => setEditingField('project'),
            onClickPlaceholder: () => setEditingField('project'),
            renderCustomBadge: editingField === 'project' ? () => (
              <div className="min-w-[250px] flex gap-2">
                <EntityCombobox
                    value={formData.project || ''}
                    onChange={(v) => { handleChange('project', v ?? ''); setEditingField(null); }}
                    options={projects.map(p => ({ id: p.name, label: p.name } as ComboboxOption))}
                    placeholder={t('common.project')}
                    className="flex-1"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => { handleChange('project', ''); setEditingField(null); }}
                  title={t('tasks.actions.detach_from_project')}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ) : undefined
          },
          ...(showAssignee ? [{
            id: 'assignee',
            label: t('task_sheet.field.assignee'),
            value: editingField === 'assignee' ? '__editing__' : (formData.assignee || null),
            icon: <User className="w-4 h-4 text-emerald-500" />,
            onClick: () => setEditingField('assignee'),
            onClickPlaceholder: () => setEditingField('assignee'),
            renderCustomBadge: editingField === 'assignee' ? () => (
              <div className="min-w-[250px]">
                <UserSelect 
                    value={formData.assignee || ""}
                    onValueChange={(v) => { handleChange("assignee", v); setEditingField(null); }}
                />
              </div>
            ) : undefined
          }] : [])
        ]} />

        <div className="space-y-2">
            <Label htmlFor="description">{t('task_sheet.field.description')}</Label>
            <Textarea 
                id="description" 
                placeholder={t('task_sheet.placeholder.description')} 
                rows={4}
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
            />
        </div>

        {showSubtasks && (
            <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-medium text-sm">
                        <ListChecks className="w-4 h-4 text-primary" />
                        {t('task_sheet.checklist')}
                    </div>
                    {totalCount > 0 && <span className="text-xs text-muted-foreground">{completedCount}/{totalCount}</span>}
                </div>
                
                {totalCount > 0 && <Progress value={progress} className="h-1.5" />}

                <div className="space-y-2">
                    {formData.subTasks?.map((sub) => (
                        <div key={sub.id} className="flex items-center gap-2 group">
                            <Checkbox 
                                checked={sub.completed}
                                onCheckedChange={() => toggleSubTask(sub.id)}
                            />
                            <span className={`text-sm flex-1 ${sub.completed ? "line-through text-muted-foreground" : ""}`}>
                                {sub.title}
                            </span>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeSubTask(sub.id)}
                            >
                                <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="flex gap-2">
                    <Input 
                        placeholder={t('task_sheet.placeholder.add_subtask')} 
                        value={newSubTask}
                        onChange={(e) => setNewSubTask(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubTask()}
                        className="h-8 text-sm"
                    />
                    <Button size="sm" variant="outline" className="h-8" onClick={handleAddSubTask}>
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        )}
    </div>
  );
}
