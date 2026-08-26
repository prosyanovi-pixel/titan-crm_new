import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { GridColorPicker } from '@/components/ui/GridColorPicker';
import { ResizableSheet } from '@/components/shared';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { 
  Info, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  ListChecks, 
  Rocket, 
  Calendar as CalendarIcon, 
  CheckCircle,
  Hash,
  Clock
} from 'lucide-react';
import type { ProjectStage, CreateProjectStageDTO } from '../../../types';

interface ProjectStagesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingStage: ProjectStage | null;
  formData: CreateProjectStageDTO;
  setFormData: (data: CreateProjectStageDTO) => void;
  onSave: () => void;
  onDelete?: () => void;
  moduleKey?: string;
}

export function ProjectStagesSheet({
  open,
  onOpenChange,
  editingStage,
  formData,
  setFormData,
  onSave,
  onDelete,
  moduleKey = 'project-stages-sheet',
}: ProjectStagesSheetProps) {
  const { t } = useTranslation();

  const typeOptions = [
    { value: "stage", label: t('projects.stages.stage_type_options.stage'), icon: ListChecks, color: "text-blue-500" },
    { value: "milestone", label: t('projects.stages.stage_type_options.milestone'), icon: Rocket, color: "text-orange-500" },
    { value: "meeting", label: t('projects.stages.stage_type_options.meeting'), icon: CalendarIcon, color: "text-purple-500" },
    { value: "delivery", label: t('projects.stages.stage_type_options.delivery'), icon: CheckCircle, color: "text-green-500" },
  ];

  return (
    <ResizableSheet
      open={open}
      onOpenChange={onOpenChange}
      onSave={onSave}
      onDelete={onDelete}
      moduleKey={moduleKey}
      saveDisabled={!formData.name || !formData.startDate || !formData.endDate}
      title={editingStage ? t('projects.stages.edit_title_base') : t('projects.stages.create_title')}
      defaultWidth="md"
    >
      <div className="space-y-6 py-2 pb-10">
        
        {/* Группа 1: Основная информация */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between gap-4">
             <Input 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('projects.stages.placeholder.name')}
                className="text-lg font-semibold border-none p-0 focus-visible:ring-0 h-auto placeholder:text-muted-foreground/50 flex-1"
              />
              <GridColorPicker 
                value={formData.color} 
                onChange={(color) => setFormData({ ...formData, color })} 
                className="h-8 px-2 shrink-0 border-none bg-muted/30"
              />
          </div>
          
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <Label className="text-[15px] font-medium text-foreground/80">{t('projects.stages.stage_type')}</Label>
            <Select 
              value={formData.type || 'stage'} 
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger className="w-auto border-none p-0 h-auto focus:ring-0 text-foreground font-medium bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeOptions
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
                  value={formData.startDate}
                  onChange={(v) => setFormData({ ...formData, startDate: v })}
                  className="border-none p-0 h-auto font-medium text-primary hover:bg-transparent focus:ring-0"
                />
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between">
                <Label className="text-[14px] font-medium text-foreground/80 pl-1">{t('projects.stages.actual_end')}</Label>
                <DatePicker
                  value={formData.endDate}
                  onChange={(v) => setFormData({ ...formData, endDate: v })}
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
                  value={formData.plannedStartDate}
                  onChange={(v) => setFormData({ ...formData, plannedStartDate: v })}
                  className="border-none p-0 h-auto font-medium text-muted-foreground hover:bg-transparent focus:ring-0"
                  placeholder="—"
                />
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between">
                <Label className="text-[14px] font-medium text-foreground/80/70 italic pl-1">{t('projects.stages.planned_end_label')}</Label>
                <DatePicker
                  value={formData.plannedEndDate}
                  onChange={(v) => setFormData({ ...formData, plannedEndDate: v })}
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
                value={formData.budget || 0}
                onValueChange={(v) => setFormData({ ...formData, budget: v })}
                className="border-none text-right font-semibold focus-visible:ring-0 h-auto p-0 bg-transparent"
              />
            </div>
          </div>
          
          <div className="px-4 py-3 flex items-center justify-between">
            <Label className="text-[15px] font-medium text-foreground/80">{t('projects.stages.field.status')}</Label>
            <div className="flex items-center gap-3">
              <span className={cn(
                "text-sm font-medium",
                formData.isCompleted ? "text-green-600" : "text-muted-foreground"
              )}>
                {formData.isCompleted ? t('projects.stages.status.completed') : t('projects.stages.status.pending')}
              </span>
              <input
                type="checkbox"
                id="isCompleted-sheet"
                checked={formData.isCompleted || false}
                onChange={(e) => setFormData({ ...formData, isCompleted: e.target.checked })}
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
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('projects.stages.placeholder.description')}
              className="min-h-[150px] border-none p-0 focus-visible:ring-0 resize-y bg-transparent placeholder:text-muted-foreground/40 text-sm" 
            />
          </div>
        </div>

      </div>
    </ResizableSheet>
  );
}
