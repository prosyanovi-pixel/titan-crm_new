import React, { useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RichTextEditor } from './RichTextEditor';
import { useTranslation } from '@/lib/i18n';
import {
  Paperclip,
  File,
  Trash2,
  BookTemplate,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Attachment {
  id: string;
  filename: string;
  size: number;
  contentType: string;
  url?: string;
}

interface MailComposeEditorProps {
  body: string;
  onBodyChange: (value: string) => void;
  isHtmlMode: boolean;
  onIsHtmlModeChange: (value: boolean) => void;
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  uploading: boolean;
  uploadProgress: number;
  onUploadingChange: (uploading: boolean) => void;
  onUploadProgressChange: (progress: number) => void;
  disabled?: boolean;
  draftId?: string | null;
  accountId?: string;
  to?: string;
  subject?: string;
  onTemplateClick?: () => void;
  onSaveDraft?: () => void;
  savingDraft?: boolean;
  loadingTemplates?: boolean;
}

const fixMojibake = (value: string) => {
  if (!value) return value;
  if (!/[ÐÑÃ]/.test(value)) return value;
  try {
    const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0));
    const decoded = new TextDecoder('utf-8').decode(bytes);
    return decoded.includes('\u0000') ? value : decoded;
  } catch {
    return value;
  }
};

const formatFileSize = (bytes: number): string => {
  if (!Number.isFinite(bytes)) return '';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const normalizeAttachment = (attachment: any): Attachment => ({
  id: attachment?.id || '',
  filename: fixMojibake(attachment?.filename || attachment?.name || 'attachment'),
  size: Number(attachment?.size ?? attachment?.file_size ?? 0),
  contentType: attachment?.contentType || attachment?.content_type || '',
  url: attachment?.url || attachment?.stored_path,
});

export function MailComposeEditor({
  body, onBodyChange, isHtmlMode, onIsHtmlModeChange, attachments, onAttachmentsChange,
  uploading, uploadProgress, onUploadingChange, onUploadProgressChange,
  disabled = false, draftId, accountId, to, subject, onTemplateClick, onSaveDraft,
  savingDraft = false, loadingTemplates = false,
}: MailComposeEditorProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    let tempMailId = draftId;
    if (!tempMailId) {
      try {
        const tempRes = await api.post('/mail', {
          accountId: accountId || '',
          to: to || 'temp@example.com',
          subject: subject || t('mail.no_subject'),
          content: body || '',
          saveToSent: false
        });
        tempMailId = tempRes.mailId;
      } catch (error) {
        toast.error(t('mail.errors.create_failed'));
        return;
      }
    }

    onUploadingChange(true);
    onUploadProgressChange(0);

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        currentProgress = Math.min(currentProgress + 10, 90);
        onUploadProgressChange(currentProgress);
      }, 200);

      const response = await api.post(`/mail/${tempMailId}/attachments`, formData) as any[];
      clearInterval(progressInterval);
      onUploadProgressChange(100);

      const uploaded = Array.isArray(response) ? response : [];
      const fileList = Array.from(files);
      const normalized = uploaded.map((item, index) => {
        const fallbackSize = fileList[index]?.size ?? 0;
        const responseSize = Number(item?.size ?? item?.file_size);
        const size = Number.isFinite(responseSize) && responseSize > 0 ? responseSize : fallbackSize;
        return normalizeAttachment({ ...item, size });
      });

      onAttachmentsChange([...attachments, ...normalized]);
      toast.success(`${t('mail.filters.uploaded')} ${normalized.length}`);
    } catch (error) {
      toast.error(t('mail.errors.upload_failed'));
    } finally {
      onUploadingChange(false);
      onUploadProgressChange(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [accountId, to, subject, body, draftId, attachments, onAttachmentsChange, onUploadingChange, onUploadProgressChange, t]);

  const handleRemoveAttachment = useCallback(async (attachmentId: string) => {
    try {
      await api.delete(`/mail/attachments/${attachmentId}`);
      onAttachmentsChange(attachments.filter(a => a.id !== attachmentId));
      toast.success(t('mail.filters.attachment_deleted'));
    } catch (error) {
      toast.error(t('mail.errors.delete_failed'));
    }
  }, [attachments, onAttachmentsChange, t]);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="body" className="text-sm font-medium">
          {t('mail.body')} <span className="text-red-500">*</span>
        </Label>
        {isHtmlMode ? (
          <RichTextEditor content={body} onChange={onBodyChange} className="min-h-[300px]" />
        ) : (
          <Textarea
            id="body" placeholder={t('mail.placeholder')}
            value={body} onChange={(e) => onBodyChange(e.target.value)}
            disabled={disabled} className="min-h-[300px] resize-y font-mono text-sm"
          />
        )}
      </div>

      {(attachments.length > 0 || uploading) && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('mail.attachments')}</Label>
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <Badge key={attachment.id} variant="secondary" className="flex items-center gap-2 px-3 py-1.5 h-auto">
                <File className="h-3.5 w-3.5" />
                <span className="max-w-[150px] truncate" title={attachment.filename}>{attachment.filename}</span>
                <span className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</span>
                <button onClick={() => handleRemoveAttachment(attachment.id)} className="ml-1 hover:text-destructive transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </Badge>
            ))}
          </div>
          {uploading && (
            <div className="space-y-1">
              <Progress value={uploadProgress} className="h-1" />
              <p className="text-xs text-muted-foreground">{t('mail.filters.uploading')}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 pt-2">
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple disabled={disabled || uploading} />
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={disabled || uploading} className="gap-2">
          <Paperclip className="h-4 w-4" />
          {t('mail.attachment')}
        </Button>
        {onSaveDraft && (
          <Button variant="outline" size="sm" onClick={onSaveDraft} disabled={disabled} className="gap-2">
            {savingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : '💾'}
            {savingDraft ? t('common.saving') : t('mail.save_draft')}
          </Button>
        )}
        {onTemplateClick && (
          <Button variant="outline" size="sm" onClick={onTemplateClick} className="gap-2 text-primary border-primary/20 hover:bg-primary/5">
            <BookTemplate className="h-4 w-4" />
            {t('mail.filters.templates')}
          </Button>
        )}
      </div>
    </div>
  );
}

