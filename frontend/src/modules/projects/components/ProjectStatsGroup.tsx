import React from "react";
import { useTranslation } from "@/lib/i18n";
import { StatsCard } from "@/components/ui";
import { FolderKanban, CheckCircle2, DollarSign } from "lucide-react";
import { Project } from "../types";

interface ProjectStatsGroupProps {
  projects: Project[];
  totalBudget: number;
}

export const ProjectStatsGroup = ({ projects, totalBudget }: ProjectStatsGroupProps) => {
  const { t } = useTranslation();

  return (
    <div className="hidden sm:grid sm:grid-cols-3 gap-4 mb-6">
      <StatsCard 
        title={t("projects.stats.total")} 
        value={projects.length} 
        icon={FolderKanban} 
      />
      <StatsCard
        title={t("projects.stats.active")}
        value={projects.filter((p) => p.status === "active").length}
        icon={CheckCircle2}
      />
      <StatsCard
        title={t("projects.stats.budget")}
        value={`${((totalBudget || 0) / 1_000_000).toFixed(2)} M ₽`}
        icon={DollarSign}
      />
    </div>
  );
};
