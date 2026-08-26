import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface GridColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  className?: string;
  disabled?: boolean;
}

// Расширенная палитра (12 колонок x 10 рядов)
const COLOR_GRID = [
  ['#ff0000', '#fce4e4', '#f9c9c9', '#f39393', '#ed5d5d', '#e72727', '#b91f1f', '#8b1717', '#5d0f0f', '#2e0707'], // Red
  ['#ff9900', '#fff5e6', '#ffebcc', '#ffd699', '#ffc266', '#ffad33', '#cc7a00', '#995c00', '#663d00', '#331f00'], // Orange
  ['#ffff00', '#ffffcc', '#ffff99', '#ffff66', '#ffff33', '#ffff00', '#cccc00', '#999900', '#666600', '#333300'], // Yellow
  ['#00ff00', '#e6ffe6', '#ccffcc', '#99ff99', '#66ff66', '#33ff33', '#00cc00', '#009900', '#006600', '#003300'], // Green
  ['#00ffff', '#e6ffff', '#ccffff', '#99ffff', '#66ffff', '#33ffff', '#00cccc', '#009999', '#006666', '#003333'], // Cyan
  ['#0000ff', '#e6e6ff', '#ccccff', '#9999ff', '#6666ff', '#3333ff', '#0000cc', '#000099', '#000066', '#000033'], // Blue
  ['#ff00ff', '#ffe6ff', '#ffccff', '#ff99ff', '#ff66ff', '#ff33ff', '#cc00cc', '#990099', '#660066', '#330033'], // Magenta
  ['#9900ff', '#f5e6ff', '#ebccff', '#d699ff', '#c266ff', '#ad33ff', '#7a00cc', '#5c0099', '#3d0066', '#1f0033'], // Purple
  ['#663300', '#f0e6da', '#e1cdb5', '#c39b6b', '#a56921', '#874d00', '#663a00', '#4d2c00', '#331d00', '#1a0f00'], // Brown
  ['#ffffff', '#ffffff', '#f2f2f2', '#e5e5e5', '#d9d9d9', '#cccccc', '#b3b3b3', '#999999', '#808080', '#666666'], // White -> Gray
  ['#cccccc', '#808080', '#737373', '#666666', '#595959', '#4d4d4d', '#404040', '#333333', '#262626', '#1a1a1a'], // Gray -> Dark Gray
  ['#000000', '#404040', '#333333', '#262626', '#1a1a1a', '#0d0d0d', '#000000', '#000000', '#000000', '#000000'], // Black
];

export function GridColorPicker({ 
  value, 
  onChange, 
  className,
  disabled = false 
}: GridColorPickerProps) {
  const [open, setOpen] = React.useState(false);

  const { t } = useTranslation();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("h-10 px-3 flex items-center gap-2 border-2 shadow-sm transition-all hover:bg-muted/50", className)}
          disabled={disabled}
        >
          <div 
            className="w-5 h-5 rounded-sm border shadow-inner"
            style={{ backgroundColor: value || '#ffffff' }}
          />
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="flex gap-1">
          {COLOR_GRID.map((column, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-1">
              {column.map((color, rowIndex) => (
                <button
                  key={rowIndex}
                  type="button"
                  className={cn(
                    "w-5 h-5 rounded-[1px] border transition-all hover:scale-125 hover:z-10 focus:outline-none",
                    rowIndex === 0 && "mb-1.5",
                    value === color ? 'border-foreground ring-1 ring-ring scale-110 z-10' : 'border-black/5'
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    onChange(color);
                    setOpen(false);
                  }}
                  aria-label={t('components.grid_color_picker.select_color').replace('{0}', color)}
                />
              ))}
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <div className="mt-4 pt-3 border-t flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={value?.startsWith('#') ? value : '#3b82f6'}
              onChange={(e) => onChange(e.target.value)}
              className="w-5 h-5 border-0 rounded cursor-pointer p-0 overflow-hidden"
            />
            <span className="text-[9px] font-mono text-muted-foreground uppercase">
              {value || 'None'}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground"
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
          >
            {t('components.grid_color_picker.reset')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
