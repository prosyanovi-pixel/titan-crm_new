
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FolderKanban, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Project } from "../types";
import { Button } from "@/components/ui/button";

interface ProjectSelectProps {
  value: string | number | null;
  onValueChange: (value: number | null) => void;
  projects: Project[];
  placeholder?: string;
  className?: string;
  excludeIds?: number[];
}

/**
 * Специализированный компонент выбора проекта.
 * Поддерживает очистку выбора и древовидное отображение (опционально в будущем).
 */
export function ProjectSelect({ 
  value, 
  onValueChange, 
  projects, 
  placeholder, 
  className,
  excludeIds = []
}: ProjectSelectProps) {
  const { t } = useTranslation();
  
  const availableProjects = projects.filter(p => !excludeIds.includes(p.id));
  const selectedProject = projects.find(p => String(p.id) === String(value));

  return (
    <div className="flex gap-2 items-center w-full">
      <Select 
        value={value ? String(value) : "none"} 
        onValueChange={(v) => onValueChange(v === "none" ? null : Number(v))}
      >
        <SelectTrigger className={cn("flex-1", className)}>
          <div className="flex items-center gap-2 truncate">
            <FolderKanban className="h-4 w-4 shrink-0 opacity-50" />
            <SelectValue placeholder={placeholder || t('projects.placeholder.no_parent')} />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none" className="text-muted-foreground italic">
            {t('projects.placeholder.no_parent')}
          </SelectItem>
          {availableProjects.map((project) => (
            <SelectItem key={project.id} value={String(project.id)}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {value && value !== "none" && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 shrink-0" 
          onClick={() => onValueChange(null)}
          title={t('common.clear')}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
