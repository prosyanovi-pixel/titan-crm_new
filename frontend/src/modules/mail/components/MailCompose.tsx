import React from 'react';
import { useMailContext } from '../context/useMailContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MailComposeForm } from './MailComposeForm';
import { MailComposeEditor } from './MailComposeEditor';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Send,
  Trash2,
  Loader2,
  Minus,
  Maximize2,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useMailComposeLogic } from '../hooks/logic/useMailComposeLogic';
interface MailComposeProps {
  open: boolean;
  onClose: () => void;
  accountId?: string;
  onSent?: () => void;
  variant?: 'dialog' | 'page';
  inline?: boolean;
  replyTo?: {
    subject: string;
    sender: string;
    senderEmail: string;
    content: string;
    date: string;
    recipients?: string[];
    accountEmail?: string;
  };
  draft?: {
    id: string;
    to: string;
    cc: string;
    bcc: string;
    subject: string;
    body: string;
  };
}

export function MailCompose(props: MailComposeProps) {
  const { open, onClose, accountId, inline = false, replyTo, draft } = props;
  const { t } = useTranslation();
  const { isComposeMinimized, setIsComposeMinimized } = useMailContext();
  
  const logic = useMailComposeLogic(props);
  const {
    to, setTo, subject, setSubject, body, setBody, cc, setCc, bcc, setBcc,
    loading, showAdvanced, setShowAdvanced, attachments, setAttachments,
    uploading, uploadProgress, setUploading, setUploadProgress,
    isHtmlMode, setIsHtmlMode, savingDraft, draftId,
    templates, isTemplateDialogOpen, setIsTemplateDialogOpen, loadingTemplates,
    handleSaveDraft, fetchTemplates, handleApplyTemplate, handleSend, handleClose,
    accounts, fromAccountId, setFromAccountId
  } = logic;

  if (!open) return null;

  const titleText = replyTo
    ? (replyTo?.recipients && replyTo.recipients.length > 1 ? t('mail.actions.reply_all') : t('mail.actions.reply'))
    : draft
      ? t('common.edit')
      : t('mail.compose.title');

  return (
    <div className={cn(
      inline ? "flex flex-col h-full w-full bg-background relative" : cn(
        "fixed bottom-0 right-8 z-[40] w-[600px] bg-background border rounded-t-xl shadow-2xl",
        isComposeMinimized ? "h-14" : "h-[650px] max-h-[90vh]"
      )
    )}>
      {/* Header */}
      <div 
        className={cn("flex items-center justify-between px-4 h-14 border-b bg-muted/30 cursor-pointer", !inline && "rounded-t-xl")}
        onClick={() => !inline && isComposeMinimized && setIsComposeMinimized(false)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold truncate max-w-[300px]">
            {titleText}: {subject || `(${t('mail.no_subject')})`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {!inline && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setIsComposeMinimized(!isComposeMinimized); }}>
              {isComposeMinimized ? <Maximize2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleClose(); }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {(!isComposeMinimized || inline) && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <MailComposeForm
                to={to} cc={cc} bcc={bcc} subject={subject}
                onToChange={setTo} onCcChange={setCc} onBccChange={setBcc} onSubjectChange={setSubject}
                showAdvanced={showAdvanced} onShowAdvancedChange={setShowAdvanced}
                disabled={loading || savingDraft}
                fromAccountId={fromAccountId}
                onFromAccountIdChange={setFromAccountId}
                accounts={accounts}
              />
              <MailComposeEditor
                body={body} onBodyChange={setBody} isHtmlMode={isHtmlMode} onIsHtmlModeChange={setIsHtmlMode}
                attachments={attachments} onAttachmentsChange={setAttachments}
                uploading={uploading} uploadProgress={uploadProgress}
                onUploadingChange={setUploading} onUploadProgressChange={setUploadProgress}
                disabled={loading || savingDraft} draftId={draftId} accountId={accountId}
                to={to} subject={subject}
                onTemplateClick={() => { fetchTemplates(); setIsTemplateDialogOpen(true); }}
                onSaveDraft={handleSaveDraft} savingDraft={savingDraft} loadingTemplates={loadingTemplates}
              />
            </div>
          </ScrollArea>
          
          <div className="px-6 py-4 border-t bg-muted/30">
            <div className="flex items-center justify-between">
              <div />
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleClose} disabled={loading || savingDraft}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleSend} disabled={loading || savingDraft || !to || !subject || !body} className="gap-2 bg-primary hover:bg-primary/90">
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> {t('mail.filters.applying')}</>
                  ) : (
                    <><Send className="h-4 w-4" /> {t('mail.actions.send')}</>
                  )}
                </Button>
              </div>
            </div>
            {replyTo && (
              <p className="text-xs text-muted-foreground mt-2">
                {t('mail.reply_to_desc') || 'Ответ на письмо от'} {replyTo.sender} &lt;{replyTo.senderEmail}&gt;
              </p>
            )}
          </div>
        </div>
      )}

      {/* Templates Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('mail.filters.templates') || 'Выберите шаблон'}</DialogTitle>
            <DialogDescription>{t('mail.template_desc')}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {loadingTemplates ? (
              <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
            ) : templates.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{t('mail.no_templates')}</p>
            ) : (
              <ScrollArea className="max-h-[300px]">
                <div className="space-y-2">
                  {templates.map(t_item => (
                    <button key={t_item.id} onClick={() => handleApplyTemplate(t_item)} className="w-full text-left p-3 border rounded-md hover:bg-muted transition-colors">
                      <div className="font-medium">{t_item.name}</div>
                      {t_item.subject && <div className="text-xs text-muted-foreground truncate">{t('mail.subject')}: {t_item.subject}</div>}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

