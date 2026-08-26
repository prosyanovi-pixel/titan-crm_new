import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Curated list of safe icons that are likely to exist in most lucide versions
const ICON_LIST = [
  'CheckCircle', 'AlertCircle', 'Clock', 'XCircle', 'Info', 'HelpCircle',
  'Star', 'Zap', 'Shield', 'Lock', 'Unlock', 'Eye', 'EyeOff',
  'File', 'FileText', 'Image', 'Video', 'Music', 'Archive',
  'Mail', 'MessageSquare', 'Phone', 'Share', 'Link',
  'User', 'Users', 'Briefcase', 'Building', 'Landmark',
  'CreditCard', 'Wallet', 'DollarSign', 'PieChart', 'BarChart',
  'Calendar', 'MapPin', 'Flag', 'Tag', 'Bookmark',
  'Heart', 'ThumbsUp', 'ThumbsDown', 'Smile', 'Frown',
  'Sun', 'Moon', 'Cloud', 'Wind', 'Umbrella',
  'Settings', 'Tool', 'Key', 'Search', 'Filter',
  'Plus', 'Minus', 'Edit', 'Trash', 'Save', 'Download', 'Upload',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'RefreshCw', 'ExternalLink', 'Play', 'Pause', 'Square',
  'Check', 'CheckCircle2', 'AlertTriangle', 'Bell', 'Camera', 'Car'
];

/**
 * Safely retrieves a Lucide icon component by name
 */
const getIcon = (name: string): React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }> | null => {
  const icon = (LucideIcons as Record<string, unknown>)[name];
  if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null)) {
    return icon as React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  }
  return null;
};

const LucideIconRenderer = ({ name, size, className, strokeWidth }: { name: string; size?: number; className?: string; strokeWidth?: number }) => {
  const Icon = getIcon(name);
  if (!Icon) return null;
  return React.createElement(Icon, { size, className, strokeWidth });
};

interface IconPickerProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  className?: string;
}

export function IconPicker({ value, onChange, className }: IconPickerProps) {
  const [search, setSearch] = React.useState('');
  
  const filteredIcons = ICON_LIST.filter(icon => 
    icon.toLowerCase().includes(search.toLowerCase())
  );


  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={cn("w-12 h-12 p-0 flex items-center justify-center relative", className)}
        >
          {value ? <LucideIconRenderer name={value} size={20} /> : <div className="text-[10px] text-muted-foreground uppercase">Icon</div>}
          {value && (
            <div 
              className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                onChange(undefined);
              }}
            >
              <X size={10} />
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search icon..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>
        <ScrollArea className="h-64 p-2">
          <div className="grid grid-cols-6 gap-1">
            {filteredIcons.map(iconName => (
              <Button
                key={iconName}
                variant={value === iconName ? "secondary" : "ghost"}
                className="w-10 h-10 p-0"
                onClick={() => onChange(iconName)}
                title={iconName}
              >
                <LucideIconRenderer name={iconName} size={18} />
              </Button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
