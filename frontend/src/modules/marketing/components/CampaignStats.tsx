import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, DollarSign, BarChart2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { MarketingCampaign } from "../types";
import { useMemo } from "react";

interface CampaignStatsProps {
  campaigns: MarketingCampaign[];
}

export function CampaignStats({ campaigns }: CampaignStatsProps) {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    let totalBudget = 0;
    let totalCost = 0;
    let activeCount = 0;

    campaigns.forEach((c) => {
      totalBudget += Number(c.budget || 0);
      totalCost += Number(c.actualCost || 0);
      if (c.status === "active") {
        activeCount++;
      }
    });

    return { totalBudget, totalCost, activeCount };
  }, [campaigns]);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="shadow-sm border-muted-foreground/10 bg-card/60 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">{t("marketing.campaigns.active_campaigns")}</CardTitle>
          <Megaphone className="w-4 h-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeCount}</div>
          <p className="text-xs text-muted-foreground mt-1">{t("marketing.campaigns.campaigns_in_progress")}</p>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-muted-foreground/10 bg-card/60 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">{t("marketing.campaigns.total_budget")}</CardTitle>
          <DollarSign className="w-4 h-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalBudget.toLocaleString()} ₽</div>
          <p className="text-xs text-muted-foreground mt-1">{t("marketing.campaigns.planned_expenses")}</p>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-muted-foreground/10 bg-card/60 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">{t("marketing.campaigns.actual_cost_label")}</CardTitle>
          <BarChart2 className="w-4 h-4 text-rose-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalCost.toLocaleString()} ₽</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.totalBudget > 0
              ? `${Math.round((stats.totalCost / stats.totalBudget) * 100)}% ${t("marketing.campaigns.of_total_budget")}`
              : `0% ${t("marketing.campaigns.of_total_budget")}`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
