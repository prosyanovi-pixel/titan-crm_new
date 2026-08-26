import React from "react";
import { Bell, Check, Trash2, Info, CheckCircle2, AlertTriangle, AlertCircle, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { useTranslation } from "@/lib/i18n";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { useChats } from "@/modules/mail/hooks/useChatQueries";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export function NotificationDropdown() {
  const { t } = useTranslation();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loading
  } = useNotifications();

  const { data: chatsData } = useChats();
  const chats = chatsData?.data || [];
  
  const chatNotifications: Notification[] = chats
    .filter(chat => chat.unreadCount > 0)
    .map(chat => ({
      id: -chat.id, // Use negative IDs to avoid collisions
      type: 'info',
      title: t('notifications.center.new_message').replace('{name}', chat.name),
      message: chat.lastMessage || t('notifications.center.new_message_fallback'),
      link: '/mail',
      isRead: false,
      createdAt: chat.lastMessageTime || chat.updatedAt
    }));

  const allNotifications = [...chatNotifications, ...notifications].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const totalUnreadCount = unreadCount + chats.filter(c => c.unreadCount > 0).length;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-destructive" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors relative group">
          <Bell className="w-5 h-5 group-hover:animate-bell" />
          {totalUnreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-destructive text-[10px] font-bold text-white flex items-center justify-center rounded-full border-2 border-background shadow-sm">
              {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[320px] sm:w-[400px] p-0 overflow-hidden shadow-2xl border-border/50 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">{t('notifications.center.title')}</h3>
            {totalUnreadCount > 0 && (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-primary/10 text-primary border-none">
                {totalUnreadCount} {t('notifications.center.unread_count', { count: totalUnreadCount })}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs h-8 text-primary hover:text-primary hover:bg-primary/10 font-medium"
                onClick={(e) => {
                    e.preventDefault();
                    markAllAsRead();
                }}
            >
              {t('notifications.center.mark_all_read')}
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px] bg-background">
          {loading && allNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
               <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
               <span className="text-xs font-medium animate-pulse">{t('general.generated.zagruzka')}</span>
            </div>
          ) : allNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/40">
              <div className="relative mb-4">
                <Bell className="w-16 h-16 stroke-[1]" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              </div>
              <p className="text-sm font-medium text-muted-foreground/60">{t('notifications.center.empty')}</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {allNotifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={cn(
                    "relative flex gap-3 p-4 border-b border-border/40 hover:bg-muted/40 transition-all group/item",
                    !notification.isRead && "bg-primary/[0.03] hover:bg-primary/[0.06]"
                  )}
                >
                  {!notification.isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                  )}
                  
                  <div className="mt-0.5 shrink-0">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                       <p className={cn(
                           "text-sm font-semibold leading-tight",
                           !notification.isRead ? "text-foreground" : "text-muted-foreground"
                       )}>
                           {notification.title}
                       </p>
                       <span className="text-[10px] text-muted-foreground shrink-0 font-medium uppercase tracking-tight tabular-nums">
                           {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ru })}
                       </span>
                    </div>
                    {notification.message && (
                      <p className="text-[12px] text-muted-foreground line-clamp-2 leading-snug">
                        {notification.message}
                      </p>
                    )}
                    <div className="flex items-center gap-3 pt-1">
                        {!notification.isRead && (
                            <button 
                                onClick={() => markAsRead(notification.id)}
                                className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                            >
                                <Check className="w-3 h-3" />
                                {t('notifications.center.mark_read')}
                            </button>
                        )}
                        {notification.link && (
                            <Link 
                                to={notification.link}
                                className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                            >
                                <ExternalLink className="w-3 h-3" />
                                {t('notifications.center.go_to_link')}
                            </Link>
                        )}
                    </div>
                  </div>
                  {notification.id > 0 && (
                    <button 
                      onClick={() => deleteNotification(notification.id)}
                      className="absolute right-2 bottom-2 p-1.5 opacity-0 group-hover/item:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all duration-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
            <div className="p-3 bg-muted/30 border-t">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold h-9 rounded-lg hover:bg-background transition-all">
                    {t('notifications.center.clear_all')}
                </Button>
            </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
