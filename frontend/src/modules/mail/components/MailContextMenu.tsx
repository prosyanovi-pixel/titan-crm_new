import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Mail,
  Reply,
  ReplyAll,
  Forward,
  Eye,
  EyeOff,
  FolderOpen,
  Trash2,
  ShieldAlert,
  Tag,
  Printer,
  Plus,
  ChevronRight,
  Archive,
  Star,
  Calendar,
  Filter,
  Search,
  X,
  Paperclip,
} from 'lucide-react';
import { systemFolderNames, getCanonicalSystemKey } from '../utils/componentUtils';
import { ApiMailFolder } from '../types';
import { FolderTreeMenu } from './FolderTreeMenu';
import { useTranslation } from '@/lib/i18n';

interface MailContextMenuProps {
  mail: any;
  folders: ApiMailFolder[];
  labels?: string[];
  onSelectAction: (action: string, mail: any, data?: any) => void;
  onClose: () => void;
  position: { x: number; y: number };
  isAllSelected?: boolean;
}

export function MailContextMenu({
  mail,
  folders,
  labels = [],
  onSelectAction,
  onClose,
  position,
  isAllSelected = false,
}: MailContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState(position);
  const { t } = useTranslation();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [onClose]);

  // Корректировка позиции чтобы меню не выходило за экран
  useEffect(() => {
    if (!menuRef.current) return;

    const rect = menuRef.current.getBoundingClientRect();
    let newX = position.x;
    let newY = position.y;

    if (newX + rect.width > window.innerWidth) {
      newX = window.innerWidth - rect.width - 8;
    }
    if (newY + rect.height > window.innerHeight) {
      newY = window.innerHeight - rect.height - 8;
    }

    newX = Math.max(0, newX);
    newY = Math.max(0, newY);

    setAdjustedPos({ x: newX, y: newY });
  }, [position]);

  const handleAction = (action: string, data?: any) => {
    console.log('[MailContextMenu] handleAction called:', action, 'mailId:', mail.id, 'data:', data);
    onSelectAction(action, mail, data);
    onClose();
  };

  const [hoveredSubmenu, setHoveredSubmenu] = useState<string | null>(null);

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] bg-popover border rounded-md shadow-md py-1 min-w-[220px]"
      style={{
        left: adjustedPos.x,
        top: adjustedPos.y,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Открыть в новой вкладке */}
      <button
        className="w-full px-2 py-1.5 text-sm flex items-center hover:bg-accent cursor-pointer group"
        onClick={() => handleAction('openNewTab')}
      >
        <Mail className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-foreground" />
        {t('mail.context_menu.open_new_tab')}
      </button>
      {/* 1.1 Переслать как вложение */}
      <button
        className="w-full px-2 py-1.5 text-sm flex items-center hover:bg-accent cursor-pointer group"
        onClick={() => handleAction('forwardAsAttachment')}
      >
        <Paperclip className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-foreground" />
        {t('mail.context_menu.forward_as_attachment')}
      </button>

      {/* 2. Выделить все письма / Снять выделение */}
      <button
        className="w-full px-2 py-1.5 text-sm flex items-center hover:bg-accent cursor-pointer group"
        onClick={() => handleAction('selectAll')}
      >
        {isAllSelected ? (
          <>
            <X className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-foreground" />
            {t('mail.context_menu.deselect_all')}
          </>
        ) : (
          <>
            <div className="mr-2 w-4 h-4 border-2 border-muted-foreground/40 rounded flex items-center justify-center group-hover:border-foreground">
              <Plus className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100" />
            </div>
            {t('mail.context_menu.select_all')}
          </>
        )}
      </button>

      <div className="my-1 h-px bg-border" />

      {/* 3. Удалить */}
      <button
        className="w-full px-2 py-1.5 text-sm flex items-center hover:bg-accent cursor-pointer text-destructive group"
        onClick={() => handleAction('delete')}
      >
        <Trash2 className="mr-2 h-4 w-4 opacity-70 group-hover:opacity-100" />
        {t('mail.context_menu.delete')}
      </button>

      {/* 4. В архив */}
      <button
        className="w-full px-2 py-1.5 text-sm flex items-center hover:bg-accent cursor-pointer group"
        onClick={() => handleAction('archive')}
      >
        <Archive className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-foreground" />
        {t('mail.context_menu.archive')}
      </button>

      {/* 5. Спам */}
      <button
        className="w-full px-2 py-1.5 text-sm flex items-center hover:bg-accent cursor-pointer group"
        onClick={() => handleAction('spam')}
      >
        <ShieldAlert className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-foreground" />
        {t('mail.context_menu.spam')}
      </button>

      {/* 6. Переместить в папку */}
      <div
        className="relative group/sub"
        onMouseEnter={() => setHoveredSubmenu('folder')}
        onMouseLeave={() => setHoveredSubmenu(null)}
      >
        <button
          className="w-full px-2 py-1.5 text-sm flex items-center justify-between hover:bg-accent cursor-pointer"
        >
          <span className="flex items-center">
            <FolderOpen className="mr-2 h-4 w-4 text-muted-foreground group-hover/sub:text-foreground" />
            {t('mail.context_menu.move_to_folder')}
          </span>
          <ChevronRight className="h-3 w-3 opacity-50" />
        </button>

        {hoveredSubmenu === 'folder' && (
          <div className="absolute left-full top-0 ml-1 bg-popover border rounded-md shadow-md py-1 min-w-[180px] max-h-[60vh] overflow-y-auto z-[10000]">
            <FolderTreeMenu
              folders={folders}
              onSelectFolder={(folderId) => handleAction('moveToFolder', folderId)}
              separateSystemFolders={true}
              onlyVisible={true}
              baseIndent={12}
              renderAs="button"
              className="py-1"
            />
          </div>
        )}
      </div>

      <div className="my-1 h-px bg-border" />

      {/* 7. Пометить прочитанным/непрочитанным */}
      <button
        className="w-full px-2 py-1.5 text-sm flex items-center hover:bg-accent cursor-pointer group"
        onClick={() => handleAction('markRead', !mail.isRead)}
      >
        {mail.isRead ? (
          <>
            <EyeOff className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-foreground" />
            {t('mail.context_menu.mark_unread')}
          </>
        ) : (
          <>
            <Eye className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-foreground" />
            {t('mail.context_menu.mark_read')}
          </>
        )}
      </button>

      {/* 8. Пометить флажком */}
      <button
        className="w-full px-2 py-1.5 text-sm flex items-center hover:bg-accent cursor-pointer group"
        onClick={() => handleAction('toggleStar')}
      >
        <Star className={cn('mr-2 h-4 w-4', mail.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground group-hover:text-foreground')} />
        {t('mail.context_menu.flag')}
      </button>

      {/* 9. Создать событие */}
      <button
        className="w-full px-2 py-1.5 text-sm flex items-center hover:bg-accent cursor-pointer group"
        onClick={() => handleAction('createEvent')}
      >
        <Calendar className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-foreground" />
        {t('mail.context_menu.create_event')}
      </button>

      {/* 10. Создать фильтр */}
      <button
        className="w-full px-2 py-1.5 text-sm flex items-center hover:bg-accent cursor-pointer group"
        onClick={() => handleAction('createFilter')}
      >
        <Filter className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-foreground" />
        {t('mail.context_menu.create_filter')}
      </button>

      <div className="my-1 h-px bg-border" />

      {/* 11. Найти все письма отправителя */}
      <button
        className="w-full px-2 py-1.5 text-sm flex items-center hover:bg-accent cursor-pointer group"
        onClick={() => handleAction('findSimilar')}
      >
        <Search className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-foreground" />
        {t('mail.context_menu.find_sender_mails')}
      </button>
    </div>
  );
}
