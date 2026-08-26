import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTemplates } from '../hooks/useTemplates';
import { templatesApi } from '../api';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BulkGenerateDocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  entityIds: (string | number)[];
  onSuccess?: () => void;
}

export function BulkGenerateDocumentsDialog({
  open,
  onOpenChange,
  moduleId,
  entityIds,
  onSuccess
}: BulkGenerateDocumentsDialogProps) {
  const { data: templates = [], isLoading } = useTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const activeTemplates = templates.filter(t => t.isActive && t.moduleId === moduleId);

  const handleGenerate = async () => {
    if (!selectedTemplateId || entityIds.length === 0) return;
    
    setIsGenerating(true);
    try {
      await templatesApi.generateDocumentBulkAsync(Number(selectedTemplateId), entityIds);
      
      toast.success('Массовая генерация запущена. Мы пришлем уведомление, когда архив будет готов.');
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error('Failed to start bulk generate documents:', err);
      toast.error('Произошла ошибка при запуске массовой генерации документов');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Массовая генерация документов</DialogTitle>
          <DialogDescription>
            Выбрано записей: {entityIds.length}. Выберите шаблон для генерации документов.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Шаблон</label>
            <Select 
              value={selectedTemplateId} 
              onValueChange={setSelectedTemplateId}
              disabled={isLoading || activeTemplates.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? 'Загрузка...' : 'Выберите шаблон'} />
              </SelectTrigger>
              <SelectContent>
                {activeTemplates.map(t => (
                  <SelectItem key={t.id} value={t.id.toString()}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeTemplates.length === 0 && !isLoading && (
              <p className="text-xs text-muted-foreground mt-1">Нет активных шаблонов для этого модуля.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Отмена
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={!selectedTemplateId || isGenerating || activeTemplates.length === 0}
          >
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Запустить генерацию
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
