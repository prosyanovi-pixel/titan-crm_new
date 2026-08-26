import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

/** Возвращаемое значение хука useContractorsUIState */
interface UseContractorsUIStateReturn {
  // Create sheet
  createSheetOpen: boolean;
  setCreateSheetOpen: (open: boolean) => void;
  
  // Bulk edit dialog
  bulkEditOpen: boolean;
  setBulkEditOpen: (open: boolean) => void;
}

/**
 * Hook for managing dialog/sheet UI state for the Contractors page.
 * Manages create sheet and bulk edit dialog visibility.
 * Other sheet states (quick actions) are managed by useContractorsPage.
 */
export function useContractorsUIState(): UseContractorsUIStateReturn {
  const [searchParams, setSearchParams] = useSearchParams();
  const isNewFromUrl = searchParams.get('new') === 'true';
  const [createSheetOpen, setCreateSheetOpen] = useState(isNewFromUrl);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);

  useEffect(() => {
    if (isNewFromUrl) {
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
  }, [isNewFromUrl, searchParams, setSearchParams]);

  return {
    createSheetOpen,
    setCreateSheetOpen,
    bulkEditOpen,
    setBulkEditOpen,
  };
}
