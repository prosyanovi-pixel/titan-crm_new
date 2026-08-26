import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ArrowRight, Settings, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface DashboardWidgetProps {
  id: string;
  title: string;
  children: React.ReactNode;
  settingsContent?: React.ReactNode;
  className?: string;
  compact?: boolean;
  icon?: React.ElementType;
  showAllHref?: string;
  noPadding?: boolean;
}

export function DashboardWidget({ 
  id, 
  title, 
  children, 
  settingsContent,
  className, 
  compact, 
  icon: Icon, 
  showAllHref, 
  noPadding 
}: DashboardWidgetProps) {
  const { t } = useTranslation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging 
  } = useSortable({ id });

  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition, 
    zIndex: isDragging ? 100 : 1, 
    opacity: isDragging ? 0.6 : 1 
  };

  const toggleSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSettingsOpen(!isSettingsOpen);
  };

  return (
    <div ref={setNodeRef} style={style} className={cn("relative group flex flex-col w-full min-w-0 h-full perspective-1000", className)}>
      <div className="relative flex-1 flex flex-col transition-all duration-500">
        {/* Main Content */}
        <div className="relative flex flex-col h-full bg-card rounded-2xl border border-border/30 shadow-sm overflow-hidden z-20">
          <div className={cn(
            "relative z-40 flex items-center justify-between border-b border-border/20 bg-card", 
            compact ? "px-4 py-3" : "px-6 py-5"
          )}>
            <div className="flex items-center gap-3 min-w-0">
               {Icon && (
                 <div className={cn("rounded-xl flex items-center justify-center bg-primary/5 text-primary", compact ? "w-8 h-8" : "w-10 h-10")}>
                   <Icon className={cn(compact ? "w-4 h-4" : "w-5 h-5")} />
                 </div>
               )}
               <h3 className={cn("font-bold text-foreground/90 tracking-tight truncate", compact ? "text-sm" : "text-base")}>
                 {title}
               </h3>
            </div>
            <div className="flex items-center gap-1.5">
              {showAllHref && !compact && (
                <Link to={showAllHref} className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              {settingsContent && (
                <button 
                  onClick={toggleSettings}
                  className={cn(
                    "p-2 rounded-xl transition-all duration-300",
                    isSettingsOpen 
                      ? "bg-primary/10 text-primary opacity-100" 
                      : "hover:bg-muted text-muted-foreground/40 hover:text-muted-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  )}
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}
              <div 
                {...attributes} 
                {...listeners} 
                className="p-2 rounded-xl hover:bg-muted text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <GripVertical className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className={cn("flex-1 flex flex-col", noPadding ? "" : (compact ? "p-4" : "p-6"))}>
            {children}
          </div>
        </div>

          {/* Slide-down Settings Panel */}
          {settingsContent && (
            <div 
              className={cn(
                "absolute top-[72px] left-0 right-0 bottom-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md overflow-hidden transition-all duration-300 ease-in-out flex flex-col",
                isSettingsOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
              )}
            >
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/10">
                   <h4 className="font-medium text-sm text-muted-foreground">
                     {compact ? t('common.settings') : t('dashboard.widget_settings')}
                   </h4>
                   <button onClick={toggleSettings} className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                     <RotateCcw className="w-4 h-4" />
                   </button>
                </div>
                {settingsContent}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
