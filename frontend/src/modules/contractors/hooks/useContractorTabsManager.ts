import { useEffect } from "react";
import { Users, Building2, UserCheck } from "lucide-react";
import { TabConfig } from "@/hooks/useDataTable";
import { RelationshipTypeItem, LegalFormGroupItem } from "@/modules/settings/types/settings.types";

interface UseContractorTabsManagerProps {
  legalFormGroups: LegalFormGroupItem[];
  relationshipTypes: RelationshipTypeItem[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setTabsConfig: React.Dispatch<React.SetStateAction<TabConfig[]>>;
  savedTabVisibilityRef: React.MutableRefObject<Record<string, boolean>>;
}

/**
 * Хук для управления динамическими вкладками списка контрагентов.
 * Формирует вкладки из групп юр. форм и типов отношений, сохраняя видимость предыдущих настроек.
 */
export function useContractorTabsManager({
  legalFormGroups,
  relationshipTypes,
  activeTab,
  setActiveTab,
  setTabsConfig,
  savedTabVisibilityRef,
}: UseContractorTabsManagerProps) {
  useEffect(() => {
    // 1. Tabs from Groups (Legal Forms)
    const groupTabs = (legalFormGroups || [])
      .filter(g => g.showAsTab)
      .map(g => ({
        id: g.id,
        label: g.name,
        icon: Building2,
        visible: true,
      }));

    // 2. Tabs from Relationship Types
    const rtTabs = relationshipTypes
      .filter(rt => rt.showAsTab && (!rt.module || rt.module === 'contractors'))
      .map(rt => ({
        id: rt.id,
        label: rt.name,
        icon: UserCheck,
        visible: true,
      }));

    const newTabs = [
      { id: "all", label: "contractors.tabs.all", icon: Users, visible: true },
      ...groupTabs,
      ...rtTabs
    ];

    setTabsConfig(prev => {
      const visMap = savedTabVisibilityRef.current;
      return newTabs.map(tab => {
        const existing = prev.find(p => p.id === tab.id);
        if (existing) return { ...tab, visible: existing.visible };
        if (tab.id in visMap) return { ...tab, visible: visMap[tab.id] };
        return tab;
      });
    });

    // Validate active tab
    if (activeTab !== 'all') {
      const tabExists = newTabs.some(t => t.id === activeTab);
      if (!tabExists) {
        setActiveTab('all');
      }
    }
  }, [legalFormGroups, relationshipTypes, activeTab, setActiveTab, setTabsConfig, savedTabVisibilityRef]);
}
