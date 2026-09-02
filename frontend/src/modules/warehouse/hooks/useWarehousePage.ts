import { useState, useMemo } from 'react';
import { PackageSearch, Home, Activity } from 'lucide-react';
import { useDataTable } from '@/hooks/useDataTable';
import { usePersistedTab } from '@/hooks/usePersistedTab';
import { TabConfig } from '@/hooks/useDataTable';
import { useQuery } from '@tanstack/react-query';
import { warehouseApi, InventoryBalance, Warehouse, InventoryTransaction } from '../api/warehouseApi';
import { useModuleSettings } from '@/modules/settings/hooks/useModuleSettings';

/**
 * Custom hook for managing warehouse page state and data
 * @returns {Object} Warehouse page state including balances, warehouses, transactions, tables, filters, and tabs
 */
export function useWarehousePage(): {
  activeTab: string;
  setActiveTab: (value: string) => void;
  tabsConfig: TabConfig[];
  reorderTab: (fromId: string, toId: string) => void;
  toggleTabVisibility: (id: string, checked: boolean) => void;
  isTransactionFormOpen: boolean;
  setIsTransactionFormOpen: (value: boolean) => void;
  isWarehouseFormOpen: boolean;
  setIsWarehouseFormOpen: (value: boolean) => void;
  editingWarehouse: Warehouse | null;
  setEditingWarehouse: (value: Warehouse | null) => void;
  balancesTable: ReturnType<typeof useDataTable<InventoryBalance>>;
  filteredBalances: InventoryBalance[];
  balancesLoading: boolean;
  warehousesTable: ReturnType<typeof useDataTable<Warehouse>>;
  filteredWarehouses: Warehouse[];
  warehousesLoading: boolean;
  transactionsTable: ReturnType<typeof useDataTable<InventoryTransaction>>;
  filteredTransactions: InventoryTransaction[];
  transactionsLoading: boolean;
  handleWarehouseQuickAction: (action: string, id: number | string) => Promise<void>;
  taskSheet: { isOpen: boolean; contractorId: number; contractorName: string };
  setTaskSheet: (value: { isOpen: boolean; contractorId: number; contractorName: string }) => void;
  projectSheet: { isOpen: boolean; contractorId: number; contractorName: string };
  setProjectSheet: (value: { isOpen: boolean; contractorId: number; contractorName: string }) => void;
  claimSheet: { isOpen: boolean; contractorId: number; contractorName: string };
  setClaimSheet: (value: { isOpen: boolean; contractorId: number; contractorName: string }) => void;
  eventSheet: { isOpen: boolean; contractorId: number; contractorName: string };
  setEventSheet: (value: { isOpen: boolean; contractorId: number; contractorName: string }) => void;
  reminderSheet: { isOpen: boolean; contractorId: number; contractorName: string };
  setReminderSheet: (value: { isOpen: boolean; contractorId: number; contractorName: string }) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  warehouseSettings: Record<string, unknown>;
} {
  const [activeTab, setActiveTab] = usePersistedTab('warehouse-active-tab', 'balances');
  
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [isWarehouseFormOpen, setIsWarehouseFormOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const { settings: warehouseSettings } = useModuleSettings('warehouse');

  // --- Fetch Data ---
  const { data: balances, isLoading: balancesLoading } = useQuery({
    queryKey: ['warehouse_balances'],
    queryFn: warehouseApi.getBalances,
  });

  const { data: warehouses, isLoading: warehousesLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: warehouseApi.getWarehouses,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['warehouse_transactions'],
    queryFn: () => warehouseApi.getTransactions(),
  });

  // --- Tabs State ---
  const initialTabs: TabConfig[] = useMemo(() => [
    { id: 'balances', label: 'warehouse.tabs.balances', icon: PackageSearch, visible: true },
    { id: 'warehouses', label: 'warehouse.tabs.warehouses', icon: Home, visible: true },
    { id: 'transactions', label: 'warehouse.tabs.transactions', icon: Activity, visible: true },
  ], []);

  const mainTable = useDataTable<never>({
    initialData: [],
    initialColumns: {},
    initialTabs,
    storageKey: 'warehouse-main',
  });

  // --- Table States ---
  const balancesTable = useDataTable<InventoryBalance>({
    initialData: balances || [],
    initialColumns: { skuInternal: true, productName: true, warehouseName: true, quantity: true, reservedQuantity: true, available: true },
    storageKey: 'warehouse-balances',
  });

  const warehousesTable = useDataTable<Warehouse>({
    initialData: warehouses || [],
    initialColumns: { name: true, type: true, address: true, status: true, tags: true },
    storageKey: 'warehouse-list',
  });

  const transactionsTable = useDataTable<InventoryTransaction>({
    initialData: transactions || [],
    initialColumns: { createdAt: true, type: true, productName: true, warehouseName: true, quantity: true },
    storageKey: 'warehouse-transactions',
  });

  // --- Filtered Data ---
  const filteredBalances = useMemo(() => {
    if (!balances) return [];
    if (!balancesTable.searchQuery) return balances;
    const lower = balancesTable.searchQuery.toLowerCase();
    return balances.filter(b => b.productName?.toLowerCase().includes(lower) || b.warehouseName?.toLowerCase().includes(lower) || b.skuInternal?.toLowerCase().includes(lower));
  }, [balances, balancesTable.searchQuery]);

  const filteredWarehouses = useMemo(() => {
    if (!warehouses) return [];
    let result = warehouses;

    if (statusFilter !== 'all') {
      result = result.filter(w => w.status === statusFilter);
    }

    if (warehousesTable.searchQuery) {
      const lower = warehousesTable.searchQuery.toLowerCase();
      result = result.filter(w => w.name?.toLowerCase().includes(lower) || w.address?.toLowerCase().includes(lower));
    }
    
    return result;
  }, [warehouses, warehousesTable.searchQuery, statusFilter]);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    if (!transactionsTable.searchQuery) return transactions;
    const lower = transactionsTable.searchQuery.toLowerCase();
    return transactions.filter(t => t.productName?.toLowerCase().includes(lower) || t.warehouseName?.toLowerCase().includes(lower));
  }, [transactions, transactionsTable.searchQuery]);

  const [taskSheet, setTaskSheet] = useState<{ isOpen: boolean; contractorId: number; contractorName: string }>({ isOpen: false, contractorId: 0, contractorName: '' });
  const [projectSheet, setProjectSheet] = useState<{ isOpen: boolean; contractorId: number; contractorName: string }>({ isOpen: false, contractorId: 0, contractorName: '' });
  const [claimSheet, setClaimSheet] = useState<{ isOpen: boolean; contractorId: number; contractorName: string }>({ isOpen: false, contractorId: 0, contractorName: '' });
  const [eventSheet, setEventSheet] = useState<{ isOpen: boolean; contractorId: number; contractorName: string }>({ isOpen: false, contractorId: 0, contractorName: '' });
  const [reminderSheet, setReminderSheet] = useState<{ isOpen: boolean; contractorId: number; contractorName: string }>({ isOpen: false, contractorId: 0, contractorName: '' });
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  const handleWarehouseQuickAction = async (action: string, id: number | string): Promise<void> => {
    const warehouse = warehouses?.find(w => w.id === Number(id));
    if (!warehouse) return;
    
    // Using contractorId to match QuickActionSheet's expected props for now, though it's technically a warehouse
    const commonSheetState = {
      isOpen: true,
      contractorId: Number(id),
      contractorName: warehouse.name,
    };

    switch (action) {
      case 'edit':
        setEditingWarehouse(warehouse);
        setIsWarehouseFormOpen(true);
        return;
      case 'create_task': return setTaskSheet(commonSheetState);
      case 'create_project': return setProjectSheet(commonSheetState);
      case 'create_claim': return setClaimSheet(commonSheetState);
      case 'create_event': return setEventSheet(commonSheetState);
      case 'create_reminder': return setReminderSheet(commonSheetState);
      default:
        console.log(`Action ${action} for warehouse ${id} not implemented`);
    }
  };

  return {
    activeTab,
    setActiveTab,
    tabsConfig: mainTable.tabsConfig,
    reorderTab: mainTable.reorderTab,
    toggleTabVisibility: mainTable.toggleTabVisibility,
    
    isTransactionFormOpen, setIsTransactionFormOpen,
    isWarehouseFormOpen, setIsWarehouseFormOpen,
    editingWarehouse, setEditingWarehouse,

    balancesTable, filteredBalances, balancesLoading,
    warehousesTable, filteredWarehouses, warehousesLoading,
    transactionsTable, filteredTransactions, transactionsLoading,

    handleWarehouseQuickAction,
    taskSheet, setTaskSheet,
    projectSheet, setProjectSheet,
    claimSheet, setClaimSheet,
    eventSheet, setEventSheet,
    reminderSheet, setReminderSheet,
    statusFilter,
    setStatusFilter,
    warehouseSettings,
  };
}
