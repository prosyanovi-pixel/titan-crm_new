import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Settings2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DashboardConfig } from '../types';
import { cn } from '@/lib/utils';

interface DashboardActionsProps {
  config: DashboardConfig;
  onToggle: (id: string) => void;
  onUpdate: (id: string, key: string, val: any) => void;
}

export function DashboardActions({ config, onToggle, onUpdate }: DashboardActionsProps) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted/50 border-none shadow-none">
          <Settings2 className="w-5 h-5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[85vh] overflow-y-auto p-0 shadow-xl border-border/50">
        <div className="sticky top-0 bg-popover z-20 px-4 py-3 border-b border-border/50 flex items-center justify-between">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">{t('dashboard.visible_blocks')}</DropdownMenuLabel>
        </div>
        
        <div className="p-3 space-y-3">
          {config.order.map(block => (
            <div key={block} className={cn(
              "p-3 rounded-xl transition-all border",
              config.visible[block] 
                ? "bg-muted/30 border-border/40 shadow-sm" 
                : "bg-transparent border-transparent opacity-50 hover:opacity-100"
            )}>
              {/* Row 1: Visibility & Compact toggle */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Switch 
                    id={`toggle-${block}`}
                    checked={config.visible[block]} 
                    onCheckedChange={() => onToggle(block)}
                    className="data-[state=checked]:bg-primary"
                  />
                  <Label 
                    htmlFor={`toggle-${block}`}
                    className="text-sm font-semibold cursor-pointer truncate flex-1 py-1"
                  >
                    {t(`dashboard.blocks.${block}`)}
                  </Label>
                </div>
                
                {config.visible[block] && (
                  <Button 
                    variant={config.settings[block]?.compact ? 'default' : 'outline'} 
                    size="sm" 
                    className="h-7 px-2 text-[10px] font-bold rounded-md shrink-0 uppercase tracking-tight"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onUpdate(block, 'compact', !config.settings[block]?.compact);
                    }}
                  >
                    {t('dashboard.sizes.compact')}
                  </Button>
                )}
              </div>

              {/* Row 2: Detailed Settings (only if visible) */}
              {config.visible[block] && (
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border/20">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] text-muted-foreground font-black uppercase tracking-widest ml-0.5">
                      {t('dashboard.sizes.title')}
                    </Label>
                    <Select 
                      value={config.settings[block]?.size} 
                      onValueChange={(v) => onUpdate(block, 'size', v)}
                    >
                      <SelectTrigger className="h-8 text-[11px] bg-background border-border/40 focus:ring-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1/3" className="text-xs">{t('dashboard.settings.size.1/3')}</SelectItem>
                        <SelectItem value="1/2" className="text-xs">{t('dashboard.settings.size.1/2')}</SelectItem>
                        <SelectItem value="2/3" className="text-xs">{t('dashboard.settings.size.2/3')}</SelectItem>
                        <SelectItem value="full" className="text-xs">{t('dashboard.settings.size.full')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {block === 'analytics' && (
                    <div className="space-y-1.5">
                      <Label className="text-[9px] text-muted-foreground font-black uppercase tracking-widest ml-0.5">
                        {t('dashboard.view_type')}
                      </Label>
                      <Select 
                        value={config.settings[block]?.view} 
                        onValueChange={(v) => onUpdate(block, 'view', v)}
                      >
                        <SelectTrigger className="h-8 text-[11px] bg-background border-border/40 focus:ring-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="chart" className="text-xs">{t('dashboard.view.chart')}</SelectItem>
                          <SelectItem value="numbers" className="text-xs">{t('dashboard.view.numbers')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
