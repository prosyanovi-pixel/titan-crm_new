import React from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  ListFilter,
  Folder,
  RefreshCw,
  Trash2,
  Loader,
} from "lucide-react";

interface IMAPFolder {
  name: string;
  path: string;
  folderType?: string;
  matchedFolderId?: string;
  isVisible?: boolean;
  isSyncEnabled?: boolean;
}

interface MailAccountFoldersProps {
  imapFolders: IMAPFolder[];
  onUpdateFolderType: (imapFolder: IMAPFolder, newType: string) => void;
  onToggleFolderSetting: (imapFolder: IMAPFolder, setting: 'isVisible' | 'isSyncEnabled') => void;
  onSyncFolders: () => Promise<void>;
  onClearFolder: (folder: IMAPFolder) => Promise<void>;
  loadingFolders: boolean;
  clearingFolder: string | null;
}

export function MailAccountFolders({
  imapFolders, onUpdateFolderType, onToggleFolderSetting, onSyncFolders, onClearFolder, loadingFolders, clearingFolder,
}: MailAccountFoldersProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 pt-2">
      <Card className="shadow-sm border-primary/10">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-primary">
              <ListFilter className="w-5 h-5" /> {t('mail.settings.folders.title')}
            </CardTitle>
            <CardDescription>{t('mail.settings.folders.desc')}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onSyncFolders} disabled={loadingFolders}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loadingFolders && "animate-spin")} /> 
            {t('mail.settings.folders.update')}
          </Button>
        </CardHeader>
        <CardContent>
          {loadingFolders ? (
            <div className="py-20 text-center"><Loader className="w-10 h-10 mx-auto animate-spin text-primary opacity-20" /></div>
          ) : imapFolders.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {imapFolders.map((f) => (
                <div key={f.path} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-full bg-primary/10 text-primary"><Folder className="w-4 h-4" /></div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{f.name}</p>
                      <Select value={f.folderType || 'custom'} onValueChange={(v) => onUpdateFolderType(f, v)}>
                        <SelectTrigger className="h-6 border-none p-0 text-[10px] bg-transparent hover:underline"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inbox">{t('mail.folders.inbox')}</SelectItem>
                          <SelectItem value="sent">{t('mail.folders.sent')}</SelectItem>
                          <SelectItem value="drafts">{t('mail.folders.drafts')}</SelectItem>
                          <SelectItem value="spam">Spam</SelectItem>
                          <SelectItem value="trash">{t('mail.folders.trash')}</SelectItem>
                          <SelectItem value="archive">{t('mail.folders.archive')}</SelectItem>
                          <SelectItem value="custom">{t('mail.custom_folders')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {f.matchedFolderId && (
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-red-500" onClick={() => onClearFolder(f)} disabled={clearingFolder === f.path}>
                        {clearingFolder === f.path ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    )}
                    <div className="flex flex-col items-center gap-1">
                      <Switch checked={f.isSyncEnabled !== false} onCheckedChange={() => onToggleFolderSetting(f, 'isSyncEnabled')} className="scale-75" />
                      <span className="text-[8px] font-bold opacity-50 uppercase">{t('mail.settings.folders.sync_short')}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Switch checked={f.isVisible !== false} onCheckedChange={() => onToggleFolderSetting(f, 'isVisible')} className="scale-75" />
                      <span className="text-[8px] font-bold opacity-50 uppercase">{t('mail.settings.folders.visible_short')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border-2 border-dashed rounded-xl">
              <Folder className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
              <p className="text-muted-foreground">{t('mail.settings.folders.empty_desc')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

