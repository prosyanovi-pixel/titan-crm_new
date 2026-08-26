import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '@/lib/i18n'
import { api } from '@/lib/api'
import { usePageSettings } from '@/context/LayoutContext';
import { usePermission } from '@/hooks/usePermission';
import { useModuleSettings } from '@/modules/settings/hooks/useModuleSettings';
import { 
  DashboardActions, 
  WidgetRenderer, 
  DashboardSkeleton 
} from '../components'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { DashboardConfig, Project, Task } from '../types';

export default function Dashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { settings: moduleSettings } = useModuleSettings("dashboard");
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitializing(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const { role, isAdmin } = usePermission();

  // --- Dashboard Configuration ---
  const [config, setConfig] = useState<DashboardConfig>(() => {
    const saved = localStorage.getItem('dashboard-config-v6');
    if (saved) return JSON.parse(saved);

    // Default configuration based on role
    const visible = { 
      stats: true, 
      contracts: true,
      activity: true, 
      deadlines: true, 
      overdue: true, 
      calendar: true, 
      projects: true, 
      analytics: true 
    };

    if (!isAdmin()) {
      if (role === 'sales') {
        visible.activity = false;
      } else if (role === 'lawyer' || role === 'legal') {
        visible.stats = false;
        visible.analytics = false;
        visible.projects = false;
      }
    }

    return {
      visible,
      settings: {
        analytics: { size: 'full', view: 'chart', compact: false },
        activity: { size: '2/3', view: 'list', compact: false },
        deadlines: { size: '1/3', view: 'list', compact: false },
        overdue: { size: '1/3', view: 'list', compact: false },
        calendar: { size: '1/3', view: 'default', compact: false },
        projects: { size: '1/3', view: 'list', compact: false },
        stats: { size: 'full', view: 'grid', compact: false }
      },
      order: ['stats', 'analytics', 'contracts', 'activity', 'deadlines', 'overdue', 'calendar', 'projects']
    };
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    localStorage.setItem('dashboard-config-v6', JSON.stringify(config));
  }, [config]);

  const updateWidgetSetting = (block: string, key: string, value: unknown) => {
    setConfig(prev => ({ 
      ...prev, 
      settings: { 
        ...prev.settings, 
        [block]: { ...prev.settings[block as keyof typeof prev.settings], [key]: value } 
      } 
    }));
  };

  const toggleBlock = (block: string) => {
    setConfig(prev => ({ 
      ...prev, 
      visible: { ...prev.visible, [block]: !prev.visible[block] } 
    }));
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setConfig(prev => {
        const oldIndex = prev.order.indexOf(active.id as string);
        const newIndex = prev.order.indexOf(over.id as string);
        return { ...prev, order: arrayMove(prev.order, oldIndex, newIndex) };
      });
    }
  };

  // Метаданные страницы
  usePageSettings({
    title: t('dashboard.title'),
    subtitle: t('dashboard.subtitle'),
    actions: <DashboardActions config={config} onToggle={toggleBlock} onUpdate={updateWidgetSetting} />
  })

  if (isInitializing) {
    return (
      <div className="pb-10">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={config.order} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 gap-x-5 gap-y-6 pb-10 items-start md:grid-cols-2 xl:grid-cols-12">
          {config.order.map(id => {
            // Check global module settings
            if (id === 'stats' && moduleSettings.features?.enableStatistics === false) return null;
            if (id === 'activity' && moduleSettings.features?.enableRecentActivities === false) return null;
            if (id === 'projects' && moduleSettings.features?.enableUpcomingProjects === false) return null;
            if (id === 'analytics' && moduleSettings.features?.enableCharts === false) return null;

            return (
              <WidgetRenderer 
                key={id} 
                id={id} 
                config={config} 
                navigate={navigate}
                onUpdateSetting={updateWidgetSetting}
              />
            );
          })}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeId ? (
          <div className="opacity-90 scale-[1.02] shadow-2xl ring-2 ring-primary cursor-grabbing rounded-lg overflow-hidden">
            <WidgetRenderer 
              id={activeId} 
              config={config} 
              navigate={navigate}
              onUpdateSetting={updateWidgetSetting}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
