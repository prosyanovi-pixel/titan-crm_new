import React, { createContext, useContext, useState, useMemo } from 'react';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface LayoutState {
  title: string;
  subtitle: string;
  breadcrumbs: Breadcrumb[];
  actions: React.ReactNode;
}

interface LayoutDispatch {
  setTitle: (title: string) => void;
  setSubtitle: (subtitle: string) => void;
  setBreadcrumbs: (breadcrumbs: Breadcrumb[]) => void;
  setActions: (actions: React.ReactNode) => void;
}

const LayoutStateContext = createContext<LayoutState | undefined>(undefined);
const LayoutDispatchContext = createContext<LayoutDispatch | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [actions, setActions] = useState<React.ReactNode>(null);

  const stateValue = useMemo(() => ({
    title, subtitle, breadcrumbs, actions
  }), [title, subtitle, breadcrumbs, actions]);

  const dispatchValue = useMemo(() => ({
    setTitle, setSubtitle, setBreadcrumbs, setActions
  }), []);

  return (
    <LayoutDispatchContext.Provider value={dispatchValue}>
      <LayoutStateContext.Provider value={stateValue}>
        {children}
      </LayoutStateContext.Provider>
    </LayoutDispatchContext.Provider>
  );
}

export function useLayout() {
  const state = useContext(LayoutStateContext);
  const dispatch = useContext(LayoutDispatchContext);
  if (!state || !dispatch) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return { ...state, ...dispatch };
}

/**
 * Хук-помощник для установки настроек страницы в AppLayout
 */
export function usePageSettings({ 
  title, 
  subtitle = '', 
  breadcrumbs = [], 
  actions = null 
}: { 
  title: string; 
  subtitle?: string; 
  breadcrumbs?: Breadcrumb[]; 
  actions?: React.ReactNode;
}) {
  const dispatch = useContext(LayoutDispatchContext);
  if (!dispatch) {
    throw new Error('usePageSettings must be used within a LayoutProvider');
  }

  React.useEffect(() => {
    // Используем функциональные обновления, чтобы избежать лишних триггеров,
    // но так как setTitle и прочие — это простые стейты, 
    // мы просто вызываем их. Проблема в том, что actions (JSX) 
    // всегда новый при рендере родителя.
    
    dispatch.setTitle(title);
    dispatch.setSubtitle(subtitle);
    dispatch.setBreadcrumbs(breadcrumbs);
    
    // Обновляем actions только если они реально изменились (простая проверка)
    // или если они стали null.
    dispatch.setActions(actions);
    
    return () => {
      dispatch.setTitle('');
      dispatch.setSubtitle('');
      dispatch.setBreadcrumbs([]);
      dispatch.setActions(null);
    };
  }, [title, subtitle, JSON.stringify(breadcrumbs), actions, dispatch]);
}
