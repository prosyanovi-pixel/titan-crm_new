import { FileItem } from "../types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Folder, 
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  File as FileIcon,
  Archive,
  MoreVertical,
  Star,
  Download,
  Share2,
  RotateCcw,
  AlertTriangle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/lib/i18n";
import { useModuleSettings } from "@/modules/settings/hooks/useModuleSettings";

interface FileCardProps {
  file: FileItem;
  onClick: (file: FileItem) => void;
  onToggleStar: (id: string) => void;
  onRestore?: (id: string) => void;
  selected?: boolean;
  onToggleSelection?: (id: string) => void;
  isTrash?: boolean;
}

export function FileCard({ file, onClick, onToggleStar, onRestore, selected = false, onToggleSelection, isTrash }: FileCardProps) {
  const { t } = useTranslation();
  const { settings } = useModuleSettings("documents");

  const showStarred = settings.features?.enableStarred !== false;
  const showSharing = settings.features?.enableSharing !== false;
  const showDownload = settings.features?.enableDownload !== false;

  const getIcon = () => {
    switch (file.type) {
      case "folder": return <Folder className="w-10 h-10 text-yellow-400 fill-yellow-400/20" />;
      case "pdf": return <FileText className="w-10 h-10 text-red-500" />;
      case "doc": return <FileText className="w-10 h-10 text-blue-500" />;
      case "xls": return <FileSpreadsheet className="w-10 h-10 text-green-500" />;
      case "image": return <ImageIcon className="w-10 h-10 text-purple-500" />;
      case "archive": return <Archive className="w-10 h-10 text-orange-500" />;
      default: return <FileIcon className="w-10 h-10 text-gray-500" />;
    }
  };

  return (
    <Card 
      className={`group cursor-pointer hover:shadow-md transition-all border-border/60 hover:border-primary/50 overflow-hidden ${selected ? "ring-2 ring-primary border-primary" : ""}`}
      onClick={() => onClick(file)}
    >
      <CardContent className="p-4 flex flex-col items-center justify-center aspect-[4/3] bg-muted/10 relative">
        {onToggleSelection && (
          <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={selected} onCheckedChange={() => onToggleSelection(file.id)} aria-label={file.name} />
          </div>
        )}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              {isTrash ? (
                <DropdownMenuItem onClick={() => onRestore?.(file.id)} className="text-green-600 focus:text-green-700 focus:bg-green-50">
                  <RotateCcw className="w-3 h-3 mr-2" />
                  {t('common.restore') || "Восстановить"}
                </DropdownMenuItem>
              ) : (
                <>
                  {showStarred && (
                    <DropdownMenuItem onClick={() => onToggleStar(file.id)}>
                      <Star className={`w-3 h-3 mr-2 ${file.starred ? "fill-yellow-400 text-yellow-400" : ""}`} />
                      {file.starred ? "Убрать из избранного" : t('documents.categories.starred')}
                    </DropdownMenuItem>
                  )}
                  {showDownload && (
                    <DropdownMenuItem>
                      <Download className="w-3 h-3 mr-2" />
                      {t('common.download')}
                    </DropdownMenuItem>
                  )}
                  {showSharing && (
                    <DropdownMenuItem>
                      <Share2 className="w-3 h-3 mr-2" />
                      {t('common.share')}
                    </DropdownMenuItem>
                  )}
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="relative">
          {getIcon()}
          {file.isMissing && (
            <div className="absolute -top-1 -right-1 bg-background rounded-full p-0.5 shadow-sm border" title={t("documents.toast.file_missing_warning")}>
              <AlertTriangle className="w-3 h-3 text-destructive fill-destructive/10" />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-3 flex items-start justify-between bg-card">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate leading-tight" title={file.name}>
            {file.name}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] text-muted-foreground truncate">{file.date}</span>
            {file.size && (
              <>
                <span className="text-[10px] text-muted-foreground">•</span>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{file.size}</span>
              </>
            )}
          </div>
        </div>
        {file.starred && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 shrink-0 mt-0.5 ml-1" />}
      </CardFooter>
    </Card>
  );
}
