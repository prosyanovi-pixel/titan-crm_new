import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Settings, FileText, Mail, Scale, FileSignature } from 'lucide-react';
import { Template } from '../types';
import { templatesApi } from '../api';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import { useNavigate } from 'react-router-dom';
import { useDocuments } from '@/modules/documents/hooks/useDocuments';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template | null;
  moduleId: string;
  entityId: string | number;
}

export const DocumentWizardDialog = ({ open, onOpenChange, template, moduleId, entityId }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveOption, setSaveOption] = useState<'default' | 'folder'>('default');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('root');

  const { files } = useDocuments();
  const folders = files.filter(f => f.type === 'folder');

  if (!template) return null;

  const targetAction = template.targetAction || 'none';

  const getActionDetails = (action: string) => {
    switch (action) {
      case 'create_mail':
        return { icon: Mail, label: 'Создать письмо', desc: 'Сгенерированный файл будет прикреплен к новому письму.' };
      case 'create_claim':
        return { icon: Scale, label: 'Создать судебную претензию', desc: 'Файл будет прикреплен к карточке новой претензии.' };
      case 'create_contract':
        return { icon: FileSignature, label: 'Создать договор', desc: 'Будет создана новая карточка договора.' };
      case 'none':
      default:
        return { icon: FileText, label: 'Скачать файл', desc: 'Файл будет просто скачан на ваш компьютер.' };
    }
  };

  const actionDetails = getActionDetails(targetAction);
  const ActionIcon = actionDetails.icon;

  const handleExecute = async () => {
    setIsGenerating(true);
    try {
      if (targetAction === 'none') {
        // Старое поведение (просто скачать)
        const blob = await templatesApi.generateDocument(template.id, entityId, true);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `generated_${template.name}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Документ успешно скачан');
        onOpenChange(false);
        return;
      }

      // Новое поведение через generateAction
      const folderId = saveOption === 'folder' && selectedFolderId !== 'root' ? selectedFolderId : undefined;
      const result = await templatesApi.generateDocumentAction(template.id, entityId, folderId);
      
      if (result.targetAction === 'create_mail') {
        window.dispatchEvent(new CustomEvent('open-global-mail-compose', {
          detail: {
            documentId: result.documentId
          }
        }));
        toast.success('Создано письмо с вложением');
      } else if (result.targetAction === 'create_claim') {
        navigate(`/lawyers?action=create_claim&sourceModule=${moduleId}&sourceId=${entityId}&documentId=${result.documentId}`);
        toast.success('Переход к созданию претензии');
      } else if (result.targetAction === 'create_contract') {
        navigate(`/contracts?action=create_contract&sourceModule=${moduleId}&sourceId=${entityId}&documentId=${result.documentId}`);
        toast.success('Переход к созданию договора');
      } else {
        toast.success('Документ успешно создан и сохранен в системе');
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error('Ошибка при генерации документа');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Settings className="w-5 h-5 text-primary" />
            Мастер документов
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 space-y-6">
          <div className="bg-muted/30 p-4 rounded-xl border flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
              <ActionIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{template.name}</h3>
              <p className="text-sm text-muted-foreground">{actionDetails.desc}</p>
            </div>
          </div>

          {targetAction === 'create_claim' && (
            <div className="text-sm text-muted-foreground bg-amber-500/10 text-amber-600 p-3 rounded-md">
              Внимание: Система автоматически свяжет претензию с текущей карточкой.
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-base font-semibold">Путь сохранения документа</Label>
            <RadioGroup value={saveOption} onValueChange={(v: 'default' | 'folder') => setSaveOption(v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="default" id="save-default" />
                <Label htmlFor="save-default" className="font-normal">По умолчанию (прикрепить к карточке)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="folder" id="save-folder" />
                <Label htmlFor="save-folder" className="font-normal">Выбрать папку в Документах</Label>
              </div>
            </RadioGroup>

            {saveOption === 'folder' && (
              <div className="pt-2 pl-6">
                <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Выберите папку..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="root">Корневая папка</SelectItem>
                    {folders.map(folder => (
                      <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Отмена
          </Button>
          <Button onClick={handleExecute} disabled={isGenerating} className="min-w-[140px]">
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            {isGenerating ? 'Генерация...' : actionDetails.label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
