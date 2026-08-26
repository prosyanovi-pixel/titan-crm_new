/**
 * Диалог сохранения конфигурации отчёта
 */

import { useState, useEffect, useMemo } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ChartType, ReportConfigFormData } from '../../types/reports.types';
import { useStatuses } from '@/components/ui/status-system';
import { useTranslation } from '@/lib/i18n';

interface SaveConfigDialogProps {
  open:          boolean;
  onClose:       () => void;
  onSave:        (data: Pick<ReportConfigFormData, 'name' | 'description' | 'chartType' | 'isShared' | 'status'>) => Promise<void>;
  initialName?:  string;
  initialStatus?: string;
  isSaving?:     boolean;
}

/**
 * Диалог сохранения / переименования конфигурации отчёта
 */
export function SaveConfigDialog({ open, onClose, onSave, initialName = '', initialStatus, isSaving = false }: SaveConfigDialogProps) {
  const { t } = useTranslation();
  const [name,        setName]        = useState(initialName);
  const [description, setDescription] = useState('');
  const [chartType,   setChartType]   = useState<ChartType>('table');
  const [isShared,    setIsShared]    = useState(false);
  const [status,      setStatus]      = useState<string | undefined>(undefined);

  const chartTypeOptions = useMemo<{ value: ChartType; label: string }[]>(() => [
    { value: 'table', label: t('reports.save_dialog_chart_types_table') },
    { value: 'bar',   label: t('reports.save_dialog_chart_types_bar') },
    { value: 'line',  label: t('reports.save_dialog_chart_types_line') },
    { value: 'pie',   label: t('reports.save_dialog_chart_types_pie') },
  ], [t]);

  const [prevInitialName, setPrevInitialName] = useState(initialName);
  if (initialName !== prevInitialName) {
    setPrevInitialName(initialName);
    setName(initialName);
  }

  const [prevInitialStatus, setPrevInitialStatus] = useState(initialStatus);
  if (initialStatus !== prevInitialStatus) {
    setPrevInitialStatus(initialStatus);
    setStatus(initialStatus);
  }

  const { statuses, isLoading: statusesLoading } = useStatuses({ module: 'reports' });

  const handleSave = async () => {
    if (!name.trim()) return;
    await onSave({ name: name.trim(), description: description.trim() || undefined, chartType, isShared, status });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            {t('reports.save_dialog_title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Название */}
          <div className="space-y-1.5">
            <Label htmlFor="report-name">
              {t('reports.save_dialog_name_label')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="report-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('reports.save_dialog_name_placeholder')}
              autoFocus
            />
          </div>

          {/* Описание */}
          <div className="space-y-1.5">
            <Label htmlFor="report-desc">{t('reports.save_dialog_desc_label')}</Label>
            <Textarea
              id="report-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('reports.save_dialog_desc_placeholder')}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Тип визуализации */}
          <div className="space-y-1.5">
            <Label>{t('reports.save_dialog_chart_type_label')}</Label>
            <Select value={chartType} onValueChange={v => setChartType(v as ChartType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {chartTypeOptions
                  .filter((opt) => opt.value !== undefined && opt.value !== null && String(opt.value) !== '')
                  .map(opt => (
                    <SelectItem key={String(opt.value)} value={String(opt.value)}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Поделиться */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="share-toggle" className="cursor-pointer">
                {t('reports.save_dialog_share_label')}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t('reports.save_dialog_share_desc')}
              </p>
            </div>
            <Switch
              id="share-toggle"
              checked={isShared}
              onCheckedChange={setIsShared}
            />
          </div>

          {/* Статус */}
          <div className="space-y-1.5">
            <Label>{t('reports.save_dialog_status_label')}</Label>
            <Select value={status ?? ''} onValueChange={(v) => setStatus(v || undefined)}>
              <SelectTrigger>
                <SelectValue placeholder={t('reports.save_dialog_status_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {statuses && statuses.length > 0 ? (
                  statuses
                    .filter(s => s && s.id)
                    .map(opt => (
                       <SelectItem key={String(opt.id)} value={String(opt.id)}>{opt.name}</SelectItem>
                    ))
                ) : (
                  <SelectItem value="draft">{t('reports.save_dialog_draft_label')}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {t('reports.save_dialog_cancel_button')}
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || isSaving}>
            {isSaving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('reports.save_dialog_saving_button')}</>
            ) : (
              <><Save className="w-4 h-4 mr-2" />{t('reports.save_dialog_save_button')}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
