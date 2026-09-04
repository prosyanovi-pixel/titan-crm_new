
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "@/lib/i18n";
import { useSettings } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";
import { getModuleNavigation } from "@/modules";
import { isFeatureEnabled } from "@/config/featureFlags";
import { usePermission } from "@/hooks/usePermission";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Megaphone,
  Workflow,
  Settings,
  LogOut,
  HelpCircle
} from "lucide-react";
import { toast } from "sonner";
import { authService } from "@/modules/auth/api/authService";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AppSidebarProps {
  isMobileView?: boolean;
  onNavigate?: () => void;
  forceCollapsed?: boolean;
}

export function AppSidebar({ isMobileView = false, onNavigate, forceCollapsed }: AppSidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarCollapsed, setSidebarCollapsed } = useSettings();
  const { role, isAdmin } = usePermission();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const [user, setUser] = useState(authService.getCurrentUser());

  useEffect(() => {
    const handleUserUpdate = () => {
      setUser(authService.getCurrentUser());
    };
    window.addEventListener('titan_user_updated', handleUserUpdate);
    return () => window.removeEventListener('titan_user_updated', handleUserUpdate);
  }, []);

  const userName = user.name || t('generated.profil');
  const userRole = user.role || t('generated.pol_zovatel');
  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || t('generated.aa');

  // If mobile view, sidebar is never collapsed visually (it's inside a drawer)
  // If forceCollapsed is provided (e.g. on tablets), respect it
  const isCollapsed = isMobileView ? false : (forceCollapsed !== undefined ? forceCollapsed : sidebarCollapsed);

  const { modules: dbModules = [] } = useSettings();
  const activeModuleIds = new Set(dbModules.filter((m: any) => m.isActive !== false).map((m: any) => m.id));

  const moduleNavigationItems = getModuleNavigation()
    .filter(item => isFeatureEnabled(item.featureFlag))
    .filter(item => {
      // Check database status. If dbModules hasn't loaded yet, default to showing everything to prevent UI flashing
      if (dbModules.length > 0 && item.featureFlag && !activeModuleIds.has(item.featureFlag)) return false;
      
      if (isAdmin()) return true;
      if (role === 'sales') {
        return ['dashboard', 'contractors', 'projects', 'contracts', 'tasks', 'calendar', 'mail', 'products', 'services', 'reports'].includes(item.featureFlag || '');
      }
      if (role === 'lawyer' || role === 'legal') {
        return ['dashboard', 'contractors', 'contracts', 'lawyers', 'tasks', 'documents', 'calendar', 'mail'].includes(item.featureFlag || '');
      }
      return true;
    })
    .map(item => ({
      icon: item.icon,
      label: t(item.labelKey),
      href: item.href,
    }));

  const navigationItems = [
    ...moduleNavigationItems,
  ];

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clear all auth data
    localStorage.removeItem('titan_token');
    localStorage.removeItem('titan_user_id');
    localStorage.removeItem('titan_user_role');
    
    toast.success(t('generated.vy_uspeshno_vyshli_iz_sistemy'));
    navigate('/login');
  };

  const handleItemClick = (e: React.MouseEvent) => {
    // Mobile navigation: Close the sheet
    if (isMobileView && onNavigate) {
        onNavigate();
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (isMobileView) return; // Disable collapse on mobile header
    e.stopPropagation();
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('titan_sidebar_collapsed', newState.toString());
  };

  const sidebarClass = isMobileView 
    ? "w-full h-full bg-sidebar text-sidebar-foreground flex flex-col"
    : "w-full h-full flex flex-col text-sidebar-foreground";

  return (
    <aside className={sidebarClass}>
      {/* Logo Area */}
      <div 
        className={cn(
            "flex items-center gap-3 px-5 py-6 border-b border-sidebar-border/50 transition-colors hover:bg-white/5",
            !isMobileView && "cursor-pointer"
        )}
        onClick={handleLogoClick}
        title={!isMobileView ? (isCollapsed ? t('layout.sidebar.expand_menu') : t('layout.sidebar.collapse_menu')) : undefined}
      >
        <div
          className="flex-shrink-0 transition-transform hover:scale-105 active:scale-95"
        >
          {/* New Blue Neon Logo SVG */}
          <div className="w-10 h-10 relative">
             <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id={isMobileView ? "neonGlowMobile" : "neonGlowSidebar"} x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur"></feGaussianBlur>
                  <feComposite in="SourceGraphic" in2="blur" operator="over"></feComposite>
                </filter>
              </defs>
              <circle cx="50" cy="50" r="45" stroke="#3b82f6" strokeWidth="2.5" filter={`url(#${isMobileView ? "neonGlowMobile" : "neonGlowSidebar"})`} style={{filter: "drop-shadow(#3b82f6 0px 0px 5px)"}}></circle>
              <path d="M25 35 H65 M45 35 V75" stroke="#3b82f6" strokeWidth="8" strokeLinecap="square" style={{filter: "drop-shadow(#3b82f6 0px 0px 3px)"}}></path>
              <circle cx="75" cy="32" r="4.5" fill="#3b82f6" style={{filter: "drop-shadow(#3b82f6 0px 0px 4px)"}}></circle>
              <path d="M75 45 V75" stroke="#3b82f6" strokeWidth="8" strokeLinecap="square" style={{filter: "drop-shadow(#3b82f6 0px 0px 3px)"}}></path>
            </svg>
          </div>
        </div>
        
        <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
          <span className="text-base font-bold text-white tracking-wide whitespace-nowrap">
            TITAN<span className="text-blue-500">.</span>CRM
          </span>
        </div>
      </div>

      {/* Navigation */}
      <TooltipProvider delayDuration={0}>
        <nav className="flex-1 overflow-y-auto py-4 px-3 sidebar-scrollbar space-y-1 tour-sidebar-step">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Tooltip key={item.href}>
                <div className="relative">
                  <TooltipTrigger asChild>
                    <Link
                      to={item.href}
                      onClick={handleItemClick}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors duration-200 group relative",
                        isActive 
                          ? "bg-primary/10 text-primary border border-primary/20" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                        <Icon className={cn(
                            "w-5 h-5 transition-colors duration-200",
                            isActive ? 'text-primary' : 'group-hover:text-foreground'
                        )} />
                      </div>
                      
                      <span className={cn(
                          "whitespace-nowrap font-medium transition-all duration-300 overflow-hidden",
                          isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
                      )}>
                        {item.label}
                      </span>
                      
                      {isActive && !isCollapsed && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l"></div>
                      )}
                    </Link>
                  </TooltipTrigger>
                  
                  {/* Tooltip for collapsed state (Desktop only) */}
                  {!isMobileView && isCollapsed && (
                    <TooltipContent side="right" sideOffset={12} className="z-50 border-gray-700 bg-gray-900 text-white shadow-lg pointer-events-none">
                      {item.label}
                    </TooltipContent>
                  )}
                </div>
              </Tooltip>
            );
          })}
        </nav>
      </TooltipProvider>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-sidebar-border/50 bg-sidebar-accent tour-profile-step">
        <div className={cn("flex items-center", isCollapsed ? 'justify-center' : 'gap-3')}>
          <div 
            onClick={() => { if(onNavigate) onNavigate(); navigate('/profile'); }}
            className="flex-shrink-0 relative group cursor-pointer"
          >
            <Avatar className="w-10 h-10 ring-2 ring-transparent group-hover:ring-blue-500/50 transition-all shadow-lg">
              <AvatarImage src={user.avatar || ""} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-900"></div>
          </div>
          
          <div className={cn(
              "flex-1 min-w-0 overflow-hidden transition-all duration-300",
              isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
          )}>
            <div 
                onClick={() => { if(onNavigate) onNavigate(); navigate('/profile'); }}
                className="block truncate text-sm font-semibold text-white hover:text-blue-400 transition-colors cursor-pointer"
            >
              {userName}
            </div>
            <p className="truncate text-xs text-slate-500">
              {userRole}
            </p>
          </div>
          
          <div className={cn(
              "transition-all duration-300 flex items-center gap-1",
              isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
          )}>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                document.dispatchEvent(new CustomEvent("START_ONBOARDING_WIZARD"));
              }}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-blue-500/10 hover:text-blue-500 transition-colors"
              title={t('layout.sidebar.restart_tour')}
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <button 
              onClick={handleLogout}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-red-500/10 hover:text-red-500 transition-colors"
              title={t('auth.logout.logout')}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
