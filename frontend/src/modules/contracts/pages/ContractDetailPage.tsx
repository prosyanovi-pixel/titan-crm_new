/**
 * Contract Detail Page
 * Full contract view with tabs for details, versions, approvals, files, and cases
 */

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { api } from '@/lib/api';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useContract, useDeleteContract } from '../hooks';
import { ContractForm, ApprovalWorkflow, VersionHistory, FileUpload, ContractFinance } from '../components';
import { SmartMetadataGrid } from '@/components/shared';
import { useProjects } from '@/modules/projects/hooks/useProjects';
import { formatDate } from '@/lib/formatters';
import { Building2, FolderKanban, FileText, AlignLeft, DollarSign, CreditCard, User, Tags } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { usePageSettings } from '@/context/LayoutContext';
import { Badge as StatusSystemBadge, UniversalTagList } from '@/components/ui/status-system';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, ArrowLeft, Trash2, Download } from 'lucide-react';

const formatAmount = (amount?: number | null, currency?: string) => {
  if (amount == null) return '—';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency || 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function ContractDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [isEditMode, setIsEditMode] = useState(searchParams.get('edit') === 'true');
  const [activeTab, setActiveTab] = useState('details');
  
  const { data: contract, isLoading, error } = useContract(id || null);
  const { projects } = useProjects();
  const deleteMutation = useDeleteContract();

  const linkedProject = contract?.projectId
    ? projects.find((project) => project.id === contract.projectId)
    : null;

  const actions = !isEditMode && contract ? (
    <div className="flex gap-2">
      <Button onClick={() => {
        setIsEditMode(true);
        setActiveTab('details');
      }}>
        {t('general.edit')}
      </Button>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="destructive" size="icon">
            <Trash2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('general.delete')}</DialogTitle>
            <DialogDescription>
              {t('contracts.form.delete')}
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => {
              deleteMutation.mutate(contract.id, {
                onSuccess: () => navigate('/contracts'),
              });
            }}
            disabled={deleteMutation.isPending}
            variant="destructive"
          >
            {deleteMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t('general.confirm')}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  ) : null;

  usePageSettings({
    title: contract?.name || t('contracts.title'),
    subtitle: contract?.contractNumber ? `№ ${contract.contractNumber}` : undefined,
    breadcrumbs: [
      { label: t('contracts.title'), href: '/contracts' },
      ...(contract?.name ? [{ label: contract.name }] : [])
    ],
    actions,
  });

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate('/contracts')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('general.back')}
        </Button>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{t('contracts.errors.not_found')}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!contract) {
    return null;
  }

  const getStatusGradient = (status: string) => {
    switch (status) {
      case 'approved': return 'from-emerald-500/15 via-emerald-500/5 to-transparent border-emerald-500/20';
      case 'pending_approval': return 'from-amber-500/15 via-amber-500/5 to-transparent border-amber-500/20';
      case 'rejected': return 'from-red-500/15 via-red-500/5 to-transparent border-red-500/20';
      case 'draft': return 'from-slate-500/15 via-slate-500/5 to-transparent border-slate-500/20';
      case 'archived': return 'from-zinc-500/15 via-zinc-500/5 to-transparent border-zinc-500/20';
      default: return 'from-primary/15 via-primary/5 to-transparent border-primary/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Hero Section */}
      <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-r ${getStatusGradient(contract.status)} p-5 shadow-sm transition-all duration-500`}>
        <div className="relative z-10 flex flex-wrap items-center gap-4">
          <StatusSystemBadge id={contract.status} type="status" module="contracts" />
          {contract.tags && contract.tags.length > 0 && (
            <UniversalTagList
              tags={contract.tags.map((t: string | { id: string; name?: string }) => (typeof t === 'string' ? { id: t } : t))}
              module="contracts"
              size="sm"
            />
          )}
          <div className="flex-1" />
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-full backdrop-blur-sm border">
            <User className="w-4 h-4" />
            {t('general.created')}: {formatDate(contract.createdAt)}
          </p>
        </div>
      </div>

      {/* Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
            <TabsTrigger value="details">{t('contracts.tabs.details')}</TabsTrigger>
            <TabsTrigger value="versions">{t('contracts.tabs.versions')}</TabsTrigger>
            <TabsTrigger value="approvals">{t('contracts.tabs.approvals')}</TabsTrigger>
            <TabsTrigger value="files">{t('contracts.tabs.files')}</TabsTrigger>
            <TabsTrigger value="cases">{t('contracts.tabs.cases')}</TabsTrigger>
            <TabsTrigger value="finance">Финансы</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="rounded-lg border p-6">
            {isEditMode ? (
              <ContractForm
                contract={contract}
                onSuccess={() => setIsEditMode(false)}
                onCancel={() => setIsEditMode(false)}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Description Card */}
                  <Card className="border shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b pb-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlignLeft className="w-5 h-5 text-primary" />
                        {t('contracts.form.fields.description')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap mb-6">
                        {contract.description || (
                          <span className="text-muted-foreground italic">{t('common.no_data')}</span>
                        )}
                      </p>
                      
                      <Button variant="outline" onClick={async () => {
                        try {
                          const res = await api.get(`/api/contracts/${id}/actual-file`);
                          if (res.data && res.data.fileId) {
                             window.open(`/api/files/download/${res.data.fileId}`, '_blank');
                          }
                        } catch (e) {
                          console.error(e);
                          alert("Актуальный файл не найден");
                        }
                      }}>
                        <Download className="w-4 h-4 mr-2" />
                        Скачать актуальную версию
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                  
                  {/* Assingee & Context */}
                  <Card className="border shadow-sm bg-gradient-to-br from-card to-card/50">
                    <CardContent className="p-5 space-y-5">
                      {/* Assingee */}
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">{t('contracts.form.fields.assigned_to')}</p>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner">
                            {contract.assignedToName?.[0] || <User className="w-4 h-4" />}
                          </div>
                          <span className="font-medium">{contract.assignedToName || contract.assignedTo || t('general.unassigned')}</span>
                        </div>
                      </div>
                      
                      <div className="h-px bg-border" />

                      {/* Project & Contractor */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">{t('contracts.table.contractor')}</p>
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
                            <span className="truncate" title={contract.contractorName || ''}>{contract.contractorName || '—'}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">{t('contracts.form.fields.project')}</p>
                          <div className="flex items-center gap-2 text-sm">
                            <FolderKanban className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span className="truncate">{contract.projectId ? (linkedProject?.name || `#${contract.projectId}`) : '—'}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Financial Summary */}
                  <Card className="border shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                      <DollarSign className="w-24 h-24" />
                    </div>
                    <CardContent className="p-5 space-y-5 relative z-10">
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">{t('contracts.form.fields.amount')}</p>
                        <p className="text-2xl font-bold tracking-tight">
                          {contract.amount !== null ? formatAmount(contract.amount, contract.currency) : '—'}
                        </p>
                      </div>

                      {contract.amount ? (
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Оплачено</span>
                            <span className="font-medium">
                              {contract.financeSummary?.totalPaid ? formatAmount(contract.financeSummary.totalPaid, contract.currency) : '0'}
                            </span>
                          </div>
                          <Progress 
                            value={Math.min(100, Math.max(0, ((contract.financeSummary?.totalPaid || 0) / contract.amount) * 100))} 
                            className="h-2"
                          />
                        </div>
                      ) : null}

                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-semibold uppercase text-muted-foreground">{t('contracts.form.fields.payment_status')}</p>
                          {contract.paymentStatus ? (
                            <StatusSystemBadge id={contract.paymentStatus} type="status" module="contracts_payment" />
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Versions Tab */}
          <TabsContent value="versions" className="rounded-lg border p-6">
            <VersionHistory contractId={contract.id} />
          </TabsContent>

          {/* Approvals Tab */}
          <TabsContent value="approvals" className="rounded-lg border p-6">
            <ApprovalWorkflow contractId={contract.id} />
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="rounded-lg border p-6">
            <FileUpload contractId={contract.id} />
          </TabsContent>

          {/* Cases Tab */}
          <TabsContent value="cases" className="rounded-lg border p-6">
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">
                {contract.cases && contract.cases.length > 0
                  ? `${contract.cases.length} дел связано`
                  : t('contracts.cases.empty')}
              </p>
            </div>
          </TabsContent>

          {/* Finance Tab */}
          <TabsContent value="finance" className="rounded-lg border p-6">
            <ContractFinance contract={contract} />
          </TabsContent>
        </Tabs>
    </div>
  );
}
