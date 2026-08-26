import React, { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { GroupedVirtuoso } from 'react-virtuoso';
import * as LucideIcons from 'lucide-react';
import { 
  ChevronDown, 
  X, 
  CheckCircle,
  EyeOff,
  Star,
  Paperclip,
  Tag,
  Mail as MailIcon,
  Loader2,
  Trash2,
  Archive,
  Eye,
  ShieldAlert,
  Flag,
  Reply,
  FolderOpen,
} from 'lucide-react';
import { Mail } from '../types';
import { useTranslation } from '@/lib/i18n';
import { MailContextMenu } from './MailContextMenu';
import { FolderTreeMenu } from './FolderTreeMenu';
import {
  formatMailDate,
  getInitials,
  getDisplayName,
  isOfficialEmail,
  getAvatarColor,
  getSenderLogoUrl,
  getSenderNameColor,
} from '../utils/componentUtils';
import { useMailContext } from '../context/useMailContext';

export function MailList() {
  const { t } = useTranslation();
  const {
    filteredMails: mails,
    selectedMail,
    setSelectedMail,
    toggleStar,
    markAsRead,
    mailsLoading: loading,
    hasMore,
    total,
    loadMore,
    loadingMore,
    selectedMailIds,
    toggleSelectMail,
    selectAll,
    showMassActions,
    handleMassRead,
    handleMassUnread,
    handleMassArchive,
    handleMassSpam,
    handleMassDelete,
    handleMassMoveToFolder,
    clearSelection,
    folders,
    labels,
    actions,
    setViewMode,
    mailFilter,
    setMailFilter,
    mailSort,
    setMailSort,
    categories,
    selectedAccountId,
  } = useMailContext();

  const [contextMenu, setContextMenu] = useState<{
    open: boolean;
    mail: Mail | null;
    x: number;
    y: number;
  }>({ open: false, mail: null, x: 0, y: 0 });

  const handleContextMenu = (e: React.MouseEvent, mail: Mail) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ open: true, mail, x: e.clientX, y: e.clientY });
  };

  const handleSelectMail = (mail: Mail) => {
    setSelectedMail(mail);
    setViewMode('mail');
  };

  // Удаление дубликатов и подготовка данных для виртуализации
  const { flatMails, groupCounts, groupNames } = useMemo(() => {
    const uniqueMails = mails.filter((mail, index, self) =>
      index === self.findIndex((m) => m.id === mail.id)
    );

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const weekAgo = new Date(today.getTime() - (today.getDay() + 7) * 86400000);

    const labelToday = t('mail.today');
    const labelYesterday = t('mail.yesterday');
    const labelWeek = t('mail.week');
    const labelEarlier = t('mail.earlier');

    const groups: Record<string, Mail[]> = {
      [labelToday]: [],
      [labelYesterday]: [],
      [labelWeek]: [],
      [labelEarlier]: [],
    };

    uniqueMails.forEach(mail => {
      const mailDate = new Date(mail.timestamp);
      if (mailDate >= today) groups[labelToday].push(mail);
      else if (mailDate >= yesterday) groups[labelYesterday].push(mail);
      else if (mailDate >= weekAgo) groups[labelWeek].push(mail);
      else groups[labelEarlier].push(mail);
    });

    const activeGroups = Object.entries(groups).filter(([_, ms]) => ms.length > 0);
    
    return {
      flatMails: activeGroups.flatMap(([_, ms]) => ms),
      groupCounts: activeGroups.map(([_, ms]) => ms.length),
      groupNames: activeGroups.map(([name, _]) => name)
    };
  }, [mails, t]);

  if (loading && mails.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center animate-pulse">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{t('mail.loading_letters')}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 w-full bg-background overflow-hidden relative flex flex-col h-full">
        {/* Header / Mass Actions Bar */}
        <div className={cn(
          "flex items-center justify-between px-4 py-2 border-b",
          showMassActions ? "bg-primary/5 border-primary/20" : "bg-muted/5"
        )}>
          {showMassActions ? (
            <div className="flex items-center gap-4 w-full">
              <div className="flex items-center gap-2 pr-4 border-r border-primary/20">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => clearSelection()} 
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
                <span className="text-sm font-bold text-primary">
                  {t('mail.selected_count', { count: selectedMailIds.length })}
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={handleMassRead} className="h-8 gap-2 hover:bg-blue-50 hover:text-blue-600">
                  <Eye className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">{t('mail.read')}</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleMassArchive} className="h-8 gap-2 hover:bg-emerald-50 hover:text-emerald-600">
                  <Archive className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">{t('mail.folders.archive')}</span>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 gap-2 hover:bg-purple-50 hover:text-purple-600">
                      <FolderOpen className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">{t('mail.context_menu.move_to_folder')}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-1 z-[100]">
                    <div className="max-h-[300px] overflow-y-auto">
                      <FolderTreeMenu
                        folders={folders}
                        onSelectFolder={(folderId) => handleMassMoveToFolder(folderId)}
                        separateSystemFolders={true}
                        onlyVisible={true}
                        baseIndent={12}
                        renderAs="button"
                        className="py-1"
                      />
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="ghost" size="sm" onClick={handleMassSpam} className="h-8 gap-2 hover:bg-orange-50 hover:text-orange-600">
                  <ShieldAlert className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">{t('mail.spam')}</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleMassDelete} className="h-8 gap-2 hover:bg-red-50 hover:text-red-600 text-destructive">
                  <Trash2 className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">{t('mail.delete')}</span>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => selectAll()} 
                  className="h-8 px-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground"
                >
                  <div className="w-4 h-4 border-2 border-muted-foreground/30 rounded mr-2 flex items-center justify-center">
                    <CheckCircle className="w-2.5 h-2.5 opacity-0" />
                  </div>
                  {t('mail.select_all')}
                </Button>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">
                    {t('mail.filter_label')} <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuRadioGroup value={mailFilter} onValueChange={(v) => setMailFilter(v as any)}>
                    <DropdownMenuRadioItem value="all" className="gap-2">
                      <MailIcon className="w-4 h-4 opacity-70" /> {t('mail.all_letters')}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="unread" className="gap-2">
                      <EyeOff className="w-4 h-4 opacity-70" /> {t('mail.unread_letters')}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="starred" className="gap-2">
                      <Star className="w-4 h-4 opacity-70" /> {t('mail.starred_letters')}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="attachments" className="gap-2">
                      <Paperclip className="w-4 h-4 opacity-70" /> {t('mail.with_attachments')}
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                  
                  {categories.some((cat) => cat.keywords?.trim()) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="gap-2">
                          <LucideIcons.LayoutGrid className="w-4 h-4 opacity-70" /> {t('mail.categories_label')}
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent className="w-56">
                            <DropdownMenuRadioGroup value={mailFilter} onValueChange={(v) => setMailFilter(v as any)}>
                              {categories.filter((cat) => cat.keywords?.trim()).map((cat) => {
                            const Icon = (LucideIcons as any)[cat.icon] || LucideIcons.Tag;
                                return (
                                  <DropdownMenuRadioItem key={cat.id} value={cat.id} className="gap-2">
                                    <Icon className="w-4 h-4 opacity-70" /> {cat.name}
                                  </DropdownMenuRadioItem>
                                );
                              })}
                            </DropdownMenuRadioGroup>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                    </>
                  )}
 
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="gap-2">
                      <Tag className="w-4 h-4 opacity-70" /> {t('mail.sort_label')}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuRadioGroup value={mailSort} onValueChange={(v) => setMailSort(v as any)}>
                          <DropdownMenuRadioItem value="date-desc">{t('mail.sort_date_desc')}</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="date-asc">{t('mail.sort_date_asc')}</DropdownMenuRadioItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuRadioItem value="sender-asc">{t('mail.sort_sender_asc')}</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="sender-desc">{t('mail.sort_sender_desc')}</DropdownMenuRadioItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuRadioItem value="subject-asc">{t('mail.sort_subject_asc')}</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="subject-desc">{t('mail.sort_subject_desc')}</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
 
        <div className="flex-1 overflow-hidden relative">
          {flatMails.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center p-8 text-muted-foreground bg-muted/5 h-full">
              <div className="text-center">
                <MailIcon className="w-16 h-16 mx-auto mb-4 opacity-10" />
                <p className="text-lg font-bold uppercase tracking-tight text-foreground/40">{t('mail.empty_label')}</p>
                <p className="text-sm opacity-50 max-w-xs mx-auto">{t('mail.folder_empty_desc')}</p>
              </div>
            </div>
          ) : (
            <GroupedVirtuoso
              style={{ height: '100%' }}
          groupCounts={groupCounts}
          groupContent={index => (
            <div className="bg-background/95 backdrop-blur-sm px-4 py-3 select-none">
              <h5 className="text-[11px] font-black text-foreground/40 uppercase tracking-[0.1em]">
                {groupNames[index]}
              </h5>
            </div>
          )}
          itemContent={(index) => {
            const mail = flatMails[index];
            if (!mail) return null;

            const dateInfo = formatMailDate(mail.timestamp);
            const isOfficial = isOfficialEmail(mail.sender.email);
            const displayName = getDisplayName(mail.sender.name, mail.sender.email);
            const avatarInitials = getInitials(displayName, mail.sender.email);
            const avatarColor = getAvatarColor(mail.sender.email);
            const senderLogo = getSenderLogoUrl(mail.sender.email, mail.sender.avatar);
            const isSelected = selectedMailIds.includes(mail.id);
            const isActive = selectedMail?.id === mail.id;
            const senderColorClass = getSenderNameColor(displayName, mail.sender.email);

            // Определяем иконку категории для отображения рядом с датой
            const getCategoryIcon = () => {
              const fullText = `${displayName} ${mail.sender.email} ${mail.subject} ${mail.content || ''}`.toLowerCase();
              const cat = categories.find(c => {
                if (!c.keywords) return false;
                const keywords = c.keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
                return keywords.some(k => fullText.includes(k));
              });
              if (!cat) return null;
              const Icon = (LucideIcons as any)[cat.icon] || LucideIcons.Tag;
              return <Icon title={cat.name} className="w-3.5 h-3.5 text-muted-foreground/30" />;
            };

            return (
              <div
                id={`mail-${mail.id}`}
                className={cn(
                  'group relative flex items-center gap-0 px-0 cursor-pointer transition-all duration-150',
                  'border-b border-border/40 min-h-[48px]',
                  isSelected && 'bg-primary/5',
                  isActive && !isSelected && 'bg-primary/5 shadow-inner',
                  !mail.isRead && 'bg-blue-50/20 dark:bg-blue-950/5',
                  contextMenu.open && contextMenu.mail?.id === mail.id && 'bg-muted'
                )}
                onClick={() => handleSelectMail(mail)}
                onContextMenu={(e) => handleContextMenu(e, mail)}
              >
                {/* Статус-бар слева (Точка / Стрелка ответа) */}
                <div className="w-6 flex flex-col items-center justify-center shrink-0">
                  {!mail.isRead ? (
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  ) : mail.answered ? (
                    <Reply className="w-3 h-3 text-muted-foreground/40" />
                  ) : null}
                </div>

                {/* Аватар / Чекбокс */}
                <div className="relative flex-shrink-0 w-10 h-10 mx-2">
                  <div className={cn(
                    'w-full h-full rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm transition-all overflow-hidden',
                    avatarColor,
                    contextMenu.open && 'opacity-0'
                  )}>
                    <span>{avatarInitials}</span>
                    {senderLogo && (
                      <img
                        src={senderLogo}
                        className="absolute inset-0 w-full h-full rounded-xl object-contain bg-white p-1"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        alt=""
                      />
                    )}
                  </div>
                  
                  {/* Чекбокс выбора (появляется при ховере или когда выбрано) */}
                  <div 
                    className={cn(
                      "absolute inset-0 flex items-center justify-center rounded-xl transition-all duration-200",
                      isSelected 
                        ? "bg-primary/20 opacity-100 scale-100 ring-2 ring-primary ring-inset" 
                        : "bg-background/40 backdrop-blur-[1px] opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100"
                    )}
                    onClick={(e) => { e.stopPropagation(); toggleSelectMail(mail.id); }}
                  >
                    <Checkbox checked={isSelected} className="rounded border-primary/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary shadow-sm" />
                  </div>
                </div>

                {/* Основная информация */}
                <div className="flex-1 min-w-0 grid grid-cols-[180px_1fr_120px] items-center gap-4 pr-4">
                  {/* Отправитель */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn(
                      'text-sm truncate',
                      !mail.isRead ? 'font-black text-foreground' : 'font-medium text-foreground/70',
                      senderColorClass
                    )}>
                      {displayName}
                    </span>
                  </div>

                  {/* Тема и Превью */}
                  <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                    {!mail.isRead && (
                      <Badge variant="secondary" className="h-4 px-1 text-[8px] font-black uppercase tracking-tighter bg-muted text-muted-foreground/70 shrink-0">
                        {t('mail.new_badge')}
                      </Badge>
                    )}
                    {selectedAccountId === 'all' && mail.accountEmail && (
                      <Badge variant="outline" className="h-4 px-1 text-[8px] font-semibold uppercase tracking-tighter shrink-0 border-primary/20 text-primary/70">
                        {mail.accountEmail}
                      </Badge>
                    )}
                    <span className={cn(
                      'text-sm truncate shrink-0',
                      !mail.isRead ? 'font-black text-foreground' : 'font-medium text-foreground/80'
                    )}>
                      {mail.subject || `(${t('mail.no_subject')})`}
                    </span>
                    <span className="text-sm text-muted-foreground/30 truncate font-medium ml-1">
                      {mail.content ? mail.content.replace(/<[^>]*>/g, '').slice(0, 80) : ''}
                    </span>
                  </div>

                  {/* Дата и иконки (Secondary Data) */}
                  <div className="flex items-center justify-end gap-2.5 text-right">
                    {mail.hasAttachments && (
                      <Paperclip className="w-4 h-4 text-muted-foreground/40" strokeWidth={2.5} />
                    )}
                    {getCategoryIcon()}
                    {mail.isStarred && <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />}
                    <span className="text-[11px] font-bold text-muted-foreground/40 whitespace-nowrap">
                      {dateInfo.display}
                    </span>
                  </div>
                </div>

                {/* Масс-действия при ховере */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 bg-background/95 backdrop-blur shadow-2xl px-1.5 py-1 rounded-xl border border-primary/10 transition-all duration-200 translate-x-2 group-hover:translate-x-0 z-50">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => { e.stopPropagation(); toggleStar(mail.id); }} 
                    className={cn("h-8 w-8 text-muted-foreground transition-colors hover:bg-yellow-50 hover:text-yellow-500", mail.isStarred && "text-yellow-500")}
                    title={t('mail.to_starred')}
                  >
                    <Star className={cn("h-4 w-4", mail.isStarred && "fill-current")} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => { e.stopPropagation(); markAsRead(mail.id, !mail.isRead); }} 
                    className={cn("h-8 w-8 text-muted-foreground transition-colors hover:bg-blue-50 hover:text-blue-500", !mail.isRead && "text-blue-500")}
                    title={mail.isRead ? t('mail.mark_unread') : t('mail.mark_read')}
                  >
                    {mail.isRead ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => { e.stopPropagation(); actions.handleArchive(mail); }} 
                    className="h-8 w-8 text-muted-foreground transition-colors hover:bg-emerald-50 hover:text-emerald-500"
                    title={t('mail.archive_action')}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => { e.stopPropagation(); actions.handleDelete(mail); }} 
                    className="h-8 w-8 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500"
                    title={t('mail.delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          }}
          endReached={() => hasMore && loadMore()}
          components={{
            Footer: () => hasMore ? (
              <div className="p-8 flex justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('mail.loading_more')}</span>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center border-t border-dashed border-border/40 bg-muted/5">
                <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">{t('mail.end_of_list', { count: total })}</p>
              </div>
            )
          }}
          />
        )}
      </div>
    </div>

    {contextMenu.open && contextMenu.mail && (
        <MailContextMenu
          mail={contextMenu.mail}
          folders={folders}
          labels={labels}
          onSelectAction={actions.handleContextMenuAction}
          onClose={() => setContextMenu({ ...contextMenu, open: false })}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          isAllSelected={selectedMailIds.length === flatMails.length && flatMails.length > 0}
        />
      )}
    </>
  );
}
