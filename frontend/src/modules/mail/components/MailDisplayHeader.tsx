import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import * as LucideIcons from 'lucide-react';
import {
  Copy, Pencil, Search, Users, MoreVertical, ChevronDown,
  Reply, ReplyAll, Forward, Trash2, Archive, Star, Eye, EyeOff, MailOpen,
  Mail as MailIcon, FolderOpen, ShieldAlert, Link2, Download, Printer, Languages,
  ChevronLeft, Calendar, Tag, History
} from 'lucide-react';
import { Mail, ApiMailFolder, MailFilterType } from '../types';
import { useTranslation } from '@/lib/i18n';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import { getAvatarColor, getInitials, getSenderLogoUrl } from '../utils/componentUtils';
import { FolderTreeMenu } from './FolderTreeMenu';

interface MailCategoryItem {
  id: string;
  name: string;
  icon: string;
  keywords?: string;
}

interface MailDisplayHeaderProps {
  mail: Mail;
  showDetails: boolean;
  isRead: boolean;
  isStarred: boolean;
  folders: ApiMailFolder[];
  categories: MailCategoryItem[];
  onToggleDetails: (show: boolean) => void;
  onReply: (mail: Mail) => void;
  onSetSearchQuery: (query: string) => void;
  onSetViewMode: (mode: 'list' | 'mail' | 'compose' | 'settings') => void;
  onSetComposeOpen: (open: boolean) => void;
  onMarkAsRead: (mailId: string, isRead: boolean) => void;
  onToggleStar: (mailId: string) => void;
  onDelete: (mail: Mail) => void;
  onReplyAll: (mail: Mail) => void;
  onForward: (mail: Mail) => void;
  onSpam: (mail: Mail) => void;
  onMoveToFolder: (folderId: string) => void;
  onDownloadEml: () => void;
  onTranslate: () => void;
  onSetMailFilter: (filter: MailFilterType) => void;
  onSetSettingsTab: (tab: string) => void;
  onContextMenuAction: (action: string, mail: Mail) => void;
}

export function MailDisplayHeader({
  mail,
  showDetails,
  isRead,
  isStarred,
  folders,
  categories,
  onToggleDetails,
  onReply,
  onSetSearchQuery,
  onSetViewMode,
  onSetComposeOpen,
  onMarkAsRead,
  onToggleStar,
  onDelete,
  onReplyAll,
  onForward,
  onSpam,
  onMoveToFolder,
  onDownloadEml,
  onTranslate,
  onSetMailFilter,
  onSetSettingsTab,
  onContextMenuAction,
}: MailDisplayHeaderProps) {
  const { t } = useTranslation();
  const [senderMenuOpen, setSenderMenuOpen] = useState(false);

  const handleWriteLetter = () => {
    onReply(mail);
    onSetComposeOpen(false);
    onSetViewMode('compose');
  };

  const handleSearchSender = () => {
    const email = mail.sender?.email || '';
    if (email) {
      onSetSearchQuery(email);
      onSetViewMode('list');
    }
  };

  const handleAddToContacts = () => {
    const email = mail.sender?.email || '';
    if (email) {
      window.location.href = `/contractors?search=${encodeURIComponent(email)}`;
    }
  };

  return (
    <div className="px-8 pt-6 pb-4 bg-background border-b border-border/50">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          {!isRead && (
            <div className="h-5 px-1.5 text-[10px] font-black uppercase tracking-tighter bg-blue-50 text-blue-600 border border-blue-100 rounded-md flex items-center justify-center">
              {t('mail.new_badge')}
            </div>
          )}
          <h2 className={cn(
            "text-[22px] tracking-tight text-foreground/90 leading-tight",
            !isRead ? "font-black" : "font-bold"
          )}>
            {mail.subject || t('mail.no_subject')}
          </h2>
        </div>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex flex-col flex-1 gap-2">
          <div className="flex items-center gap-3">
            <DropdownMenu open={senderMenuOpen} onOpenChange={setSenderMenuOpen}>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center mt-0.5">
                    {mail.answered && (
                      <div className="absolute -left-6 top-1/2 -translate-y-1/2 text-muted-foreground/30">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3 6a3 3 0 0 1 3-3h7a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6z" />
                        </svg>
                      </div>
                    )}
                    <div className="relative group/avatar">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm overflow-hidden",
                        getAvatarColor(mail.sender?.email || '')
                      )}>
                        <span className="opacity-80">{getInitials(mail.sender.name || '', mail.sender?.email || '')}</span>
                        <img
                          src={getSenderLogoUrl(mail.sender?.email || '', mail.sender.avatar)}
                          className="absolute inset-0 w-full h-full object-contain bg-white p-1"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                          alt=""
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-baseline gap-2">
                      <span className={cn(
                        "text-[15px] tracking-tight group-hover:underline decoration-muted-foreground/30 underline-offset-4",
                        !isRead ? "font-black" : "font-semibold"
                      )}>
                        {mail.sender.name?.replace(/<.*>$/, '').replace(/["']/g, '').trim() || mail.sender?.email?.split('@')[0] || ''}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-[#949494] font-normal text-[13px] w-fit">
                      <span>{t('mail.to_label')}</span>
                      <span className="ml-1">{t('mail.to_me')}</span>
                      <span className="mx-1.5">•</span>
                      <span className="text-[13px] font-normal text-[#949494] tracking-tight">
                        {mail.timestamp ? format(new Date(mail.timestamp), 'd MMMM, H:mm', { locale: ru }) : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72 p-0 overflow-hidden rounded-2xl border border-border/50 shadow-lg bg-white z-[100]">
                <div className="p-4 flex items-center gap-3 bg-muted/5">
                  <div className={cn(
                    "w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-white text-lg font-bold overflow-hidden relative",
                    getAvatarColor(mail.sender?.email || '')
                  )}>
                    <span className="opacity-80">{getInitials(mail.sender.name || '', mail.sender?.email || '')}</span>
                    <img
                      src={getSenderLogoUrl(mail.sender?.email || '', mail.sender.avatar)}
                      className="absolute inset-0 w-full h-full object-contain bg-white"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      alt=""
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-foreground leading-tight truncate">
                      {mail.sender.name?.replace(/<.*>$/, '').replace(/["']/g, '').trim() || mail.sender?.email?.split('@')[0] || ''}
                    </span>
                    <span className="text-xs text-muted-foreground truncate" title={mail.sender?.email || ''}>
                      {mail.sender?.email || ''}
                    </span>
                  </div>
                </div>

                <div className="p-1.5 bg-white border-t border-border/50">
                  <DropdownMenuItem
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg hover:bg-muted/50 transition-colors focus:bg-muted/50 outline-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      const email = mail.sender?.email || '';
                      if (email) {
                        navigator.clipboard.writeText(email);
                        toast.success(t('mail.copied'));
                      }
                      setSenderMenuOpen(false);
                    }}
                  >
                    <Copy className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-[13px] text-foreground/90">{t('mail.copy_address')}</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg hover:bg-muted/50 transition-colors focus:bg-muted/50 outline-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWriteLetter();
                      setSenderMenuOpen(false);
                    }}
                  >
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-[13px] text-foreground/90">{t('mail.write_letter')}</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg hover:bg-muted/50 transition-colors focus:bg-muted/50 outline-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSearchSender();
                      setSenderMenuOpen(false);
                    }}
                  >
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-[13px] text-foreground/90">{t('mail.find_all_mail')}</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg hover:bg-muted/50 transition-colors focus:bg-muted/50 outline-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToContacts();
                      setSenderMenuOpen(false);
                    }}
                  >
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-[13px] text-foreground/90">{t('mail.in_contacts')}</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {showDetails && (
            <div className="bg-muted/30 rounded-lg p-3 mt-2 space-y-2 border border-border/40 w-fit min-w-[300px]">
              <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1.5 text-sm">
                <span className="text-muted-foreground font-medium">{t('mail.from_label')}</span>
                <span className="font-medium text-foreground">
                  {mail.sender.name?.replace(/<.*>$/, '').replace(/["']/g, '').trim()} &lt;{mail.sender?.email || ''}&gt;
                </span>

                <span className="text-muted-foreground font-medium">{t('mail.to_label')}</span>
                <div className="flex flex-wrap gap-2 items-center">
                  {(mail.recipients && mail.recipients.length > 0) ? (
                    mail.recipients.map((recipient, idx) => (
                      <div key={`to-${recipient}-${idx}`} className="flex items-center gap-1.5 bg-muted/30 px-2 py-0.5 rounded-full border border-border/40 group/recipient">
                        <div className={cn(
                          "w-4 h-4 rounded-full overflow-hidden relative flex items-center justify-center text-[8px] font-bold text-white shrink-0",
                          getAvatarColor(recipient)
                        )}>
                          <span className="opacity-80 scale-[0.7]">{getInitials('', recipient)}</span>
                          <img
                            src={getSenderLogoUrl(recipient)}
                            className="absolute inset-0 w-full h-full object-contain bg-white"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            alt=""
                          />
                        </div>
                        <span className="text-[12px] font-medium text-foreground/70 truncate max-w-[200px] group-hover/recipient:text-foreground transition-colors">
                          {recipient}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="font-medium text-foreground">{t('mail.to_me')}</span>
                  )}
                </div>

                {mail.cc && mail.cc.length > 0 && (
                  <>
                    <span className="text-muted-foreground font-medium">{t('mail.cc_label')}</span>
                    <div className="flex flex-wrap gap-2 items-center">
                      {mail.cc.map((recipient, idx) => (
                        <div key={`cc-${recipient}-${idx}`} className="flex items-center gap-1.5 bg-muted/30 px-2 py-0.5 rounded-full border border-border/40 group/cc">
                          <div className={cn(
                            "w-4 h-4 rounded-full overflow-hidden relative flex items-center justify-center text-[8px] font-bold text-white shrink-0",
                            getAvatarColor(recipient)
                          )}>
                            <span className="opacity-80 scale-[0.7]">{getInitials('', recipient)}</span>
                            <img
                              src={getSenderLogoUrl(recipient)}
                              className="absolute inset-0 w-full h-full object-contain bg-white"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                              alt=""
                            />
                          </div>
                          <span className="text-[12px] font-medium text-foreground/70 truncate max-w-[200px] group-hover/cc:text-foreground transition-colors">
                            {recipient}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <span className="text-muted-foreground font-medium">{t('mail.date_label')}</span>
                <span className="font-medium text-foreground">
                  {mail.timestamp ? format(new Date(mail.timestamp), 'd MMMM yyyy, H:mm:ss (XXX)', { locale: ru }) : ''}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls - Mail.ru Style */}
        <div className="flex items-center gap-1 self-start ml-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onMarkAsRead(mail.id, !isRead)}
            title={isRead ? t('mail.mark_unread') : t('mail.mark_read')}
            className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl"
          >
            {isRead ? <MailOpen className="h-[18px] w-[18px]" /> : <MailIcon className="h-[18px] w-[18px] text-blue-500" />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleStar(mail.id)}
            title={t('mail.to_starred')}
            className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl"
          >
            <Star className={cn("h-[18px] w-[18px]", isStarred && "fill-current text-yellow-500 hover:text-yellow-600")} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success(t('mail.link_copied'));
            }}
            title={t('mail.copy_link')}
            className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl"
          >
            <Link2 className="h-[18px] w-[18px]" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onContextMenuAction('createEvent', mail)}
            title={t('mail.create_event')}
            className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl"
          >
            <Calendar className="h-[18px] w-[18px]" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.print()}
            title={t('mail.print')}
            className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl"
          >
            <Printer className="h-[18px] w-[18px]" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                title={t('mail.tags')}
                className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl"
              >
                <Tag className="h-[18px] w-[18px]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-lg border-border/50">
               {categories.filter(cat => cat.keywords?.trim()).map((cat) => {
                  /* @ts-expect-error - Icon resolution */
                  const Icon = (LucideIcons as Record<string, React.ElementType>)[cat.icon] || LucideIcons.Tag;
                  return (
                    <DropdownMenuItem
                      key={cat.id}
                      onClick={() => {
                        onSetMailFilter(cat.id as MailFilterType);
                        onSetViewMode('list');
                      }}
                      className="gap-2 cursor-pointer rounded-lg hover:bg-muted/50"
                    >
                      <Icon className="w-4 h-4 opacity-70" /> {cat.name}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={() => {
                    onSetSettingsTab('categories');
                    onSetViewMode('settings');
                  }}
                  className="gap-2 text-xs font-semibold cursor-pointer rounded-lg hover:bg-muted/50"
                >
                  {t('mail.manage_labels')}
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                title={t('common.more')}
                className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl"
              >
                <MoreVertical className="h-[18px] w-[18px]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-xl shadow-lg border-border/50 p-1.5">
              <DropdownMenuItem onClick={() => onReply(mail)} className="gap-3 cursor-pointer rounded-lg hover:bg-muted/50 py-2.5">
                <Reply className="w-4 h-4 opacity-70" /> {t('mail.actions.reply')} <span className="ml-auto text-[10px] text-muted-foreground/50 font-medium">R</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onForward(mail)} className="gap-3 cursor-pointer rounded-lg hover:bg-muted/50 py-2.5">
                <Forward className="w-4 h-4 opacity-70" /> {t('mail.actions.forward')} <span className="ml-auto text-[10px] text-muted-foreground/50 font-medium">F</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1" />

              <DropdownMenuItem onClick={() => onDelete(mail)} className="gap-3 cursor-pointer rounded-lg hover:bg-destructive/10 text-destructive py-2.5 group">
                <Trash2 className="w-4 h-4 opacity-70 group-hover:opacity-100" /> {t('mail.delete')} <span className="ml-auto text-[10px] opacity-50 font-medium">Del</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onContextMenuAction('archive', mail)} className="gap-3 cursor-pointer rounded-lg hover:bg-muted/50 py-2.5">
                <Archive className="w-4 h-4 opacity-70" /> {t('mail.to_archive')} <span className="ml-auto text-[10px] text-muted-foreground/50 font-medium">E</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSpam(mail)} className="gap-3 cursor-pointer rounded-lg hover:bg-muted/50 py-2.5">
                <ShieldAlert className="w-4 h-4 opacity-70" /> {t('mail.spam')} <span className="ml-auto text-[10px] text-muted-foreground/50 font-medium">Shift+J</span>
              </DropdownMenuItem>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="gap-3 cursor-pointer rounded-lg hover:bg-muted/50 py-2.5">
                  <FolderOpen className="w-4 h-4 opacity-70" /> {t('mail.move_to_folder')}
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="p-2 w-64 max-h-[300px] overflow-auto rounded-xl shadow-lg border-border/50">
                    <FolderTreeMenu
                      folders={folders}
                      onSelectFolder={(id) => onMoveToFolder(id)}
                      separateSystemFolders={true}
                    />
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuSeparator className="my-1" />

              <DropdownMenuItem onClick={() => onMarkAsRead(mail.id, !isRead)} className="gap-3 cursor-pointer rounded-lg hover:bg-muted/50 py-2.5">
                {isRead ? <MailOpen className="w-4 h-4 opacity-70" /> : <MailIcon className="w-4 h-4 opacity-70" />}
                {isRead ? t('mail.mark_unread') : t('mail.mark_read')} <span className="ml-auto text-[10px] text-muted-foreground/50 font-medium">U</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleStar(mail.id)} className="gap-3 cursor-pointer rounded-lg hover:bg-muted/50 py-2.5">
                <Star className={cn("w-4 h-4", isStarred ? "fill-current text-yellow-500" : "opacity-70")} />
                {t('mail.mark_starred')} <span className="ml-auto text-[10px] text-muted-foreground/50 font-medium">I</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1" />

              <DropdownMenuItem onClick={() => onContextMenuAction('createEvent', mail)} className="gap-3 cursor-pointer rounded-lg hover:bg-muted/50 py-2.5">
                <Calendar className="w-4 h-4 opacity-70" /> {t('mail.create_event')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.print()} className="gap-3 cursor-pointer rounded-lg hover:bg-muted/50 py-2.5">
                <Printer className="w-4 h-4 opacity-70" /> {t('mail.print_letter')}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => onTranslate()} className="gap-3 cursor-pointer rounded-lg hover:bg-muted/50 py-2.5">
                <Languages className="w-4 h-4 opacity-70" /> {t('mail.translate_letter')} <span className="ml-auto text-[10px] text-muted-foreground/50 font-medium">Shift+T</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1" />

              <DropdownMenuItem onClick={() => onContextMenuAction('findSimilar', mail)} className="gap-3 cursor-pointer rounded-lg hover:bg-muted/50 py-2.5">
                <History className="w-4 h-4 opacity-70" /> {t('mail.find_all_letters')} <span className="ml-auto text-[10px] text-muted-foreground/50 font-medium">Shift+S</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleDetails(!showDetails)}
            className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl ml-2"
          >
            <ChevronDown className={cn("w-4 h-4 transition-transform", showDetails && "rotate-180")} />
          </Button>
        </div>
      </div>
    </div>
  );
}
