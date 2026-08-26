/**
 * Карточка сохранённого отчёта
 */

import { ExternalLink, Pencil, Copy, Trash2, Share2, LockOpen, MoreHorizontal, Users } from 'lucide-react';
import { FileText, TrendingUp, BarChart2, AlertCircle, FolderKanban, Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge, useStatuses } from '@/components/ui/status-system';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateReportConfig } from '../../hooks/useReportConfigs';
import { toast } from 'sonner';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getReportTypeMeta } from '../../config/reportTypes';
import type { ReportConfig } from '../../types/reports.types';
import { useTranslation } from '@/lib/i18n';

const ICON_MAP: Record<string, React.ElementType> = {
  FileText, TrendingUp, BarChart2, AlertCircle, FolderKanban, Users, Scale,
};

interface SavedReportCardProps {
  config:      ReportConfig;
  currentUserId: string;
  onDuplicate: (id: string) => void;
  onDelete:    (id: string) => void;
  onToggleShare: (id: string, isShared: boolean) => void;
}

/** Форматировать дату */
function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
}

/**
 * Карточка сохранённого отчёта со списком действий
 */
export function SavedReportCard({
  config, currentUserId, onDuplicate, onDelete, onToggleShare,
}: SavedReportCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const meta     = getReportTypeMeta(config.reportType);
  const Icon     = meta ? (ICON_MAP[meta.icon] ?? BarChart2) : BarChart2;
  const isOwner  = String(config.createdBy) === String(currentUserId);
  const [localStatus, setLocalStatus] = useState<string | undefined>(config.status);
  const updateStatus = useUpdateReportConfig();
  const { statuses = [], isLoading: statusesLoading } = useStatuses({ module: 'reports' });

  const handleStatusChange = async (newStatus: string) => {
    const prev = localStatus;
    setLocalStatus(newStatus || undefined);
    try {
      await updateStatus.mutateAsync({ id: config.id, data: { status: newStatus } });
      toast.success(t('reports.saved_card_toast_status_saved'));
    } catch (e) {
      setLocalStatus(prev);
      toast.error(t('reports.saved_card_toast_status_error'));
    }
  };

  return (
    <div className="group flex items-start gap-4 p-4 rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all bg-card">
      {/* Иконка */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/8 text-primary flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>

      {/* Контент */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-medium text-sm leading-tight truncate">{config.name}</h3>
            {config.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{config.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 overflow-visible">
            {config.isShared && (
              <Badge id={`shared-${config.id}`} variant="secondary" className="text-xs gap-1">
                <Users className="w-3 h-3" />
                {t('reports.saved_card_shared_badge')}
              </Badge>
            )}
            {isOwner ? (
              <div className="ml-2">
                <Select value={localStatus ?? ''} onValueChange={(v) => handleStatusChange(v)}>
                  <SelectTrigger className="h-7 text-xs w-auto min-w-[9rem] overflow-visible [&>span]:line-clamp-none">
                      <SelectValue placeholder={t('reports.saved_card_status_placeholder')} className="whitespace-nowrap" style={{ WebkitLineClamp: 'unset' }} />
                    </SelectTrigger>
                  <SelectContent>
                    {statusesLoading ? (
                      <SelectItem value="__loading" disabled>{t('reports.saved_card_loading')}</SelectItem>
                    ) : (
                      statuses.filter(s => s && s.id).map(s => (
                        <SelectItem key={String(s.id)} value={String(s.id)}>
                          <Badge id={String(s.id)} type="status" module="reports" size="md" variant="soft" showLabel={true} />
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              config.status && <Badge id={String(config.status)} type="status" module="reports" className="ml-2" variant="soft" size="md" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span>{meta?.label ? t(meta.label) : config.reportType}</span>
          <span>·</span>
          <span>{t('reports.saved_card_updated_at', { date: fmtDate(config.updatedAt) })}</span>
          {!isOwner && config.createdByName && (
            <>
              <span>·</span>
              <span>{config.createdByName}</span>
            </>
          )}
        </div>

        {/* Действия */}
        <div className="flex items-center gap-2 mt-3">
          <Button
            size="sm"
            variant="default"
            className="h-7 text-xs gap-1.5"
            onClick={() => navigate(`/reports/view/${config.id}`)}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t('reports.saved_card_open_button')}
          </Button>

          {isOwner && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5"
              onClick={() => navigate(`/reports/builder/${config.id}`)}
            >
              <Pencil className="w-3.5 h-3.5" />
              {t('reports.saved_card_edit_button')}
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDuplicate(config.id)}>
                <Copy className="w-3.5 h-3.5 mr-2" />
                {t('reports.saved_card_duplicate_item')}
              </DropdownMenuItem>

              {isOwner && (
                <>
                  <DropdownMenuItem onClick={() => onToggleShare(config.id, !config.isShared)}>
                    {config.isShared ? (
                      <><LockOpen className="w-3.5 h-3.5 mr-2" />{t('reports.saved_card_close_access_item')}</>
                    ) : (
                      <><Share2 className="w-3.5 h-3.5 mr-2" />{t('reports.saved_card_share_item')}</>
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(config.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    {t('reports.saved_card_delete_item')}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
