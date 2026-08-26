
import React from "react";
import { Input } from "@/components/ui/input";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Settings2, X, Trash2, ArrowUp, ArrowDown, Filter } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { TabConfig } from "@/hooks/useDataTable";
import { cn } from "@/lib/utils";

// ─── Reusable Bulk Action Sub-components ─────────────────────────────────────

/**
 * Standard button for bulk action toolbars.
 * Provides consistent styling for custom bulk operations (e.g., Edit Status, Assign User).
 */
export function BulkActionButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "h-8 gap-2 bg-background/80 border-border/60 hover:bg-background",
        className
      )}
      {...props}
    />
  );
}

/**
 * Standard delete button for bulk action toolbars.
 * Uses destructive styling. Requires confirmation to be handled by the parent.
 */
export function BulkDeleteButton({ className, children, ...props }: ButtonProps) {
  const { t } = useTranslation();
  return (
    <Button
      variant="destructive"
      size="sm"
      className={cn("h-8 gap-2", className)}
      {...props}
    >
      <Trash2 className="w-4 h-4" />
      {children ?? <span className="hidden sm:inline">{t('common.delete')}</span>}
    </Button>
  );
}

interface DataTableToolbarProps {
  // Search
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  // Selection & Bulk Actions
  selectedCount?: number;
  onCancelSelection?: () => void;
  onBulkDelete?: () => void;
  bulkActions?: React.ReactNode; // Extra bulk actions buttons

  // Settings
  tabsConfig?: TabConfig[];
  onMoveTab?: (index: number, direction: 'up' | 'down') => void;
  onToggleTab?: (id: string, visible: boolean) => void;
  
  visibleColumns?: Record<string, boolean>;
  onToggleColumn?: (key: string, visible: boolean) => void;
  columnLabels?: Record<string, string>;
  columnOrder?: string[];
  onMoveColumn?: (key: string, direction: 'up' | 'down') => void;
  columnWidths?: Record<string, number>;
  onColumnResize?: (key: string, width: number) => void;

  // Filters (Slot for specific page filters)
  filters?: React.ReactNode;
  filterDropdownWidth?: string;
  
  className?: string;
}

export function DataTableToolbar({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  selectedCount,
  onCancelSelection,
  onBulkDelete,
  bulkActions,
  tabsConfig,
  onMoveTab,
  onToggleTab,
  visibleColumns,
  onToggleColumn,
  columnLabels,
  columnOrder,
  onMoveColumn,
  columnWidths,
  onColumnResize,
  filters,
  filterDropdownWidth,
  className,
}: DataTableToolbarProps) {
  const { t } = useTranslation();
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const hasSearch = Boolean(searchQuery);

  const handleSearchClick = () => {
    setIsSearchExpanded(true);
    setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  // Mode: Bulk Actions
  if ((selectedCount ?? 0) > 0) {
    return (
      <div
        className={cn(
          "flex items-center flex-nowrap gap-1.5 sm:gap-2",
          "bg-background/95 backdrop-blur-md",
          "border border-primary/20 shadow-lg shadow-primary/5",
          "p-1.5 rounded-xl",
          "animate-in slide-in-from-top-1 fade-in duration-200",
          "flex-1 justify-end min-w-0 overflow-x-auto",
          className
        )}
      >
        {/* Count badge */}
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold px-2.5 py-1 bg-primary/10 text-primary rounded-lg whitespace-nowrap flex-shrink-0">
          <span className="tabular-nums">{selectedCount}</span>
          <span className="hidden sm:inline text-xs font-normal opacity-70">{t('common.selected')}</span>
        </span>

        <div className="h-5 w-px bg-border/60 mx-0.5 flex-shrink-0" />

        {/* Cancel */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancelSelection}
          className="h-8 gap-1.5 text-muted-foreground hover:text-foreground flex-shrink-0"
        >
          <X className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('common.cancel')}</span>
        </Button>

        {/* Custom bulk actions slot */}
        {bulkActions && (
          <>
            <div className="h-5 w-px bg-border/60 mx-0.5 flex-shrink-0" />
            <div className="flex items-center gap-1.5">{bulkActions}</div>
          </>
        )}

        {/* Delete */}
        {onBulkDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onBulkDelete}
            className="h-8 gap-1.5 flex-shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('common.delete')}</span>
          </Button>
        )}
      </div>
    );
  }

  // Mode: Standard Toolbar
  return (
    <div className={cn("flex flex-nowrap items-center gap-1.5 flex-1 justify-end min-w-0 w-max", className)}>
      {searchQuery !== undefined && onSearchChange && (
        <div className={cn("relative transition-all duration-300 ease-in-out", isSearchExpanded || hasSearch ? "w-[130px] sm:w-[200px]" : "w-9")}>
          {isSearchExpanded || hasSearch ? (
            <>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder={searchPlaceholder || t('common.search')}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onBlur={() => {
                  if (!searchQuery) setIsSearchExpanded(false);
                }}
                className="pl-9 h-9 w-full"
              />
            </>
          ) : (
            <Button variant="ghost" size="icon" className="h-9 w-9 border sm:border-0" onClick={handleSearchClick} title={t('common.search')}>
              <Search className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {filters && (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 border sm:border-0" title={t('common.filter')}>
                        <Filter className="w-4 h-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={filterDropdownWidth ?? 'w-56'}>
                    {filters}
                </DropdownMenuContent>
            </DropdownMenu>
        )}

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 border sm:border-0">
                <Settings2 className="w-4 h-4" />
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 max-h-[70vh] overflow-y-auto">
            {tabsConfig && onMoveTab && onToggleTab && (
                <>
                <DropdownMenuLabel>{t('generated.vkladki')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {tabsConfig.map((tab, index) => (
                    <div key={tab.id} className="flex items-center justify-between p-2 hover:bg-muted rounded-sm text-sm">
                    <div
                        className="flex items-center gap-2 cursor-pointer select-none flex-1"
                        onClick={(e) => {
                        e.preventDefault();
                        onToggleTab(tab.id, !tab.visible);
                        }}
                    >
                        <Checkbox checked={tab.visible} />
                        <span>{t(tab.label)}</span>
                    </div>
                    <div className="flex gap-1">
                        <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => { e.preventDefault(); onMoveTab(index, 'up'); }}
                        disabled={index === 0}
                        >
                        <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => { e.preventDefault(); onMoveTab(index, 'down'); }}
                        disabled={index === tabsConfig.length - 1}
                        >
                        <ArrowDown className="w-3 h-3" />
                        </Button>
                    </div>
                    </div>
                ))}
                <DropdownMenuSeparator />
                </>
            )}
            
            {visibleColumns && columnLabels && onToggleColumn && (
              <>
                <DropdownMenuLabel>{t('common.columns')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(columnOrder || Object.keys(visibleColumns)).map((key, index, arr) => (
                  <div key={key} className="group flex items-center justify-between px-2 py-1 hover:bg-muted rounded-sm text-sm">
                    <div
                      className="flex items-center gap-2 cursor-pointer select-none flex-1"
                      onClick={() => onToggleColumn(key, !visibleColumns[key])}
                    >
                      <Checkbox checked={!!visibleColumns[key]} />
                      <span>{t(columnLabels[key] || key)}</span>
                    </div>
                    {onMoveColumn && (
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon" variant="ghost" className="h-5 w-5"
                          onClick={(e) => { e.preventDefault(); onMoveColumn(key, 'up'); }}
                          disabled={index === 0}
                        ><ArrowUp className="w-3 h-3" /></Button>
                        <Button
                          size="icon" variant="ghost" className="h-5 w-5"
                          onClick={(e) => { e.preventDefault(); onMoveColumn(key, 'down'); }}
                          disabled={index === arr.length - 1}
                        ><ArrowDown className="w-3 h-3" /></Button>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
