import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/lib/i18n';
import { useState, useEffect } from 'react';
import { TableFooterPagination } from '@/components/shared';
import { RefreshCw, ShieldOff, ShieldCheck, Circle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from '@/lib/api';
import { parseRowsPerPage } from '@/lib/utils';
import { toast } from 'sonner';
import { AdminUser } from './types';
import { formatDate } from './helpers';

const ONLINE_THRESHOLD_MIN = 5;

function onlineStatus(lastActiveAt: string | null): 'online' | 'recent' | 'offline' | 'never' {
  if (!lastActiveAt) return 'never';
  const diffMin = (Date.now() - new Date(lastActiveAt).getTime()) / 60000;
  if (diffMin < ONLINE_THRESHOLD_MIN) return 'online';
  if (diffMin < 60)                   return 'recent';
  return 'offline';
}

const getStatusConfig = (t: (k: string) => string) => ({
  online:  { label: t('settings.system.users.status.online'),     dot: 'bg-green-500',  badge: 'bg-green-100 text-green-700 border-green-200' },
  recent:  { label: t('settings.system.users.status.recent'),     dot: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  offline: { label: t('settings.system.users.status.offline'),    dot: 'bg-gray-300',   badge: 'bg-gray-100 text-gray-500 border-gray-200' },
  never:   { label: t('settings.system.users.status.never'),      dot: 'bg-gray-200',   badge: 'bg-gray-100 text-gray-400 border-gray-200' },
});

export function UsersTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [filter, setFilter]           = useState<'all' | 'online' | 'blocked'>('all');
  const [search, setSearch]           = useState('');
  const [blockTarget, setBlockTarget] = useState<AdminUser | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState('25');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data: users = [], isLoading: loading, refetch: load } = useQuery<AdminUser[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      try {
        return await api.get('/admin/users');
      } catch (err) {
        console.error('Failed to load users:', err);
        toast.error(t('generated.oshibka_zagruzki_pol_zovateley'));
        throw err;
      }
    }
  });

  const handleBlock = async () => {
    if (!blockTarget) return;
     
    setActionLoading(blockTarget.id);
    try {
      await api.post(`/admin/users/${blockTarget.id}/block`, { reason: blockReason });
      toast.success(t('settings.users.blocked', { name: blockTarget.name }));
      setBlockTarget(null);
      setBlockReason('');
      load();
    } catch (e: unknown) {
      toast.error(t('settings.users.error_block'));
    } finally { setActionLoading(null); }
  };

  const handleUnblock = async (user: AdminUser) => {
    setActionLoading(user.id);
    try {
      await api.post(`/admin/users/${user.id}/unblock`, {});
      toast.success(t('settings.users.unblocked', { name: user.name }));
      load();
    } catch (e: unknown) {
      toast.error(t('settings.users.error_unblock'));
    } finally { setActionLoading(null); }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (filter === 'blocked') return u.isBlocked;
    if (filter === 'online')  return onlineStatus(u.lastActiveAt) === 'online' || onlineStatus(u.lastActiveAt) === 'recent';
    return true;
  });

  const onlineCount  = users.filter(u => onlineStatus(u.lastActiveAt) === 'online').length;
  const recentCount  = users.filter(u => onlineStatus(u.lastActiveAt) === 'recent').length;
  const blockedCount = users.filter(u => u.isBlocked).length;

  const [prevSearch, setPrevSearch] = useState(search);
  const [prevFilter, setPrevFilter] = useState(filter);
  if (search !== prevSearch || filter !== prevFilter) {
    setPrevSearch(search);
    setPrevFilter(filter);
    setCurrentPage(1);
  }

  const perPage = parseRowsPerPage(rowsPerPage);
  const paginatedUsers = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div className="space-y-4">
      {/* Статистика */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t('settings.system.users.stats.total'),          value: users.length,  color: 'text-foreground', dot: 'bg-muted' },
          { label: t('settings.system.users.status.online'),        value: onlineCount,   color: 'text-green-600',  dot: 'bg-green-500' },
          { label: t('settings.system.users.stats.recent'),         value: recentCount,   color: 'text-yellow-600', dot: 'bg-yellow-400' },
          { label: t('settings.system.users.stats.blocked'),        value: blockedCount,  color: 'text-red-600',    dot: 'bg-red-500' },
        ].map(s => (
          <Card key={s.label} className="p-3">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${s.dot}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Фильтры и поиск */}
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder={t('generated.poisk_po_imeni_ili_email')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-8 w-52 text-xs"
        />
        {(['all', 'online', 'blocked'] as const).map(f => (
          <Button
            key={f}
            size="sm" variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)}
            className="h-8 text-xs"
          >
            {f === 'all' ? t('settings.system.users.filters.all') : f === 'online' ? t('settings.system.users.filters.online') : t('settings.system.users.filters.blocked')}
          </Button>
        ))}
        <Button size="sm" variant="outline" onClick={() => load()} disabled={loading} className="ml-auto h-8">
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Таблица */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('generated.pol_zovatel')}</TableHead>
              <TableHead>{t('generated.rol_dolzhnost')}</TableHead>
              <TableHead>{t('generated.aktivnost')}</TableHead>
              <TableHead>{t('generated.status')}</TableHead>
              <TableHead className="text-right">{t('generated.deystviya')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {loading ? t('generated.zagruzka') : t('settings.system.users.empty')}
                </TableCell>
              </TableRow>
            )}
            {paginatedUsers.map(u => {
              const os = onlineStatus(u.lastActiveAt);
              const sc = getStatusConfig(t)[os];
              const isLoading = actionLoading === u.id;
              return (
                <TableRow key={u.id} className={u.isBlocked ? 'opacity-60' : ''}>
                  {/* Аватар + имя */}
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="relative shrink-0">
                        <Avatar className="w-8 h-8 border border-border">
                          <AvatarImage src={u.avatar || ''} alt={u.name} />
                          <AvatarFallback className="bg-muted text-xs font-semibold">
                            {u.initials || u.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background ${sc.dot}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{u.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Роль и отдел */}
                  <TableCell>
                    <div className="text-xs font-medium">{u.role || t('common.no_data')}</div>
                    {u.departmentName && (
                      <div className="text-xs text-muted-foreground">{u.departmentName}</div>
                    )}
                    {u.positionName && (
                      <div className="text-xs text-muted-foreground">{u.positionName}</div>
                    )}
                  </TableCell>

                  {/* Активность */}
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border ${sc.badge}`}>
                      <Circle className="w-1.5 h-1.5 fill-current" />
                      {sc.label}
                    </span>
                    {u.lastActiveAt && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(u.lastActiveAt)}
                      </div>
                    )}
                  </TableCell>

                  {/* Блокировка */}
                  <TableCell>
                    {u.isBlocked ? (
                      <div>
                        <Badge variant="destructive" className="text-xs">{t('generated.zablokirovan')}</Badge>
                        {u.blockReason && (
                          <div className="text-xs text-muted-foreground mt-0.5 max-w-[140px] truncate" title={u.blockReason}>
                            {u.blockReason}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">{t('generated.aktiven')}</span>
                    )}
                  </TableCell>

                  {/* Действия */}
                  <TableCell className="text-right">
                    {u.isBlocked ? (
                      <Button
                        size="sm" variant="outline"
                        className="h-7 text-xs gap-1 text-green-600 border-green-200 hover:bg-green-50"
                        onClick={() => handleUnblock(u)}
                        disabled={isLoading}
                      >
                        {isLoading
                          ? <RefreshCw className="w-3 h-3 animate-spin" />
                          : <ShieldCheck className="w-3 h-3" />
                        }
                        {t('settings.system.users.unblock')}
                      </Button>
                    ) : (
                      <Button
                        size="sm" variant="outline"
                        className="h-7 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => {
                          setBlockTarget(u);
                          setBlockReason('');
                        }}
                        disabled={isLoading}
                      >
                        {isLoading
                          ? <RefreshCw className="w-3 h-3 animate-spin" />
                          : <ShieldOff className="w-3 h-3" />
                        }
                        {t('settings.system.users.block')}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <TableFooterPagination
        shownCount={paginatedUsers.length}
        totalCount={filtered.length}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={setRowsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        className="flex items-center justify-between p-2 border border-border rounded-lg"
      />

      {/* Диалог блокировки */}
      <Dialog open={!!blockTarget} onOpenChange={v => !v && setBlockTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldOff className="w-5 h-5" />
              {t('generated.zablokirovat_pol_zovatelya')}
            </DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{blockTarget?.name}</span> {t('generated.poteryaet_dostup_k_sisteme_nemedlenno')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-sm font-medium">{t('generated.prichina_blokirovki')}</label>
            <Input
              placeholder={t('generated.ukazhite_prichinu_neobyazatel_no')}
              value={blockReason}
              onChange={e => setBlockReason(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleBlock()}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBlockTarget(null)}>{t('generated.otmena')}</Button>
            <Button
              variant="destructive"
              onClick={handleBlock}
              disabled={!!actionLoading}
              className="gap-2"
            >
              {actionLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ShieldOff className="w-3 h-3" />}
              {t('settings.system.users.block_dialog_title')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
