/**
 * Хук для проверки прав доступа текущего пользователя
 * 
 * Пример использования:
 * const { hasPermission, hasAnyPermission, isLoading } = usePermission();
 * if (hasPermission('cases.write')) { ... }
 */

import { useQuery } from '@tanstack/react-query';
import { authService } from '@/modules/auth/api/authService';

interface UserPermissions {
  role: string;
  permissions: string[];
}

export function usePermission() {
  const role = localStorage.getItem('titan_user_role') || 'user';
  
  const { data: userPermissions, isLoading } = useQuery<UserPermissions>({
    queryKey: ['user-permissions', role],
    queryFn: async () => {
      // Если роль admin - даём все права без запроса
      if (role === 'admin') {
        return { role, permissions: ['*'] };
      }
      
      try {
        const userData = await authService.getCurrentUserPermissions();
        const permissions = userData?.permissions || [];
        return { role, permissions };
      } catch (error) {
        console.error('Failed to load user permissions:', error);
        return { role, permissions: [] };
      }
    },
    staleTime: 5 * 60 * 1000, // Кэшируем на 5 минут
    placeholderData: { role, permissions: [] },
  });

  /**
   * Проверка наличия конкретного права
   * Admin имеет все права (wildcard '*')
   */
  const hasPermission = (permission: string): boolean => {
    if (!userPermissions) return false;
    
    // Admin имеет все права
    if (userPermissions.permissions.includes('*')) return true;
    
    return userPermissions.permissions.includes(permission);
  };

  /**
   * Проверка наличия любого из перечисленных прав
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!userPermissions) return false;
    
    // Admin имеет все права
    if (userPermissions.permissions.includes('*')) return true;
    
    return permissions.some(p => userPermissions.permissions.includes(p));
  };

  /**
   * Проверка наличия всех перечисленных прав
   */
  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!userPermissions) return false;
    
    // Admin имеет все права
    if (userPermissions.permissions.includes('*')) return true;
    
    return permissions.every(p => userPermissions.permissions.includes(p));
  };

  /**
   * Получение роли пользователя
   */
  const getRole = (): string => {
    return userPermissions?.role || 'user';
  };

  /**
   * Проверка, является ли пользователь администратором
   */
  const isAdmin = (): boolean => {
    return getRole() === 'admin';
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getRole,
    isAdmin,
    isLoading,
    permissions: userPermissions?.permissions || [],
    role: userPermissions?.role || 'user',
  };
}
