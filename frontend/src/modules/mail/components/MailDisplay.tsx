import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mail as MailIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Mail, Attachment, MailFilterType, ApiMailFolder } from '../types';
import { useTranslation } from '@/lib/i18n';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { transformMailData } from '../utils/mailUtils';
import {
  getCanonicalSystemKey,
  systemFolderNames,
} from '../utils/componentUtils';
import { isPreviewable, normalizeAttachment } from '../utils/attachmentUtils';
import { useMailContext } from '../context/useMailContext';
import { MailDisplayHeader } from './MailDisplayHeader';
import { MailDisplayActions } from './MailDisplayActions';
import { MailDisplayContent } from './MailDisplayContent';
import { MailDisplayAttachments } from './MailDisplayAttachments';
import { MailDisplayThread } from './MailDisplayThread';
import { AiInsightPanel } from '@/components/ai/AiInsightPanel';

export function MailDisplay() {
  const { t } = useTranslation();
  const {
    selectedMail: mail,
    setSelectedMail,
    filteredMails,
    folders,
    setViewMode,
    refetchMails,
    markAsRead,
    toggleStar,
    refetchFolders,
    setMailFilter,
    setSettingsTab,
    setComposeOpen,
    setSearchQuery,
    categories,
    actions: actionsRaw,
  } = useMailContext();
  const actions = actionsRaw;

  // State
  const [resolvedAttachments, setResolvedAttachments] = useState<Attachment[]>(mail?.attachments || []);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [attachmentPreviews, setAttachmentPreviews] = useState<Record<string, string>>({});
  const [threadMails, setThreadMails] = useState<Mail[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const lastLoadedMailId = useRef<string | null>(null);

  // Loading functions
  const loadFullMailDetails = useCallback(async (mailId: string) => {
    try {
      console.log('[MailDisplay] Loading full mail details for:', mailId);
      const detailedMail = await api.get(`/mail/${mailId}`);
      console.log('[MailDisplay] Full mail details loaded:', {
        id: detailedMail.id,
        contentLength: detailedMail.content?.length,
        htmlContentLength: detailedMail.htmlContent?.length
      });
      if (detailedMail && mail && mail.id === mailId) {
        const transformedDetailedMail = transformMailData([detailedMail])[0];
        setSelectedMail({ ...mail, ...transformedDetailedMail });
      }
    } catch (err) {
      console.error('[MailDisplay] Failed to load full mail details:', err);
    }
  }, [mail, setSelectedMail]);

  const loadAttachments = async (mailId: string) => {
    setAttachmentsLoading(true);
    try {
      const response = await api.get(`/mail/${mailId}/attachments`);
      const normalized = Array.isArray(response) ? response.map((attachment: Attachment) => normalizeAttachment(attachment)) : [];
      if (normalized.length > 0) {
        setResolvedAttachments(normalized);
        return;
      }
      const detailedMail = await api.get(`/mail/${mailId}`);
      const fromDetails = Array.isArray(detailedMail?.attachments) ? detailedMail.attachments.map((attachment: Attachment) => normalizeAttachment(attachment)) : [];
      setResolvedAttachments(fromDetails);
    } catch (error) {
      console.warn('Failed to load attachments:', error);
    } finally {
      setAttachmentsLoading(false);
    }
  };

  const loadThread = async (mailId: string) => {
    setThreadLoading(true);
    try {
      const resp = await api.get(`/mail/${mailId}/thread`);
      const threadData = Array.isArray(resp) ? resp : (resp?.mails || []);
      const transformed = transformMailData(threadData);
      setThreadMails(transformed || []);
    } catch (err) {
      console.warn('Failed to load thread:', err);
    } finally {
      setThreadLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    const currentAttachments = mail?.attachments || [];
    if (mail?.id && mail.id !== lastLoadedMailId.current) {
      lastLoadedMailId.current = mail.id;
      const timer = setTimeout(() => {
        loadFullMailDetails(mail.id);
        setResolvedAttachments(currentAttachments);
        if (currentAttachments.length === 0) {
          loadAttachments(mail.id);
        } else {
          setAttachmentsLoading(false);
        }
        loadThread(mail.id);
      }, 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [mail?.id, mail?.attachments]);

  // Mark as read on open
  useEffect(() => {
    if (mail?.id && !mail.isRead) {
      const timer = setTimeout(() => {
        markAsRead(mail.id, true);
      }, 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [mail?.id, mail?.isRead, markAsRead]);

  // Load previews
  useEffect(() => {
    let isActive = true;
    const createdUrls: string[] = [];

    if (mail?.id) {
      const timer = setTimeout(() => {
        setAttachmentPreviews({});
      }, 0);

      const loadPreviews = async () => {
        for (const attachment of resolvedAttachments || []) {
          if (!attachment?.id || !isPreviewable(attachment)) continue;
          try {
            const blob = await api.get(`/mail/attachments/download/${attachment.id}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([blob]));
            createdUrls.push(url);
            if (isActive) setAttachmentPreviews((prev) => ({ ...prev, [attachment.id]: url }));
          } catch (error) {
            console.warn('[MailDisplay] Preview load failed:', error);
          }
        }
      };

      if (resolvedAttachments?.length) {
        loadPreviews();
      }

      return () => {
        isActive = false;
        clearTimeout(timer);
        createdUrls.forEach((url) => window.URL.revokeObjectURL(url));
      };
    }
    return () => {
      isActive = false;
      createdUrls.forEach((url) => window.URL.revokeObjectURL(url));
    };
  }, [mail?.id, resolvedAttachments]);

  // Handlers
  const handleMoveToFolder = async (folderId: string) => {
    if (!mail) return;
    try {
      await api.patch(`/mail/${mail.id}/move`, { folderId });
      const folder = folders?.find(f => f.id === folderId);
      const canonicalKey = folder ? getCanonicalSystemKey(folder) : undefined;
      const displayName = (canonicalKey && systemFolderNames[canonicalKey]) || folder?.folderName || 'папку';
      toast.success(`${t('common.moved_to')} ${displayName}`);
      setSelectedMail(null);
      refetchMails();
      refetchFolders();
    } catch (error) {
      toast.error(t('common.move_failed'));
    }
  };

  const handleDownloadAttachment = async (attachmentId: string, filename: string) => {
    try {
      const response = await api.get(`/mail/attachments/download/${attachmentId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(t('mail.attachment_downloaded'));
    } catch (error) {
      toast.error(t('mail.attachment_download_failed'));
    }
  };

  const handleDownloadEml = async () => {
    if (!mail) return;
    try {
      const response = await api.get(`/mail/${mail.id}/eml`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${mail.subject || 'email'}.eml`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(t('mail.eml_downloaded'));
    } catch (error) {
      toast.error(t('mail.eml_download_failed'));
    }
  };

  const handleTranslate = async () => {
    if (!mail) return;
    try {
      await new Promise(r => setTimeout(r, 1500));
      toast.success(t('mail.translated'));
    } catch (error) {
      toast.error(t('mail.translate_failed'));
    }
  };

  const handleSaveToDocs = async (attachmentId: string) => {
    try {
      await api.post(`/mail/attachments/${attachmentId}/save-to-docs`, {});
      toast.success(t('mail.saved_to_docs'));
    } catch (error) {
      toast.error(t('mail.save_to_docs_failed'));
    }
  };

  const currentIndex = mail ? filteredMails.findIndex(m => m.id === mail.id) : -1;
  const handlePrevious = () => currentIndex > 0 && setSelectedMail(filteredMails[currentIndex - 1]);
  const handleNext = () => currentIndex < filteredMails.length - 1 && setSelectedMail(filteredMails[currentIndex + 1]);

  // Empty state
  if (!mail) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-muted-foreground bg-muted/5">
        <div className="text-center">
          <MailIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">{t('mail.select_message')}</p>
          <p className="text-sm opacity-70">{t('mail.no_selection_desc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <MailDisplayActions
        currentIndex={currentIndex}
        totalMails={filteredMails.length}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onSetViewMode={setViewMode}
      />

      <MailDisplayHeader
        mail={mail}
        showDetails={showDetails}
        isRead={mail.isRead}
        isStarred={mail.isStarred}
        folders={folders as ApiMailFolder[]}
        categories={categories}
        onToggleDetails={setShowDetails}
        onReply={actions.handleReply}
        onSetSearchQuery={setSearchQuery}
        onSetViewMode={setViewMode}
        onSetComposeOpen={setComposeOpen}
        onMarkAsRead={markAsRead}
        onToggleStar={toggleStar}
        onDelete={actions.handleDelete}
        onReplyAll={actions.handleReplyAll}
        onForward={actions.handleForward}
        onSpam={actions.handleSpam}
        onMoveToFolder={handleMoveToFolder}
        onDownloadEml={handleDownloadEml}
        onTranslate={handleTranslate}
        onSetMailFilter={setMailFilter}
        onSetSettingsTab={setSettingsTab}
        onContextMenuAction={actions.handleContextMenuAction}
      />

      <ScrollArea className="flex-1 bg-white dark:bg-transparent">
        <MailDisplayContent mail={mail} />
        
        <div className="px-8 py-4">
          <AiInsightPanel
            entityType="mail"
            entityId={mail.id}
            insightType="summary"
            title={t('settings.ai.insights_title')}
            description={t('settings.ai.no_insight_yet')}
          />
        </div>

        <MailDisplayAttachments
          attachments={resolvedAttachments}
          onDownloadAttachment={handleDownloadAttachment}
          onSaveToDocs={handleSaveToDocs}
          attachmentPreviews={attachmentPreviews}
        />
        <MailDisplayThread
          currentMailId={mail.id}
          threadMails={threadMails}
          onSelectMail={setSelectedMail}
        />
      </ScrollArea>

      <div className="px-8 py-4 border-t bg-muted/10 backdrop-blur-sm">
        <div
          className="flex items-center gap-4 bg-background border rounded-2xl p-2 cursor-pointer hover:border-primary/30 transition-all group"
          onClick={() => actions.handleReply(mail)}
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
            <LucideIcons.Reply className="w-4 h-4" />
          </div>
          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-all">Нажмите, чтобы ответить...</span>
        </div>
      </div>
    </div>
  );
}
