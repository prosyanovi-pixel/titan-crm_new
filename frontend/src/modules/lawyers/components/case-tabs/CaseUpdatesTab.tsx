import { useTranslation } from "@/lib/i18n";
import { CaseRecordUpdate } from "../../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { CheckCircle2, AlertCircle, FileText, MessageSquare, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CaseUpdatesTabProps {
  updates?: CaseRecordUpdate[];
  onDeleteUpdate?: (updateId: string) => void;
  onDeleteAll?: () => void;
}

const updateTypeIcons: Record<string, any> = {
  case_update: AlertCircle,
  case_note: MessageSquare,
  document_added: FileText,
};

const updateTypeLabels: Record<string, string> = {
  case_update: "Обновление дела",
  case_note: "Заметка",
  document_added: "Документ добавлен",
};

export function CaseUpdatesTab({ updates = [], onDeleteUpdate, onDeleteAll }: CaseUpdatesTabProps) {
  const { t } = useTranslation();

  if (updates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle2 className="w-12 h-12 text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground">{t('lawyers.updates.no_updates')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs text-muted-foreground hover:text-destructive gap-1.5"
          onClick={onDeleteAll}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Очистить все
        </Button>
      </div>

      {updates.map((update) => {
        const Icon = updateTypeIcons[update.update_type] || AlertCircle;
        const label = updateTypeLabels[update.update_type] || update.update_type;
        
        return (
          <div
            key={update.id}
            className={cn(
              "p-4 border rounded-lg transition-all group relative",
              update.is_viewed
                ? "bg-muted/30 border-border text-muted-foreground"
                : "bg-primary/5 border-primary/20 text-foreground"
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              onClick={() => onDeleteUpdate?.(update.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>

            <div className="flex items-start gap-3 pr-8">
              <Icon className={cn(
                "w-5 h-5 mt-0.5 flex-shrink-0",
                !update.is_viewed ? "text-primary" : "text-muted-foreground"
              )} />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{update.title}</h4>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {label}
                    </Badge>
                  </div>
                  {!update.is_viewed && (
                    <Badge variant="destructive" className="text-xs flex-shrink-0">
                      Новое
                    </Badge>
                  )}
                </div>

                {update.description && (
                  <p className="text-sm mt-2 text-muted-foreground">
                    {update.description}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                  <span>
                    {update.created_at ? 
                      formatDistanceToNow(new Date(update.created_at), {
                        locale: ru,
                        addSuffix: true,
                      })
                      : 'Недавно'
                    }
                  </span>
                  {update.is_viewed && update.viewed_at && (
                    <span className="text-muted-foreground/70">
                      • {t('lawyers.updates.viewed_at')} {new Date(update.viewed_at).toLocaleString('ru-RU')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
