import { useState, useRef, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import { useMailContext } from '../../context/useMailContext';

interface Attachment {
  id: string;
  filename: string;
  size: number;
  contentType: string;
  url?: string;
}

interface MailTemplate {
  id: string;
  name: string;
  subject?: string;
  content: string;
}

interface ComposeApiErrorLike {
  message?: string;
  response?: {
    data?: {
      details?: string;
    };
  };
}

interface UseMailComposeProps {
  accountId?: string;
  onSent?: () => void;
  onClose: () => void;
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
  open: boolean;
}

export function useMailComposeLogic({
  accountId,
  onSent,
  onClose,
  replyTo,
  draft,
  open
}: UseMailComposeProps) {
  const { t } = useTranslation();

  const initialTo = replyTo?.senderEmail || draft?.to || '';
  const initialSubject = replyTo ? `Re: ${replyTo.subject}` : (draft?.subject || '');
  const initialBody = (() => {
    if (replyTo?.content) {
      const date = new Date(replyTo.date).toLocaleString('ru-RU');
      return `\n\n---\n${replyTo.sender} <${replyTo.senderEmail}>, ${date}:\n\n> ${replyTo.content.split('\n').join('\n> ')}`;
    }
    return draft?.body || '';
  })();

  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [cc, setCc] = useState(() => draft?.cc || '');
  const [bcc, setBcc] = useState(() => draft?.bcc || '');

  const { accounts } = useMailContext();
  const [fromAccountId, setFromAccountId] = useState(() => {
    if (replyTo?.accountEmail) {
      const match = accounts.find(a => a.email === replyTo.accountEmail);
      if (match) return match.id;
    }
    if (accountId && accountId !== 'all') return accountId;
    return accounts?.[0]?.id || '';
  });

  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(!!draft || !!replyTo);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isHtmlMode, setIsHtmlMode] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(draft?.id || null);

  const [templates, setTemplates] = useState<MailTemplate[]>([]);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const initialDataRef = useRef({ to: initialTo, subject: initialSubject, body: initialBody });
  const [hasChanged, setHasChanged] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track changes
  useEffect(() => {
    if (open && !hasChanged) {
      if (to !== initialDataRef.current.to || 
          subject !== initialDataRef.current.subject || 
          body !== initialDataRef.current.body) {
        setHasChanged(true);
      }
    }
  }, [to, subject, body, open, hasChanged]);

  const handleSaveDraft = useCallback(async () => {
    if (!fromAccountId) {
      toast.error(t('mail.errors.account_not_selected'));
      return;
    }

    try {
      setSavingDraft(true);

      const payload = {
        accountId: fromAccountId,
        to: to || '',
        subject: subject || t('mail.no_subject'),
        content: body || '',
        saveToSent: false,
        cc: cc || undefined,
        bcc: bcc || undefined
      };

      if (draftId) {
        toast.info(t('mail.filters.filter_updated'));
      } else {
        const response = await api.post('/mail', payload) as { mailId: string };
        setDraftId(response.mailId);
        toast.success(t('mail.filters.filter_created'));
      }
    } catch (error) {
      console.error('Draft save error:', error);
      toast.error(t('mail.errors.save_draft_failed'));
    } finally {
      setSavingDraft(false);
    }
  }, [fromAccountId, to, subject, body, cc, bcc, draftId, t]);

  // Auto-save timer (30 seconds)
  useEffect(() => {
    if (open && hasChanged && !draftId && !savingDraft) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      
      autoSaveTimerRef.current = setTimeout(() => {
        handleSaveDraft();
      }, 30000);
    }

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [open, hasChanged, draftId, handleSaveDraft, savingDraft]);

  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const data = await api.get('/mail/templates') as MailTemplate[];
      setTemplates(data || []);
    } catch (err) {
      toast.error(t('mail.errors.load_failed'));
    } finally {
      setLoadingTemplates(false);
    }
  }, [t]);

  const handleApplyTemplate = (template: MailTemplate) => {
    if (template.subject && !subject) setSubject(template.subject);
    
    const newBody = body ? `${body}\n\n${template.content}` : template.content;
    setBody(newBody);
    
    setIsTemplateDialogOpen(false);
    toast.success(`${t('mail.filters.template_applied')}: ${template.name}`);
  };

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      const resetTimer = setTimeout(() => {
        setTo('');
        setSubject('');
        setBody('');
        setCc('');
        setBcc('');
        setAttachments([]);
        setDraftId(null);
        setHasChanged(false);
      }, 0);

      return () => clearTimeout(resetTimer);
    }
  }, [open]);

  const handleSend = async () => {
    if (!to.trim()) {
      toast.error(t('mail.errors.to_required'));
      return;
    }

    if (!subject.trim()) {
      toast.error(t('mail.errors.subject_required'));
      return;
    }

    if (!body.trim()) {
      toast.error(t('mail.errors.body_required'));
      return;
    }

    if (!fromAccountId) {
      toast.error(t('mail.errors.account_not_selected'));
      return;
    }

    try {
      setLoading(true);

      const attachmentIds = attachments.map(a => a.id);

      await api.post('/mail', {
        accountId: fromAccountId,
        to: to.split(',').map(e => e.trim()).filter(Boolean),
        cc: cc ? cc.split(',').map(e => e.trim()).filter(Boolean) : [],
        bcc: bcc ? bcc.split(',').map(e => e.trim()).filter(Boolean) : [],
        subject,
        content: body,
        htmlContent: isHtmlMode ? body : undefined,
        attachmentIds: attachmentIds.length > 0 ? attachmentIds : undefined
      });

      toast.success(t('mail.actions.sent_success'));

      onSent?.();
      onClose();
    } catch (error: unknown) {
      console.error('❌ Failed to send mail:', error);
      const composeError = error as ComposeApiErrorLike;
      const errorMsg = composeError.response?.data?.details || composeError.message || t('mail.errors.send_failed');
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    if (draftId || !hasChanged) {
      onClose();
      return;
    }

    const confirmClose = await import('@/components/ui/confirm-dialog').then(m =>
      m.showConfirm({ 
        title: t('mail.compose.close_draft_title'), 
        description: t('mail.compose.close_draft_desc'), 
        confirmText: t('common.close'), 
        variant: 'destructive' 
      })
    );
    if (!confirmClose) return;
    
    onClose();
  };

  return {
    to, setTo,
    subject, setSubject,
    body, setBody,
    cc, setCc,
    bcc, setBcc,
    loading, setLoading,
    showAdvanced, setShowAdvanced,
    attachments, setAttachments,
    uploading, setUploading,
    uploadProgress, setUploadProgress,
    isHtmlMode, setIsHtmlMode,
    savingDraft, setSavingDraft,
    draftId, setDraftId,
    templates, setTemplates,
    isTemplateDialogOpen, setIsTemplateDialogOpen,
    loadingTemplates, setLoadingTemplates,
    hasChanged, setHasChanged,
    handleSaveDraft,
    fetchTemplates,
    handleApplyTemplate,
    handleSend,
    handleClose,
    accounts,
    fromAccountId,
    setFromAccountId,
  };
}
