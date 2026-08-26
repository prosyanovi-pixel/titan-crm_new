/**
 * Approval Workflow Component
 * Display and manage contract approval steps
 */

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useContractApprovals, useSendForApproval, useCancelApproval } from '../hooks';
import type { ContractApproval } from '../types/contract.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { CheckCircle, Clock, XCircle, User } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { EntityCombobox } from '@/components/shared/EntityCombobox';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { isPast } from 'date-fns';

interface ApprovalWorkflowProps {
  contractId: string;
}

export function ApprovalWorkflow({ contractId }: ApprovalWorkflowProps) {
  const { t } = useTranslation();
  const { approvals, isLoading, approve, isApproving, reject, isRejecting } =
    useContractApprovals(contractId);
  const sendMutation = useSendForApproval(contractId);

  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  
  const cancelMutation = useCancelApproval(contractId);


  const handleCancelApproval = async () => {
    try {
      await cancelMutation.mutateAsync();
    } catch (e) {
      // handled by hook
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline" | "custom"> = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{t(`contracts.approvals.status.${status}`)}</Badge>;
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">{t('general.loading')}</div>;
  }


  return (
    <div className="space-y-4">
      {/* removed generic send button as per user request (send per version in VersionHistory instead) */}

      {approvals && approvals.some(a => a.status === 'pending') && (
        <div className="flex justify-end mb-4">
          <Button variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleCancelApproval} disabled={cancelMutation.isPending}>
            Отменить согласование
          </Button>
        </div>
      )}

      {(!approvals || approvals.length === 0) ? (
        <div className="rounded-2xl border border-dashed bg-muted/30 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-primary/50" />
          </div>
          <h3 className="text-lg font-medium mb-1">{t('contracts.approvals.title')}</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Перейдите во вкладку "Версии", чтобы отправить нужную версию на согласование.
          </p>
        </div>
      ) : (
        <div className="relative pl-8 space-y-6 before:absolute before:inset-y-0 before:left-[19px] before:w-[2px] before:bg-border/50 pt-2 pb-4">
          {approvals.map((approval) => {
            const isPending = approval.status === 'pending';
            const isApproved = approval.status === 'approved';
            const isRejected = approval.status === 'rejected';

            return (
              <div key={approval.id} className="relative">
                {/* Timeline Marker */}
                <div className={`absolute -left-[39px] w-5 h-5 rounded-full border-4 border-background flex items-center justify-center z-10 
                  ${isApproved ? 'bg-emerald-500' : isRejected ? 'bg-red-500' : 'bg-amber-500 ring-4 ring-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.5)]'}`}
                />

                <Card className={`p-5 transition-all duration-300 ${isPending ? 'border-amber-500/30 shadow-md bg-gradient-to-br from-card to-amber-500/5' : 'opacity-90 hover:opacity-100 hover:shadow-md'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-semibold text-secondary-foreground shadow-inner border border-border/50">
                          {approval.assignedToName?.[0] || <User className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-medium text-base">
                            {approval.assignedToName || approval.assignedTo || t('general.unassigned')}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm text-muted-foreground">
                              {t('contracts.approvals.table.step')} {approval.stepNumber}
                            </span>
                            {approval.versionId && (
                              <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/50">
                                Версия {approval.versionNumber !== undefined ? approval.versionNumber : approval.versionId.substring(0,8)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {approval.deadlineDate && isPending && (
                        <div className="pl-13 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-md font-medium border ${isPast(new Date(approval.deadlineDate)) ? 'bg-red-100 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                            Срок: {formatDate(approval.deadlineDate)}
                            {isPast(new Date(approval.deadlineDate)) && ' (Просрочено)'}
                          </span>
                        </div>
                      )}

                      {isApproved && approval.approvalDate && (
                        <div className="pl-13 text-sm text-emerald-600/90 bg-emerald-500/10 py-2 px-3 rounded-md border border-emerald-500/20 inline-block">
                          {t('contracts.approvals.table.approved_by')}: <span className="font-medium">{approval.approverName || approval.approvedBy}</span>
                          <span className="mx-2 opacity-50">•</span>
                          {formatDate(approval.approvalDate)}
                        </div>
                      )}

                      {isRejected && approval.rejectionReason && (
                        <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                          <p className="text-sm text-red-600/90 font-semibold mb-1 flex items-center gap-2">
                            <XCircle className="w-4 h-4" />
                            {t('general.reason')}: {approval.rejectionReason}
                          </p>
                          <p className="text-xs text-red-500/80">
                            Для повторного согласования перейдите во вкладку "Версии", создайте новую версию с исправлениями и отправьте её на согласование.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                      {getStatusBadge(approval.status)}

                      {isPending && (
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-600">
                                {t('contracts.approvals.actions.approve')}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{t('contracts.approvals.actions.approve')}</DialogTitle>
                                <DialogDescription>
                                  {t('contracts.approvals.dialogs.approve_confirm')}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="flex justify-end gap-2 mt-4">
                                <Button
                                  onClick={() => approve({ stepNumber: approval.stepNumber })}
                                  disabled={isApproving}
                                >
                                  {t('general.confirm')}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="border-red-500/30 hover:bg-red-500/10 hover:text-red-600 text-red-600">
                                {t('contracts.approvals.actions.reject')}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{t('contracts.approvals.actions.reject')}</DialogTitle>
                                <DialogDescription>
                                  {t('contracts.approvals.dialogs.reject_confirm')}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 mt-4">
                                <Textarea
                                  placeholder={t('contracts.approvals.dialogs.reject_reason_placeholder')}
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  rows={4}
                                  className="resize-none"
                                />
                                <div className="flex justify-end gap-2">
                                  <Button
                                    onClick={() => {
                                      reject({ stepNumber: approval.stepNumber, reason: rejectionReason });
                                      setRejectionReason('');
                                    }}
                                    disabled={isRejecting || !rejectionReason.trim()}
                                    variant="destructive"
                                  >
                                    {t('general.confirm')}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
