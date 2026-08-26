import { Plus } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface ProjectTaskInlineCreatorProps {
  onClick: () => void;
  placeholder?: string;
}

/**
 * Упрощенный триггер для создания задачи.
 * При клике открывает полноценную боковую панель задачи.
 */
export function ProjectTaskInlineCreator({ onClick, placeholder }: ProjectTaskInlineCreatorProps) {
  const { t } = useTranslation();
  return (
    <div 
      className="flex items-center gap-3 py-2.5 px-4 group hover:bg-primary/5 transition-all rounded-lg border border-dashed border-muted-foreground/20 cursor-pointer bg-muted/5"
      onClick={onClick}
    >
      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all shrink-0">
        <Plus className="w-4 h-4" />
      </div>
      
      <div className="flex-1 text-sm text-muted-foreground/60 font-medium">
        {placeholder || t('projects.stages.tasks.add')}
      </div>
    </div>
  );
}
