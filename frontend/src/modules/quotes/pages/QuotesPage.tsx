import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePageSettings } from '@/context/LayoutContext';
import { useQuotes } from '../hooks';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function QuotesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: quotes, isLoading } = useQuotes();

  usePageSettings({
    title: t('quotes.title'),
    subtitle: t('quotes.subtitle'),
    actions: (
      <Button className="gap-2 h-9" onClick={() => navigate('/quotes/new')}>
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">{t('quotes.create')}</span>
      </Button>
    )
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted': return <Badge className="bg-green-500">{t('quotes.statuses.accepted')}</Badge>;
      case 'rejected': return <Badge variant="destructive">{t('quotes.statuses.rejected')}</Badge>;
      case 'sent': return <Badge variant="secondary" className="bg-blue-100 text-blue-800">{t('quotes.statuses.sent')}</Badge>;
      default: return <Badge variant="outline">{t('quotes.statuses.draft')}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('quotes.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('quotes.number')}</TableHead>
                <TableHead>{t('quotes.date')}</TableHead>
                <TableHead>{t('quotes.contractor')}</TableHead>
                <TableHead>{t('quotes.status')}</TableHead>
                <TableHead className="text-right">{t('quotes.total')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {t('common.loading')}
                  </TableCell>
                </TableRow>
              ) : quotes?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {t('common.no_data')}
                  </TableCell>
                </TableRow>
              ) : (
                quotes?.map((quote) => (
                  <TableRow key={quote.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/quotes/${quote.id}`)}>
                    <TableCell className="font-medium">{quote.number}</TableCell>
                    <TableCell>{new Date(quote.date).toLocaleDateString()}</TableCell>
                    <TableCell>{quote.contractorName || '-'}</TableCell>
                    <TableCell>{getStatusBadge(quote.status)}</TableCell>
                    <TableCell className="text-right">{Number(quote.totalAmount).toLocaleString()} ₽</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
