import React, { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import * as LucideIcons from 'lucide-react';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Mail as MailIcon 
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { showConfirm } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FolderContextMenu } from './FolderContextMenu';
import { SortableFolderTree } from './SortableFolderTree';
import {
  isSystemFolder,
  getSenderLogoUrl,
} from '../utils/componentUtils';
import { useMailContext } from '../context/useMailContext';

export function MailSidebar() {
  const { t } = useTranslation();
  const {
    setActiveFolder,
    selectedAccountId,
    handleAccountChange,
    accounts,
    folders,
    setViewMode,
    syncStatus,
    isAllSelected,
    selectAll,
    clearSelection,
    actions,
    mailFilter,
    setMailFilter,
    categories,
  } = useMailContext();

  const [categoriesExpanded, setCategoriesExpanded] = useState(true);
  const [systemExpanded, setSystemExpanded] = useState(true);
  const [customExpanded, setCustomExpanded] = useState(true);
  const [folderContextMenu, setFolderContextMenu] = useState<{
    open: boolean;
    folder: any;
    x: number;
    y: number;
  }>({ open: false, folder: null, x: 0, y: 0 });

  // @ts-ignore
  const isSyncing = syncStatus?.status === 'progress' || syncStatus?.status === 'counting';

  // Обработка кастомного события для контекстного меню из SortableFolderTree
  useEffect(() => {
    const handleContextMenuEvent = (e: any) => {
      const { event, folder } = e.detail;
      setFolderContextMenu({
        open: true,
        folder,
        x: event.clientX,
        y: event.clientY
      });
    };
    window.addEventListener('mail-folder-context-menu', handleContextMenuEvent);
    return () => window.removeEventListener('mail-folder-context-menu', handleContextMenuEvent);
  }, []);

  const handleFolderAction = async (action: string, folderData: any) => {
    if (action === 'open_folder') {
      setActiveFolder(folderData.id);
      setViewMode('list');
    } else if (action === 'mark_all_read') {
      actions.handleMarkAllRead(folderData.id);
    } else if (action === 'rename_folder') {
      actions.handleRenameFolder(folderData);
    } else if (action === 'create_subfolder') {
      actions.handleCreateSubfolder(folderData);
    } else if (action === 'delete_folder') {
      actions.handleDeleteFolder(folderData);
    } else if (action === 'select_all_mails') {
      selectAll?.();
    } else if (action === 'clear_selection') {
      clearSelection?.();
    } else if (action === 'clear_folder') {
      if (await showConfirm({
        title: 'Очистить папку',
        description: `Удалить все письма из папки "${folderData.folderName}"? Это действие нельзя отменить.`,
        confirmText: 'Удалить всё',
        variant: 'destructive',
      })) {
        try {
          await api.post(`/mail/folders/${folderData.id}/clear`, {});
          toast.success('Папка очищена');
        } catch (error: any) {
          toast.error(error.message || 'Ошибка при очистке папки');
        }
      }
    }
  };

  const { systemFolders, customFolders } = useMemo(() => {
    const isVisible = (f: any) => f.isVisible !== false;
    const visibleFolders = folders.filter(isVisible);
    
    // Функция для определения, является ли папка системной или потомком системной
    const isDescendantOfSystem = (folder: any): boolean => {
      if (isSystemFolder(folder.folderType)) return true;
      if (!folder.parentFolderId) return false;
      const parent = folders.find(p => p.id === folder.parentFolderId);
      return parent ? isDescendantOfSystem(parent) : false;
    };

    return {
      systemFolders: visibleFolders.filter(isDescendantOfSystem),
      customFolders: visibleFolders.filter(f => !isDescendantOfSystem(f))
    };
  }, [folders]);

  return (
    <>
      <div className="w-64 shrink-0 border-r bg-muted/30 flex flex-col h-full overflow-hidden">
        {accounts.length > 0 && (
          <div className="p-3 border-b bg-background/50">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-sm truncate bg-background shadow-sm border-primary/10 pl-2">
                  <div className="relative mr-2 shrink-0">
                    {selectedAccountId === 'all' ? (
                      <MailIcon className="w-5 h-5 p-0.5 text-muted-foreground" />
                    ) : (
                      <>
                        <img 
                          src={getSenderLogoUrl(accounts.find(a => a.id === selectedAccountId)?.email || '')} 
                          className="w-5 h-5 rounded-md object-contain p-0.5 bg-white border border-border/50"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 border border-background" />
                      </>
                    )}
                  </div>
                  <span className="truncate flex-1 text-left font-semibold">
                    {selectedAccountId === 'all' ? 'Все ящики' : (accounts.find(a => a.id === selectedAccountId)?.displayName || accounts.find(a => a.id === selectedAccountId)?.email || t('mail.select_account'))}
                  </span>
                  <ChevronDown className="ml-1 h-3 w-3 opacity-30" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[220px]">
                {accounts.length > 1 && (
                  <>
                    <DropdownMenuItem onClick={() => handleAccountChange('all')} className="text-sm font-medium gap-2">
                      <MailIcon className="w-4 h-4 text-muted-foreground" />
                      Все ящики
                    </DropdownMenuItem>
                    <div className="h-px bg-border my-1" />
                  </>
                )}
                {accounts.map((account) => (
                  <DropdownMenuItem key={account.id} onClick={() => handleAccountChange(account.id)} className="text-sm font-medium gap-2">
                    <img 
                      src={getSenderLogoUrl(account.email)} 
                      className="w-4 h-4 rounded-sm object-contain bg-white"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                    {account.displayName || account.email}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <div className="p-3">
          <Button
            className="w-full gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-white font-bold h-10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => window.dispatchEvent(new CustomEvent('open-mail-compose'))}
            disabled={!selectedAccountId}
          >
            <Plus className="h-4 w-4" />
            Написать письмо
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-6 py-2 px-2">
            {systemFolders.length > 0 && (
              <div>
                <button
                  className="w-full px-2 py-1 mb-2 text-[10px] font-black text-muted-foreground uppercase flex items-center justify-between hover:text-foreground transition-all tracking-widest"
                  onClick={() => setSystemExpanded(!systemExpanded)}
                >
                  <span>{t('mail.folders_label')}</span>
                  {systemExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>
                {systemExpanded && <SortableFolderTree folders={systemFolders} type="system" />}
              </div>
            )}

            <div>
              <button
                className="w-full px-2 py-1 mb-2 text-[10px] font-black text-muted-foreground uppercase flex items-center justify-between hover:text-foreground transition-all tracking-widest"
                onClick={() => setCategoriesExpanded(!categoriesExpanded)}
              >
                <span>Категории</span>
                {categoriesExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
              {categoriesExpanded && (
                <div className="space-y-0.5 px-1">
                    {categories.filter((cat) => cat.keywords?.trim()).map((cat) => {
                    // @ts-ignore
                    const Icon = LucideIcons[cat.icon] || LucideIcons.Tag;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setMailFilter(cat.id as any);
                          setViewMode('list');
                        }}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-all group",
                          mailFilter === cat.id 
                            ? "bg-primary/10 text-primary font-bold shadow-sm" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          mailFilter === cat.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                        )} />
                        <span className="truncate">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            
            {customFolders.length > 0 && (
              <div>
                <button
                  className="w-full px-2 py-1 mb-2 text-[10px] font-black text-muted-foreground uppercase flex items-center justify-between hover:text-foreground transition-all tracking-widest"
                  onClick={() => setCustomExpanded(!customExpanded)}
                >
                  <span>{t('mail.custom_folders')}</span>
                  {customExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>
                {customExpanded && <SortableFolderTree folders={customFolders} type="custom" />}
              </div>
            )}
          </div>
        </ScrollArea>
        
        {isSyncing && (
          <div className="p-3 border-t bg-background/50">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-[10px] font-black uppercase text-primary tracking-widest animate-pulse">Синхронизация...</span>
              <span className="text-[10px] font-bold text-muted-foreground">IMAP</span>
            </div>
            <Progress value={100} className="h-1 animate-pulse" />
          </div>
        )}
      </div>

      {folderContextMenu.open && folderContextMenu.folder && (
        <div className="z-50" style={{ position: 'fixed', left: folderContextMenu.x, top: folderContextMenu.y, pointerEvents: 'auto' }}>
          <FolderContextMenu
            folder={folderContextMenu.folder}
            onSelectAction={handleFolderAction}
            onClose={() => setFolderContextMenu({ ...folderContextMenu, open: false })}
            allMailsSelected={isAllSelected}
          />
        </div>
      )}
    </>
  );
}
