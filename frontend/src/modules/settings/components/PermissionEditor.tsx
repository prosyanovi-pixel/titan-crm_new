
import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2, Check, X, Shield, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PERMISSIONS, RESOURCES } from '@/constants/permissions';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  resource: string;
  action: string;
}

interface PermissionEditorProps {
  selectedModule: string;
}

// Все категории модулей с иконками
const PERMISSION_CATEGORIES = [
  { id: RESOURCES.USERS, icon: Shield, label: 'users' },
  { id: RESOURCES.CONTRACTORS, icon: Shield, label: 'contractors' },
  { id: RESOURCES.PROJECTS, icon: Shield, label: 'projects' },
  { id: RESOURCES.TASKS, icon: Shield, label: 'tasks' },
  { id: RESOURCES.DOCUMENTS, icon: Shield, label: 'documents' },
  { id: RESOURCES.CASES, icon: Shield, label: 'cases' },
  { id: RESOURCES.LAWYERS, icon: Shield, label: 'lawyers' },
  { id: RESOURCES.CALENDAR, icon: Shield, label: 'calendar' },
  { id: RESOURCES.MAIL, icon: Shield, label: 'mail' },
  { id: RESOURCES.FINANCE, icon: Shield, label: 'finance' },
  { id: RESOURCES.REPORTS, icon: Shield, label: 'reports' },
  { id: RESOURCES.SETTINGS, icon: Shield, label: 'settings' },
  { id: RESOURCES.ROLES, icon: Shield, label: 'roles' },
  { id: RESOURCES.PERMISSIONS, icon: Shield, label: 'permissions' },
  { id: RESOURCES.BACKUPS, icon: Shield, label: 'backups' },
];

export function PermissionEditor({ selectedModule }: PermissionEditorProps) {
  const { t } = useTranslation();
  
  const getCategoryLabel = (categoryId: string) => {
    // Используем переводы из settings.modules
    const moduleTranslation = t(`settings.modules.${categoryId}`);
    
    // Если перевод есть, используем его
    if (moduleTranslation && !moduleTranslation.startsWith('settings.modules.')) {
      return moduleTranslation;
    }
    
    // Иначе возвращаем category ID как есть
    return categoryId;
  };

  // Получение переведённого названия права
  const getPermissionName = (permission: Permission) => {
    // Пробуем получить перевод из settings.permissions.permission_names
    const translationKey = `settings.permissions.permission_names.${permission.id}`;
    const translatedName = t(translationKey);
    
    // Если перевод есть, используем его
    if (translatedName && !translatedName.startsWith(translationKey)) {
      return translatedName;
    }
    
    // Иначе используем name из базы данных или генерируем из id
    return permission.name || permission.id;
  };
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('users');
  const [editingPermission, setEditingPermission] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Permission>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newPermission, setNewPermission] = useState<Partial<Permission>>({
    category: 'users',
    resource: 'users',
    action: 'read',
  });

  const loadPermissions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get('/permissions');
      setPermissions(data);
    } catch (error) {
      console.error('Failed to load permissions:', error);
      toast.error(t('generated.oshibka_zagruzki_prav_dostupa'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPermissions();
  }, [loadPermissions]);

  const handleEdit = (permission: Permission) => {
    setEditingPermission(permission.id);
    setEditData({ ...permission });
  };

  const handleSaveEdit = async () => {
    if (!editData.name?.trim() || !editingPermission) return;
    
    try {
      const updated = await api.put(`/permissions/${editingPermission}`, editData);
      setPermissions(permissions.map(p => p.id === editingPermission ? updated : p));
      setEditingPermission(null);
      setEditData({});
      toast.success(t('generated.pravo_dostupa_obnovleno'));
    } catch (error) {
      console.error('Failed to update permission:', error);
      toast.error(t('generated.oshibka_obnovleniya'));
    }
  };

  const handleCancelEdit = () => {
    setEditingPermission(null);
    setEditData({});
  };

  const handleAdd = async () => {
    if (!newPermission.name?.trim() || !newPermission.id?.trim()) return;
    
    try {
      const created = await api.post('/permissions', newPermission);
      setPermissions([...permissions, created]);
      setNewPermission({
        category: 'users',
        resource: 'users',
        action: 'read',
      });
      setIsAdding(false);
      toast.success(t('generated.pravo_dostupa_sozdano'));
    } catch (error: unknown) {
      console.error('Failed to create permission:', error);
      toast.error(error instanceof Error ? error.message : t('generated.oshibka_sozdaniya'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('generated.vy_uvereny_chto_hotite_udalit_eto_pravo_'))) return;
    
    try {
      await api.delete(`/permissions/${id}`);
      setPermissions(permissions.filter(p => p.id !== id));
      toast.success(t('generated.pravo_dostupa_udaleno'));
    } catch (error) {
      console.error('Failed to delete permission:', error);
      toast.error(t('generated.oshibka_udaleniya'));
    }
  };

  const categorizedPermissions = PERMISSION_CATEGORIES.reduce((acc, category) => {
    acc[category.id] = permissions.filter(p => p.category === category.id);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Add category for uncategorized if any
  const uncategorized = permissions.filter(p => !PERMISSION_CATEGORIES.some(c => c.id === p.category));
  if (uncategorized.length > 0) {
      categorizedPermissions['other'] = uncategorized;
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'read': return 'bg-blue-100 text-blue-800';
      case 'write': return 'bg-green-100 text-green-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'assign': return 'bg-purple-100 text-purple-800';
      case 'sign': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          {t('generated.upravlenie_pravami_dostupa')}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
        >
          <Plus className="w-4 h-4 mr-1" />
          {t('generated.dobavit_pravo')}
        </Button>
      </div>

      {/* Add new permission form */}
      {isAdding && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">{t('generated.novoe_pravo_dostupa')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                value={newPermission.name || ''}
                onChange={(e) => setNewPermission({ ...newPermission, name: e.target.value })}
                placeholder={t('generated.nazvanie_prava')}
              />
              <Input
                value={newPermission.id || ''}
                onChange={(e) => setNewPermission({ ...newPermission, id: e.target.value })}
                placeholder={t('generated.identifikator_naprimer_users_read')}
              />
            </div>
            <Textarea
              value={newPermission.description || ''}
              onChange={(e) => setNewPermission({ ...newPermission, description: e.target.value })}
              placeholder={t('generated.opisanie_prava_dostupa')}
              rows={2}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                value={newPermission.resource || ''}
                onChange={(e) => setNewPermission({ ...newPermission, resource: e.target.value })}
                placeholder={t('generated.resurs_naprimer_users')}
              />
              <Input
                value={newPermission.action || ''}
                onChange={(e) => setNewPermission({ ...newPermission, action: e.target.value })}
                placeholder={t('generated.deystvie_naprimer_read')}
              />
              <Select 
                  value={newPermission.category} 
                  onValueChange={(val) => setNewPermission({...newPermission, category: val})}
              >
                  <SelectTrigger><SelectValue placeholder={t('generated.kategoriya')} /></SelectTrigger>
                  <SelectContent>
                      {PERMISSION_CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{getCategoryLabel(c.id)}</SelectItem>)}
                      <SelectItem value="other">{t('generated.drugoe')}</SelectItem>
                  </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleAdd}>
                <Check className="w-4 h-4 mr-1 text-green-500" />
                {t('generated.sohranit')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
                <X className="w-4 h-4 mr-1 text-destructive" />
                {t('generated.otmena')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permission categories */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0 justify-start">
          {PERMISSION_CATEGORIES.map(category => {
            const Icon = category.icon;
            const count = categorizedPermissions[category.id]?.length || 0;
            return (
              <TabsTrigger 
                key={category.id} 
                value={category.id} 
                className="gap-1 border data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{getCategoryLabel(category.id)}</span>
                <Badge variant="secondary" className="ml-1 text-xs">
                  {count}
                </Badge>
              </TabsTrigger>
            );
          })}
          {categorizedPermissions['other'] && (
              <TabsTrigger value="other" className="gap-1 border">
                  <span>{t('generated.drugoe')}</span>
                  <Badge variant="secondary" className="ml-1 text-xs">{categorizedPermissions['other'].length}</Badge>
              </TabsTrigger>
          )}
        </TabsList>

        {PERMISSION_CATEGORIES.map(category => (
          <TabsContent key={category.id} value={category.id} className="space-y-4 mt-4">
            <div className="space-y-3">
              {categorizedPermissions[category.id]?.map(permission => (
                <Card key={permission.id} className="transition-all hover:shadow-sm">
                  <CardContent className="p-4">
                    {editingPermission === permission.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input
                            value={editData.name || ''}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            placeholder={t('generated.nazvanie_prava')}
                          />
                          <Input
                            value={editData.id || ''}
                            disabled
                            className="bg-muted"
                          />
                        </div>
                        <Textarea
                          value={editData.description || ''}
                          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                          placeholder={t('generated.opisanie')}
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={handleSaveEdit}>
                            <Check className="w-4 h-4 mr-1 text-green-500" />
                            {t('generated.sohranit')}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                            <X className="w-4 h-4 mr-1 text-destructive" />
                            {t('generated.otmena')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{getPermissionName(permission)}</h4>
                            <Badge className={cn("text-xs", getActionColor(permission.action))}>
                              {permission.action}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {permission.resource}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{permission.description}</p>
                          <div className="flex items-center gap-1 mt-2">
                            <Key className="w-3 h-3 text-muted-foreground" />
                            <code className="text-xs bg-muted px-2 py-1 rounded">{permission.id}</code>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 ml-4">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(permission)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(permission.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {categorizedPermissions[category.id]?.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  {t('generated.no_permissions_for_category').replace('{category}', getCategoryLabel(category.id))}
                </p>
              )}
            </div>
          </TabsContent>
        ))}
        
        {categorizedPermissions['other'] && (
            <TabsContent value="other" className="space-y-4 mt-4">
                <div className="space-y-3">
                    {categorizedPermissions['other'].map(permission => (
                        <Card key={permission.id} className="transition-all hover:shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h4 className="font-medium">{getPermissionName(permission)}</h4>
                                        <p className="text-sm text-muted-foreground">{permission.description}</p>
                                        <div className="flex items-center gap-1 mt-2">
                                            <code className="text-xs bg-muted px-2 py-1 rounded">{permission.id}</code>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 ml-4">
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(permission.id)}>
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
