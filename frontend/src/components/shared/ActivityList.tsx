import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Activity as ActivityIcon, Clock, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import { useConfirm } from '@/components/ui/confirm-dialog';

interface ActivityEntry {
  id: number;
  user_id?: string;
  action?: string;
  entity_type?: string;
  entity_id?: string;
  old_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
  user_name?: string;
}

interface ActivityListProps {
  queryKey: Array<string | number>;
  fetchPath: string; // GET path, e.g. `/contractors/${id}/activity`
  deletePath?: (id: number) => string; // path builder for delete
  emptyMessage?: string;
}

export function ActivityList({ queryKey, fetchPath, deletePath, emptyMessage }: ActivityListProps) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: activity, isLoading } = useQuery<ActivityEntry[]>({
    queryKey,
    queryFn: () => api.get(fetchPath),
    retry: false,
  });

  const isError = (activity === undefined && !isLoading && !!queryClient.getQueryState(queryKey)?.error) || false;

  const deleteMutation = useMutation({
    mutationFn: (activityId: number) => api.delete(deletePath ? deletePath(activityId) : `${fetchPath}/${activityId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(t('common.deleted'));
    },
    onError: () => {
      toast.error(t('common.error'));
    }
  });

  const handleDelete = async (e: React.MouseEvent, activityId: number) => {
    e.stopPropagation();
    const isConfirmed = await confirm(t('common.confirm_delete'));
    if (isConfirmed) {
      deleteMutation.mutate(activityId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
      </div>
    );
  }

  if (!activity || activity.length === 0) {
    if (isError) {
      return (
        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl bg-muted/5">
          <ActivityIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>{t('activity.unavailable')}</p>
        </div>
      );
    }

    return (
      <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl bg-muted/5">
          <ActivityIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>{emptyMessage ? t(emptyMessage) : t('common.no_activity')}</p>
        </div>
    );
  }

  const getActionIcon = (action?: string) => {
    switch (action) {
      case 'CREATE': return <ActivityIcon className="w-4 h-4 text-emerald-500" />;
      case 'UPDATE': return <ActivityIcon className="w-4 h-4 text-blue-500" />;
      case 'DELETE': return <ActivityIcon className="w-4 h-4 text-destructive" />;
      default: return <ActivityIcon className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActionLabel = (action?: string) => {
    switch (action) {
      case 'CREATE': return t('activity.actions.create');
      case 'UPDATE': return t('activity.actions.update');
      case 'DELETE': return t('activity.actions.delete');
      default: return action || '';
    }
  };

  return (
    <div className="space-y-4">
      {activity.map((entry) => (
        <div key={entry.id} className={cn(
          'group border rounded-xl overflow-hidden bg-card transition-all',
          expandedId === entry.id ? 'ring-1 ring-primary/20 shadow-md' : 'hover:border-primary/30'
        )}>
          <div className="p-4 cursor-pointer flex items-start gap-4 relative" onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}>
            <div className="mt-1 p-2 bg-muted/50 rounded-lg group-hover:bg-primary/5 transition-colors">
              {getActionIcon(entry.action)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm">{getActionLabel(entry.action)}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {entry.created_at ? format(new Date(entry.created_at), 'd MMMM yyyy, HH:mm', { locale: ru }) : '—'}
                  </span>
                  {deletePath && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => handleDelete(e, entry.id)} disabled={deleteMutation.isPending}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-foreground/80">{entry.user_name || 'System'}</span>
                </div>
                {entry.ip_address && <span className="text-[10px] opacity-50 font-mono">IP: {entry.ip_address}</span>}
              </div>
            </div>

            <div className="mt-1 text-muted-foreground opacity-50">
              {expandedId === entry.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>

          {expandedId === entry.id && (entry.old_data || entry.new_data) && (
            <div className="px-4 pb-4 pt-0 border-t border-dashed">
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {entry.old_data && (
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-[9px] uppercase font-black text-muted-foreground">{t('activity.comparison.old_value')}
                    </Badge>
                    <pre className="text-[10px] p-2 bg-muted/30 rounded-lg overflow-x-auto font-mono max-h-40">{JSON.stringify(entry.old_data, null, 2)}</pre>
                  </div>
                )}
                {entry.new_data && (
                  <div className="space-y-2">
                    <Badge variant="secondary" className="text-[9px] uppercase font-black bg-blue-500/10 text-blue-600 border-blue-500/20">{t('activity.comparison.new_value')}</Badge>
                    <pre className="text-[10px] p-2 bg-blue-500/[0.02] rounded-lg border border-blue-500/10 overflow-x-auto font-mono max-h-40">{JSON.stringify(entry.new_data, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default ActivityList;
