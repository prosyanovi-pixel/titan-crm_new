import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Outlet } from 'react-router';
import { AppLayout } from './AppLayout';
import { useTranslation } from '@/lib/i18n';
import { getModuleRoutes } from '@/modules';
import { authService } from '@/modules/auth/api/authService';
import { WebSocketProvider } from '@/context/WebSocketContext';

/**
 * Обертка для авторизованных роутов, которая сохраняет состояние AppLayout (и WebSocket)
 * при переходах между страницами.
 * Также проверяет авторизацию пользователя.
 */
export function AuthorizedLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const moduleRoutes = getModuleRoutes();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      console.warn('[AuthorizedLayout] User not authenticated, redirecting to /login');
      navigate('/login', { state: { from: location } });
    }
  }, [navigate, location]);

  // Находим текущий маршрут, чтобы извлечь метаданные (заголовок и т.д.)
  const currentRoute = useMemo(() => {
    return moduleRoutes.find(route => {
      // Проверяем точное совпадение или начало пути
      // Убираем trailing slash для корректного сравнения
      const cleanPath = route.path.replace(/\/\*$/, ''); // убираем /* из путей типа /contracts/*
      const cleanLocation = location.pathname.replace(/\/$/, ''); // убираем trailing slash
      
      return cleanLocation === cleanPath || cleanLocation.startsWith(cleanPath + '/');
    });
  }, [location.pathname, moduleRoutes]);

  // Если не авторизован, ничего не рендерим (редирект отработает в useEffect)
  if (!authService.isAuthenticated()) {
    return null;
  }

  return (
    <WebSocketProvider>
      <AppLayout 
        title={currentRoute ? t(currentRoute.titleKey) : undefined}
        breadcrumbs={currentRoute ? [{ label: t(currentRoute.titleKey) }] : []}
      >
        <Outlet />
      </AppLayout>
    </WebSocketProvider>
  );
}
