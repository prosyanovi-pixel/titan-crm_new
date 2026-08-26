import React, { useState, useRef } from 'react';
import { Paperclip, FileText, X, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from './button';
import { Progress } from './progress';
import { Badge } from './badge';
import { useTranslation } from '@/lib/i18n';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useConfirm } from '@/components/ui/confirm-dialog';

export interface NoteAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  addedAt: string;
}

export interface NoteAttachmentUploaderProps {
  /** Загруженные вложения */
  attachments?: NoteAttachment[];
  
  /** Добавление вложения */
  onAddAttachment: (attachment: NoteAttachment) => void;
  
  /** Удаление вложения */
  onRemoveAttachment: (attachmentId: string) => void;
  
  /** Максимальный размер файла (по умолчанию 50MB) */
  maxSize?: number;
  
  /** Разрешённые типы файлов */
  accept?: string;
  
  /** Отключить компонент */
  disabled?: boolean;
  
  /** Класс контейнера */
  className?: string;
}

/**
 * Компонент загрузки вложений для заметок
 * 
 * @example
 * ```tsx
 * <NoteAttachmentUploader
 *   attachments={note.attachments}
 *   onAddAttachment={handleAddAttachment}
 *   onRemoveAttachment={handleRemoveAttachment}
 * />
 * ```
 */
export function NoteAttachmentUploader({
  attachments = [],
  onAddAttachment,
  onRemoveAttachment,
  maxSize = 50 * 1024 * 1024,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt,.zip,.rar',
  disabled = false,
  className,
}: NoteAttachmentUploaderProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isAttachmentDialogOpen, setIsAttachmentDialogOpen] = useState(false);
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentType, setAttachmentType] = useState('other');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const { confirm } = useConfirm();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleOpenDialog = () => {
    setAttachmentName('');
    setAttachmentType('other');
    setSelectedFile(null);
    setIsAttachmentDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize) {
      toast.error(t('common.file_too_large', { size: formatFileSize(maxSize) }));
      return;
    }

    setAttachmentName(file.name);
    setSelectedFile(file);
  };

  const handleUploadAttachment = async () => {
    if (!selectedFile && !attachmentName.trim()) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      
      if (selectedFile) {
        formData.append('file', selectedFile);
        formData.append('name', attachmentName || selectedFile.name);
      } else {
        formData.append('name', attachmentName);
      }
      
      formData.append('type', attachmentType);

      const userId = localStorage.getItem('titan_user_id') || '';
      const userName = localStorage.getItem('titan_user_name') || 'User';

      // Encode header values to handle non-ASCII characters (Cyrillic)
      const response = await api.post('/legal-cases/documents', formData, {
        headers: {
          'x-user-id': userId,
          'x-user-name': encodeURIComponent(userName),
        },
      });

      const newAttachment: NoteAttachment = {
        id: `attach_${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        name: response.name || attachmentName,
        url: response.url || `/api/legal-cases/documents/files/${response.filename}`,
        type: attachmentType,
        addedAt: new Date().toLocaleDateString('ru-RU'),
      };

      onAddAttachment(newAttachment);
      setIsAttachmentDialogOpen(false);
      setAttachmentName('');
      setAttachmentType('other');
      setSelectedFile(null);
      toast.success(t('general.toast.success.file_uploaded'));
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(t('general.toast.error.file_upload'));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className={className}>
      {/* Кнопка добавления вложения */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpenDialog}
        disabled={disabled}
        className="gap-2"
      >
        <Paperclip className="w-3 h-3" />
        {t('common.add_file')}
      </Button>

      {/* Список вложений */}
      {attachments.length > 0 && (
        <div className="mt-2 space-y-1">
          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <Paperclip className="w-3 h-3" />
            {t('common.note_item.attached_documents')}
          </div>
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 text-xs p-2 bg-muted/50 rounded-md"
            >
              <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 truncate text-primary hover:underline"
                title={attachment.name}
              >
                {attachment.name}
              </a>
              <Badge variant="secondary" className="text-[10px] shrink-0">
                {t(`common.document_types.${attachment.type}`, { defaultValue: attachment.type })}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-destructive hover:bg-destructive/10 shrink-0"
                onClick={async () => {
                  const confirmed = await confirm(t('common.confirm_delete_attachment'));
                  if (confirmed) onRemoveAttachment(attachment.id);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Dialog для добавления вложения */}
      {isAttachmentDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold">{t('common.add_attachment')}</h3>
            
            {/* Выбор файла */}
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full gap-2"
              >
                <Upload className="w-4 h-4" />
                {selectedFile ? selectedFile.name : t('common.select_file')}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={accept}
                onChange={handleFileSelect}
              />
              {selectedFile && (
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              )}
            </div>

            {/* Название */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('common.name')}</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                placeholder={t('common.uploader.placeholder_example')}
              />
            </div>

            {/* Тип документа */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('common.type_document')}</label>
              <select
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={attachmentType}
                onChange={(e) => setAttachmentType(e.target.value)}
              >
                <option value="contract">{t('common.document_types.contract')}</option>
                <option value="invoice">{t('common.document_types.invoice')}</option>
                <option value="letter">{t('common.document_types.letter')}</option>
                <option value="act">{t('common.document_types.act')}</option>
                <option value="protocol">{t('common.document_types.protocol')}</option>
                <option value="ruling">{t('common.document_types.ruling')}</option>
                <option value="decision">{t('common.document_types.decision')}</option>
                <option value="claim">{t('common.document_types.claim')}</option>
                <option value="power_of_attorney">{t('common.document_types.power_of_attorney')}</option>
                <option value="correspondence">{t('common.document_types.correspondence')}</option>
                <option value="other">{t('common.document_types.other')}</option>
              </select>
            </div>

            {/* Прогресс загрузки */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t('common.loading')}...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Кнопки */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsAttachmentDialogOpen(false)}
                disabled={isUploading}
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleUploadAttachment}
                disabled={!attachmentName.trim() || isUploading}
              >
                {isUploading ? `${t('common.loading')}...` : t('common.add')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
