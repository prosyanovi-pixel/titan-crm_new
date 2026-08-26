
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { CommandPalette } from "./CommandPalette";
import { GlobalProgress } from "./GlobalProgress";
import { useSettings } from "@/hooks/use-settings";
import { useIsMobile, useIsTablet } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useLayout } from "@/context/LayoutContext";
import { OnboardingWizard } from "@/components/shared/OnboardingWizard";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
}

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import type { ImperativePanelHandle } from "react-resizable-panels";

export function AppLayout({
  children,
  title: propTitle,
  subtitle: propSubtitle,
  breadcrumbs: propBreadcrumbs,
  actions: propActions
}: AppLayoutProps) {
  const location = useLocation();
  const { sidebarCollapsed, setSidebarCollapsed } = useSettings() as { sidebarCollapsed?: boolean; setSidebarCollapsed?: (collapsed: boolean) => void };
  const { 
    title: ctxTitle, 
    subtitle: ctxSubtitle, 
    breadcrumbs: ctxBreadcrumbs, 
    actions: ctxActions 
  } = useLayout();

  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const panelRef = React.useRef<ImperativePanelHandle>(null);

  // Allow the sidebar to toggle on tablets as well
  const effectiveCollapsed = sidebarCollapsed;

  useEffect(() => {
    if (panelRef.current) {
      if (effectiveCollapsed && !panelRef.current.isCollapsed()) {
        panelRef.current.collapse();
      } else if (!effectiveCollapsed && panelRef.current.isCollapsed()) {
        panelRef.current.expand();
      }
    }
  }, [effectiveCollapsed]);

  // Use context if provided (for page overrides), otherwise props
  const title = ctxTitle || propTitle;
  const subtitle = ctxSubtitle || propSubtitle;
  const breadcrumbs = (ctxBreadcrumbs && ctxBreadcrumbs.length > 0) ? ctxBreadcrumbs : propBreadcrumbs;
  const actions = ctxActions || propActions;

  const contentHeader = (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
      <div>
        {title && (
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-foreground">{title}</h1>
        )}
        {subtitle && (
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );

  const mainContent = (
    <div className="w-full min-w-0 overflow-x-hidden">
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col w-full">
      <GlobalProgress />
      <CommandPalette />
      <OnboardingWizard />
      
      {isMobile ? (
        <>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetContent side="left" className="p-0 w-[280px] border-r-0 bg-transparent shadow-none" closeClassName="text-white hover:bg-white/20 top-4 right-4 z-50">
                  <div className="h-full rounded-r-xl overflow-hidden shadow-2xl bg-sidebar">
                      <AppSidebar isMobileView onNavigate={() => setMobileMenuOpen(false)} />
                  </div>
              </SheetContent>
          </Sheet>
          <div className="flex-1 w-full flex flex-col min-h-screen pl-0 min-w-0">
            <AppHeader 
                breadcrumbs={breadcrumbs} 
                isMobile={true}
                onOpenMobileMenu={() => setMobileMenuOpen(true)}
            />
            <main className="p-3 sm:p-4 lg:p-6 flex-1 min-w-0 overflow-x-hidden">
              {(title || actions) && contentHeader}
              {mainContent}
            </main>
          </div>
        </>
      ) : (
        <ResizablePanelGroup direction="horizontal" className="min-h-screen items-stretch w-full" autoSaveId="titan-crm-sidebar-layout">
          <ResizablePanel 
            ref={panelRef}
            id="sidebar-panel"
            defaultSize={effectiveCollapsed ? 4 : 16} 
            minSize={4} 
            maxSize={25}
            collapsible={true}
            collapsedSize={4}
            onCollapse={() => {
              if (setSidebarCollapsed) setSidebarCollapsed(true);
            }}
            onExpand={() => {
              if (setSidebarCollapsed) setSidebarCollapsed(false);
            }}
            className="bg-sidebar"
          >
            <AppSidebar />
          </ResizablePanel>
          <ResizableHandle withHandle className="hover:bg-primary/50 transition-colors w-1.5" />
          <ResizablePanel id="main-panel" defaultSize={effectiveCollapsed ? 96 : 84} className="min-w-0 bg-background flex flex-col w-full overflow-hidden">
            <AppHeader 
                breadcrumbs={breadcrumbs} 
                isMobile={false}
                onOpenMobileMenu={() => setMobileMenuOpen(true)}
            />
            <main className="flex-1 p-4 lg:p-6 min-w-0 overflow-x-hidden w-full">
              {(title || actions) && contentHeader}
              {mainContent}
            </main>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
}
