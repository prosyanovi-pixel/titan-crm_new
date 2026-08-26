import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Paperclip,
  Download,
  Save,
  Loader2,
} from 'lucide-react';
import { Attachment } from '../types';
import {
  formatFileSize,
} from '../utils/componentUtils';
import { getFileIcon } from '../utils/attachmentUtils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MailDisplayAttachmentsProps {
  attachments: Attachment[];
  onDownloadAttachment: (attachmentId: string, filename: string) => Promise<void>;
  onSaveToDocs: (attachmentId: string) => Promise<void>;
  attachmentPreviews: Record<string, string>;
}

export function MailDisplayAttachments({
  attachments,
  onDownloadAttachment,
  onSaveToDocs,
  attachmentPreviews,
}: MailDisplayAttachmentsProps) {
  const [downloadingAttachments, setDownloadingAttachments] = useState<Set<string>>(new Set());

  const handleDownload = async (attachmentId: string, filename: string) => {
    setDownloadingAttachments(prev => new Set(prev).add(attachmentId));
    try {
      await onDownloadAttachment(attachmentId, filename);
    } finally {
      setDownloadingAttachments(prev => {
        const next = new Set(prev);
        next.delete(attachmentId);
        return next;
      });
    }
  };

  const handleSave = async (attachmentId: string) => {
    try {
      await onSaveToDocs(attachmentId);
      toast.success('Сохранено в документы');
    } catch (error) {
      toast.error('Ошибка при сохранении');
    }
  };

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="px-8 pb-10">
      <Separator className="mb-6" />
      <h4 className="text-sm font-bold tracking-tight text-foreground/80 mb-4 flex items-center gap-2">
        <Paperclip className="w-4 h-4" /> Вложения <span className="text-muted-foreground font-normal">({attachments.length})</span>
      </h4>
      <div className="flex flex-wrap gap-4">
        {attachments.map((att) => {
          const isDownloading = downloadingAttachments.has(att.id);
          const Icon = getFileIcon(att);
          const hasPreview = !!attachmentPreviews[att.id];

          return (
            <div
              key={att.id}
              className="flex flex-col w-[200px] group cursor-pointer"
              onClick={() => !isDownloading && handleDownload(att.id, att.name)}
            >
              <div className="h-[140px] w-full rounded-2xl bg-muted/30 border border-border/50 flex items-center justify-center relative overflow-hidden mb-2 shadow-sm transition-all group-hover:shadow-md group-hover:border-primary/30">
                {hasPreview ? (
                  <img src={attachmentPreviews[att.id]} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" alt="" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
                    <Icon className="w-10 h-10" strokeWidth={1.5} />
                  </div>
                )}
                
                {/* Hover overlay with actions */}
                <div className={cn(
                  "absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 transition-opacity",
                  !isDownloading && "group-hover:opacity-100"
                )}>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-10 w-10 rounded-full shadow-lg bg-white/90 hover:bg-white text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(att.id, att.name);
                    }}
                    title="Скачать"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-10 w-10 rounded-full shadow-lg bg-white/90 hover:bg-white text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSave(att.id);
                    }}
                    title="Сохранить в документы"
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                </div>

                {isDownloading && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center backdrop-blur-sm">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <div className="flex flex-col px-1">
                <p className="text-[13px] font-semibold truncate text-foreground/90 group-hover:text-primary transition-colors" title={att.name}>
                  {att.name}
                </p>
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-tight">
                  {formatFileSize(att.size)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
