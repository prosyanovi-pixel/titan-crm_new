import { Progress } from "@/components/ui/progress";
import { useTranslation } from "@/lib/i18n";
import { FolderStats } from "../types";
import { FileText, Image as ImageIcon, LayoutGrid } from "lucide-react";
import { StatsCard } from "@/components/ui";
import { formatBytes } from "@/lib/utils";

interface DocumentStatsProps {
  stats: FolderStats;
}

export function DocumentStats({ stats }: DocumentStatsProps) {
  const { t } = useTranslation();

  return (
    <div className="p-4 border-b">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">{t('documents.storage.title')}</h3>
          <span className="text-xs font-bold">{formatBytes(stats.used)} / {formatBytes(stats.total)}</span>
        </div>
        <Progress value={stats.percentage} className="h-2 rounded-full" />
      </div>
      
      <div className="space-y-2">
        <StatsCard 
          title={t('generated.dokumenty')} 
          value={formatBytes(stats.categories.documents)} 
          icon={FileText} 
          compact 
          iconColor="text-blue-500 bg-blue-50 dark:bg-blue-950"
        />
        <StatsCard 
          title={t('generated.foto')} 
          value={formatBytes(stats.categories.images)} 
          icon={ImageIcon} 
          compact 
          iconColor="text-purple-500 bg-purple-50 dark:bg-purple-950"
        />
        <StatsCard 
          title={t('common.other')}
          value={formatBytes(stats.categories.others)} 
          icon={LayoutGrid} 
          compact 
          iconColor="text-gray-500 bg-gray-50 dark:bg-gray-950"
        />
      </div>
    </div>
  );
}
