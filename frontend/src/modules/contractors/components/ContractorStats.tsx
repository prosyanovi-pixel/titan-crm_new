import { StatsCard } from "@/components/ui";
import { Users, TrendingUp, DollarSign } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Contractor } from "../types/contractor.types";

interface ContractorStatsProps {
  contractors: Contractor[];
}

export function ContractorStats({ contractors }: ContractorStatsProps) {
  const { t } = useTranslation();
  
  const activeContractors = contractors.filter(
    c => c.status === "active" || c.status === "vip"
  ).length;

  return (
    <div className="hidden sm:grid sm:grid-cols-3 gap-4 mb-6">
      <StatsCard
        title={t('common.total')}
        value={contractors.length}
        icon={Users}
      />
      <StatsCard
        title={t('common.active')}
        value={activeContractors}
        icon={TrendingUp}
      />
      <StatsCard
        title={t('contractors.stats.turnover')}
        value="0"
        icon={DollarSign}
      />
    </div>
  );
}