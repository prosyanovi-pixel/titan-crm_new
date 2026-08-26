import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  History, Clock, CheckCircle2, XCircle, ChevronRight, Info, AlertTriangle, Terminal, Trash2, FileText, FolderOpen, ListChecks
} from 'lucide-react';
import { ResizableSheet } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/lib/i18n';
import { deleteExecution, deleteExecutionHistory, fetchExecutionHistory, fetchExecutionDetails, WorkflowExecution, retryExecution, approveExecution, fetchRegistryActions } from '../api/workflowAPI';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ExecutionHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId: string | null;
  workflowName: string;
}

export const ExecutionHistorySheet: React.FC<ExecutionHistorySheetProps> = ({
  open, onOpenChange, workflowId, workflowName
}) => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [selectedExecId, setSelectedExecId] = useState<string | null>(null);

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['workflow-history', workflowId],
    queryFn: () => fetchExecutionHistory(workflowId!),
    enabled: !!workflowId && open,
  });

  const { data: registryActions = [] } = useQuery({
    queryKey: ['workflow-registry-actions'],
    queryFn: fetchRegistryActions,
  });

  const { data: details, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['workflow-execution', selectedExecId],
    queryFn: () => fetchExecutionDetails(workflowId!, selectedExecId!),
    enabled: !!selectedExecId,
  });

  const clearHistoryMutation = useMutation({
    mutationFn: () => deleteExecutionHistory(workflowId!),
    onSuccess: () => {
      setSelectedExecId(null);
      qc.invalidateQueries({ queryKey: ['workflow-history', workflowId] });
    }
  });

  const deleteExecutionMutation = useMutation({
    mutationFn: (execId: string) => deleteExecution(workflowId!, execId),
    onSuccess: () => {
      setSelectedExecId(null);
      qc.invalidateQueries({ queryKey: ['workflow-history', workflowId] });
    }
  });

  const retryMutation = useMutation({
    mutationFn: (execId: string) => retryExecution(workflowId!, execId),
    onSuccess: () => {
      toast.success(t('workflows.history.retry_started'));
      qc.invalidateQueries({ queryKey: ['workflow-history', workflowId] });
    }
  });

  const approveMutation = useMutation({
    mutationFn: ({ execId, approved }: { execId: string, approved: boolean }) => approveExecution(workflowId!, execId, approved),
    onSuccess: (_, variables) => {
      toast.success(variables.approved ? t('workflows.history.approved') : t('workflows.history.rejected'));
      qc.invalidateQueries({ queryKey: ['workflow-history', workflowId] });
      qc.invalidateQueries({ queryKey: ['workflow-execution', variables.execId] });
    }
  });

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':    return <XCircle className="w-4 h-4 text-red-500" />;
      case 'dry_run':   return <Terminal className="w-4 h-4 text-blue-500" />;
      case 'paused':    return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'waiting_approval': return <AlertTriangle className="w-4 h-4 text-orange-500 animate-pulse" />;
      default:          return <Clock className="w-4 h-4 text-orange-500 animate-pulse" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="outline" className="text-green-600 border-green-200">{t('workflows.table.status_success') || 'Успех'}</Badge>;
      case 'failed':    return <Badge variant="outline" className="text-red-600 border-red-200">{t('workflows.table.status_failed') || 'Ошибка'}</Badge>;
      case 'dry_run':   return <Badge variant="outline" className="text-blue-600 border-blue-200">Dry Run</Badge>;
      case 'paused':    return <Badge variant="outline" className="text-yellow-600 border-yellow-200">{t('workflows.status.paused')}</Badge>;
      case 'waiting_approval': return <Badge variant="outline" className="text-orange-600 border-orange-200 animate-pulse">{t('workflows.history.waiting_approval_short') || 'Ожидание'}</Badge>;
      default:          return <Badge variant="outline">{t('workflows.status.active')}</Badge>;
    }
  };

  const formatSafe = (dateStr: string | undefined, formatStr: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      return format(d, formatStr);
    } catch {
      return '—';
    }
  };

  return (
    <ResizableSheet 
      open={open} 
      onOpenChange={onOpenChange}
      moduleKey="workflow-history-sheet"
      defaultWidth="xl"
      title={
        <span className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          {t('workflows.history.title')}
        </span>
      }
      description={workflowName}
      contentClassName="p-0 overflow-hidden flex flex-col h-full"
      hideFooter
    >
      <div className="flex-1 overflow-hidden flex">
        {/* History List */}
        <div className={`flex-1 flex flex-col ${selectedExecId ? 'hidden sm:flex' : 'flex'}`}>
          <div className="p-4 border-b bg-slate-50/50 dark:bg-zinc-900/50">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => {
                if (!workflowId) return;
                if (confirm(t('workflows.history.clear_all_confirm'))) {
                  clearHistoryMutation.mutate();
                }
              }}
              disabled={!workflowId || clearHistoryMutation.isPending}
            >
              <Trash2 className="w-4 h-4" />
              {t('workflows.history.clear_history')}
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))
              ) : history.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>{t('workflows.history.empty')}</p>
                </div>
              ) : history.map((exec) => (
                <div 
                  key={exec.id} 
                  className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-center gap-3 ${
                    selectedExecId === exec.id ? 'bg-primary/5 border-primary/30' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedExecId(exec.id)}
                >
                  <StatusIcon status={exec.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-muted-foreground">
                        {formatSafe(exec.started_at, 'dd.MM HH:mm:ss')}
                      </span>
                      {getStatusBadge(exec.status)}
                    </div>
                    <p className="text-xs truncate text-muted-foreground">
                      {t('workflows.table.trigger')}: {exec.trigger_event_payload?.trigger || 'manual'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(t('workflows.history.delete_confirm'))) {
                        deleteExecutionMutation.mutate(exec.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Details View */}
        {selectedExecId && (
          <div className="flex-1 bg-muted/30 border-l flex flex-col">
            <div className="p-4 border-b flex items-center justify-between bg-background">
              <span className="font-medium text-sm">{t('workflows.history.details')}</span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedExecId(null)} className="sm:hidden">
                {t('workflows.actions.cancel')}
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {isLoadingDetails ? (
                  <Skeleton className="h-40 w-full" />
                ) : details && (
                  <>
                    <div className="space-y-4">
                      {details.status === 'failed' && (
                        <div className="mb-4 flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg">
                          <span className="text-sm text-red-800">{t('workflows.history.failed_msg')}</span>
                          <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-100" onClick={() => retryMutation.mutate(details.id)} disabled={retryMutation.isPending}>
                            {t('workflows.history.retry_btn')}
                          </Button>
                        </div>
                      )}
                      {details.status === 'waiting_approval' && (
                        <div className="mb-4 flex items-center justify-between p-3 bg-orange-50 border border-orange-100 rounded-lg">
                          <span className="text-sm text-orange-800 font-medium flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {t('workflows.history.waiting_approval')}
                          </span>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-100" onClick={() => approveMutation.mutate({ execId: details.id, approved: false })} disabled={approveMutation.isPending}>
                              {t('workflows.history.reject_btn')}
                            </Button>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => approveMutation.mutate({ execId: details.id, approved: true })} disabled={approveMutation.isPending}>
                              {t('workflows.history.approve_btn')}
                            </Button>
                          </div>
                        </div>
                      )}
                      {details.status === 'paused' && (
                        <div className="mb-4 flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                          <Clock className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm text-yellow-800">
                            {t('workflows.history.paused_msg')}
                          </span>
                        </div>
                      )}

                      {details.summary && (
                        <div className="border rounded-lg bg-background p-4 space-y-4 shadow-sm">
                          <div className="flex items-center gap-2">
                            <Info className="w-4 h-4 text-primary" />
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                              {t('workflows.history.summary_title')}
                            </p>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-md border bg-muted/30 p-3">
                              <p className="text-[10px] uppercase text-muted-foreground mb-1">{t('workflows.history.summary_steps')}</p>
                              <p className="text-sm font-semibold">{details.summary.successCount}/{details.summary.totalSteps}</p>
                            </div>
                            <div className="rounded-md border bg-muted/30 p-3">
                              <p className="text-[10px] uppercase text-muted-foreground mb-1">{t('workflows.history.summary_cases')}</p>
                              <p className="text-sm font-semibold">{details.summary.updatedCases.length}</p>
                            </div>
                            <div className="rounded-md border bg-muted/30 p-3">
                              <p className="text-[10px] uppercase text-muted-foreground mb-1">{t('workflows.history.summary_documents')}</p>
                              <p className="text-sm font-semibold">{details.summary.documents.length}</p>
                            </div>
                            <div className="rounded-md border bg-muted/30 p-3">
                              <p className="text-[10px] uppercase text-muted-foreground mb-1">{t('workflows.history.summary_status')}</p>
                              <p className="text-sm font-semibold">{details.summary.processing?.status || '—'}</p>
                            </div>
                          </div>

                          {details.summary.processing && (
                            <div className="flex items-center justify-between rounded-md border bg-slate-50/80 px-3 py-2 text-sm">
                              <div className="flex items-center gap-2">
                                <ListChecks className="w-4 h-4 text-muted-foreground" />
                                <span>{details.summary.processing.summary || t('workflows.history.summary_processing')}</span>
                              </div>
                              <Badge variant="outline">{details.summary.processing.progress}%</Badge>
                            </div>
                          )}

                          {details.summary.updatedCases.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  {t('workflows.history.summary_updated_cases')}
                                </p>
                              </div>
                              <div className="space-y-2">
                                {details.summary.updatedCases.map((item) => (
                                  <div key={item.caseId} className="rounded-md border p-3 text-sm bg-muted/20">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                      <span className="font-semibold">{item.caseNumber || item.title || item.caseId}</span>
                                      {item.status && <Badge variant="outline">{item.status}</Badge>}
                                      {item.instanceType && <Badge variant="secondary">{item.instanceType}</Badge>}
                                    </div>
                                    <p className="text-xs text-muted-foreground">ID: {item.caseId}</p>
                                    {item.actions.length > 0 && (
                                      <p className="text-xs text-muted-foreground mt-1">{item.actions.join(' · ')}</p>
                                    )}
                                    {item.notes.length > 0 && (
                                      <p className="text-xs text-muted-foreground mt-1">{t('workflows.history.summary_notes')}: {item.notes.join(' · ')}</p>
                                    )}
                                    {item.documents.length > 0 && (
                                      <p className="text-xs text-muted-foreground mt-1">{t('workflows.history.summary_documents')}: {item.documents.join(' · ')}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {details.summary.documents.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <FolderOpen className="w-4 h-4 text-muted-foreground" />
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  {t('workflows.history.summary_documents')}
                                </p>
                              </div>
                              <div className="space-y-2">
                                {details.summary.documents.map((document, index) => (
                                  <div key={`${document.documentId || document.documentName || index}`} className="rounded-md border p-3 text-sm bg-muted/20">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-semibold">{document.documentName || document.documentId || t('workflows.history.summary_document_fallback')}</span>
                                      <Badge variant="outline" className={document.success ? 'text-green-600 border-green-200' : 'text-amber-600 border-amber-200'}>
                                        {document.success ? 'OK' : 'Fallback'}
                                      </Badge>
                                      {document.external && <Badge variant="secondary">External</Badge>}
                                    </div>
                                    {document.url && (
                                      <p className="text-xs text-muted-foreground mt-1 break-all">{document.url}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                       {details.logs?.map((log, idx) => {
                         const actionInfo = registryActions?.find((a: any) => a.module === log.module && (a.name === log.action || a.action === log.action));
                         const actionLabel = actionInfo?.label || log.action;
                         const moduleLabel = t(`workflows.registry.modules.${log.module}`) || log.module;

                         return (
                           <div key={log.id} className="border bg-background rounded-lg p-3 text-sm">
                             <div className="flex items-center justify-between mb-2 pb-2 border-b">
                               <div className="flex flex-col">
                                 <span className="font-semibold text-xs text-muted-foreground uppercase">{moduleLabel}</span>
                                 <span className="font-bold">{t('workflows.editor.step_label')} {log.stepOrder}: {actionLabel}</span>
                               </div>
                               {log.status === 'success' ? (
                                 <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{t('workflows.toast.validation_success')}</Badge>
                               ) : log.status === 'error' ? (
                                 <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{t('common.error')}</Badge>
                               ) : (
                                 <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">{t('workflows.editor.on_fail.skip')}</Badge>
                               )}
                             </div>
                             
                             {log.error_message && (
                               <div className="p-2 bg-red-50 text-red-600 rounded mb-2 text-xs flex items-start gap-2">
                                 <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                 <span>{log.error_message}</span>
                               </div>
                             )}

                             {log.output_data && (
                               <div className="mt-2">
                                 <p className="text-[10px] uppercase text-muted-foreground mb-1">{t('workflows.history.output_data')}</p>
                                 <pre className="bg-muted p-2 rounded text-[10px] overflow-auto max-h-40">
                                   {JSON.stringify(log.output_data, null, 2)}
                                 </pre>
                               </div>
                             )}
                           </div>
                         );
                       })}
                    </div>

                    <div className="mt-6 border-t pt-4">
                      <div className="flex items-center gap-2 mb-2">
                         <Terminal className="w-3 h-3 text-muted-foreground" />
                         <p className="text-[10px] uppercase text-muted-foreground">{t('workflows.history.execution_console')}</p>
                      </div>
                      <div className="bg-slate-900 text-slate-100 rounded-lg p-3 font-mono text-[10px] overflow-auto max-h-60 space-y-1 shadow-inner">
                        {details.executionLogs && details.executionLogs.length > 0 ? (
                          details.executionLogs.map((entry, i) => (
                            <div key={i} className="flex gap-2 leading-relaxed">
                              <span className="opacity-40 shrink-0">[{formatSafe(entry.time, 'HH:mm:ss')}]</span>
                              <span className={cn(
                                entry.level === 'error' ? 'text-red-400' : 
                                entry.level === 'warn' ? 'text-amber-400' : 
                                entry.level === 'info' ? 'text-blue-300' : ''
                              )}>
                                {entry.msg}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="opacity-40 italic">{t('workflows.history.no_console_logs')}</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 border-t pt-4 opacity-80">
                      <p className="text-[10px] uppercase text-muted-foreground mb-2">{t('workflows.history.final_context_title')}</p>
                      <pre className="bg-muted p-2 rounded text-[10px] overflow-auto max-h-40">
                        {JSON.stringify(details.context, null, 2)}
                      </pre>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </ResizableSheet>
  );
};
