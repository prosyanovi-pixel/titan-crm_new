import { useTranslation } from "@/lib/i18n";
import { Project } from "../../types";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ProjectQuotesTabProps {
  project: Project;
}

export function ProjectQuotesTab({ project }: ProjectQuotesTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{t("projects.tabs.quotes")}</h3>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          {t("quotes.create_quote")}
        </Button>
      </div>
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        {t("projects.tabs.quotes_empty")}
      </div>
    </div>
  );
}
