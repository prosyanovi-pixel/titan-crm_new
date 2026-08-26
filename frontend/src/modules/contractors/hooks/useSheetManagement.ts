import { useState, useCallback } from "react";

/** Состояние панели (шторы) связанной с контрагентом */
interface SheetState {
  isOpen: boolean;
  contractorId?: number | null;
  contractorName?: string;
}

/** Возвращаемое значение хука useSheetManagement */
interface UseSheetManagementReturn {
  contractorSheet: SheetState;
  taskSheet: SheetState;
  claimSheet: SheetState;
  projectSheet: SheetState;
  openContractorSheet: (contractorId?: number | null) => void;
  closeContractorSheet: () => void;
  openTaskSheet: (contractorName: string) => void;
  closeTaskSheet: () => void;
  openClaimSheet: (contractorName: string) => void;
  closeClaimSheet: () => void;
  openProjectSheet: (contractorName: string) => void;
  closeProjectSheet: () => void;
}

/**
 * Хук для управления состоянием панелей (штор) модуля контрагентов.
 * Обеспечивает открытие/закрытие панелей карточки, задачи, претензии и проекта.
 * @returns Состояния панелей и методы управления
 */
export function useSheetManagement(): UseSheetManagementReturn {
  const [contractorSheet, setContractorSheet] = useState<SheetState>({ isOpen: false });
  const [taskSheet, setTaskSheet] = useState<SheetState>({ isOpen: false });
  const [claimSheet, setClaimSheet] = useState<SheetState>({ isOpen: false });
  const [projectSheet, setProjectSheet] = useState<SheetState>({ isOpen: false });

  const openContractorSheet = useCallback((contractorId?: number | null) => {
    setContractorSheet({ isOpen: true, contractorId });
  }, []);

  const closeContractorSheet = useCallback(() => {
    setContractorSheet({ isOpen: false });
  }, []);

  const openTaskSheet = useCallback((contractorName: string) => {
    setTaskSheet({ isOpen: true, contractorName });
  }, []);

  const closeTaskSheet = useCallback(() => {
    setTaskSheet({ isOpen: false });
  }, []);

  const openClaimSheet = useCallback((contractorName: string) => {
    setClaimSheet({ isOpen: true, contractorName });
  }, []);

  const closeClaimSheet = useCallback(() => {
    setClaimSheet({ isOpen: false });
  }, []);

  const openProjectSheet = useCallback((contractorName: string) => {
    setProjectSheet({ isOpen: true, contractorName });
  }, []);

  const closeProjectSheet = useCallback(() => {
    setProjectSheet({ isOpen: false });
  }, []);

  return {
    contractorSheet,
    taskSheet,
    claimSheet,
    projectSheet,
    openContractorSheet,
    closeContractorSheet,
    openTaskSheet,
    closeTaskSheet,
    openClaimSheet,
    closeClaimSheet,
    openProjectSheet,
    closeProjectSheet,
  };
}