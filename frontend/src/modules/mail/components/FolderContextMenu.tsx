import React, { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FolderOpen,
  CheckCircle,
  Trash2,
  Edit2,
  FolderPlus,
  Eraser,
  Square,
  CheckSquare,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

interface FolderContextMenuProps {
  folder: {
    id: string;
    folderName: string;
    folderType: string;
    accountId: string;
  };
  onSelectAction: (action: string, folder: any) => void;
  onClose: () => void;
  allMailsSelected?: boolean;
}

export function FolderContextMenu({
  folder,
  onSelectAction,
  onClose,
  allMailsSelected = false,
}: FolderContextMenuProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const systemFolderTypes = new Set(['system', 'inbox', 'sent', 'drafts', 'archive', 'spam', 'trash']);
  const isSystemFolder = systemFolderTypes.has((folder.folderType || '').toLowerCase());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(true);
    
    const handleClickOutside = () => {
      setOpen(false);
      onClose();
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        onClose();
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const handleAction = (action: string) => {
    if (isSystemFolder && ['delete_folder', 'rename_folder', 'create_subfolder'].includes(action)) {
      toast.error(t('mail.folder_context_menu.cannot_modify_system'));
      return;
    }
    
    onSelectAction(action, folder);
    setOpen(false);
    onClose();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <div className="fixed w-0 h-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-56" 
        align="start" 
        side="right"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {/* Открыть папку */}
        <DropdownMenuItem onClick={() => handleAction('open_folder')}>
          <FolderOpen className="mr-2 h-4 w-4" />
          {t('mail.folder_context_menu.open')}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Выбрать все письма / Отменить выбор */}
        <DropdownMenuItem onClick={() => handleAction(allMailsSelected ? 'clear_selection' : 'select_all_mails')}>
          {allMailsSelected ? (
            <>
              <CheckSquare className="mr-2 h-4 w-4" />
              {t('mail.folder_context_menu.deselect_all')}
            </>
          ) : (
            <>
              <Square className="mr-2 h-4 w-4" />
              {t('mail.folder_context_menu.select_all_mails')}
            </>
          )}
        </DropdownMenuItem>
        
        {/* Выбрать непрочитанные */}
        <DropdownMenuItem onClick={() => handleAction('select_unread_mails')}>
          <EyeOff className="mr-2 h-4 w-4" />
          {t('mail.folder_context_menu.select_unread_mails')}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Пометить всё как прочитанное */}
        <DropdownMenuItem onClick={() => handleAction('mark_all_read')}>
          <CheckCircle className="mr-2 h-4 w-4" />
          {t('mail.folder_context_menu.mark_all_read')}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Переименовать */}
        <DropdownMenuItem 
          onClick={() => handleAction('rename_folder')}
          className={isSystemFolder ? 'text-muted-foreground opacity-50' : ''}
          disabled={isSystemFolder}
        >
          <Edit2 className="mr-2 h-4 w-4" />
          {t('mail.folder_context_menu.rename')}
        </DropdownMenuItem>
        
        {/* Создать подпапку */}
        <DropdownMenuItem 
          onClick={() => handleAction('create_subfolder')}
          className={isSystemFolder ? 'text-muted-foreground opacity-50' : ''}
          disabled={isSystemFolder}
        >
          <FolderPlus className="mr-2 h-4 w-4" />
          {t('mail.folder_context_menu.create_subfolder')}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Очистить папку */}
        <DropdownMenuItem 
          onClick={() => handleAction('clear_folder')}
          className="text-destructive focus:text-destructive"
        >
          <Eraser className="mr-2 h-4 w-4" />
          {t('mail.folder_context_menu.clear_folder')}
        </DropdownMenuItem>
        
        {/* Удалить папку */}
        <DropdownMenuItem 
          onClick={() => handleAction('delete_folder')}
          className={isSystemFolder ? 'text-muted-foreground opacity-50' : 'text-destructive focus:text-destructive'}
          disabled={isSystemFolder}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t('mail.folder_context_menu.delete_folder')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
