import React from 'react';
import { Avatar, AvatarFallback } from './avatar';
import { Button } from './button';
import { Badge } from './badge';
import { Lock, ExternalLink, FileText, Edit2, Trash2, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export interface NoteAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  addedAt: string;
}

export interface Note {
  id: string;
  author: string;
  authorId?: string;
  initials: string;
  date: string;
  text: string;
  isInternal: boolean;
  attachments?: NoteAttachment[];
}

export interface NoteItemProps {
  note: Note;

  /** Текущий пользователь ID */
  currentUserId?: string;

  /** Текущий пользователь имя */
  currentUserName?: string;

  /** Роль текущего пользователя */
  currentUserRole?: string;

  /** Начать редактирование */
  onEdit?: (note: Note) => void;

  /** Удалить заметку */
  onDelete?: (noteId: string) => void;

  /** Переключить приватность */
  onTogglePrivacy?: (noteId: string) => void;

  /** Удалить вложение */
  onRemoveAttachment?: (noteId: string, attachmentId: string) => void;

  /** Показывать действия (редактирование/удаление) */
  showActions?: boolean;
}

/**
 * Компонент отображения одной заметки
 * 
 * @example
 * ```tsx
 * <NoteItem
 *   note={note}
 *   currentUserId={userId}
 *   currentUserRole={role}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 * ```
 */
export function NoteItem({
  note,
  currentUserId = '',
  currentUserName = '',
  currentUserRole = '',
  onEdit,
  onDelete,
  onTogglePrivacy,
  onRemoveAttachment,
  showActions = true,
}: NoteItemProps) {
  const { t } = useTranslation();
  const isAdmin = currentUserRole === 'admin';

  // Логика проверки прав на редактирование:
  // - Администратор может редактировать любые заметки
  // - Автор может редактировать свои заметки (по ID или по имени)
  // - Если нет информации об авторе, разрешаем редактирование
  // - Если нет информации о текущем пользователе, разрешаем редактирование (не авторизованные может пробовать)
  const canEdit = isAdmin || 
                  (currentUserId && note.authorId === currentUserId) || 
                  (currentUserName && note.author === currentUserName) ||
                  !note.authorId ||
                  (!currentUserId && !currentUserName); // Если пользователь не идентифицирован, показываем кнопки

  const canDelete = canEdit;

  return (
    <div
      className={cn(
        'flex gap-3 group',
        note.isInternal && 'bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-100 dark:border-amber-900/50'
      )}
    >
      <Avatar className="h-8 w-8 mt-1">
        <AvatarFallback className="text-xs bg-primary/10 text-primary">
          {note.initials}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-1">
        {/* Заголовок */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{note.author}</span>
            {note.isInternal && (
              <Badge variant="secondary" className="text-[10px] gap-1">
                <Lock className="w-3 h-3" />
                {t('common.note_item.personal')}
              </Badge>
            )}
            {!note.isInternal && (
              <Badge variant="outline" className="text-[10px] gap-1">
                <FileText className="w-3 h-3" />
                {t('common.note_item.public')}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{note.date}</span>
            {showActions && canDelete && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => onEdit?.(note)}
                  title={t('common.edit')}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => onTogglePrivacy?.(note.id)}
                  title={note.isInternal ? t('common.note_item.make_public') : t('common.note_item.make_private')}
                >
                  {note.isInternal ? (
                    <ExternalLink className="w-3 h-3" />
                  ) : (
                    <Lock className="w-3 h-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete?.(note.id)}
                  title={t('common.note_item.delete_note')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Текст заметки */}
        <p className="text-sm text-foreground leading-relaxed">
          {note.text}
        </p>

        {/* Вложения */}
        {note.attachments && note.attachments.length > 0 && (
          <div className="mt-2 space-y-1">
            <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Paperclip className="w-3 h-3" />
              {t('common.note_item.attached_documents')}
            </div>
            {note.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 text-xs p-1.5 bg-muted/50 rounded-md group/attachment"
              >
                <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 truncate text-primary hover:underline"
                >
                  {attachment.name}
                </a>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {attachment.type}
                </Badge>
                {showActions && canDelete && onRemoveAttachment && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-destructive opacity-0 group-hover/attachment:opacity-100 transition-opacity hover:bg-destructive/10 shrink-0"
                    onClick={() => onRemoveAttachment?.(note.id, attachment.id)}
                    title={t('common.note_item.delete_file')}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
