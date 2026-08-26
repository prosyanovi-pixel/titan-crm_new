import { useTranslation } from '@/lib/i18n';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { DbTable } from './types';
import { formatDate } from './helpers';
import { TableFooterPagination } from '@/components/shared/TableFooterPagination';
import { parseRowsPerPage } from '@/lib/utils';

export function DbTablesTab() {
  const { t } = useTranslation();
  const [tables, setTables] = useState<DbTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState('25');

  const load = useCallback(async () => {
    setLoading(true);
    try { setTables(await api.get('/admin/db-stats')); setCurrentPage(1); }
    catch { toast.error(t('generated.oshibka_zagruzki_statistiki_bd')); }
    finally { setLoading(false); }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const perPage = useMemo(() => parseRowsPerPage(rowsPerPage), [rowsPerPage]);
  const paginated = useMemo(
    () => tables.slice((currentPage - 1) * perPage, currentPage * perPage),
    [tables, currentPage, perPage]
  );

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{tables.length} {t('settings.system.db_tables.tables_count')}</span>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />{t('generated.obnovit')}
        </Button>
      </div>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('generated.tablitsa')}</TableHead>
              <TableHead className="text-right">{t('generated.strok')}</TableHead>
              <TableHead className="text-right">{t('generated.razmer')}</TableHead>
              <TableHead>{t('generated.posledniy_vacuum')}</TableHead>
              <TableHead>{t('generated.posledniy_analyze')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map(t => (
              <TableRow key={t.tableName}>
                <TableCell className="font-mono text-xs">{t.tableName}</TableCell>
                <TableCell className="text-right font-medium">
                  {parseInt(t.rowCount).toLocaleString('ru')}
                </TableCell>
                <TableCell className="text-right text-muted-foreground text-xs">{t.totalSize}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(t.lastAutovacuum || t.lastVacuum)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(t.lastAutoanalyze || t.lastAnalyze)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TableFooterPagination
          shownCount={paginated.length}
          totalCount={tables.length}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(v) => { setRowsPerPage(v); setCurrentPage(1); }}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          className="flex items-center justify-between p-3 border-t border-border"
        />
      </div>
    </div>
  );
}
