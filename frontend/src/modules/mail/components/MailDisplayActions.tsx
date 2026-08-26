import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface MailDisplayActionsProps {
  currentIndex: number;
  totalMails: number;
  onPrevious: () => void;
  onNext: () => void;
  onSetViewMode: (mode: 'list' | 'mail' | 'compose' | 'settings') => void;
}

export function MailDisplayActions({
  currentIndex,
  totalMails,
  onPrevious,
  onNext,
  onSetViewMode,
}: MailDisplayActionsProps) {
  const { t } = useTranslation();
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < totalMails - 1;

  return (
    <div className="flex items-center justify-between px-6 py-2 border-b bg-muted/10">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSetViewMode('list')}
          className="h-8 gap-2 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="font-bold text-xs uppercase tracking-widest">{t('mail.back')}</span>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrevious}
          disabled={!hasPrevious}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <ChevronDown className="h-4 w-4 rotate-180" />
        </Button>
        <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-tighter">
          {currentIndex + 1} / {totalMails}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          disabled={!hasNext}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
