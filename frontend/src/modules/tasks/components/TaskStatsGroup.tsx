import React from "react";
import { useTranslation } from "@/lib/i18n";
import { StatsCard } from "@/components/ui";
import { CheckSquare, Clock, AlertCircle } from "lucide-react";

import { Task } from "../types";

interface TaskStatsGroupProps {
  tasks: Task[];
}

export function TaskStatsGroup({ tasks }: TaskStatsGroupProps) {
  const { t } = useTranslation();

  const total = tasks.length;
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;
  const overdue = tasks.filter(t => {
    if (t.status === 'Done') return false;
    if (!t.dueDate) return false;
    return new Date(t.dueDate) < new Date();
  }).length;

  return (
    <div className="hidden sm:grid sm:grid-cols-3 gap-4 mb-6">
      <StatsCard 
        title={t("tasks.stats.total")} 
        value={total} 
        icon={CheckSquare} 
      />
      <StatsCard
        title={t("tasks.stats.in_progress")}
        value={inProgress}
        icon={Clock}
        iconColor="text-amber-500 bg-amber-50 dark:bg-amber-950"
      />
      <StatsCard
        title={t("tasks.stats.overdue")}
        value={overdue}
        icon={AlertCircle}
        valueColor={overdue > 0 ? "text-destructive" : "text-muted-foreground"}
        iconColor="text-destructive bg-red-50 dark:bg-red-950"
      />
    </div>
  );
}
