import { useTranslation } from '@/lib/i18n';
import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TableFooterPagination } from '@/components/shared';
import { RefreshCw, Trash2, Eye, FileText as FileTextIcon, Database as DatabaseIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { parseRowsPerPage } from '@/lib/utils';
import { toast } from 'sonner';
import { SystemLog, LogFile } from './types';
import { LevelBadge, formatDate } from './helpers';

export function LogsTab() {
  const { t } = useTranslation();
  const [activeLogTab, setActiveLogTab] = useState<'system' | 'files'>('system');

  const queryClient = useQueryClient();
  const { data: logToDb = false } = useQuery({
    queryKey: ['settings-log-to-db'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/settings/log-to-db');
        return res.enabled;
      } catch {
        return false;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const [loadingSetting, setLoadingSetting] = useState(false);

  const handleToggleLogToDb = async (checked: boolean) => {
    setLoadingSetting(true);
    try {
      await api.put('/admin/settings/log-to-db', { enabled: checked });
      queryClient.setQueryData(['settings-log-to-db'], checked);
      toast.success(checked ? t('settings.system.logs.db_logging_active_toast') : t('settings.system.logs.file_logging_active_toast'));
    } catch {
      toast.error(t('generated.oshibka_obnovleniya_nastroyki'));
    } finally {
      setLoadingSetting(false);
    }
  };

  // System logs
  const [sysLogs, setSysLogs] = useState<SystemLog[]>([]);
  const [sysTotal, setSysTotal] = useState(0);
  const [sysLevel, setSysLevel] = useState('');
  const [sysSource, setSysSource] = useState('');
  const [sysLoading, setSysLoading] = useState(false);
  const [sysRowsPerPage, setSysRowsPerPage] = useState('25');
  const [sysPage, setSysPage] = useState(1);

  const loadSysLogs = useCallback(async () => {
    setSysLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (sysLevel)  params.set('level', sysLevel);
      if (sysSource) params.set('source', sysSource);
      const data = await api.get(`/admin/system-logs?${params}`);
      setSysLogs(data.rows);
      setSysTotal(data.total);
    } catch { toast.error(t('generated.oshibka_zagruzki_sistemnyh_logov')); }
    finally { setSysLoading(false); }
  }, [sysLevel, sysSource, t]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (activeLogTab === 'system') loadSysLogs(); }, [activeLogTab, loadSysLogs]);

  const [prevSysLevel, setPrevSysLevel] = useState(sysLevel);
  const [prevSysSource, setPrevSysSource] = useState(sysSource);
  if (sysLevel !== prevSysLevel || sysSource !== prevSysSource) {
    setPrevSysLevel(sysLevel);
    setPrevSysSource(sysSource);
    setSysPage(1);
  }

  const sysPerPage = parseRowsPerPage(sysRowsPerPage);
  const paginatedSysLogs = sysLogs.slice((sysPage - 1) * sysPerPage, sysPage * sysPerPage);

  const clearSysLogs = async () => {
    if (!confirm(t('generated.udalit_zapisi_logov_starshe_30_dney'))) return;
    try {
      const res = await api.post('/admin/system-logs/clear', { olderThanDays: 30 });
      toast.success(t('settings.system.logs.cleared_toast', { count: res.deleted }));
      loadSysLogs();
    } catch { toast.error(t('generated.oshibka_ochistki_logov')); }
  };

  // File logs
  const [logFiles, setLogFiles] = useState<LogFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [viewFile, setViewFile] = useState<{ name: string; content: string } | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const loadLogFiles = useCallback(async () => {
    setFilesLoading(true);
    try { setLogFiles(await api.get('/admin/log-files')); }
    catch { toast.error(t('generated.oshibka_zagruzki_faylov_logov')); }
    finally { setFilesLoading(false); }
  }, [t]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (activeLogTab === 'files') loadLogFiles(); }, [activeLogTab, loadLogFiles]);

  const openLogFile = async (name: string) => {
    setViewLoading(true);
    try {
      const data = await api.get(`/admin/log-files/${encodeURIComponent(name)}?lines=300`);
      setViewFile({ name, content: data.content });
    } catch { toast.error(t('generated.oshibka_chteniya_fayla')); }
    finally { setViewLoading(false); }
  };

  const deleteLogFile = async (name: string) => {
    if (!confirm(t('settings.system.logs.delete_confirm', { name }))) return;
    try {
      await api.delete(`/admin/log-files/${encodeURIComponent(name)}`);
      toast.success(t('generated.fayl_udalen'));
      loadLogFiles();
    } catch { toast.error(t('generated.oshibka_udaleniya_fayla')); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={activeLogTab === 'system' ? 'default' : 'outline'}
          onClick={() => setActiveLogTab('system')}
        >
          <DatabaseIcon className="w-3 h-3 mr-1" />{t('generated.sistemnye_logi_bd')}
        </Button>
        <Button
          size="sm"
          variant={activeLogTab === 'files' ? 'default' : 'outline'}
          onClick={() => setActiveLogTab('files')}
        >
          <FileTextIcon className="w-3 h-3 mr-1" />{t('generated.fayly_logov')}
        </Button>
      </div>

      {activeLogTab === 'system' && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
            <Switch
              id="log-to-db"
              checked={logToDb}
              onCheckedChange={handleToggleLogToDb}
              disabled={loadingSetting}
            />
            <Label htmlFor="log-to-db" className="text-sm cursor-pointer flex items-center gap-2">
              {logToDb ? (
                <>
                  <DatabaseIcon className="w-4 h-4 text-blue-500" />
                  <span>{t('settings.system.logs.db_logging_enabled')}</span>
                </>
              ) : (
                <>
                  <FileTextIcon className="w-4 h-4 text-muted-foreground" />
                  <span>{t('settings.system.logs.file_logging_only')}</span>
                </>
              )}
            </Label>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Select value={sysLevel || '_all'} onValueChange={v => setSysLevel(v === '_all' ? '' : v)}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue placeholder={t('generated.uroven')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">{t('generated.vse_urovni')}</SelectItem>
                {['error','warn','info','debug','http'].map(l => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sysSource || '_all'} onValueChange={v => setSysSource(v === '_all' ? '' : v)}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue placeholder={t('generated.istochnik')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">{t('generated.vse_istochniki')}</SelectItem>
                {['frontend','backend'].map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={loadSysLogs} disabled={sysLoading}>
              <RefreshCw className={`w-3 h-3 mr-1 ${sysLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={clearSysLogs}>
              <Trash2 className="w-3 h-3 mr-1" />{t('generated.ochistit_starye')}
            </Button>
            <span className="text-xs text-muted-foreground ml-auto">{t('settings.system.logs.total_count')}: {sysTotal}</span>
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">{t('generated.vremya')}</TableHead>
                  <TableHead className="w-20">{t('generated.uroven')}</TableHead>
                  <TableHead className="w-24">{t('generated.istochnik')}</TableHead>
                  <TableHead>{t('generated.soobschenie')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sysLogs.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">{t('generated.net_zapisey')}</TableCell></TableRow>
                )}
                {paginatedSysLogs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </TableCell>
                    <TableCell><LevelBadge level={log.level} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{log.source}</TableCell>
                    <TableCell className="text-xs font-mono break-all max-w-xs">{log.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TableFooterPagination
            shownCount={paginatedSysLogs.length}
            totalCount={sysLogs.length}
            rowsPerPage={sysRowsPerPage}
            onRowsPerPageChange={setSysRowsPerPage}
            currentPage={sysPage}
            onPageChange={setSysPage}
            className="flex items-center justify-between p-2 border border-t-0 border-border rounded-b-md"
          />
        </div>
      )}

      {activeLogTab === 'files' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={loadLogFiles} disabled={filesLoading}>
              <RefreshCw className={`w-3 h-3 mr-1 ${filesLoading ? 'animate-spin' : ''}`} />{t('generated.obnovit')}
            </Button>
          </div>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('generated.fayl')}</TableHead>
                  <TableHead className="text-right">{t('generated.razmer')}</TableHead>
                  <TableHead>{t('generated.izmenen')}</TableHead>
                  <TableHead className="text-right">{t('generated.deystviya')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logFiles.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">{t('generated.net_faylov_logov')}</TableCell></TableRow>
                )}
                {logFiles.map(f => (
                  <TableRow key={f.name}>
                    <TableCell className="font-mono text-xs">{f.name}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{f.sizeHuman}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(f.modifiedAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon" variant="ghost" className="h-7 w-7"
                          onClick={() => openLogFile(f.name)} disabled={viewLoading}
                          title={t('generated.prosmotret')}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => deleteLogFile(f.name)} title={t('generated.udalit')}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Log file viewer dialog */}
      <Dialog open={!!viewFile} onOpenChange={() => setViewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">{viewFile?.name}</DialogTitle>
            <DialogDescription>{t('generated.poslednie_300_strok')}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0 border rounded">
            <pre className="p-3 text-xs font-mono whitespace-pre-wrap break-all leading-5">
              {viewFile?.content || t('settings.logs.empty')}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
