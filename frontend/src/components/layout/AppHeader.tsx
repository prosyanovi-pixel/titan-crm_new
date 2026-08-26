import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, Settings, HelpCircle, Sparkles, ChevronRight, Home, Menu, Search, Bug, X, WifiOff } from "lucide-react";
import { NotificationDropdown } from "./NotificationDropdown";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { OPEN_GLOBAL_SEARCH_EVENT } from "./CommandPalette";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  breadcrumbs?: { label: string; href?: string }[];
  onOpenMobileMenu?: () => void;
  isMobile?: boolean;
}

export function AppHeader({ breadcrumbs, onOpenMobileMenu, isMobile }: AppHeaderProps) {
  const { t } = useTranslation();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchExpanded]);
  return (
    <header className="sticky top-0 z-30 bg-background border-b border-border">
      <div className="flex items-center justify-between h-14 px-4 sm:px-6">
        <div className="flex items-center gap-3">
            {isMobile && (
                <Button variant="ghost" size="icon" className="-ml-2" onClick={onOpenMobileMenu}>
                    <Menu className="w-5 h-5" />
                </Button>
            )}
            
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1 sm:gap-2 text-sm overflow-hidden whitespace-nowrap mask-linear-fade">
            <Link
                to="/"
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">{t('components.breadcrumbs.workspace')}</span>
            </Link>
            {breadcrumbs?.map((crumb, index) => (
                <div key={index} className="flex items-center gap-1 sm:gap-2">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                {crumb.href ? (
                    <Link 
                    to={crumb.href} 
                    className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[100px] sm:max-w-none"
                    title={crumb.label}
                    >
                    {crumb.label}
                    </Link>
                ) : (
                    <span className="text-foreground font-medium truncate max-w-[120px] sm:max-w-none" title={crumb.label}>{crumb.label}</span>
                )}
                </div>
            ))}
            </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {!isOnline && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium mr-1 sm:mr-2">
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Offline</span>
            </div>
          )}

          <Button
            variant="outline"
            className="hidden sm:flex items-center gap-2 text-muted-foreground w-48 justify-start mr-2 tour-search-step"
            onClick={() => document.dispatchEvent(new CustomEvent(OPEN_GLOBAL_SEARCH_EVENT))}
          >
            <Search className="w-4 h-4" />
            <span className="flex-1 text-left">{t('components.global_search.search_button')}</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>

          {isMobile && (
            <button 
              className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              onClick={() => setIsSearchExpanded(true)}
            >
              <Search className="w-5 h-5" />
            </button>
          )}

          <button 
            className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors hidden sm:block"
            title={t('components.header.ai_assistant')}
            onClick={() => toast.info(t('components.placeholder_page.under_development'))}
          >
            <Sparkles className="w-5 h-5" />
          </button>
          <Link to="/settings" className="tour-settings-step">
            <button className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors hidden sm:block">
                <Settings className="w-5 h-5" />
            </button>
          </Link>
          <button 
            className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title={t('components.header.report_bug')}
            onClick={() => window.open('mailto:support@titan.crm?subject=Bug Report', '_blank')}
          >
            <Bug className="w-5 h-5" />
          </button>
          <button 
            className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title={t('components.header.help')}
            onClick={() => window.open('https://docs.titan.crm', '_blank')}
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <NotificationDropdown />
        </div>
      </div>

      {/* Mobile Inline Search Overlay */}
      {isMobile && (
        <div 
          className={cn(
            "absolute inset-0 z-40 bg-background flex items-center px-4 gap-2 transition-all duration-300 ease-in-out origin-right",
            isSearchExpanded 
              ? "opacity-100 visible scale-x-100" 
              : "opacity-0 invisible scale-x-95 translate-x-4"
          )}
        >
          <div className="flex-1 flex items-center bg-muted rounded-full px-4 h-10 border border-border overflow-hidden">
            <Search className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
            <input 
              ref={searchInputRef}
              className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground w-full"
              placeholder={t('components.global_search.search_button')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  document.dispatchEvent(new CustomEvent(OPEN_GLOBAL_SEARCH_EVENT, { 
                    detail: { query: e.currentTarget.value } 
                  }));
                  setIsSearchExpanded(false);
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsSearchExpanded(false)} className="shrink-0 rounded-full h-10 w-10">
            <X className="w-5 h-5" />
          </Button>
        </div>
      )}
    </header>
  );
}
