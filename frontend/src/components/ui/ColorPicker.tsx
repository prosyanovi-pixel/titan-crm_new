import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { COLOR_PALETTE, getContrastColor } from '@/lib/color';

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * ColorPicker — компонент выбора цвета из палитры
 * 
 * @example
 * ```tsx
 * const [color, setColor] = useState('#3b82f6');
 * 
 * <ColorPicker 
 *   value={color} 
 *   onChange={setColor}
 * />
 * ```
 */
export function ColorPicker({ 
  value, 
  onChange, 
  className,
  disabled = false 
}: ColorPickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-10 h-10 p-0 border-2", className)}
          disabled={disabled}
          style={{ backgroundColor: value }}
        >
          {value && (
            <Check 
              className={cn(
                "w-4 h-4",
                // Белый check для тёмных цветов, чёрный для светлых
                value.startsWith('#') && 
                parseInt(value.slice(1, 3), 16) * 0.299 + 
                parseInt(value.slice(3, 5), 16) * 0.587 + 
                parseInt(value.slice(5, 7), 16) * 0.114 > 128
                  ? 'text-black' 
                  : 'text-white'
              )} 
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="grid grid-cols-4 gap-2">
          {COLOR_PALETTE.map((color) => (
            <button
              key={color}
              type="button"
              className={cn(
                "w-10 h-10 rounded-md border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                value === color ? 'border-foreground ring-2 ring-ring' : 'border-transparent'
              )}
              style={{ backgroundColor: color }}
              onClick={() => {
                onChange(color);
                setOpen(false);
              }}
              aria-label={`Выбрать цвет ${color}`}
            />
          ))}
        </div>
        
        {/* Custom color input */}
        <div className="mt-3 flex items-center gap-2">
          <input
            type="color"
            value={value || '#3b82f6'}
            onChange={(e) => onChange(e.target.value)}
            className="w-8 h-8 border-0 rounded cursor-pointer"
            aria-label="Пользовательский цвет"
          />
          <span className="text-sm text-muted-foreground font-mono">
            {value || '#3b82f6'}
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * ColorSwatch — отображение цветового образца
 */
interface ColorSwatchProps {
  color: string;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ColorSwatch({ 
  color, 
  label,
  className,
  size = 'md' 
}: ColorSwatchProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "rounded-md border border-border shadow-sm",
          sizeClasses[size]
        )}
        style={{ backgroundColor: color }}
        aria-label={label || `Цвет ${color}`}
      />
      {label && (
        <span className="text-sm font-mono text-muted-foreground">
          {label}
        </span>
      )}
    </div>
  );
}

/**
 * ColorPreview — предпросмотр цвета с контрастным текстом
 */
interface ColorPreviewProps {
  color: string;
  children?: React.ReactNode;
  className?: string;
}

export function ColorPreview({ 
  color, 
  children = 'Preview',
  className 
}: ColorPreviewProps) {
  const textColor = getContrastColor(color);

  return (
    <div
      className={cn(
        "px-4 py-2 rounded-md font-medium transition-colors",
        className
      )}
      style={{ 
        backgroundColor: color,
        color: textColor
      }}
    >
      {children}
    </div>
  );
}
