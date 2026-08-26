import React from 'react';
import { usePermission } from '@/hooks/usePermission';

interface CanProps {
  /** Право доступа или массив прав */
  permission: string | string[];
  /** Режим проверки: 'any' - любое право, 'all' - все права */
  mode?: 'any' | 'all';
  /** Дочерние элементы */
  children: React.ReactNode;
  /** Альтернативный контент при отсутствии прав */
  fallback?: React.ReactNode;
}

/**
 * Компонент для условного рендеринга на основе прав доступа
 * 
 * Примеры использования:
 * 
 * // Проверка одного права
 * <Can permission="cases.write">
 *   <Button>Редактировать</Button>
 * </Can>
 * 
 * // Проверка любого из перечисленных прав
 * <Can permission={['cases.write', 'cases.assign']} mode="any">
 *   <Button>Действие</Button>
 * </Can>
 * 
 * // Проверка всех перечисленных прав
 * <Can permission={['cases.read', 'cases.write']} mode="all">
 *   <Button>Действие</Button>
 * </Can>
 * 
 * // С fallback
 * <Can permission="cases.delete" fallback={<Button disabled>Удалить</Button>}>
 *   <Button>Удалить</Button>
 * </Can>
 */
export function Can({ permission, mode = 'any', children, fallback }: CanProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermission();

  if (isLoading) {
    return null; // Или можно показать loading indicator
  }

  const hasAccess = Array.isArray(permission)
    ? mode === 'all'
      ? hasAllPermissions(permission)
      : hasAnyPermission(permission)
    : hasPermission(permission);

  if (hasAccess) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}

/**
 * Компонент для рендеринга при отсутствии прав
 */
export function Cannot({ permission, children }: { permission: string | string[]; children: React.ReactNode }) {
  const { hasPermission, hasAnyPermission, isLoading } = usePermission();

  if (isLoading) {
    return null;
  }

  const hasAccess = Array.isArray(permission)
    ? hasAnyPermission(permission)
    : hasPermission(permission);

  if (!hasAccess) {
    return <>{children}</>;
  }

  return null;
}
