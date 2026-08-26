import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RESOURCES } from "@/constants/permissions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Shield, 
  Lock, 
  Check, 
  ChevronLeft, 
  ShieldAlert, 
  Key 
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsService } from "../api/settingsService";

import { Role, Permission } from "../types/settings.types";

export function RoleEditor() {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<Partial<Role> | null>(null);

  const { data: roles = [], isLoading: loadingRoles } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: () => settingsService.getRoles()
  });

  const { data: permissions = [], isLoading: loadingPermissions } = useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: () => settingsService.getPermissions(),
    staleTime: Infinity,
  });

  const loading = loadingRoles || loadingPermissions;

  const saveMutation = useMutation({
    mutationFn: (role: Partial<Role>) => {
      if (role.id) return settingsService.updateRole(role.id, role);
      return settingsService.createRole(role);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success(variables.id ? t('generated.rol_obnovlena') : t('generated.rol_sozdana'));
      setIsDialogOpen(false);
      setCurrentRole(null);
    },
    onError: () => toast.error(t('generated.oshibka_sohraneniya_roli'))
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => settingsService.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success(t('generated.rol_udalena'));
    },
    onError: () => toast.error(t('generated.oshibka_udaleniya_roli'))
  });

  const getCategoryLabel = (categoryId: string) => {
    const moduleTranslation = t(`settings.modules.${categoryId}`);
    if (moduleTranslation && !moduleTranslation.startsWith('settings.modules.')) {
      return moduleTranslation;
    }
    return categoryId;
  };

  const getPermissionName = (permissionId: string, fallbackName?: string) => {
    const translationKey = `settings.permissions.permission_names.${permissionId}`;
    const translatedName = t(translationKey);
    if (translatedName && !translatedName.startsWith('settings.permissions.permission_names.')) {
      return translatedName;
    }
    return fallbackName || permissionId;
  };

  const handleAddRole = () => {
    setCurrentRole({ name: "", description: "", isSystem: false, permissions: [] });
    setIsDialogOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setCurrentRole({ ...role });
    setIsDialogOpen(true);
  };

  const handleSaveRole = async () => {
    if (!currentRole?.name) return;
    saveMutation.mutate(currentRole);
  };

  const handleDeleteRole = async (id: string) => {
    const ok = await confirm({
      title: t('common.confirm_deletion'),
      description: t('generated.vy_uvereny_chto_hotite_udalit_etu_rol'),
      variant: 'destructive',
    });
    if (!ok) return;

    deleteMutation.mutate(id);
  };

  // Категории прав доступа
  const PERMISSION_CATEGORIES = [
    { id: RESOURCES.USERS, label: 'users' },
    { id: RESOURCES.CONTRACTORS, label: 'contractors' },
    { id: RESOURCES.PROJECTS, label: 'projects' },
    { id: RESOURCES.TASKS, label: 'tasks' },
    { id: RESOURCES.DOCUMENTS, label: 'documents' },
    { id: RESOURCES.CASES, label: 'cases' },
    { id: RESOURCES.LAWYERS, label: 'lawyers' },
    { id: RESOURCES.CALENDAR, label: 'calendar' },
    { id: RESOURCES.MAIL, label: 'mail' },
    { id: RESOURCES.FINANCE, label: 'finance' },
    { id: RESOURCES.REPORTS, label: 'reports' },
    { id: RESOURCES.SETTINGS, label: 'settings' },
    { id: RESOURCES.ROLES, label: 'roles' },
    { id: RESOURCES.PERMISSIONS, label: 'permissions' },
    { id: RESOURCES.BACKUPS, label: 'backups' },
    { id: RESOURCES.DASHBOARD, label: 'dashboard' },
    { id: RESOURCES.PROFILE, label: 'profile' },
    { id: RESOURCES.TAGS, label: 'tags' },
    { id: RESOURCES.STATUSES, label: 'statuses' },
    { id: RESOURCES.EMPLOYEES, label: 'employees' },
    { id: RESOURCES.DEPARTMENTS, label: 'departments' },
    { id: RESOURCES.POSITIONS, label: 'positions' },
  ];

  // Группировка разрешений, не попавших в основные категории
  const otherPermissions = permissions.filter(p => 
    !PERMISSION_CATEGORIES.some(cat => cat.id === p.category)
  );

  // Получение прав по категории
  const getCategoryPermissions = (categoryId: string) => {
    if (categoryId === 'other') return otherPermissions;
    return permissions.filter(p => p.category === categoryId);
  };

  // Проверка, выбрано ли право (с поддержкой wildcard)
  const isPermissionSelected = (permissionId: string) => {
    const rolePermissions = currentRole?.permissions || [];
    // Если есть wildcard "*", то все права выбраны
    if (rolePermissions.includes("*")) return true;
    // Если есть wildcard для ресурса "resource.*"
    const resourceWildcard = permissionId.split('.')[0] + '.*';
    if (rolePermissions.includes(resourceWildcard)) return true;
    // Проверка конкретного права
    return rolePermissions.includes(permissionId);
  };

  // Переключение выбора права
  const togglePermission = (permissionId: string) => {
    if (!currentRole) return;
    const currentPermissions = currentRole.permissions || [];
    
    // Если уже выбрано через wildcard, нужно убрать wildcard и добавить все остальные права
    if (currentPermissions.includes("*")) {
      // Убираем wildcard и добавляем все права кроме этого
      const allPermissionIds = permissions.map(p => p.id);
      const newPermissions = allPermissionIds.filter(p => p !== permissionId);
      setCurrentRole({ ...currentRole, permissions: newPermissions });
      return;
    }
    
    // Проверяем wildcard для ресурса
    const resource = permissionId.split('.')[0];
    const resourceWildcard = resource + '.*';
    if (currentPermissions.includes(resourceWildcard)) {
      // Убираем wildcard ресурса и добавляем все права ресурса кроме этого
      const resourcePermissions = permissions.filter(p => p.resource === resource).map(p => p.id);
      const newPermissions = currentPermissions.filter(p => p !== resourceWildcard);
      const otherResourcePerms = resourcePermissions.filter(p => p !== permissionId);
      setCurrentRole({ ...currentRole, permissions: [...newPermissions, ...otherResourcePerms] });
      return;
    }
    
    // Обычное переключение
    const newPermissions = currentPermissions.includes(permissionId)
      ? currentPermissions.filter(p => p !== permissionId)
      : [...currentPermissions, permissionId];
    setCurrentRole({ ...currentRole, permissions: newPermissions });
  };

  // Проверка, выбраны ли все права категории
  const isCategorySelected = (categoryId: string) => {
    const rolePermissions = currentRole?.permissions || [];
    // Если есть wildcard "*", то все категории выбраны
    if (rolePermissions.includes("*")) return true;
    
    const categoryPerms = getCategoryPermissions(categoryId);
    if (categoryPerms.length === 0) return false;
    
    // Проверяем wildcard для всех ресурсов категории
    const categoryResources = [...new Set(categoryPerms.map(p => p.resource))];
    const allResourcesHaveWildcard = categoryResources.every(resource =>
      rolePermissions.includes(resource + '.*')
    );
    if (allResourcesHaveWildcard) return true;
    
    // Проверяем все конкретные права
    return categoryPerms.every(p => isPermissionSelected(p.id));
  };

  // Переключение всей категории
  const toggleCategory = (categoryId: string) => {
    if (!currentRole) return;
    const categoryPerms = getCategoryPermissions(categoryId);
    const currentPermissions = currentRole.permissions || [];
    const allSelected = isCategorySelected(categoryId);
    
    let newPermissions: string[] = [];
    if (allSelected) {
      // Убрать все права категории
      // Сначала проверяем wildcard "*"
      if (currentPermissions.includes("*")) {
        // Убираем wildcard и добавляем все права кроме этой категории
        const allPermissionIds = permissions.map(p => p.id);
        const otherCategoryIds = allPermissionIds.filter(pid =>
          !categoryPerms.some(p => p.id === pid)
        );
        newPermissions = otherCategoryIds;
      } else {
        // Убираем конкретные права категории и wildcard ресурсов
        newPermissions = currentPermissions.filter((pid: string) => {
          // Если это wildcard ресурса из этой категории - убираем
          if (pid.endsWith('.*')) {
            const resource = pid.replace('.*', '');
            const resourceInCategory = categoryPerms.some(p => p.resource === resource);
            return !resourceInCategory;
          }
          // Если это конкретное право из категории - убираем
          return !categoryPerms.some(p => p.id === pid);
        });
      }
    } else {
      // Добавить все права категории
      // Если есть wildcard "*", ничего не делаем (все уже выбрано)
      if (currentPermissions.includes("*")) {
        return;
      }
      
      // Добавляем все права категории
      const missingIds = categoryPerms
        .filter(p => !isPermissionSelected(p.id))
        .map(p => p.id);
      newPermissions = [...currentPermissions, ...missingIds];
      
      // Убираем дубликаты wildcard ресурсов, если теперь все права ресурса выбраны
      const categoryResources = [...new Set(categoryPerms.map(p => p.resource))];
      categoryResources.forEach(resource => {
        const resourcePermissions = categoryPerms.filter(p => p.resource === resource);
        const resourceWildcard = resource + '.*';
        if (resourcePermissions.every(p => newPermissions.includes(p.id))) {
          // Все права ресурса выбраны - заменяем на wildcard
          newPermissions = newPermissions.filter((p: string) =>
            p !== resourceWildcard && !resourcePermissions.some(rp => rp.id === p)
          );
          newPermissions.push(resourceWildcard);
        }
      });
    }
    setCurrentRole({ ...currentRole, permissions: newPermissions });
  };

  return (
    <div className="space-y-6">
      {/* Унифицированная верхняя панель управления */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          {currentRole && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setCurrentRole(null)}
              className="h-8 w-8 hover:bg-muted"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h3 className="text-base font-bold text-foreground">
              {!currentRole ? t('settings.section.roles') : (currentRole.id ? t('generated.redaktirovanie_roli') : t('generated.novaya_rol'))}
            </h3>
            {currentRole && currentRole.id && (
              <p className="text-[10px] text-muted-foreground font-mono">ID: {currentRole.id}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!currentRole ? (
            <Button onClick={handleAddRole} className="h-9 gap-2 shadow-sm">
              <Plus className="w-4 h-4" />
              <span>{t('generated.dobavit_rol')}</span>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => setCurrentRole(null)} className="h-9">
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSaveRole} size="sm" className="h-9 gap-2 shadow-md">
                <Check className="w-4 h-4" />
                {t('common.save')}
              </Button>
            </>
          )}
        </div>
      </div>

      {!currentRole ? (
        <div className="titan-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="font-bold">{t('generated.nazvanie')}</TableHead>
                <TableHead className="font-bold">{t('generated.opisanie')}</TableHead>
                <TableHead className="w-24 text-right font-bold">{t('generated.dejstviya')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-background">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 text-center text-muted-foreground italic">
                    {t('generated.net_dannyh')}
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => (
                  <TableRow key={role.id} className="hover:bg-muted/40 transition-colors group">
                    <TableCell className="font-semibold text-sm">
                      <div className="flex items-center gap-2">
                        {role.name}
                        {role.isSystem && (
                          <span title={t('generated.sistemnaya')}>
                            <Lock className="w-3 h-3 text-amber-600" />
                          </span>
                        )}

                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{role.description}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                          onClick={() => handleEditRole(role)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        {!role.isSystem && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteRole(role.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Основные настройки */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="shadow-sm border-primary/5">
              <div className="p-4 space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t('generated.nazvanie')}
                  </Label>
                  <Input
                    id="name"
                    value={currentRole?.name || ""}
                    onChange={(e) => setCurrentRole({ ...currentRole, name: e.target.value })}
                    className="h-9 bg-background focus:ring-1 focus:ring-primary/30"
                    disabled={currentRole?.isSystem}
                    placeholder={t('generated.vvedite_nazvanie') || 'Введите название'}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t('generated.opisanie')}
                  </Label>
                  <Textarea
                    id="description"
                    value={currentRole?.description || ""}
                    onChange={(e) => setCurrentRole({ ...currentRole, description: e.target.value })}
                    className="min-h-[80px] text-sm bg-background focus:ring-1 focus:ring-primary/30"
                    placeholder={t('generated.vvedite_opisanie') || 'Введите описание роли'}
                  />
                </div>
              </div>
            </Card>

            <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-3">
              <h4 className="text-[10px] font-bold flex items-center gap-1.5 mb-1.5 text-amber-700 uppercase">
                <ShieldAlert className="w-3.5 h-3.5" />
                {t('generated.vazhno') || 'Внимание'}
              </h4>
              <p className="text-[10px] text-amber-700/70 leading-relaxed">
                {t('generated.role_edit_help') || 'Изменения прав доступа вступят в силу после обновления страницы пользователем.'}
              </p>
            </div>
          </div>

          {/* Матрица прав */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Key className="w-3 h-3" />
                {t('settings.section.permissions')}
              </h4>
              <Badge variant="secondary" className="text-[9px] h-5 font-mono px-2 bg-muted/50 text-muted-foreground border-none">
                {currentRole?.permissions?.length || 0} / {permissions.length}
              </Badge>
            </div>

            <div className="grid gap-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-2 custom-scrollbar pb-4">
              {[...PERMISSION_CATEGORIES, ...(otherPermissions.length > 0 ? [{ id: 'other', label: 'other' }] : [])].map(category => {
                const categoryPermissions = getCategoryPermissions(category.id);
                if (categoryPermissions.length === 0) return null;
                
                const categoryLabel = category.id === 'other' ? t('generated.drugoe') : getCategoryLabel(category.id);
                const allSelected = isCategorySelected(category.id);
                const someSelected = categoryPermissions.some(p => isPermissionSelected(p.id)) && !allSelected;
                
                return (
                  <Card key={category.id} className="border-border/40 hover:border-border/80 transition-all shadow-none">
                    <div className="p-3 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-border/20">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`category-${category.id}`}
                            checked={allSelected}
                            onCheckedChange={() => toggleCategory(category.id)}
                            className="h-3.5 w-3.5"
                          />
                          <Label
                            htmlFor={`category-${category.id}`}
                            className="text-xs font-bold cursor-pointer hover:text-primary transition-colors"
                          >
                            {categoryLabel}
                          </Label>
                          {someSelected && (
                            <Badge variant="outline" className="text-[8px] h-3.5 px-1 font-normal bg-muted/20 border-muted-foreground/20 text-muted-foreground">
                              {t('common.partially_selected') || 'частично'}
                            </Badge>
                          )}
                        </div>
                        <span className="text-[9px] text-muted-foreground font-mono opacity-50">
                          {categoryPermissions.filter(p => isPermissionSelected(p.id)).length} / {categoryPermissions.length}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
                        {categoryPermissions.map(permission => (
                          <div key={permission.id} className="flex items-center gap-2 group/perm">
                            <Checkbox
                              id={`perm-${permission.id}`}
                              checked={isPermissionSelected(permission.id)}
                              onCheckedChange={() => togglePermission(permission.id)}
                              className="h-3.5 w-3.5"
                            />
                            <div className="flex flex-col flex-1 min-w-0">
                              <Label
                                htmlFor={`perm-${permission.id}`}
                                className="text-[11px] cursor-pointer truncate font-medium group-hover/perm:text-primary transition-colors"
                              >
                                {getPermissionName(permission.id, permission.name)}
                              </Label>
                              <span className="text-[8px] text-muted-foreground font-mono opacity-40 group-hover/perm:opacity-100 transition-opacity">
                                {permission.id}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
