import { useState } from "react";

/** Тип активной вкладки в панели контрагента */
export type ContractorSheetTab = "overview" | "comments" | "contacts" | "taxes" | "activity";

/** Состояние быстрой панели связанной с контрагентом */
export interface QuickSheetState {
  isOpen: boolean;
  contractorName: string;
  contractorId?: number | string;
}

/** Начальное состояние быстрой панели (закрыта) */
export const initialSheetState: QuickSheetState = {
  isOpen: false,
  contractorName: "",
  contractorId: undefined,
};

/**
 * Хук для управления состоянием панелей быстрых действий (задача, претензия, проект, событие, напоминание).
 * @returns Состояния панелей и методы управления панелью контрагента
 */
export function useContractorSheetManager() {
  const [taskSheet, setTaskSheet] = useState<QuickSheetState>(initialSheetState);
  const [claimSheet, setClaimSheet] = useState<QuickSheetState>(initialSheetState);
  const [projectSheet, setProjectSheet] = useState<QuickSheetState>(initialSheetState);
  const [eventSheet, setEventSheet] = useState<QuickSheetState>(initialSheetState);
  const [reminderSheet, setReminderSheet] = useState<QuickSheetState>(initialSheetState);
  
  const [contractorSheet, setContractorSheet] = useState<{
    isOpen: boolean;
    contractorId?: number | null;
    initialTab?: ContractorSheetTab;
  }>({ isOpen: false, contractorId: null, initialTab: "overview" });

  const openContractorSheet = (contractorId?: number | null, initialTab: ContractorSheetTab = "overview") =>
    setContractorSheet({ isOpen: true, contractorId: contractorId ?? null, initialTab });
    
  const closeContractorSheet = () =>
    setContractorSheet({ isOpen: false, contractorId: null, initialTab: "overview" });

  return {
    taskSheet,
    setTaskSheet,
    claimSheet,
    setClaimSheet,
    projectSheet,
    setProjectSheet,
    eventSheet,
    setEventSheet,
    reminderSheet,
    setReminderSheet,
    contractorSheet,
    setContractorSheet,
    openContractorSheet,
    closeContractorSheet,
  };
}
