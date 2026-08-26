import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { GridColorPicker } from '@/components/ui/GridColorPicker';
import { X, Check, Info, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import type { CreateProjectStageDTO } from '../../../types';

interface ProjectStageInlineFormProps {
  onSave: (data: CreateProjectStageDTO) => void;
  onCancel: () => void;
}

/**
 * Встроенная форма добавления этапа.
 * Повторяет дизайн из модуля контрагентов для единообразия UX.
 */
export function ProjectStageInlineForm({ onSave, onCancel }: ProjectStageInlineFormProps) {
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState<CreateProjectStageDTO>({
    name: '',
    description: '',
    startDate: format(new Date(), 'dd.MM.yyyy'),
    endDate: format(new Date(), 'dd.MM.yyyy'),
    budget: 0,
    color: '',
  });

  const handleSave = () => {
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  return (
    <div className="border-2 border-primary/20 rounded-xl p-4 bg-primary/5 space-y-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Основная информация */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-primary/60">
            <Info className="w-3 h-3" />
            {t('common.basic_info')}
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
              {t('projects.stages.field.name')} *
            </Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('projects.stages.placeholder.name')}
              className="h-10 bg-background"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
              {t('projects.stages.field.description')}
            </Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('projects.stages.placeholder.description')}
              rows={2}
              className="bg-background resize-none"
            />
          </div>
        </div>

        {/* Сроки и Финансы */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-primary/60">
            <Calendar className="w-3 h-3" />
            {t('projects.stages.field.dates')} & {t('projects.stages.field.budget')}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                {t('projects.stages.field.start_date')} *
              </Label>
              <DatePicker
                value={formData.startDate}
                onChange={(v) => setFormData({ ...formData, startDate: v })}
                className="w-full bg-background"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                {t('projects.stages.field.end_date')} *
              </Label>
              <DatePicker
                value={formData.endDate}
                onChange={(v) => setFormData({ ...formData, endDate: v })}
                className="w-full bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-end">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                {t('projects.stages.field.budget')}
              </Label>
              <MoneyInput
                value={formData.budget || 0}
                onValueChange={(v) => setFormData({ ...formData, budget: v })}
                className="h-10 bg-background"
              />
            </div>
            
            <div className="flex items-center gap-2 pb-1">
               <GridColorPicker 
                value={formData.color} 
                onChange={(color) => setFormData({ ...formData, color })} 
                className="h-9 px-2 shrink-0 bg-background border"
              />
              <span className="text-[10px] font-bold uppercase text-muted-foreground">
                {t('projects.stages.field.color')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end pt-2 border-t border-primary/10 gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel} className="h-8">
          <X className="w-4 h-4 mr-1" />
          {t('common.cancel')}
        </Button>
        <Button 
          size="sm" 
          onClick={handleSave} 
          disabled={!formData.name || !formData.startDate || !formData.endDate}
          className="h-8 px-4 bg-primary hover:bg-primary/90 shadow-md"
        >
          <Check className="w-4 h-4 mr-1" />
          {t('common.save')}
        </Button>
      </div>
    </div>
  );
}
