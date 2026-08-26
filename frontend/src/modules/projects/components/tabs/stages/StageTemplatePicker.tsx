import React from 'react';
import {
  Search,
  Plus,
  DollarSign,
  DraftingCompass,
  ShoppingCart,
  Hammer,
  Truck,
  CheckCircle2,
  FileText
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n';

export interface StageTemplate {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: React.ReactNode;
}

const STAGE_TEMPLATES: StageTemplate[] = [
  {
    id: 'advance',
    name: t('projects.stages.templates.advance.name'),
    description: t('projects.stages.templates.advance.description'),
    color: '#f59e0b',
    icon: <DollarSign className="w-5 h-5" />
  },
  {
    id: 'design',
    name: t('projects.stages.templates.design.name'),
    description: t('projects.stages.templates.design.description'),
    color: '#3b82f6',
    icon: <DraftingCompass className="w-5 h-5" />
  },
  {
    id: 'procurement',
    name: t('projects.stages.templates.procurement.name'),
    description: t('projects.stages.templates.procurement.description'),
    color: '#8b5cf6',
    icon: <ShoppingCart className="w-5 h-5" />
  },
  {
    id: 'production',
    name: t('projects.stages.templates.production.name'),
    description: t('projects.stages.templates.production.description'),
    color: '#10b981',
    icon: <Hammer className="w-5 h-5" />
  },
  {
    id: 'installation',
    name: t('projects.stages.templates.installation.name'),
    description: t('projects.stages.templates.installation.description'),
    color: '#14b8a6',
    icon: <Truck className="w-5 h-5" />
  },
  {
    id: 'handover',
    name: t('projects.stages.templates.acceptance.name'),
    description: t('projects.stages.templates.acceptance.description'),
    color: '#22c55e',
    icon: <CheckCircle2 className="w-5 h-5" />
  },
  {
    id: 'contracting',
    name: t('projects.stages.templates.contract.name'),
    description: t('projects.stages.templates.contract.description'),
    color: '#6366f1',
    icon: <FileText className="w-5 h-5" />
  },
  {
    id: 'blank',
    name: t('projects.stages.templates.empty.name'),
    description: t('projects.stages.templates.empty.description'),
    color: '',
    icon: <Plus className="w-5 h-5" />
  },
];

interface StageTemplatePickerProps {
  onSelect: (template: StageTemplate) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function StageTemplatePicker({ onSelect, trigger, open: controlledOpen, onOpenChange }: StageTemplatePickerProps) {
  const { t } = useTranslation();
  const [search, setSearch] = React.useState('');
  const [internalOpen, setInternalOpen] = React.useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const filteredTemplates = STAGE_TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            {t('projects.stages.add')}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0 shadow-2xl border-border overflow-hidden" align="start">
        <div className="p-3 border-b bg-background">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('projects.stages.search_blocks')}
              className="pl-9 h-9 border-primary/20 focus-visible:ring-primary/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="p-2 max-h-[400px] overflow-y-auto">
          <div className="grid grid-cols-3 gap-1">
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                className={cn(
                  "flex flex-col items-center justify-start p-3 rounded-lg border border-transparent transition-all",
                  "hover:bg-muted group",
                  "active:scale-95"
                )}
                onClick={() => {
                  onSelect(template);
                  setOpen(false);
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-2 transition-transform group-hover:scale-110"
                  style={{
                    backgroundColor: template.color ? `${template.color}15` : '#f3f4f6',
                    color: template.color || 'inherit'
                  }}
                >
                  {template.icon}
                </div>
                <span className="text-[10px] font-medium text-center leading-tight line-clamp-2">{template.name}</span>
              </button>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Ничего не найдено
            </div>
          )}
        </div>

        <div className="p-2 border-t bg-black">
          <Button
            variant="ghost"
            className="w-full justify-center text-xs font-semibold h-8 text-white hover:bg-white/10 hover:text-white"
            onClick={() => {
              onSelect(STAGE_TEMPLATES.find(t => t.id === 'blank')!);
              setOpen(false);
            }}
          >
            Посмотреть все
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
