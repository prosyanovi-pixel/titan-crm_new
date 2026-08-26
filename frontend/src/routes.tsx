/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter } from 'react-router';
import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { getModuleRoutes } from '@/modules';
import { LoginPage, ResetPasswordPage } from '@/modules/auth';
import { NotFoundPage } from '@/modules/errors';
import { AuthorizedLayout } from '@/components/layout/AuthorizedLayout';
import { ErrorFallback } from '@/components/shared/ErrorFallback';
import PlaceholderPage from '@/components/ui/PlaceholderPage';
import { isFeatureEnabled } from '@/config/featureFlags';
import { useTranslation } from '@/lib/i18n';

// Wrapper for placeholder to handle translations dynamically
const TranslatablePlaceholder = ({ titleKey }: { titleKey: string }) => {
  const { t } = useTranslation();
  return <PlaceholderPage title={t(titleKey)} breadcrumb={t(titleKey)} />;
};

// Transform module routes dynamically based on feature flags
const getDynamicModuleRoutes = () => {
  const moduleRoutes = getModuleRoutes();
  return moduleRoutes.map((route) => ({
    path: route.path,
    element: (
      <ErrorBoundary>
        <Suspense fallback={<TranslatablePlaceholder titleKey="Загрузка модуля..." />}>
          {isFeatureEnabled(route.featureFlag)
            ? route.element
            : <TranslatablePlaceholder titleKey={route.titleKey} />}
        </Suspense>
      </ErrorBoundary>
    ),
  }));
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/',
    element: <AuthorizedLayout />,
    errorElement: <ErrorFallback />,
    children: [
      ...getDynamicModuleRoutes(),
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
