/**
 * Quote Detail Page
 * Full quote view with tabs for details and history
 */

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { api } from '@/lib/api';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuote, useDeleteQuote } from '../hooks';
import { QuoteForm } from '../components';
import { useProjects } from '@/modules/projects/hooks/useProjects';
import { formatDate } from '@/lib/formatters';
import { Building2, FolderKanban, AlignLeft, DollarSign, User, Trash2, ArrowLeft, Loader2, FileText } from 'lucide-react';
import { TemplateGeneratorButton } from '@/modules/templates/components/TemplateGeneratorButton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const formatAmount = (amount?: number | null, currency?: string) => {
  if (amount == null) return '—';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency || 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export function QuoteDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const [searchParams] = useSearchParams();
  const [isEditMode, setIsEditMode] = useState(isNew || searchParams.get('edit') === 'true');
  const [activeTab, setActiveTab] = useState('details');
  
  const quoteId = isNew ? null : Number(id);
  const { data: quote, isLoading, error } = useQuote(quoteId);
  const { projects } = useProjects();
  const deleteMutation = useDeleteQuote();

  const linkedProject = quote?.projectId
    ? projects.find((project) => project.id === quote.projectId)
    : null;

  const actions = !isEditMode && quote ? (
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
              {t('quotes.bulk.delete_confirm_description')}
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => {
              deleteMutation.mutate(quote.id, {
                onSuccess: () => navigate('/quotes'),
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
    title: isNew ? t('quotes.create') : (quote?.number ? `КП № ${quote.number}` : t('quotes.title')),
    subtitle: quote?.date ? formatDate(quote.date) : undefined,
    breadcrumbs: [
      { label: t('quotes.title'), href: '/quotes' },
      ...((quote?.number || isNew) ? [{ label: isNew ? t('quotes.create') : `№ ${quote?.number}` }] : [])
    ],
    actions,
  });

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate('/quotes')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('general.back')}
        </Button>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{t('quotes.errors.not_found') || 'Not found'}</p>
        </div>
      </div>
    );
  }

  if (isLoading && !isNew) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!quote && !isNew) {
    return null;
  }

  const getStatusGradient = (statusId: string) => {
    switch (statusId) {
      case 'accepted': return 'from-emerald-500/15 via-emerald-500/5 to-transparent border-emerald-500/20';
      case 'sent': return 'from-amber-500/15 via-amber-500/5 to-transparent border-amber-500/20';
      case 'rejected': return 'from-red-500/15 via-red-500/5 to-transparent border-red-500/20';
      case 'draft': return 'from-slate-500/15 via-slate-500/5 to-transparent border-slate-500/20';
      default: return 'from-primary/15 via-primary/5 to-transparent border-primary/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Hero Section (hide if new) */}
      {!isNew && quote && (
        <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-r ${getStatusGradient(quote.statusId)} p-5 shadow-sm transition-all duration-500`}>
          <div className="relative z-10 flex flex-wrap items-center gap-4">
            <StatusSystemBadge id={quote.statusId} type="status" module="quotes" />
            {quote.tags && quote.tags.length > 0 && (
              <UniversalTagList
                tags={quote.tags.map((t: string | { id: string; name?: string }) => (typeof t === 'string' ? { id: t } : t))}
                module="quotes"
                size="sm"
              />
            )}
            <div className="flex-1" />
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-full backdrop-blur-sm border">
              <User className="w-4 h-4" />
              {t('general.created')}: {formatDate(quote.createdAt)}
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {!isNew && (
          <TabsList>
            <TabsTrigger value="details">{t('quotes.tabs.details')} {/* Детали */}</TabsTrigger>
          </TabsList>
        )}

        {/* Details Tab */}
        <TabsContent value="details" className="rounded-lg border p-6">
          {isEditMode ? (
            <QuoteForm
              quote={isNew ? null : quote}
              onSuccess={() => {
                if (isNew) {
                  navigate('/quotes');
                } else {
                  setIsEditMode(false);
                }
              }}
              onCancel={() => {
                if (isNew) {
                  navigate('/quotes');
                } else {
                  setIsEditMode(false);
                }
              }}
            />
          ) : quote && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
              {/* Main Content Area */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description Card */}
                <Card className="border shadow-sm overflow-hidden">
                  <CardHeader className="bg-muted/30 border-b pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlignLeft className="w-5 h-5 text-primary" />
                      {t('quotes.notes')} {/* Заметки */}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap mb-6">
                      {quote.notes || (
                        <span className="text-muted-foreground italic">{t('common.no_data')}</span>
                      )}
                    </p>
                    
        {!isNew && quoteId && (
          <div className="mt-4">
            <TemplateGeneratorButton moduleId="quotes" entityId={quoteId} />
          </div>
        )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                
                {/* Context */}
                <Card className="border shadow-sm bg-gradient-to-br from-card to-card/50">
                  <CardContent className="p-5 space-y-5">
                    {/* Project & Contractor */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">{t('contractors.title')}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
                          <span className="truncate" title={quote.contractorName || ''}>{quote.contractorName || '—'}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">{t('projects.title')}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <FolderKanban className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="truncate">{quote.projectId ? (linkedProject?.name || `#${quote.projectId}`) : '—'}</span>
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
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                        {quote.taxAmount > 0 ? t('finance.invoice.field.total_with_vat') : t('quotes.amount')}
                      </p>
                      <p className="text-2xl font-bold tracking-tight">
                        {quote.totalAmount !== null ? formatAmount(quote.totalAmount, 'RUB') : '—'}
                      </p>
                    </div>

                    <div className="pt-2 border-t">
                      {quote.taxAmount > 0 && (
                        <div className="flex justify-between items-center text-sm mb-1">
                          <span className="text-muted-foreground">{t('quotes.taxAmount')}</span>
                          <span>{formatAmount(quote.taxAmount, 'RUB')}</span>
                        </div>
                      )}
                      {quote.discountAmount > 0 && (
                        <div className="flex justify-between items-center text-sm mt-1">
                          <span className="text-muted-foreground">{t('quotes.discountAmount')}</span>
                          <span>{formatAmount(quote.discountAmount, 'RUB')}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
