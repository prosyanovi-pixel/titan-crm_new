/**
 * Внутренний роутер модуля Reports
 * Подключается к App.tsx через /reports/*
 */

import { Routes, Route } from 'react-router-dom';
import { ReportsPage }       from './pages/ReportsPage';
import { ReportBuilderPage } from './pages/ReportBuilderPage';
import { ReportViewPage }    from './pages/ReportViewPage';

/**
 * Корневой компонент модуля Отчёты с внутренней маршрутизацией
 */
export function ReportsRouter() {
  return (
    <Routes>
      <Route index          element={<ReportsPage />} />
      <Route path="builder"     element={<ReportBuilderPage />} />
      <Route path="builder/:id" element={<ReportBuilderPage />} />
      <Route path="view/:id"    element={<ReportViewPage />} />
    </Routes>
  );
}

// Barrel exports
export { ReportsPage }       from './pages/ReportsPage';
export { ReportBuilderPage } from './pages/ReportBuilderPage';
export { ReportViewPage }    from './pages/ReportViewPage';
export { reportsApi }        from './api/reports.api';
export type * from './types/reports.types';
