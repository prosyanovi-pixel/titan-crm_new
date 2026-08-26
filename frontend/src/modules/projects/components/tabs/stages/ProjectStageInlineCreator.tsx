import { Plus } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface ProjectStageInlineCreatorProps {
  onClick: () => void;
}

/**
 * Триггер для создания нового этапа проекта.
 * При клике открывает полноценную боковую панель создания этапа (ProjectStagesSheet).
 */
export function ProjectStageInlineCreator({ onClick }: ProjectStageInlineCreatorProps) {
  const { t } = useTranslation();
  return (
    <div 
      className="flex items-center gap-3 py-5 px-10 group hover:bg-primary/5 transition-all border-t border-dashed border-muted-foreground/20 cursor-pointer bg-muted/5"
      onClick={onClick}
    >
      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all active:scale-95 shrink-0">
        <Plus className="w-5 h-5" />
      </div>
      
      <div className="flex-1 text-sm text-muted-foreground/60 font-medium group-hover:text-primary transition-colors">
        {t('projects.stages.add')}
      </div>
    </div>
  );
}
