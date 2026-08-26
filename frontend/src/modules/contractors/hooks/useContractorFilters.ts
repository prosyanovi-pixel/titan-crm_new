import { useMemo } from "react";
import { Contractor } from "../types/contractor.types";
import { RelationshipTypeItem, LegalFormItem } from "@/modules/settings/types/settings.types";

interface UseContractorFiltersProps {
  contractors: Contractor[];
  activeTab: string;
  relationshipTypes: RelationshipTypeItem[];
  legalForms: LegalFormItem[];
}

/**
 * Хук для фильтрации списка контрагентов по активному табу, группе и типу отношений.
 * @returns Отфильтрованный массив контрагентов
 */
export function useContractorFilters({
  contractors,
  activeTab,
  relationshipTypes,
  legalForms,
}: UseContractorFiltersProps) {
  return useMemo(() => {
    // Для активных табов (кроме 'all') применяем фильтрацию по groupId и legacy mapping
    // search/status/hideArchived обрабатываются на сервере
    if (activeTab === "all") {
      return contractors;
    }

    const legalFormToGroup = new Map<string, string>();
    (legalForms as Array<{ id: string; groupId: string }>).forEach((form) => {
      if (form.groupId && form.id) {
        legalFormToGroup.set(String(form.id).toLowerCase(), form.groupId);
      }
    });

    return contractors.filter((contractor) => {
      const contractorRelTypes = relationshipTypes.filter(rt => rt.module === 'contractors');
      const isRelationshipTypeTab = contractorRelTypes.some(rt => rt.id === activeTab);
      
      if (isRelationshipTypeTab) {
        return String(contractor.type) === activeTab;
      } else if (activeTab === 'employee') {
        return contractor.isEmployee === true;
      } else {
        const currentTabId = String(activeTab).toLowerCase();

        if (contractor.groupId && String(contractor.groupId).toLowerCase() === currentTabId) {
          return true;
        } else {
          const lfRaw = contractor.legalForm ? String(contractor.legalForm).trim().toLowerCase() : "";
          const derivedGroupId = legalFormToGroup.get(lfRaw);
          
          if (derivedGroupId && derivedGroupId.toLowerCase() === currentTabId) {
            return true;
          } else {
            const legacyMapping: Record<string, string> = {
              'ooo': 'legal',
              'ip': 'individual',
              'foreign': 'foreign',
              'private': 'private',
              'self': 'private'
            };
            return legacyMapping[lfRaw] === currentTabId;
          }
        }
      }
    });
  }, [contractors, activeTab, relationshipTypes, legalForms]);
}

