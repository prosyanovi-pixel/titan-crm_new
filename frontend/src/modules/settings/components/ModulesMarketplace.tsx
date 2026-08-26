import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Puzzle, Blocks, PackageSearch } from 'lucide-react';
import * as Icons from 'lucide-react';
import { toast } from 'sonner';

interface ModuleDef {
  id: string;
  name: string;
  icon: string;
  displayorder: number;
  folder: string;
  isActive: boolean;
}

export function ModulesMarketplace() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: modules = [], isLoading } = useQuery<ModuleDef[]>({
    queryKey: ['admin-modules'],
    queryFn: async () => {
      return api.get('/administration/modules');
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string, is_active: boolean }) => {
      return api.patch(`/administration/modules/${id}/toggle`, { is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-modules'] });
      // Notify the frontend to reload permissions/menus
      window.dispatchEvent(new Event('permissions:updated'));
      toast.success(t('settings.marketplace.module_updated') /* Статус модуля обновлен. Перезагрузите страницу для применения изменений. */);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Error toggling module');
    }
  });

  const handleToggle = (id: string, currentStatus: boolean) => {
    // Prevent toggling critical modules (like settings, dashboard)
    if (['settings', 'dashboard'].includes(id)) {
      toast.error(t('settings.marketplace.cannot_disable_core') /* Этот модуль является системным и не может быть отключен. */);
      return;
    }
    toggleMutation.mutate({ id, is_active: !currentStatus });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">{t('settings.marketplace.title') /* Маркетплейс модулей */}</h2>
        <p className="text-sm text-muted-foreground">
          {t('settings.marketplace.description') /* Управляйте установленными модулями и расширениями системы. */}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((mod) => {
          const Icon = (Icons as any)[mod.icon] || Blocks;
          return (
            <Card key={mod.id} className={`transition-all ${!mod.isActive ? 'opacity-70 grayscale' : ''}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  {t(`settings.modules.${mod.id}`) /* mod.name */}
                </CardTitle>
                <Switch
                  checked={mod.isActive}
                  onCheckedChange={() => handleToggle(mod.id, mod.isActive)}
                  disabled={toggleMutation.isPending}
                />
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground mt-2">
                  ID: <span className="font-mono">{mod.id}</span>
                </div>
                <div className="mt-4">
                  {mod.isActive ? (
                    <Badge variant="default" className="bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-500/20">{t('settings.marketplace.status_active') /* Включен */}</Badge>
                  ) : (
                    <Badge variant="secondary">{t('settings.marketplace.status_inactive') /* Выключен */}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
