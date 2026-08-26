import React, { useState } from 'react';
import { usePageSettings } from "@/context/LayoutContext";
import { useTranslation } from "@/lib/i18n";
import { 
  MailSidebar, 
  MailList, 
  MailDisplay, 
  MailCompose, 
  MailAccountSettings, 
  MailSyncProgress,
  ChatFeed,
  CallHistoryMock,
  UnifiedFeedMock
} from "../components";
import {
  MailDeleteConfirmDialog,
  MailClearFolderDialog,
  MailLabelDialog,
  MailEventDialog,
  MailFilterDialog,
  MailFolderDialog
} from "../components/dialogs";
import { MailFilterSortMenu } from "../components/MailFilterSortMenu";
import { useModuleSettings } from "@/modules/settings/hooks/useModuleSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, Plus, Eye, EyeOff, Archive, ShieldAlert, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Контекст
import { MailProvider } from "../context/MailContext";
import { useMailContext } from "../context/useMailContext";

function MailInner() {
  const { t } = useTranslation();
  const { settings } = useModuleSettings("mail");
  
  const {
    accounts,
    selectedAccountId,
    folders,
    activeFolder,
    searchQuery,
    setSearchQuery,
    mailFilter,
    setMailFilter,
    mailSort,
    setMailSort,
    mailsLoading,
    accountsLoading,
    foldersLoading,
    refetchMails,
    refetchFolders,
    refetchAccounts,
    viewMode,
    setViewMode,
    syncStatus,
    dialogs,
    actions,
    showMassActions,
    handleMassRead,
    handleMassUnread,
    handleMassArchive,
    handleMassSpam,
    handleMassDelete,
    clearSelection,
    replyToMail,
    forwardMail,
    isReplyAll,
    composeOpen,
    setComposeOpen,
    isComposeMinimized,
    setIsComposeMinimized,
  } = useMailContext();

  const [activeChannel, setActiveChannelState] = useState<'all' | 'email' | 'chats' | 'calls'>(() => {
    return (localStorage.getItem('titan_mail_active_channel') as 'all' | 'email' | 'chats' | 'calls') || 'all';
  });

  const setActiveChannel = (channel: 'all' | 'email' | 'chats' | 'calls') => {
    setActiveChannelState(channel);
    localStorage.setItem('titan_mail_active_channel', channel);
  };

  const loading = accountsLoading || foldersLoading || mailsLoading;
  
  const shouldShowClearButton = (() => {
    if (!activeFolder) return false;
    const activeF = folders.find(f => f.id === activeFolder);
    if (!activeF) return false;
    return activeF.folderType === 'spam' || activeF.folderType === 'trash';
  })();

  const mailActions = (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      {settings.features?.enableSearch !== false && (
        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('mail.search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 pr-8 text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
      {shouldShowClearButton && (
        <Button
          variant="outline" size="sm"
          onClick={() => {
            const folder = folders.find(f => f.id === activeFolder);
            if (folder) dialogs.setClearFolderDialog({ open: true, folderId: folder.id, folderName: folder.folderName });
          }}
          className="text-destructive hover:text-destructive border-destructive/20"
        >
          {t('common.clear')}
        </Button>
      )}
    </div>
  );

  // Вызываем хук ОДИН РАЗ и безусловно в начале
  usePageSettings({
    title: t('sidebar.mail'),
    breadcrumbs: [{ label: t('sidebar.mail') }],
    actions: (!selectedAccountId && accounts.length === 0) ? undefined : mailActions
  });

  if (!selectedAccountId && accounts.length === 0) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">{t('mail.no_accounts')}</h2>
          <p className="text-muted-foreground mb-4">{t('mail.account_not_configured')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-8rem)] w-full min-w-0 border rounded-lg overflow-hidden bg-background shadow-sm relative">
        {/* Channel Tabs */}
        {viewMode === 'list' && (
          <div className="flex px-4 py-2 border-b bg-muted/10 gap-2 overflow-x-auto hide-scrollbar">
            <Button 
              variant={activeChannel === 'all' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveChannel('all')}
              className={cn("h-8 rounded-full px-4 text-xs font-semibold tracking-wider", activeChannel === 'all' ? 'shadow-sm' : '')}
            >
              Все
            </Button>
            <Button 
              variant={activeChannel === 'email' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveChannel('email')}
              className={cn("h-8 rounded-full px-4 text-xs font-semibold tracking-wider", activeChannel === 'email' ? 'shadow-sm' : '')}
            >
              Почта
            </Button>
            <Button 
              variant={activeChannel === 'chats' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveChannel('chats')}
              className={cn("h-8 rounded-full px-4 text-xs font-semibold tracking-wider", activeChannel === 'chats' ? 'shadow-sm' : '')}
            >
              Чаты
            </Button>
            <Button 
              variant={activeChannel === 'calls' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveChannel('calls')}
              className={cn("h-8 rounded-full px-4 text-xs font-semibold tracking-wider", activeChannel === 'calls' ? 'shadow-sm' : '')}
            >
              Звонки
            </Button>
          </div>
        )}

        <div className="flex-1 flex min-h-0 w-full relative">
          {(viewMode === 'list' && activeChannel === 'email') && <MailSidebar />}
          
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

          {viewMode === 'list' && activeChannel === 'all' && <UnifiedFeedMock />}
          {viewMode === 'list' && activeChannel === 'chats' && <ChatFeed />}
          {viewMode === 'list' && activeChannel === 'calls' && <CallHistoryMock />}

          {viewMode === 'list' && activeChannel === 'email' && (
            <div className="flex flex-1 min-w-0 w-full flex-col overflow-hidden">
              <MailList />
              
              {showMassActions && (
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background border border-primary/20 shadow-2xl px-4 py-2 rounded-full z-50">
                   <Button variant="ghost" size="sm" onClick={handleMassRead} title={t('mail.mark_read')}><Eye className="h-4 w-4" /></Button>
                   <Button variant="ghost" size="sm" onClick={handleMassUnread} title={t('mail.mark_unread')}><EyeOff className="h-4 w-4" /></Button>
                   <Button variant="ghost" size="sm" onClick={handleMassArchive} title={t('mail.to_archive')}><Archive className="h-4 w-4" /></Button>
                   <Button variant="ghost" size="sm" onClick={handleMassSpam} title={t('mail.to_spam')}><ShieldAlert className="h-4 w-4" /></Button>
                   <Button variant="outline" size="sm" onClick={handleMassDelete} className="text-destructive hover:text-destructive border-destructive/20" title={t('mail.delete')}><Trash2 className="h-4 w-4" /></Button>
                   <div className="w-px h-4 bg-border mx-1" />
                   <Button variant="ghost" size="sm" onClick={clearSelection}><X className="h-4 w-4" /></Button>
                </div>
              )}

              {syncStatus && (['progress', 'counting', 'completed', 'error'].includes(syncStatus.status)) && (
                /* @ts-expect-error - spread of sync status object */
                <MailSyncProgress {...syncStatus} />
              )}
            </div>
          )}

          {viewMode === 'mail' && <MailDisplay />}
          {viewMode === 'settings' && (
            <MailAccountSettings 
              accountId={selectedAccountId} 
              onSave={() => setViewMode('list')}
              onCancel={() => setViewMode('list')}
            />
          )}
          {viewMode === 'compose' && (
            <div className="flex-1 overflow-hidden bg-background">
              <MailCompose 
                key={replyToMail?.id || forwardMail?.id || 'inline-compose'}
                inline={true}
                open={true} 
                onClose={() => setViewMode('list')} 
                accountId={selectedAccountId}
                replyTo={replyToMail ? {
                  subject: replyToMail.subject,
                  sender: replyToMail.sender.name || replyToMail.sender.email,
                  senderEmail: replyToMail.sender.email,
                  content: replyToMail.content || '',
                  date: replyToMail.timestamp,
                  recipients: isReplyAll ? [
                    replyToMail.sender.email,
                    ...(replyToMail.recipients || []),
                    ...(replyToMail.cc || []),
                  ].filter((e, i, a) => e && a.indexOf(e) === i) : [replyToMail.sender.email],
                  accountEmail: replyToMail.accountEmail
                } : forwardMail ? {
                  subject: `Fwd: ${forwardMail.subject}`,
                  sender: forwardMail.sender.name || forwardMail.sender.email,
                  senderEmail: '', 
                  content: forwardMail.content || '',
                  date: forwardMail.timestamp,
                } : undefined}
              />
            </div>
          )}
        </div>
        </div>

        {/* Плавающее окно написания письма (только если не в режиме inline compose) */}
        {composeOpen && viewMode !== 'compose' && (
          <MailCompose 
            key={replyToMail?.id || forwardMail?.id || 'floating-compose'}
            open={composeOpen} 
            onClose={() => setComposeOpen(false)} 
            accountId={selectedAccountId}
            replyTo={replyToMail ? {
              subject: replyToMail.subject,
              sender: replyToMail.sender.name || replyToMail.sender.email,
              senderEmail: replyToMail.sender.email,
              content: replyToMail.content || '',
              date: replyToMail.timestamp,
              recipients: isReplyAll ? [
                replyToMail.sender.email,
                ...(replyToMail.recipients || []),
                ...(replyToMail.cc || []),
              ].filter((e, i, a) => e && a.indexOf(e) === i) : [replyToMail.sender.email],
              accountEmail: replyToMail.accountEmail
            } : forwardMail ? {
              subject: `Fwd: ${forwardMail.subject}`,
              sender: forwardMail.sender.name || forwardMail.sender.email,
              senderEmail: '', 
              content: forwardMail.content || '',
              date: forwardMail.timestamp,
            } : undefined}
          />
        )}
      </div>

      {/* Dialogs */}
      <MailDeleteConfirmDialog 
        open={dialogs.deleteConfirmDialog.open} 
        onOpenChange={(open) => dialogs.setDeleteConfirmDialog(prev => ({ ...prev, open }))}
        onConfirm={actions.handleDeleteConfirm}
        /* @ts-expect-error - count prop mismatch */
        isBulk={false}
        count={1}
      />
      <MailClearFolderDialog 
        open={dialogs.clearFolderDialog.open}
        onOpenChange={(open) => dialogs.setClearFolderDialog(prev => ({ ...prev, open }))}
        folderName={dialogs.clearFolderDialog.folderName}
        onConfirm={actions.handleClearFolderConfirm}
        onCancel={() => dialogs.setClearFolderDialog(prev => ({ ...prev, open: false }))}
      />
      <MailLabelDialog 
        open={dialogs.createLabelDialog.open}
        onOpenChange={(open) => dialogs.setCreateLabelDialog(prev => ({ ...prev, open }))}
        /* @ts-expect-error - mail object vs id mismatch */
        mailId={dialogs.createLabelDialog.mail?.id || ''}
      />
      <MailEventDialog 
        open={dialogs.createEventDialog.open}
        onOpenChange={(open) => dialogs.setCreateEventDialog(prev => ({ ...prev, open }))}
        mail={dialogs.createEventDialog.mail}
        onConfirm={(data) => {
          actions.handleCreateEventConfirm(data);
          dialogs.setCreateEventDialog(prev => ({ ...prev, open: false }));
        }}
        onCancel={() => dialogs.setCreateEventDialog(prev => ({ ...prev, open: false }))}
      />
      <MailFilterDialog 
        open={dialogs.createFilterDialog.open}
        onOpenChange={(open) => dialogs.setCreateFilterDialog(prev => ({ ...prev, open }))}
        /* @ts-expect-error - initial filter type mismatch */
        initialFilter={null}
      />
      <MailFolderDialog
        open={dialogs.folderDialog.open}
        onOpenChange={(open) => dialogs.setFolderDialog(prev => ({ ...prev, open }))}
        mode={dialogs.folderDialog.mode}
        folderName={dialogs.folderDialog.folder?.folderName || ''}
        onFolderNameChange={dialogs.setFolderDialogName}
        onConfirm={actions.handleFolderConfirm}
        onCancel={() => dialogs.setFolderDialog({ open: false, mode: 'create', folder: null })}
        parentFolderName={dialogs.folderDialog.mode === 'create' ? dialogs.folderDialog.folder?.folderName : undefined}
      />
    </>
  );
}

export default function Mail() {
  return (
    <MailProvider>
      <MailInner />
    </MailProvider>
  );
}
