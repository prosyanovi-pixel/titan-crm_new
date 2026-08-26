import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { MoneyInput } from '@/components/ui/MoneyInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ProjectStage, ProjectTask, CreateProjectStageDTO, ProjectTaskPriority, ProjectTaskStatus } from '../../../types';

interface ProjectStagesDialogsProps {
  // Этапы
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  editingStage: ProjectStage | null;
  formData: CreateProjectStageDTO;
  setFormData: (data: CreateProjectStageDTO) => void;
  handleSaveStage: () => void;
  
  // Задачи
  isTaskDialogOpen: boolean;
  setIsTaskDialogOpen: (open: boolean) => void;
  editingTask: ProjectTask | null;
  taskFormData: Partial<ProjectTask>;
  setTaskFormData: (data: Partial<ProjectTask>) => void;
  handleSaveTask: () => void;
  isCreatingTask: boolean;
}

export const ProjectStagesDialogs = ({
  isDialogOpen,
  setIsDialogOpen,
  editingStage,
  formData,
  setFormData,
  handleSaveStage,
  isTaskDialogOpen,
  setIsTaskDialogOpen,
  editingTask,
  taskFormData,
  setTaskFormData,
  handleSaveTask,
  isCreatingTask,
}: ProjectStagesDialogsProps) => {
  const { t } = useTranslation();

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingStage 
                ? t('projects.stages.edit_title', { name: editingStage.name })
                : t('projects.stages.create_title')}
            </DialogTitle>
            <DialogDescription>
              {t('projects.stages.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('projects.stages.field.name')} *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('projects.stages.placeholder.name')}
                />
              </div>
              
              <div className="space-y-2">
                <Label>{t('projects.stages.field.budget')}</Label>
                <MoneyInput
                  value={formData.budget || 0}
                  onValueChange={(v) => setFormData({ ...formData, budget: v })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('projects.stages.field.description')}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('projects.stages.placeholder.description')}
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('projects.stages.field.start_date')} *</Label>
                <DatePicker
                  value={formData.startDate}
                  onChange={(v) => setFormData({ ...formData, startDate: v })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>{t('projects.stages.field.end_date')} *</Label>
                <DatePicker
                  value={formData.endDate}
                  onChange={(v) => setFormData({ ...formData, endDate: v })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('projects.stages.field.planned_start_date')}</Label>
                <DatePicker
                  value={formData.plannedStartDate}
                  onChange={(v) => setFormData({ ...formData, plannedStartDate: v })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>{t('projects.stages.field.planned_end_date')}</Label>
                <DatePicker
                  value={formData.plannedEndDate}
                  onChange={(v) => setFormData({ ...formData, plannedEndDate: v })}
                />
              </div>
            </div>
            
            {editingStage && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isCompleted"
                  checked={formData.isCompleted || false}
                  onChange={(e) => setFormData({ ...formData, isCompleted: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isCompleted" className="font-normal">
                  {t('projects.stages.status.completed')}
                </Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveStage} disabled={!formData.name || !formData.startDate || !formData.endDate}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTask 
                ? t('projects.stages.edit_task_title', { title: editingTask.title })
                : t('projects.stages.add_task')}
            </DialogTitle>
            <DialogDescription>
              {editingTask 
                ? t('projects.stages.edit_task_description')
                : t('projects.stages.create_task_description')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>{t('projects.stages.field.task_title')} *</Label>
              <Input
                value={taskFormData.title}
                onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                placeholder={t('projects.stages.placeholder.task_title')}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>{t('projects.stages.field.priority')}</Label>
              <Select
                value={taskFormData.priority}
                onValueChange={(v) => setTaskFormData({ ...taskFormData, priority: v as ProjectTaskPriority })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">{t('projects.stages.priority.low')}</SelectItem>
                  <SelectItem value="Medium">{t('projects.stages.priority.medium')}</SelectItem>
                  <SelectItem value="High">{t('projects.stages.priority.high')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('projects.stages.field.status')}</Label>
              <Select
                value={taskFormData.status}
                onValueChange={(v) => setTaskFormData({ ...taskFormData, status: v as ProjectTaskStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="To Do">{t('projects.stages.task_status.To Do')}</SelectItem>
                  <SelectItem value="In Progress">{t('projects.stages.task_status.In Progress')}</SelectItem>
                  <SelectItem value="Done">{t('projects.stages.task_status.Done')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('projects.stages.field.assignee')}</Label>
              <Input
                value={taskFormData.assignee}
                onChange={(e) => setTaskFormData({ ...taskFormData, assignee: e.target.value })}
                placeholder={t('projects.stages.placeholder.assignee')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('projects.stages.field.due_date')}</Label>
              <DatePicker
                value={taskFormData.dueDate}
                onChange={(v) => setTaskFormData({ ...taskFormData, dueDate: v })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveTask} disabled={!taskFormData.title || isCreatingTask}>
              {isCreatingTask ? t('common.loading') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
