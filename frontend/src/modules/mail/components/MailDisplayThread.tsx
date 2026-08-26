import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/lib/i18n';
import { Mail } from '../types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  getAvatarColor,
  getInitials,
  getSenderLogoUrl,
} from '../utils/componentUtils';

interface MailDisplayThreadProps {
  currentMailId: string;
  threadMails: Mail[];
  onSelectMail: (mail: Mail) => void;
}

export function MailDisplayThread({
  currentMailId,
  threadMails,
  onSelectMail,
}: MailDisplayThreadProps) {
  const { t } = useTranslation();

  if (threadMails.length === 0) {
    return null;
  }

  return (
    <div className="px-8 pb-20">
      <Separator className="mb-6" />
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/50">{t('mail.conversation_history')}</h4>
        <Badge variant="outline" className="text-[10px] opacity-50">{threadMails.length} {t('mail.messages_count')}</Badge>
      </div>

      <div className="space-y-4 relative">
        <div className="absolute left-6 top-4 bottom-4 w-px bg-border/40" />
        {threadMails.map((m) => (
          <div
            key={m.id}
            onClick={() => onSelectMail(m)}
            className={cn(
              "relative flex gap-4 p-4 rounded-2xl transition-all border border-transparent hover:border-border/60 hover:bg-muted/30 cursor-pointer group",
              m.id === currentMailId && "bg-primary/5 border-primary/20 ring-1 ring-primary/10"
            )}
          >
            <div className="relative z-10">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm overflow-hidden",
                getAvatarColor(m.sender.email)
              )}>
                <span>{getInitials(m.sender.name || '', m.sender.email)}</span>
                <img
                  src={getSenderLogoUrl(m.sender.email, m.sender.avatar)}
                  className="absolute inset-0 w-full h-full object-contain bg-white p-1"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  alt=""
                />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-black truncate">{m.sender.name || m.sender.email}</p>
                <span className="text-[10px] font-bold text-muted-foreground/40">
                  {format(new Date(m.timestamp), 'd MMM, HH:mm', { locale: ru })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {m.content ? m.content.replace(/<[^>]*>/g, '').slice(0, 150) : t('mail.no_text_placeholder')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
