import { useTranslation } from "@/lib/i18n";
import { Project } from "../../types";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle } from "lucide-react";

interface ProjectClaimsTabProps {
  project: Project;
}

export function ProjectClaimsTab({ project }: ProjectClaimsTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{t("projects.tabs.claims")}</h3>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          {t("claims.create_claim")}
        </Button>
      </div>
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground border rounded-lg bg-slate-50/50">
        <AlertTriangle className="h-10 w-10 mb-3 text-amber-500 opacity-80" />
        <h3 className="font-medium text-foreground mb-1">{t('projects.claims.empty_title')}</h3>
        <p className="text-sm max-w-md">{t('projects.claims.empty_desc')}</p>
        
        <Button variant="outline" className="mt-6" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          {t('projects.claims.create')}
        </Button>
      </div>
    </div>
  );
}
