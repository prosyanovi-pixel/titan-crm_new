
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Settings, ArrowUp, ArrowDown } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { SheetTabConfig } from "@/hooks/useSheetTabs";

interface SheetTabSettingsProps {
  tabs: SheetTabConfig[];
  onToggle: (id: string, checked: boolean) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
}

export function SheetTabSettings({ tabs, onToggle, onMove }: SheetTabSettingsProps) {
  const { t } = useTranslation();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
          <Settings className="w-4 h-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3 max-h-[70vh] overflow-y-auto">
        <div className="space-y-2">
          <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-2">
            {t('generated.nastroyka_vkladok')}
          </h4>
          {tabs.map((tab, index) => (
            <div key={tab.id} className="flex items-center justify-between group hover:bg-muted/50 p-1 rounded-sm -mx-1">
              <div className="flex items-center space-x-2 flex-1">
                <Checkbox
                  id={`tab-${tab.id}`}
                  checked={tab.visible}
                  onCheckedChange={(checked) => onToggle(tab.id, !!checked)}
                />
                <label
                  htmlFor={`tab-${tab.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                >
                  {t(tab.label)}
                </label>
              </div>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5"
                  onClick={() => onMove(index, 'up')}
                  disabled={index === 0}
                >
                  <ArrowUp className="w-3 h-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5"
                  onClick={() => onMove(index, 'down')}
                  disabled={index === tabs.length - 1}
                >
                  <ArrowDown className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
