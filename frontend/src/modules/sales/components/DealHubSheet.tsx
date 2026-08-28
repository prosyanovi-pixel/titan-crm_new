import { useState, useEffect } from "react";
import { ResizableSheet, SheetTabSettings } from "@/components/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/lib/i18n";
import { Activity, MessageSquare, Calculator, FolderKanban, Wallet, Info } from "lucide-react";
import { SalesDeal } from "../types";
import { useSheetTabs } from "@/hooks/useSheetTabs";
import { ProjectQuotesTab } from "@/modules/projects/components/tabs/ProjectQuotesTab";
import { ProjectContractsTab } from "@/modules/projects/components/tabs/ProjectContractsTab";
import { ProjectClaimsTab } from "@/modules/projects/components/tabs/ProjectClaimsTab";
import { ProjectExpensesTab } from "@/modules/projects/components/tabs/ProjectExpensesTab";
import { CommentsSection } from '@/components/shared/CommentsSection';
import ActivityList from '@/components/shared/ActivityList';

interface DealHubSheetProps {
  deal: SalesDeal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DealHubSheet({
  deal,
  open,
  onOpenChange,
}: DealHubSheetProps) {
  const { t } = useTranslation();

  const { tabs, toggleTab, moveTab } = useSheetTabs([
    { id: "overview", label: "sales.hub.title", icon: Info, visible: true },
    { id: "quotes", label: "projects.tabs.quotes", icon: Calculator, visible: true },
    { id: "contracts", label: "sheet.tabs.contracts", icon: FolderKanban, visible: true },
    { id: "expenses", label: "sheet.tabs.expenses", icon: Wallet, visible: true },
    { id: "claims", label: "projects.tabs.claims", icon: Activity, visible: true },
    { id: "comments", label: "components.comments.title", icon: MessageSquare, visible: true },
    { id: "activity", label: "sheet.tabs.activity", icon: Activity, visible: true },
  ], "deal-hub-sheet");

  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const currentTab = tabs.find(t => t.id === activeTab);
    if (currentTab && !currentTab.visible) {
      const firstVisible = tabs.find(t => t.visible);
      if (firstVisible) {
        setTimeout(() => setActiveTab(firstVisible.id), 0);
      }
    }
  }, [tabs, activeTab]);

  return (
    <ResizableSheet
      open={open}
      onOpenChange={onOpenChange}
      moduleKey="sales"
      defaultWidth="lg"
      title={deal ? deal.name : t('sales.hub.title')}
      description={deal ? deal.client : ""}
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between gap-2 mt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-w-0">
            <TabsList className="w-full justify-start overflow-x-auto hide-scrollbar">
              {tabs.map(tab => {
                if (!tab.visible) return null;
                const Icon = tab.icon;
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                    <Icon className="w-3.5 h-3.5" />
                    {t(tab.label)}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          <SheetTabSettings
            tabs={tabs}
            onToggle={toggleTab}
            onMove={moveTab}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "overview" && deal && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/30 rounded-lg border">
                <div className="text-sm text-muted-foreground mb-1">{t('sales.metrics.margin')}</div>
                <div className="text-2xl font-semibold text-emerald-600">
                  {new Intl.NumberFormat('ru-RU').format(deal.quotesSum)} ₽
                </div>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg border">
                <div className="text-sm text-muted-foreground mb-1">{t('sales.metrics.quotes')}</div>
                <div className="text-2xl font-semibold">{deal.quotesCount}</div>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              {deal.description || t('projects.placeholder.no_description')}
            </div>
          </div>
        )}

        {activeTab === "quotes" && deal && (
          <ProjectQuotesTab project={deal} />
        )}

        {activeTab === "contracts" && deal && (
          <ProjectContractsTab project={deal} />
        )}

        {activeTab === "expenses" && deal && (
          <ProjectExpensesTab projectId={deal.id} />
        )}

        {activeTab === "claims" && deal && (
          <ProjectClaimsTab project={deal} />
        )}

        {activeTab === "comments" && deal && (
          <div className="pt-4">
            <CommentsSection entityType="project" entityId={String(deal.id)} />
          </div>
        )}

        {activeTab === "activity" && deal && (
          <div>
            <ActivityList
              queryKey={['project-activity', deal.id]}
              fetchPath={`/projects/${deal.id}/activity`}
              emptyMessage={'projects.activity.empty'}
            />
          </div>
        )}
      </div>
    </ResizableSheet>
  );
}
