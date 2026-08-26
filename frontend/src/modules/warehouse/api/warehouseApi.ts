import { api } from '@/lib/api';

export interface Warehouse {
  id: number;
  name: string;
  type: string;
  address: string | null;
  isActive: boolean;
  status?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface InventoryBalance {
  id: number;
  productId: number;
  warehouseId: number;
  quantity: string | number;
  reservedQuantity: string | number;
  updatedAt: string;
  // joined fields
  productName?: string;
  skuInternal?: string;
  warehouseName?: string;
}

export interface InventoryTransaction {
  id: number;
  productId: number;
  warehouseId: number;
  type: 'receipt' | 'expense' | 'reserve' | 'unreserve' | 'transfer' | 'adjustment' | 'write_off' | 'return';
  quantity: string | number;
  referenceId: number | null;
  referenceType: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  // joined fields
  productName?: string;
  warehouseName?: string;
  userName?: string;
}

export const warehouseApi = {
  // Warehouses
  getWarehouses: async (): Promise<Warehouse[]> => api.get('/warehouse/warehouses'),
  createWarehouse: async (data: Partial<Warehouse>): Promise<Warehouse> => api.post('/warehouse/warehouses', data),
  updateWarehouse: async (id: number, data: Partial<Warehouse>): Promise<Warehouse> => api.put(`/warehouse/warehouses/${id}`, data),
  deleteWarehouse: async (id: number): Promise<{ message: string }> => api.delete(`/warehouse/warehouses/${id}`),
  deleteWarehouseBulk: async (ids: number[]): Promise<{ message: string }> => api.post('/warehouse/warehouses/bulk-delete', { ids }),
  updateWarehouseBulk: async (ids: number[], updates: Partial<Warehouse>): Promise<{ message: string }> => api.post('/warehouse/warehouses/bulk-update', { ids, updates }),

  // Balances
  getBalances: async (): Promise<InventoryBalance[]> => api.get('/warehouse/balances'),
  getProductBalance: async (productId: number): Promise<InventoryBalance[]> => api.get(`/warehouse/balances/${productId}`),
  
  // Transactions
  getTransactions: async (params?: { productId?: number; warehouseId?: number; limit?: number; offset?: number }): Promise<InventoryTransaction[]> => 
    api.get('/warehouse/transactions', { params }),
  createTransaction: async (data: Partial<InventoryTransaction>): Promise<{ message: string, balance: InventoryBalance }> => 
    api.post('/warehouse/transactions', data),
};
