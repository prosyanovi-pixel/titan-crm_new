import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2, Edit2, Check, X, Mail, Calendar, Phone, Shield, UserCog, Key, Loader2, Briefcase, Users, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from '@/lib/i18n';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  roleName?: string;
  status: 'active' | 'inactive' | 'blocked';
  isBlocked?: boolean;
  blockedAt?: string;
  blockedBy?: string;
  blockReason?: string;
  phone?: string;
  department?: string;
  nickname?: string;
  avatar?: string;
  initials?: string;
  createdAt?: string;
  lastActiveAt?: string;
  employeeId?: string;
  positionName?: string;
  departmentName?: string;
  password?: string;
}

interface Role {
  id: string;
  name: string;
  description?: string;
}

interface UserEditorProps {
  selectedModule: string;
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-800 border-red-200',
  manager: 'bg-blue-100 text-blue-800 border-blue-200',
  user: 'bg-green-100 text-green-800 border-green-200',
  default: 'bg-gray-100 text-gray-800 border-gray-200',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800 border-green-200',
  inactive: 'bg-gray-100 text-gray-800 border-gray-200',
  blocked: 'bg-red-100 text-red-800 border-red-200',
};

export function UserEditor({ selectedModule }: UserEditorProps) {
  const { t } = useTranslation();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'user',
    status: 'active',
    phone: '',
    department: '',
    password: '',
  });

  const { data, isLoading: loading, refetch: loadData } = useQuery({
    queryKey: ['admin-users-data'],
    queryFn: async () => {
      const [usersData, rolesData, departmentsData, positionsData] = await Promise.all([
        api.get('/admin/users'),
        api.get('/roles'),
        api.get('/org/departments'),
        api.get('/org/positions'),
      ]);
      return {
        users: (usersData || []) as User[],
        roles: (rolesData || []) as Role[],
        departments: (departmentsData || []) as Array<{ id: number; name: string }>,
        positions: (positionsData || []) as Array<{ id: number; name: string }>,
      };
    }
  });

  const users = data?.users || [];
  const roles = data?.roles || [];
  const departments = data?.departments || [];
  const positions = data?.positions || [];

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    
    // Пытаемся найти department ID по имени или используем сохранённое значение
    const departmentId = user.department || '';
    
    setFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'user',
      status: user.status || 'active',
      phone: user.phone || '',
      department: departmentId,
      password: '',
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!formData.name?.trim() || !formData.email?.trim()) {
      toast.error(t('settings.users.zapolnite_polya_imya_i_email'));
      return;
    }

    setActionLoading('update');
    try {
      const payload: Partial<User> = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        status: formData.status,
        phone: formData.phone,
        department: formData.department,
      };

      if (formData.password && formData.password.trim()) {
        payload.password = formData.password;
      }

      await api.put(`/admin/users/${selectedUser?.id}`, payload);
      toast.success(t('settings.users.pol_zovatel_obnovlen'));
      setEditDialogOpen(false);
      loadData();
    } catch (error: unknown) {
      console.error('Failed to update user:', error);
      toast.error(t('settings.users.oshibka_obnovleniya'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      email: '',
      role: 'user',
      status: 'active',
      phone: '',
      department: '',
      password: '',
    });
    setCreateDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!formData.name?.trim() || !formData.email?.trim()) {
      toast.error(t('settings.users.zapolnite_polya_imya_i_email'));
      return;
    }

    if (!formData.password?.trim()) {
      toast.error(t('settings.users.vvedite_parol'));
      return;
    }

    setActionLoading('create');
    try {
      await api.post('/admin/users', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        status: formData.status,
        phone: formData.phone,
        department: formData.department,
        password: formData.password,
      });
      toast.success(t('settings.users.pol_zovatel_sozdan'));
      setCreateDialogOpen(false);
      loadData();
    } catch (error: unknown) {
      console.error('Failed to create user:', error);
      toast.error(t('settings.users.oshibka_sozdaniya'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenDelete = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    setActionLoading('delete');
    try {
      await api.delete(`/admin/users/${selectedUser.id}`);
      toast.success(t('settings.users.pol_zovatel_udalen'));
      setDeleteDialogOpen(false);
      loadData();
    } catch (error: unknown) {
      console.error('Failed to delete user:', error);
      toast.error(t('settings.users.oshibka_udaleniya'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlockUser = async (user: User) => {
    setActionLoading(`block-${user.id}`);
    try {
      await api.post(`/admin/users/${user.id}/block`, {
        reason: 'Заблокирован администратором',
      });
      toast.success(t('settings.users.blocked', { name: user.name }));
      loadData();
    } catch (error: unknown) {
      toast.error(t('settings.users.error_block'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblockUser = async (user: User) => {
    setActionLoading(`unblock-${user.id}`);
    try {
      await api.post(`/admin/users/${user.id}/unblock`, {});
      toast.success(t('settings.users.unblocked', { name: user.name }));
      loadData();
    } catch (error: unknown) {
      toast.error(t('settings.users.error_unblock'));
    } finally {
      setActionLoading(null);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (roleId?: string) => {
    const roleName = roleId?.toLowerCase() || '';
    return ROLE_COLORS[roleName] || ROLE_COLORS.default;
  };

  const getStatusColor = (status?: string, isBlocked?: boolean) => {
    if (isBlocked) return STATUS_COLORS.blocked;
    return STATUS_COLORS[status || 'inactive'] || STATUS_COLORS.default;
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{t('settings.users.upravlenie_pol_zovatelyami')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('settings.users.description')}
          </p>
        </div>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          {t('settings.users.dobavit_pol_zovatelya')}
        </Button>
      </div>

      {/* Users list */}
      <div className="grid gap-3">
        {users.map((user) => (
          <Card key={user.id} className="p-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.avatar || ''} alt={user.name} />
                <AvatarFallback className={cn('text-sm font-semibold', user.isBlocked ? 'opacity-50' : '')}>
                  {user.initials || getInitials(user.name)}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium">{user.name}</span>
                  <Badge className={cn('text-xs border', getRoleColor(user.role))}>
                    {roles.find((r) => r.id === user.role)?.name || user.role || 'user'}
                  </Badge>
                  <Badge className={cn('text-xs border', getStatusColor(user.status, user.isBlocked))}>
                    {user.isBlocked
                      ? t('settings.users.zablokirovan')
                      : user.status === 'active'
                      ? t('settings.users.aktivnyy')
                      : t('settings.users.neaktivnyy')}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    <span className="truncate max-w-[200px]">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.positionName && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      <span>{user.positionName}</span>
                    </div>
                  )}
                  {user.departmentName && (
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{user.departmentName}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{t('settings.users.sozdan')}: {formatDateTime(user.createdAt)}</span>
                  </div>
                  {user.lastActiveAt && (
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      <span>{t('settings.users.poslednyaya_aktivnost')}: {formatDateTime(user.lastActiveAt)}</span>
                    </div>
                  )}
                  {user.isBlocked && user.blockReason && (
                    <div className="text-red-600">
                      {t('settings.users.prichina')}: {user.blockReason}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenEdit(user)}
                  disabled={!!actionLoading}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                {user.isBlocked ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnblockUser(user)}
                    disabled={!!actionLoading}
                    className="text-green-600 hover:text-green-700"
                  >
                    {actionLoading === `unblock-${user.id}` ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span className="ml-1 text-xs">{t('settings.users.razblokirovat')}</span>
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBlockUser(user)}
                    disabled={!!actionLoading}
                    className="text-red-600 hover:text-red-700"
                  >
                    {actionLoading === `block-${user.id}` ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Shield className="w-4 h-4" />
                    )}
                    <span className="ml-1 text-xs">{t('settings.users.zablokirovat')}</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenDelete(user)}
                  disabled={!!actionLoading}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {users.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            {t('settings.users.pol_zovateli_ne_naydeny')}
          </p>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('settings.users.dobavit_pol_zovatelya')}</DialogTitle>
            <DialogDescription>
              {t('settings.users.zapolnite_formu_dlya_sozdaniya_novogo_pol_zovatelya')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">{t('settings.users.imya')}</Label>
                <Input
                  id="create-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('settings.users.imya_pol_zovatelya')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-email">Email</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">{t('settings.users.parol')}</Label>
              <Input
                id="create-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={t('settings.users.vvedite_parol')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-role">{t('settings.users.rol')}</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-status">{t('settings.users.status_label')}</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'inactive' | 'blocked') => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('settings.users.aktivnyy')}</SelectItem>
                    <SelectItem value="inactive">{t('settings.users.neaktivnyy')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-phone">{t('settings.users.telefon')}</Label>
                <Input
                  id="create-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+7 (___) ___-__-__"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-department">{t('settings.users.otdel')}</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({ ...formData, department: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('settings.users.vyberite_otdel')} />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={String(dept.id)}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={!!actionLoading}>
              {t('settings.users.otmena')}
            </Button>
            <Button onClick={handleCreate} disabled={!!actionLoading}>
              {actionLoading === 'create' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('settings.users.sozdanie')}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('settings.users.sohranit')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('settings.users.redaktirovat_pol_zovatelya')}</DialogTitle>
            <DialogDescription>
              {t('settings.users.vnesite_izmeneniya_v_dannye_pol_zovatelya')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t('settings.users.imya')}</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">{t('settings.users.novyy_parol')} (opcionalno)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={t('settings.users.esli_ne_menyat_ostavte_pustym')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-role">{t('settings.users.rol')}</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">{t('settings.users.status_label')}</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'inactive' | 'blocked') => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('settings.users.aktivnyy')}</SelectItem>
                    <SelectItem value="inactive">{t('settings.users.neaktivnyy')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">{t('settings.users.telefon')}</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-department">{t('settings.users.otdel')}</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({ ...formData, department: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('settings.users.vyberite_otdel')} />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={String(dept.id)}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={!!actionLoading}>
              {t('settings.users.otmena')}
            </Button>
            <Button onClick={handleSaveEdit} disabled={!!actionLoading}>
              {actionLoading === 'update' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('settings.users.sohranenie')}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {t('settings.users.sohranit')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              {t('settings.users.udalit_pol_zovatelya')}
            </DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{selectedUser?.name}</span>{' '}
              {t('settings.users.budet_udalen_bez_vozmozhnosti_vosstanovleniya')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {t('settings.users.vy_uvereny_chto_hotite_udalit_etogo_pol_zovatelya')}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={!!actionLoading}>
              {t('settings.users.otmena')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={!!actionLoading}>
              {actionLoading === 'delete' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('settings.users.udalenie')}
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('settings.users.udalit')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
