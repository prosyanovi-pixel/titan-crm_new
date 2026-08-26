import { useState, useEffect, useCallback } from 'react';
import { useDataTable } from "@/hooks/useDataTable";
import { useTranslation } from "@/lib/i18n";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Building2, Gavel, ChevronDown, List } from "lucide-react";
import { CourtsJudgesList } from "./CourtsJudgesList";
import { CourtJudgeSheet } from "./CourtJudgeSheet";

interface Court {
  id: string;
  name: string;
  address: string;
}

interface Judge {
  id: string;
  name: string;
  court_id: string;
  court_name?: string;
  secretary_phone?: string;
  assistant_phone?: string;
  email?: string;
  office?: string;
  composition?: string;
}

interface CourtWithJudges extends Court {
  judges: Judge[];
}

export function CourtsJudgesTab() {
  const { t } = useTranslation();
  const [courts, setCourts] = useState<Court[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [loading, setLoading] = useState(true);

  // Sheet states
  const [isCourtJudgeSheetOpen, setIsCourtJudgeSheetOpen] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [selectedJudge, setSelectedJudge] = useState<Judge | null>(null);
  const [activeTab, setActiveTab] = useState<'court' | 'judge'>('court');

  const table = useDataTable<Court>({
    initialData: [],
    initialColumns: {
      name: true,
      address: true,
      judges_count: true,
    },
    initialTabs: [
      { id: "all", label: "lawyers.tabs.courts", icon: Building2, visible: true },
    ],
    storageKey: "lawyers-courts-table",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [courtsData, judgesData] = await Promise.all([
        api.get('/courts'),
        api.get('/courts/judges'),
      ]);
      setCourts(courtsData);
      setJudges(judgesData);
    } catch (error) {
      console.error('Error fetching courts/judges:', error);
      toast.error(t('lawyers.case_sheet.courts.toast.load_error'));
    } finally {
      setLoading(false);
    }
  };

   
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleOpenSheet = useCallback((type: 'court' | 'judge', item: Court | Judge | null = null) => {
    setActiveTab(type);
    if (type === 'court') {
      setSelectedCourt(item as Court | null);
      setSelectedJudge(null);
    } else {
      setSelectedJudge(item as Judge | null);
      setSelectedCourt(null);
    }
    setIsCourtJudgeSheetOpen(true);
  }, []);

   
  useEffect(() => {
    const handleOpenSheetEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ type: 'court' | 'judge' }>).detail;
      if (detail) {
        handleOpenSheet(detail.type, null);
      }
    };
    window.addEventListener('openCourtJudgeSheet', handleOpenSheetEvent as EventListener);
    return () => window.removeEventListener('openCourtJudgeSheet', handleOpenSheetEvent as EventListener);
  }, [handleOpenSheet]);

  const handleSaveCourt = async (court: Partial<Court>) => {
    try {
      if (!court.name?.trim()) {
        toast.error(t('lawyers.case_sheet.courts.toast.enter_court_name'));
        return;
      }
      if (selectedCourt?.id) {
        await api.put(`/courts/${selectedCourt.id}`, {
          name: court.name,
          address: court.address || '',
        });
        toast.success(t('lawyers.case_sheet.courts.toast.court_updated'));
      } else {
        await api.post('/courts', {
          name: court.name,
          address: court.address || '',
        });
        toast.success(t('lawyers.case_sheet.courts.toast.court_added'));
      }
      setIsCourtJudgeSheetOpen(false);
      setSelectedCourt(null);
      fetchData(); // Обновляем список судов
    } catch (error) {
      console.error('Error saving court:', error);
      toast.error(t('lawyers.case_sheet.courts.toast.court_save_error'));
    }
  };

  const handleSaveJudge = async (judge: Partial<Judge>) => {
    try {
      if (!judge.name?.trim()) {
        toast.error(t('lawyers.case_sheet.courts.toast.enter_judge_name'));
        return;
      }
      if (selectedJudge?.id) {
        await api.put(`/courts/judges/${selectedJudge.id}`, judge);
        toast.success(t('lawyers.case_sheet.courts.toast.judge_updated'));
      } else {
        await api.post('/courts/judges', judge);
        toast.success(t('lawyers.case_sheet.courts.toast.judge_added'));
      }
      setIsCourtJudgeSheetOpen(false);
      setSelectedJudge(null);
      fetchData(); // Обновляем список судей
    } catch (error) {
      console.error('Error saving judge:', error);
      toast.error(t('lawyers.case_sheet.courts.toast.judge_save_error'));
    }
  };

  const handleDeleteCourt = async (id: string) => {
    try {
      await api.delete(`/courts/${id}`);
      toast.success(t('lawyers.case_sheet.courts.toast.court_deleted'));
      fetchData();
    } catch (error) {
      console.error('Error deleting court:', error);
      toast.error(t('lawyers.case_sheet.courts.toast.court_delete_error'));
    }
  };

  const handleDeleteJudge = async (id: string) => {
    try {
      await api.delete(`/courts/judges/${id}`);
      toast.success(t('lawyers.case_sheet.courts.toast.judge_deleted'));
      fetchData();
    } catch (error) {
      console.error('Error deleting judge:', error);
      toast.error(t('lawyers.case_sheet.courts.toast.judge_delete_error'));
    }
  };

  // Group judges by court
  const courtsWithJudges: CourtWithJudges[] = courts.map(court => ({
    ...court,
    judges: judges.filter(j => {
      const judgeCourtId = (j as any).courtId || j.court_id;
      return judgeCourtId === court.id;
    })
  }));

  const sortedCourts = [...courtsWithJudges].sort((a, b) => {
    if (!table.sortConfig) return 0;
    const key = table.sortConfig.key as keyof Court;
    const aVal = a[key] || '';
    const bVal = b[key] || '';
    const comparison = String(aVal).localeCompare(String(bVal));
    return table.sortConfig.direction === 'asc' ? comparison : -comparison;
  });

  return (
    <>
      <CourtsJudgesList
        courts={sortedCourts}
        selectedIds={table.selectedIds as Set<string>}
        toggleSelection={(id) => table.toggleSelection(id)}
        toggleAllSelection={() => table.toggleAllSelection(courts)}
        visibleColumns={table.visibleColumns}
        columnOrder={table.columnOrder}
        onReorderColumn={table.reorderColumn}
        columnWidths={table.columnWidths}
        onColumnResize={table.setColumnWidth}
        onEditCourt={(court) => handleOpenSheet('court', court)}
        onEditJudge={(judge) => handleOpenSheet('judge', judge)}
        onDeleteCourt={handleDeleteCourt}
        onDeleteJudge={handleDeleteJudge}
        onSort={table.handleSort}
        sortConfig={table.sortConfig as any}
      />

      <CourtJudgeSheet
        court={selectedCourt}
        judge={selectedJudge}
        courts={courts}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        open={isCourtJudgeSheetOpen}
        onOpenChange={setIsCourtJudgeSheetOpen}
        onSaveCourt={handleSaveCourt}
        onSaveJudge={handleSaveJudge}
      />
    </>
  );
}
