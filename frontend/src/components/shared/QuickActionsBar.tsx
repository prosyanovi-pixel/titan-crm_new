import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Mail,
  StickyNote,
  FileSignature,
  Calendar,
  Download,
  Send,
  Phone,
  MessageSquare,
  FileText,
  Folder,
  Bookmark,
  User,
  File,
  FileWarning
} from 'lucide-react';
import { QuickAction } from '@/lib/settings-data';
import { useTranslation } from '@/lib/i18n';

interface QuickActionsBarProps {
  quickActions: QuickAction[];
  onActionClick?: (action: QuickAction) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Plus,
  Mail,
  StickyNote,
  FileSignature,
  Calendar,
  Download,
  Send,
  Phone,
  MessageSquare,
  FileText,
  Folder,
  Bookmark,
  User,
  File,
  FileWarning
};

export function QuickActionsBar({ quickActions, onActionClick }: QuickActionsBarProps) {
  const { t } = useTranslation();
  
  if (quickActions.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {quickActions.map(action => {
        const Icon = iconMap[action.icon] || Plus;
        return (
          <Button
            key={action.id}
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => onActionClick?.(action)}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{action.name}</span>
          </Button>
        );
      })}
    </div>
  );
}